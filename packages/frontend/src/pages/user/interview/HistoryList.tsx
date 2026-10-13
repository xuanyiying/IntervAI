import { Badge, Button, GlassCard, Title } from '@/components/ui';
import React, { useState } from 'react';
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

const FILTER_OPTIONS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'mock', label: '模拟面试' },
  { key: 'assist', label: '辅助面试' },
];

const STATUS_META: Record<
  string,
  {
    label: string;
    variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  }
> = {
  COMPLETED: { label: '已完成', variant: 'success' },
  IN_PROGRESS: { label: '进行中', variant: 'primary' },
  CANCELLED: { label: '已取消', variant: 'default' },
};

const formatDuration = (sec?: number | null) => {
  if (sec == null) return null;
  return `${Math.floor(sec / 60)}分${sec % 60}秒`;
};

const HistoryList: React.FC<HistoryListProps> = ({
  history,
  loading,
  onRefresh,
  onViewReport,
  onResume,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const matchFilter = (item: InterviewSessionHistoryItem, f: HistoryFilter) =>
    f === 'all' ||
    (f === 'mock' ? item.mode === 'MOCK' : item.mode === 'ASSIST');

  const filtered = history.filter((item) => matchFilter(item, filter));
  const countFor = (f: HistoryFilter) =>
    history.filter((item) => matchFilter(item, f)).length;

  return (
    <GlassCard padding="lg">
      <div className="iv-row-between" style={{ marginBottom: '1rem' }}>
        <Title level={4} style={{ margin: 0 }}>
          面试历史记录
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
                {opt.label}
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
            刷新
          </Button>
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="iv-loading-block">
          <div className="iv-spinner" /> 正在加载...
        </div>
      ) : filtered.length === 0 ? (
        <div className="iv-empty" style={{ padding: '3rem 1rem' }}>
          <IconPlayCircle size={32} />
          <span>
            {history.length === 0
              ? '暂无面试记录，先完成一次面试吧'
              : '当前筛选条件下暂无记录'}
          </span>
          {history.length === 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/interview')}
            >
              去设置面试
            </Button>
          )}
        </div>
      ) : (
        <div className="iv-stack">
          {filtered.map((item) => {
            const status = STATUS_META[item.status] ?? {
              label: item.status,
              variant: 'default' as const,
            };
            return (
              <div key={item.id} className="iv-history-item">
                <div className="iv-history-main">
                  <div className="iv-history-title">
                    <span className="iv-history-title-text">
                      {item.jobPosition ||
                        (item.mode === 'ASSIST' ? '辅助面试' : '模拟面试')}
                    </span>
                    <Badge
                      variant={item.mode === 'MOCK' ? 'primary' : 'default'}
                    >
                      {item.mode === 'MOCK' ? '模拟' : '辅助'}
                    </Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="iv-history-meta">
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                    {item.recordingDuration
                      ? ` · 录音 ${formatDuration(item.recordingDuration)}`
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
                          title={`得分 ${item.score}`}
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
                        查看报告
                      </Button>
                    </>
                  ) : item.status === 'IN_PROGRESS' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!item.optimizationId}
                      onClick={() => onResume(item)}
                    >
                      继续面试
                    </Button>
                  ) : (
                    <Badge variant="default">{status.label}</Badge>
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
