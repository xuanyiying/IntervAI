import { Badge, Button, GlassCard, Title } from '@/components/ui';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { InterviewSessionHistoryItem } from '../../../services/interview-service';
import { IconPlayCircle } from './icons';

interface HistoryListProps {
  history: InterviewSessionHistoryItem[];
  loading: boolean;
  onRefresh: () => void;
  onViewReport: (sessionId: string) => void;
  onResume: (item: InterviewSessionHistoryItem) => void;
}

type HistoryFilter = 'all' | 'mock' | 'assist';

const FILTER_OPTIONS: { key: HistoryFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'interview.history.filter_all' },
  { key: 'mock', labelKey: 'interview.mode_mock' },
  { key: 'assist', labelKey: 'interview.mode_assist' },
];

const STATUS_META: Record<
  string,
  {
    labelKey: string;
    variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  }
> = {
  COMPLETED: {
    labelKey: 'interview.history.status_completed',
    variant: 'success',
  },
  IN_PROGRESS: {
    labelKey: 'interview.history.status_in_progress',
    variant: 'primary',
  },
  CANCELLED: {
    labelKey: 'interview.history.status_cancelled',
    variant: 'default',
  },
};

const HistoryList: React.FC<HistoryListProps> = ({
  history,
  loading,
  onRefresh,
  onViewReport,
  onResume,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const matchFilter = (item: InterviewSessionHistoryItem, f: HistoryFilter) =>
    f === 'all' ||
    (f === 'mock' ? item.mode === 'MOCK' : item.mode === 'ASSIST');

  const filtered = history.filter((item) => matchFilter(item, filter));
  const countFor = (f: HistoryFilter) =>
    history.filter((item) => matchFilter(item, f)).length;

  const formatRecordingDuration = (sec: number) =>
    t('interview.history.recording_duration', {
      minutes: Math.floor(sec / 60),
      seconds: sec % 60,
    });

  return (
    <GlassCard padding="lg">
      <div className="iv-row-between" style={{ marginBottom: '1rem' }}>
        <Title level={4} style={{ margin: 0 }}>
          {t('interview.history.title')}
        </Title>
        <div className="iv-row">
          <div className="iv-filter-chips">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`iv-filter-chip${filter === opt.key ? ' active' : ''}`}
                onClick={() => setFilter(opt.key)}
              >
                {t(opt.labelKey)}
                <span className="iv-filter-count">{countFor(opt.key)}</span>
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            loading={loading}
          >
            {t('interview.history.refresh')}
          </Button>
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="iv-loading-block">
          <div className="iv-spinner" /> {t('interview.history.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="iv-empty" style={{ padding: '3rem 1rem' }}>
          <IconPlayCircle size={32} />
          <span>
            {history.length === 0
              ? t('interview.history.empty_all')
              : t('interview.history.empty_filtered')}
          </span>
          {history.length === 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/interview')}
            >
              {t('interview.history.go_setup')}
            </Button>
          )}
        </div>
      ) : (
        <div className="iv-stack">
          {filtered.map((item) => {
            const statusMeta = STATUS_META[item.status];
            const statusLabel = statusMeta
              ? t(statusMeta.labelKey)
              : item.status;
            return (
              <div key={item.id} className="iv-history-item">
                <div className="iv-history-main">
                  <div className="iv-history-title">
                    <span className="iv-history-title-text">
                      {item.jobPosition ||
                        (item.mode === 'ASSIST'
                          ? t('interview.mode_assist')
                          : t('interview.mode_mock'))}
                    </span>
                    <Badge
                      variant={item.mode === 'MOCK' ? 'primary' : 'default'}
                    >
                      {item.mode === 'MOCK'
                        ? t('interview.history.badge_mock')
                        : t('interview.history.badge_assist')}
                    </Badge>
                    <Badge variant={statusMeta?.variant ?? 'default'}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="iv-history-meta">
                    {new Date(item.createdAt).toLocaleString(
                      i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'
                    )}
                    {item.recordingDuration
                      ? ` · ${formatRecordingDuration(item.recordingDuration)}`
                      : ''}
                  </div>
                  {item.recordingUrl && (
                    <audio
                      controls
                      preload="none"
                      src={item.recordingUrl}
                      className="iv-audio-player"
                      style={{ marginTop: '0.5rem', maxWidth: '100%' }}
                    />
                  )}
                </div>

                <div className="iv-history-actions">
                  {item.status === 'COMPLETED' ? (
                    <>
                      {item.score != null && (
                        <span
                          className="iv-score-ring"
                          style={
                            { '--score': item.score } as React.CSSProperties
                          }
                          title={t('interview.history.score_title', {
                            score: item.score,
                          })}
                        >
                          <span className="iv-score-ring-fill" />
                          <span className="iv-score-value">{item.score}</span>
                        </span>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewReport(item.id)}
                      >
                        {t('interview.history.view_report')}
                      </Button>
                    </>
                  ) : item.status === 'IN_PROGRESS' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!item.optimizationId}
                      onClick={() => onResume(item)}
                    >
                      {t('interview.history.resume')}
                    </Button>
                  ) : (
                    <Badge variant="default">{statusLabel}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default HistoryList;
