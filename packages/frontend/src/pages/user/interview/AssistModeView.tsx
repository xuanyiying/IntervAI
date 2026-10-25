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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        warning(t('interview.assist.asr_unavailable_toast'));
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
          t('interview.assist.question_detected', {
            question: `${data.text.slice(0, 40)}${data.text.length > 40 ? '...' : ''}`,
          })
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
        success(
          t('interview.assist.recording_saved', {
            duration: formatDuration(data.durationSec),
          })
        );
      }
    },
    onAsrError: (data) => {
      showError(t('interview.assist.asr_error', { message: data.message }));
    },
    onError: (err) => {
      if (/not available/i.test(err.message || '')) {
        setAsrUnavailable(true);
        warning(t('interview.assist.asr_unavailable_toast'));
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
      showError(t('interview.setup.mic_permission'));
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
        warning(t('interview.assist.no_audio_captured'));
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
      success(t('interview.assist.share_success'));
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        console.error(err);
        showError(t('interview.assist.share_failed'));
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
      {speaker === 'self'
        ? t('interview.assist.speaker_self')
        : t('interview.live.interviewer')}
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
              <IconWifi size={12} /> {t('interview.assist.connected')}
              {latency > 0 && ` · ${latency}ms`}
            </>
          ) : isReconnecting ? (
            t('interview.assist.reconnecting')
          ) : (
            t('interview.assist.connecting')
          )}
        </span>
        {listening && (
          <span className="iv-status-pill live">
            <span className="iv-rec-dot" />{' '}
            {t('interview.assist.recording_elapsed', {
              duration: formatDuration(elapsedSec),
            })}
          </span>
        )}
        {listening && tabSharing && (
          <span className="iv-status-pill ok">
            {t('interview.assist.dual_channel')}
          </span>
        )}
        {listening && (
          <Button
            variant={autoAnswer ? 'primary' : 'secondary'}
            size="sm"
            onClick={toggleAutoAnswer}
          >
            {autoAnswer
              ? t('interview.assist.auto_answer_on')
              : t('interview.assist.auto_answer_off')}
          </Button>
        )}
      </div>

      {asrUnavailable && (
        <div className="iv-tip" style={{ marginTop: '0.75rem' }}>
          <IconBulb size={15} />
          <span>{t('interview.assist.asr_unavailable_hint')}</span>
        </div>
      )}

      {!listening && !asrUnavailable && (
        <GlassCard padding="sm" variant="indigo" className="iv-share-card">
          <div className="iv-row-between">
            <div style={{ minWidth: 0 }}>
              <Text strong className="iv-share-title">
                <IconRadio size={14} />{' '}
                {t('interview.assist.speaker_separation')}
              </Text>
              <Text type="secondary" className="iv-share-desc">
                {tabSharing
                  ? t('interview.assist.share_active_desc')
                  : t('interview.assist.share_idle_desc')}
              </Text>
            </div>
            {!tabSharing ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={enableTabShare}
                disabled={!isConnected}
              >
                {t('interview.assist.share_button')}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={disableTabShare}>
                {t('interview.assist.unshare')}
              </Button>
            )}
          </div>
          {voiceprintAvailable === false && (
            <Text
              type="secondary"
              className="iv-share-desc"
              style={{ display: 'block', marginTop: '0.5rem' }}
            >
              {t('interview.assist.single_channel_hint')}
            </Text>
          )}
        </GlassCard>
      )}

      {(listening || finalSentences.length > 0) && (
        <div className="iv-subtitle-panel" style={{ marginTop: '0.75rem' }}>
          <div className="iv-row-between" style={{ marginBottom: '0.5rem' }}>
            <Text strong>{t('interview.assist.subtitles')}</Text>
            {listening && (
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                {tabSharing
                  ? t('interview.assist.dual_mode_active')
                  : t('interview.assist.single_mode_active')}
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
                {t('interview.assist.no_transcript')}
              </Text>
            )}
          </div>
        </div>
      )}

      {savedRecording && (
        <div className="iv-saved-card">
          <div className="iv-saved-headline">
            <IconCheck size={15} /> {t('interview.assist.saved_title')}
          </div>
          <Text
            type="secondary"
            style={{ fontSize: '0.82rem', display: 'block' }}
          >
            {t('interview.assist.saved_meta', {
              duration:
                savedRecording.durationSec !== undefined
                  ? formatDuration(savedRecording.durationSec)
                  : '-',
            })}
            {savedRecording.transcript
              ? t('interview.assist.saved_transcript')
              : ''}
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
                {msg.role === 'user'
                  ? t('interview.assist.role_you_or_interviewer')
                  : t('interview.assist.role_ai_answer')}
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
            <IconSparkles size={12} />{' '}
            {t('interview.assist.role_ai_generating')}
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
          {t('interview.generating_answer')}
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
                title={t('interview.assist.mic_start_title')}
              >
                <IconMic size={26} />
              </Button>
              <span className="iv-mic-hint">
                {t('interview.assist.mic_start_hint')}
              </span>
            </div>
          ) : (
            <div className="iv-mic-wrap">
              <Button
                variant="danger"
                onClick={stopListening}
                className="iv-mic-btn live"
                title={t('interview.assist.mic_stop_title')}
              >
                <IconStop size={26} />
              </Button>
              <span className="iv-mic-hint">
                {t('interview.assist.mic_stop_hint')}
              </span>
            </div>
          )}
        </div>

        <TextArea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('interview.assist.manual_placeholder')}
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
            <IconSend size={15} /> {t('interview.assist_submit')}
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
            ? t('interview.assist.hint_listening')
            : asrUnavailable
              ? t('interview.assist.hint_asr_unavailable')
              : !isConnected
                ? t('interview.assist.hint_waiting')
                : t('interview.assist.hint_idle')}
        </Text>
      </GlassCard>

      {!listening && !savedRecording && (
        <div className="iv-tip" style={{ marginTop: '0.75rem' }}>
          <IconRadio size={15} />
          <span>{t('interview.assist.tip')}</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default AssistModeView;
