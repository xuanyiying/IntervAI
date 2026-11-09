import {
  ConversationList,
  type ConversationTurn,
} from '@/features/interview/components/conversation';
import { Button, Text, TextArea, useToast } from '@/shared/ui';
import {
  AudioChannel,
  useInterviewSocket,
} from '@/features/interview/hooks/use-interview-socket';
import { InterviewQuestion } from '@/shared/types';
import {
  ASSIST_SAMPLE_RATE,
  floatTo16BitBase64,
} from '@/features/interview/utils/pcm';
import {
  QuestionEvaluation,
  AnswerEvaluationDimension,
} from '@/features/interview/api/interview-service';
import React, { useEffect, useRef, useState } from 'react';
import { Progress, Spin, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  IconBulb,
  IconMic,
  IconSend,
  IconStop,
} from '@/features/interview/components/Icons';

interface MockModeViewProps {
  currentQuestion: InterviewQuestion;
  answerText: string;
  setAnswerText: (text: string) => void;
  processing: boolean;
  /** Mock session id, used for the realtime ASR stream. */
  sessionId?: string;
  /** Evaluation of the just-answered question (polled by the parent). */
  lastEvaluation?: QuestionEvaluation | null;
  /** Whether the parent is still polling for the evaluation. */
  evaluationLoading?: boolean;
  /** Submit the answer; `audioBlob` is the recorded answer audio if any. */
  onSubmitAnswer: (audioBlob?: Blob) => void;
  /** Conversation history restored by the parent (mock + assist share it). */
  conversation?: ConversationTurn[];
  conversationLoading?: boolean;
  conversationError?: string | null;
  onRefreshConversation?: () => void;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  BEHAVIORAL: '行为面试题',
  TECHNICAL: '专业技能题',
  SITUATIONAL: '场景应变题',
  RESUME_BASED: '简历深挖题',
};

const EVALUATION_DIMENSIONS: Array<{
  key: AnswerEvaluationDimension;
  label: string;
}> = [
  { key: 'content', label: '内容质量' },
  { key: 'logicalThinking', label: '表达逻辑' },
  { key: 'contentMatch', label: '内容匹配度' },
  { key: 'jobFit', label: '岗位适配性' },
  { key: 'professionalKnowledge', label: '专业知识' },
  { key: 'communication', label: '沟通表达' },
];

const scoreColor = (score: number) => {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#faad14';
  return '#f5222d';
};

/** Join finalized ASR sentences; insert a space only between latin words. */
const joinTranscript = (prev: string, next: string): string => {
  if (!prev) return next;
  if (!next) return prev;
  const needsSpace =
    /[A-Za-z0-9]/.test(prev[prev.length - 1]) && /[A-Za-z0-9]/.test(next[0]);
  return prev + (needsSpace ? ' ' : '') + next;
};

