import StreamingMarkdownBubble from '@/components/StreamingMarkdownBubble';
import { Button, GlassCard, Text, TextArea, useToast } from '@/components/ui';
import { AudioChannel, useInterviewSocket } from '@/hooks/useInterviewSocket';
import { InterviewSession } from '@/types';
import {
  ASSIST_SAMPLE_RATE,
  floatTo16BitBase64,
  frameVolume,
} from '@/utils/pcm';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { interviewService } from '../../../services/interview-service';
import {
  IconBulb,
  IconCheck,
  IconMic,
  IconRadio,
  IconSend,
  IconSparkles,
  IconStop,
  IconWifi,
} from './icons';

interface AssistModeViewProps {
  session: InterviewSession | null;
  processing: boolean;
  onSendMessage: (question: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SubtitleLine {
  text: string;
  speaker: AudioChannel;
}

const formatDuration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const AssistModeView: React.FC<AssistModeViewProps> = ({
  session,
  processing,
  onSendMessage,
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [partial, setPartial] = useState<{
    text: string;
    channel: AudioChannel;
  } | null>(null);
  const [finalSentences, setFinalSentences] = useState<SubtitleLine[]>([]);
  const [volume, setVolume] = useState(0);
  const [asrUnavailable, setAsrUnavailable] = useState(false);
  const [voiceprintAvailable, setVoiceprintAvailable] = useState<
    boolean | null
  >(null);
  const [tabSharing, setTabSharing] = useState(false);
  const [savedRecording, setSavedRecording] = useState<{
    durationSec?: number;
    recordingUrl?: string;
    transcript?: string;
  } | null>(null);
  const { success, error: showError, warning } = useToast();

  // mic capture resources
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micChannelRef = useRef<AudioChannel>('interviewer');

  // tab/system audio capture (dual-channel: interviewer)
  const tabStreamRef = useRef<MediaStream | null>(null);
  const tabAudioContextRef = useRef<AudioContext | null>(null);
  const tabProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const tabSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const timerRef = useRef<number | null>(null);
  const volumeTimerRef = useRef<number | null>(null);
  const volumeRef = useRef(0);
  const autoAnswerRef = useRef(autoAnswer);
  const listeningRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    autoAnswerRef.current = autoAnswer;
  }, [autoAnswer]);

  const playAudio = async (audioBuffer: ArrayBuffer) => {
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  const cleanupMicTap = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      } catch {
        /* noop */
      }
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        /* noop */
      }
      sourceNodeRef.current = null;
    }
  };

  const cleanupMic = () => {
    cleanupMicTap();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (volumeTimerRef.current) {
      clearInterval(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }
    volumeRef.current = 0;
    setVolume(0);
  };

  const cleanupTab = () => {
    if (tabProcessorRef.current) {
      try {
        tabProcessorRef.current.disconnect();
        tabProcessorRef.current.onaudioprocess = null;
      } catch {
        /* noop */
      }
      tabProcessorRef.current = null;
    }
    if (tabSourceRef.current) {
      try {
        tabSourceRef.current.disconnect();
      } catch {
        /* noop */
      }
      tabSourceRef.current = null;
    }
    if (tabAudioContextRef.current) {
      tabAudioContextRef.current.close().catch(() => undefined);
      tabAudioContextRef.current = null;
    }
    if (tabStreamRef.current) {
      tabStreamRef.current.getTracks().forEach((t) => t.stop());
      tabStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupMic();
      cleanupTab();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSession = async () => {
    if (!session) return;
    try {
      const data = await interviewService.getSession(session.id);
      const sessionMessages = data.messages ?? [];
      setMessages(
        sessionMessages
          .filter((m) => m.role !== 'SYSTEM')
          .map((m) => ({
            role:
              m.role === 'USER' ? ('user' as const) : ('assistant' as const),
            content: m.content,
          }))
      );
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const {
    isConnected,
    isReconnecting,
    latency,
    joinSession,
    sendQuestion,
    startStream,
    sendAudioData,
    setAutoAnswer: emitAutoAnswerSetting,
    stopStream,
  } = useInterviewSocket({
    mode: 'assist',
    onConnected: () => {
      if (session) joinSession(session.id);
    },
    onJoinedSession: (data) => {
      if (data.realtimeAsrAvailable === false) {
        setAsrUnavailable(true);
        warning('实时语音识别暂不可用，可手动输入问题获取参考答案');
      } else {
        setAsrUnavailable(false);
      }
      if (data.voiceprintAvailable !== undefined) {
        setVoiceprintAvailable(data.voiceprintAvailable);
      }
    },
    onTranscription: (data) => {
      if (data.final) {
        const speaker: AudioChannel =
          data.speaker ?? (data.channel === 'self' ? 'self' : 'interviewer');
        setFinalSentences((prev) => [
          ...prev.slice(-60),
          { text: data.text, speaker },
        ]);
        setPartial(null);
      } else {
        setQuestion(data.text);
      }
    },
    onTranscriptionPartial: (data) => {
      setPartial({ text: data.text, channel: data.channel ?? 'interviewer' });
    },
    onQuestionDetected: (data) => {
      if (data.isQuestion && data.auto) {
        success(
          `检测到问题：${data.text.slice(0, 40)}${data.text.length > 40 ? '...' : ''}`
        );
      }
    },
    onGeneratingAnswer: () => {
      setIsGenerating(true);
      setStreamingAnswer('');
    },
    onAnswerChunk: (data) => {
      setStreamingAnswer((prev) => prev + data.chunk);
    },
    onAnswerComplete: () => {
      setIsGenerating(false);
      setStreamingAnswer('');
      refreshSession();
    },
    onAnswerAudio: async (data) => {
      await playAudio(data.audio);
    },
    onStreamStopped: (data) => {
      setSavedRecording({
        durationSec: data.durationSec,
        recordingUrl: data.recordingUrl,
        transcript: data.transcript,
      });
      if (data.durationSec !== undefined) {
        success(`面试录音已保存（${formatDuration(data.durationSec)}）`);
      }
    },
    onAsrError: (data) => {
      showError(`语音识别异常：${data.message}`);
    },
    onError: (err) => {
      if (/not available/i.test(err.message || '')) {
        setAsrUnavailable(true);
        warning('实时语音识别暂不可用，可手动输入问题获取参考答案');
        return;
      }
      showError(err.message);
      setIsGenerating(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingAnswer]);

  useEffect(() => {
    if (session && isConnected) {
      joinSession(session.id);
    }
  }, [session, isConnected, joinSession]);

  // ------------------------------------------------------------------
  // Mic channel (self in dual mode, interviewer in single-channel mode)
  // ------------------------------------------------------------------

  const startMicStream = useCallback(
    (channel: AudioChannel) => {
      if (!session || !isConnected) return;
      micChannelRef.current = channel;
      startStream(session.id, {
        sampleRate: ASSIST_SAMPLE_RATE,
        autoAnswer: autoAnswerRef.current,
        channel,
      });
    },
    [session, isConnected, startStream]
  );

  const startMicTap = (channel: AudioChannel) => {
    if (!mediaStreamRef.current || !audioContextRef.current) return;
    cleanupMicTap();
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      volumeRef.current = frameVolume(input);
      if (session) {
        sendAudioData(session.id, floatTo16BitBase64(input), channel);
      }
    };
    const source = audioContextRef.current.createMediaStreamSource(
      mediaStreamRef.current
    );
    sourceNodeRef.current = source;
    source.connect(processor);
    // Muted destination: keeps the processor pulling without playback.
    const silentGain = audioContextRef.current.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(audioContextRef.current.destination);
  };

  const startListening = async () => {
    if (!session || !isConnected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: ASSIST_SAMPLE_RATE });
      audioContextRef.current = audioContext;

      const channel: AudioChannel = tabSharing ? 'self' : 'interviewer';
      startMicStream(channel);
      startMicTap(channel);

      setFinalSentences([]);
      setPartial(null);
      setSavedRecording(null);
      setElapsedSec(0);
      setListening(true);
      listeningRef.current = true;
      timerRef.current = window.setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
      volumeTimerRef.current = window.setInterval(() => {
        setVolume(volumeRef.current);
      }, 100);
    } catch (err) {
      console.error(err);
      showError('无法访问麦克风，请检查浏览器权限');
      cleanupMic();
    }
  };

  const stopListening = () => {
    if (!session) return;
    stopStream(session.id); // all channels + recording
    listeningRef.current = false;
    cleanupMic();
    cleanupTab();
    setListening(false);
    setTabSharing(false);
    setPartial(null);
  };

  // ------------------------------------------------------------------
  // Tab/system audio channel (dual mode: interviewer)
  // ------------------------------------------------------------------

  const startTabChannel = () => {
    if (!session || !tabStreamRef.current) return;
    const audioContext = new AudioContext({ sampleRate: ASSIST_SAMPLE_RATE });
    tabAudioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(tabStreamRef.current);
    tabSourceRef.current = source;
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    tabProcessorRef.current = processor;
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      if (session) {
        sendAudioData(session.id, floatTo16BitBase64(input), 'interviewer');
      }
    };
    source.connect(processor);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    startStream(session.id, {
      sampleRate: ASSIST_SAMPLE_RATE,
      autoAnswer: autoAnswerRef.current,
      channel: 'interviewer',
    });
  };

  const enableTabShare = async () => {
    if (!session || !isConnected) return;
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      // Video is only requested because Chrome requires it for capture.
      displayStream.getVideoTracks().forEach((t) => t.stop());
      if (displayStream.getAudioTracks().length === 0) {
        displayStream.getTracks().forEach((t) => t.stop());
        warning(
          '未捕获到音频。共享时请选择「标签页」并勾选「同时共享标签页音频」'
        );
        return;
      }
      tabStreamRef.current = displayStream;
      // Browser "Stop sharing" bar releases the stream.
      displayStream.getAudioTracks()[0].addEventListener('ended', () => {
        disableTabShare();
      });

      setTabSharing(true);
      if (listeningRef.current) {
        // Switch: mic interviewer -> self, tab audio -> interviewer.
        stopStream(session.id, 'interviewer');
        cleanupMicTap();
        startTabChannel();
        startMicStream('self');
        startMicTap('self');
      }
      success('已共享会议音频，面试官与你的发言将分开显示');
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        console.error(err);
        showError('共享会议音频失败');
      }
    }
  };

  const disableTabShare = () => {
    if (!session) return;
    cleanupTab();
    setTabSharing(false);
    if (listeningRef.current) {
      // Fall back to single-channel room mic.
      stopStream(session.id, 'interviewer');
      if (micChannelRef.current === 'self') {
        stopStream(session.id, 'self');
        startMicStream('interviewer');
        startMicTap('interviewer');
      } else {
        startTabChannelFallback();
      }
    }
  };

  /** Re-start the mic-driven interviewer channel when mic was not 'self'. */
  const startTabChannelFallback = () => {
    if (!session) return;
    startStream(session.id, {
      sampleRate: ASSIST_SAMPLE_RATE,
      autoAnswer: autoAnswerRef.current,
      channel: 'interviewer',
    });
    startMicTap('interviewer');
  };

  const toggleAutoAnswer = () => {
    const next = !autoAnswer;
    setAutoAnswer(next);
    if (session && listeningRef.current) {
      emitAutoAnswerSetting(session.id, next);
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    if (session && isConnected) {
      sendQuestion(session.id, question);
    } else {
      onSendMessage(question);
    }
    setQuestion('');
  };

  const speakerChip = (speaker: AudioChannel) => (
    <span className={`iv-speaker-chip${speaker === 'self' ? ' self' : ''}`}>
      {speaker === 'self' ? '我' : '面试官'}
    </span>
  );

  return (
    <div>
      <div className="iv-statusbar">
        <span
          className={`iv-status-pill${isConnected ? ' ok' : isReconnecting ? ' warn' : ''}`}
        >
          {isConnected ? (
            <>
              <IconWifi size={12} /> 实时连接已建立
              {latency > 0 && ` · ${latency}ms`}
            </>
          ) : isReconnecting ? (
            '正在重连...'
          ) : (
            '正在连接...'
          )}
        </span>
        {listening && (
          <span className="iv-status-pill live">
            <span className="iv-rec-dot" /> 录音中 {formatDuration(elapsedSec)}
          </span>
        )}
        {listening && tabSharing && (
          <span className="iv-status-pill ok">双通道 · 已分离面试官音频</span>
        )}
        {listening && (
          <Button
            variant={autoAnswer ? 'primary' : 'secondary'}
            size="sm"
            onClick={toggleAutoAnswer}
          >
            {autoAnswer ? '自动答题：开' : '自动答题：关'}
          </Button>
        )}
      </div>

      {asrUnavailable && (
        <div className="iv-tip" style={{ marginTop: '0.75rem' }}>
          <IconBulb size={15} />
          <span>
            实时语音识别暂不可用（服务未配置识别引擎）。你仍可在下方手动输入面试官的问题获取参考答案。
          </span>
        </div>
      )}

      {!listening && !asrUnavailable && (
        <GlassCard padding="sm" variant="indigo" className="iv-share-card">
          <div className="iv-row-between">
            <div style={{ minWidth: 0 }}>
              <Text strong className="iv-share-title">
                <IconRadio size={14} /> 说话人分离
              </Text>
              <Text type="secondary" className="iv-share-desc">
                {tabSharing
                  ? '已共享会议音频：面试官（标签页声音）与你（麦克风）分开识别'
                  : '如果视频面试在电脑浏览器中进行，可共享会议标签页声音，面试官与你的发言将分开显示'}
              </Text>
            </div>
            {!tabSharing ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={enableTabShare}
                disabled={!isConnected}
              >
                共享会议音频
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={disableTabShare}>
                取消共享
              </Button>
            )}
          </div>
          {voiceprintAvailable === false && (
            <Text
              type="secondary"
              className="iv-share-desc"
              style={{ display: 'block', marginTop: '0.5rem' }}
            >
              单通道模式提示：完成声纹注册后，系统可自动区分面试官与你的发言。
            </Text>
          )}
        </GlassCard>
      )}

      {(listening || finalSentences.length > 0) && (
        <div className="iv-subtitle-panel" style={{ marginTop: '0.75rem' }}>
          <div className="iv-row-between" style={{ marginBottom: '0.5rem' }}>
            <Text strong>实时字幕</Text>
            {listening && (
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                {tabSharing
                  ? '双通道识别中'
                  : '单通道识别中 · 请将外放音量调大'}
              </Text>
            )}
          </div>
          <div className="iv-subtitle-scroll">
            {finalSentences.map((s, idx) => (
              <div
                key={idx}
                className={`iv-subtitle-line${idx === finalSentences.length - 1 ? ' latest' : ''}`}
              >
                {speakerChip(s.speaker)}
                <span className="iv-subtitle-text">{s.text}</span>
              </div>
            ))}
            {partial && partial.text && (
              <div className="iv-subtitle-line partial">
                {speakerChip(
                  partial.channel === 'self' ? 'self' : 'interviewer'
                )}
                <span className="iv-subtitle-text">{partial.text}...</span>
              </div>
            )}
            {!listening && finalSentences.length === 0 && (
              <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                暂无识别内容
              </Text>
            )}
          </div>
        </div>
      )}

      {savedRecording && (
        <div className="iv-saved-card">
          <div className="iv-saved-headline">
            <IconCheck size={15} /> 本场面试记录已保存
          </div>
          <Text
            type="secondary"
            style={{ fontSize: '0.82rem', display: 'block' }}
          >
            时长：
            {savedRecording.durationSec !== undefined
              ? formatDuration(savedRecording.durationSec)
              : '-'}
            {savedRecording.transcript ? ' · 转写文本已保存至面试记录' : ''}
          </Text>
          {savedRecording.recordingUrl && (
            <audio
              controls
              preload="none"
              src={savedRecording.recordingUrl}
              className="iv-audio-player"
              style={{ marginTop: '0.5rem', maxWidth: '100%' }}
            />
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div className="iv-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`iv-msg-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}
            >
              <div className="iv-msg-role">
                {msg.role === 'user' ? (
                  <IconMic size={12} />
                ) : (
                  <IconSparkles size={12} />
                )}
                {msg.role === 'user' ? '你 / 面试官' : 'AI 参考答案'}
              </div>
              <StreamingMarkdownBubble
                content={msg.content}
                isStreaming={false}
              />
            </div>
          ))}
        </div>
      )}

      {streamingAnswer && (
        <div className="iv-stream-card">
          <div className="iv-msg-role">
            <IconSparkles size={12} /> AI 参考答案（正在生成）
          </div>
          <StreamingMarkdownBubble
            content={streamingAnswer}
            isStreaming={isGenerating}
          />
        </div>
      )}

      {isGenerating && !streamingAnswer && (
        <div className="iv-loading-block">
          <div className="iv-spinner" />
          正在生成答案...
        </div>
      )}

      <GlassCard padding="md" className="iv-control-card">
        <div
          className={`iv-viz${listening ? '' : ' idle'}`}
          style={{ marginBottom: '0.5rem' }}
        >
          {Array.from({ length: 9 }).map((_, idx) => (
            <span
              key={idx}
              className="iv-viz-bar"
              style={
                listening
                  ? {
                      height: `${Math.max(15, Math.min(100, volume * 100 + ((idx * 37) % 25)))}%`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <div className="iv-controls">
          {!listening ? (
            <div className="iv-mic-wrap">
              <Button
                variant="primary"
                onClick={startListening}
                disabled={processing || !isConnected || asrUnavailable}
                className="iv-mic-btn"
                title="开始整场实时辅助（听音 + 自动答题 + 录音）"
              >
                <IconMic size={26} />
              </Button>
              <span className="iv-mic-hint">点击开始实时辅助</span>
            </div>
          ) : (
            <div className="iv-mic-wrap">
              <Button
                variant="danger"
                onClick={stopListening}
                className="iv-mic-btn live"
                title="结束并保存本场录音"
              >
                <IconStop size={26} />
              </Button>
              <span className="iv-mic-hint">点击结束并保存录音</span>
            </div>
          )}
        </div>

        <TextArea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="也可以手动输入面试官的问题"
          disabled={processing || isGenerating}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '0.75rem',
          }}
        >
          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={processing || isGenerating || !question.trim()}
            loading={processing || isGenerating}
          >
            <IconSend size={15} /> 获取参考答案
          </Button>
        </div>

        <Text
          type="secondary"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '0.75rem',
            fontSize: '0.78rem',
          }}
        >
          {listening
            ? '正在实时识别，检测到面试官提问后自动生成参考答案，整场录音进行中'
            : asrUnavailable
              ? '实时识别不可用，请手动输入问题'
              : !isConnected
                ? '等待连接...'
                : '点击麦克风开始整场实时辅助：持续监听提问、自动生成参考答案并录制整场面试'}
        </Text>
      </GlassCard>

      {!listening && !savedRecording && (
        <div className="iv-tip" style={{ marginTop: '0.75rem' }}>
          <IconRadio size={15} />
          <span>
            远程视频面试建议：手机端进行视频通话并开启外放，电脑端点击上方麦克风开始。开启「共享会议音频」或完成声纹注册后，字幕将区分面试官与你的发言。
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default AssistModeView;
