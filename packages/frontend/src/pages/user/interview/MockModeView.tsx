import { Badge, Button, Text, TextArea, useToast } from '@/components/ui';
import { AudioChannel, useInterviewSocket } from '@/hooks/useInterviewSocket';
import { InterviewQuestion } from '@/types';
import { ASSIST_SAMPLE_RATE, floatTo16BitBase64 } from '@/utils/pcm';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBulb, IconMic, IconSend, IconStop } from './icons';

interface MockModeViewProps {
  currentQuestion: InterviewQuestion;
  answerText: string;
  setAnswerText: (text: string) => void;
  processing: boolean;
  /** Mock session id, used for the realtime ASR stream. */
  sessionId?: string;
  /** Submit the answer; `audioBlob` is the recorded answer audio if any. */
  onSubmitAnswer: (audioBlob?: Blob) => void;
}

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
  onSubmitAnswer,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="iv-question-card">
        <div className="iv-question-meta">
          <Badge variant="primary">{currentQuestion.questionType}</Badge>
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