const MockModeView: React.FC<MockModeViewProps> = ({
  currentQuestion,
  answerText,
  setAnswerText,
  processing,
  sessionId,
  lastEvaluation,
  evaluationLoading,
  onSubmitAnswer,
  conversation = [],
  conversationLoading = false,
  conversationError = null,
  onRefreshConversation,
}) => {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [asrUnavailable, setAsrUnavailable] = useState(false);
  const { warning, error: showError } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  /** Finalized transcript of the current answer (incl. typed prefix). */
  const finalizedRef = useRef('');
  const asrUnavailableRef = useRef(false);
  const streamActiveRef = useRef(false);
  const recordingRef = useRef(false);

  const markAsrUnavailable = () => {
    asrUnavailableRef.current = true;
    setAsrUnavailable(true);
  };

  // Realtime ASR via the /realtime-interview namespace. autoAnswer is off
  // and record is off: the mock flow only wants the live transcript.
  const { isConnected, joinSession, startStream, sendAudioData, stopStream } =
    useInterviewSocket({
      mode: 'assist',
      onJoinedSession: (data) => {
        if (data.realtimeAsrAvailable === false) {
          markAsrUnavailable();
        }
      },
      onTranscriptionPartial: (data) => {
        if (!recordingRef.current) return;
        if (data.channel && data.channel !== 'self') return;
        setAnswerText(finalizedRef.current + data.text);
      },
      onTranscription: (data) => {
        if (!recordingRef.current || !data.final) return;
        if (data.channel && data.channel !== 'self') return;
        finalizedRef.current = joinTranscript(finalizedRef.current, data.text);
        setAnswerText(finalizedRef.current);
      },
      onAsrError: () => markAsrUnavailable(),
      onError: (err) => {
        if (/not available/i.test(err.message || '')) {
          markAsrUnavailable();
          return;
        }
        showError(err.message);
      },
    });

  useEffect(() => {
    if (sessionId && isConnected) {
      joinSession(sessionId);
    }
  }, [sessionId, isConnected, joinSession]);

  const cleanupAudioTap = (stopTracks = false) => {
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
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    if (stopTracks && mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (sessionId && streamActiveRef.current) {
        stopStream(sessionId, 'self');
      }
      cleanupAudioTap(true);
    };
  }, []);

  const startMicTap = (channel: AudioChannel) => {
    if (!mediaStreamRef.current || !audioContextRef.current) return;
    cleanupAudioTap();
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      if (sessionId && streamActiveRef.current) {
        sendAudioData(sessionId, floatTo16BitBase64(input), channel);
      }
    };
    const source = audioContextRef.current.createMediaStreamSource(
      mediaStreamRef.current
    );
    sourceNodeRef.current = source;
    source.connect(processor);
    // Muted destination keeps the processor pulling without playback.
    const silentGain = audioContextRef.current.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(audioContextRef.current.destination);
  };

  const finishRecording = () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    if (sessionId && streamActiveRef.current) {
      stopStream(sessionId, 'self');
      streamActiveRef.current = false;
    }
    cleanupAudioTap(true);

    recordingRef.current = false;
    setRecording(false);
    // Flush the finalized transcript before submitting.
    setAnswerText(finalizedRef.current);
    onSubmitAnswer(blob.size > 0 ? blob : undefined);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => finishRecording();

      // Keep any typed text as the transcript prefix.
      finalizedRef.current = answerText;
      setAnswerText(finalizedRef.current);

      if (sessionId && isConnected && !asrUnavailableRef.current) {
        audioContextRef.current = new AudioContext({
          sampleRate: ASSIST_SAMPLE_RATE,
        });
        startStream(sessionId, {
          sampleRate: ASSIST_SAMPLE_RATE,
          autoAnswer: false,
          channel: 'self',
          record: false,
        });
        streamActiveRef.current = true;
        startMicTap('self');
      }

      recorder.start();
      recordingRef.current = true;
      setRecording(true);
    } catch (err) {
      console.error(err);
      showError(t('interview.setup.mic_permission'));
      cleanupAudioTap(true);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleSubmit = () => {
    if (!answerText.trim()) {
      warning(t('interview.answer_required'));
      return;
    }
    onSubmitAnswer();
  };

  return (
    <>
      <ConversationList
        items={conversation}
        loading={conversationLoading}
        error={conversationError}
        onRetry={onRefreshConversation}
        title={t('interview.conversation.title', '会话记录')}
        emptyText={t(
          'interview.conversation.empty_mock',
          '提交回答后，问答记录会显示在这里'
        )}
        roleLabels={{
          user: t('interview.conversation.role_candidate', '你的回答'),
          assistant: t('interview.conversation.role_interviewer', 'AI 面试官'),
        }}
        maxHeight={280}
      />

      <div className="iv-question-card">
        <div className="iv-question-meta">
          <Tag color="blue">
            {QUESTION_TYPE_LABELS[currentQuestion.questionType] ??
              currentQuestion.questionType}
          </Tag>
          <span className="iv-status-pill live">
            <span className="iv-rec-dot" />
            {t('interview.mock.ai_asking')}
          </span>
        </div>
        <h4 className="iv-question-text">{currentQuestion.question}</h4>
        {currentQuestion.tips && currentQuestion.tips.length > 0 && (
          <div className="iv-tips">
            <span className="iv-tip-label">
              <span
                style={{
                  verticalAlign: '-2px',
                  marginRight: '0.25rem',
                  display: 'inline-flex',
                }}
              >
                <IconBulb size={13} />
              </span>
              {t('interview.mock.tips_label')}
            </span>
            <ul className="iv-tips-list">
              {currentQuestion.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(lastEvaluation || evaluationLoading) && (
        <div
          className="iv-eval-card"
          style={{
            border: '1px solid var(--border-color, rgba(148,163,184,0.25))',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            background: 'var(--bg-secondary, rgba(148,163,184,0.08))',
          }}
        >
          <div
            className="iv-row-between"
            style={{ marginBottom: '0.5rem', gap: '0.5rem' }}
          >
            <Text strong style={{ fontSize: '0.85rem' }}>
              {t('interview.mock.evaluation_title', '答题评分')}
              {lastEvaluation?.question ? ' · ' : ''}
              {lastEvaluation?.question ?? ''}
            </Text>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {lastEvaluation?.evaluation.overallScore != null && (
                <Text
                  strong
                  style={{
                    color: scoreColor(lastEvaluation.evaluation.overallScore),
                  }}
                >
                  {lastEvaluation.evaluation.overallScore} 分
                </Text>
              )}
              {lastEvaluation?.evaluation.grade && (
                <Tag color="geekblue" style={{ margin: 0 }}>
                  {lastEvaluation.evaluation.grade}
                </Tag>
              )}
              {evaluationLoading && !lastEvaluation && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary, #94a3b8)',
                  }}
                >
                  <Spin size="small" />
                  {t('interview.mock.evaluating', '评分生成中...')}
                </span>
              )}
            </span>
          </div>

          {lastEvaluation && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.35rem 1rem',
                  marginBottom: '0.5rem',
                }}
              >
                {EVALUATION_DIMENSIONS.map(({ key, label }) => {
                  const dimension = lastEvaluation.evaluation.breakdown[key];
                  if (!dimension) return null;
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary, #94a3b8)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                      <Progress
                        percent={dimension.score}
                        size="small"
                        showInfo={false}
                        strokeColor={scoreColor(dimension.score)}
                        style={{ flex: 1, margin: 0 }}
                      />
                      <span
                        style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                      >
                        {dimension.score}
                      </span>
                    </div>
                  );
                })}
              </div>

              {lastEvaluation.evaluation.feedback.improvements.length > 0 && (
                <div className="iv-tips">
                  <span className="iv-tip-label">
                    <span
                      style={{
                        verticalAlign: '-2px',
                        marginRight: '0.25rem',
                        display: 'inline-flex',
                      }}
                    >
                      <IconBulb size={13} />
                    </span>
                    {t('interview.mock.improvement_suggestions', '改进建议')}
                  </span>
                  <ul className="iv-tips-list">
                    {lastEvaluation.evaluation.feedback.improvements.map(
                      (item, idx) => (
                        <li key={idx}>{item}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div className="iv-row-between" style={{ marginBottom: '0.35rem' }}>
          <Text strong className="iv-field-label">
            {t('interview.your_answer')}
          </Text>
          {recording && (
            <span className="iv-status-pill live">
              <span className="iv-rec-dot" />
              {asrUnavailable
                ? t('interview.mock.recording')
                : t('interview.mock.transcribing')}
            </span>
          )}
        </div>
        <TextArea
          rows={6}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder={t('interview.mock.answer_placeholder')}
          disabled={processing || recording}
        />
      </div>

      <div className="iv-controls">
        <Button
          variant={recording ? 'danger' : 'secondary'}
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          className="iv-mic-btn"
        >
          {recording ? <IconStop size={24} /> : <IconMic size={24} />}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={recording || processing || !answerText.trim()}
          loading={processing}
        >
          <IconSend size={15} /> {t('interview.submit_answer')}
        </Button>
      </div>

      <Text
        type="secondary"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: '0.5rem',
          fontSize: '0.78rem',
        }}
      >
        {recording
          ? asrUnavailable
            ? t('interview.mock.hint_recording_no_asr')
            : t('interview.mock.hint_recording_asr')
          : t('interview.mock.hint_idle')}
      </Text>
    </>
  );
};

export default MockModeView;
