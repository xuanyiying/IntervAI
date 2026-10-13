import { Button, GlassCard, Select, Text, useToast } from '@/components/ui';
import { Optimization } from '@/types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  InterviewerPersona,
  interviewService,
} from '../../../services/interview-service';
import { capturePcmBase64 } from '../../../utils/pcm';
import {
  IconAudio,
  IconCheck,
  IconClock,
  IconFileText,
  IconGlobe,
  IconHeadphones,
  IconMic,
  IconSparkles,
  IconTarget,
  IconUser,
} from './icons';

export type InterviewMode = 'mock' | 'assist';
export type InterviewLanguage = 'zh' | 'en';

export const PERSONA_STYLE_LABELS: Record<string, string> = {
  STRICT: '严厉型',
  FRIENDLY: '友好型',
  TECHNICAL: '技术型',
  HR: 'HR型',
  SUPPORTIVE: '支持型',
  CHALLENGING: '挑战型',
};

interface SetupStepProps {
  mode: InterviewMode;
  onModeChange: (mode: InterviewMode) => void;
  language: InterviewLanguage;
  onLanguageChange: (lang: InterviewLanguage) => void;
  optimizations: Optimization[];
  optimizationsLoading: boolean;
  selectedOptimizationId: string | null;
  onSelectOptimization: (id: string | null) => void;
  personas: InterviewerPersona[];
  selectedPersonaId?: string;
  onSelectPersona: (id: string) => void;
  onStart: () => void;
  starting: boolean;
}

const MODE_META: Record<
  InterviewMode,
  {
    icon: React.ReactNode;
    name: string;
    tag: string;
    desc: string;
    points: string[];
  }
> = {
  assist: {
    icon: <IconHeadphones size={22} />,
    name: '辅助面试',
    tag: '远程视频面试',
    desc: '真实面试进行时使用：电脑持续监听面试官提问，实时生成参考答案。',
    points: [
      '实时语音识别面试官的问题',
      '自动检测问题并流式生成参考答案',
      '整场面试自动录音，结束后可回放、查看转写',
    ],
  },
  mock: {
    icon: <IconTarget size={22} />,
    name: '模拟面试',
    tag: 'AI 面试官',
    desc: 'AI 扮演面试官，基于你的简历与目标职位进行完整模拟面试。',
    points: [
      '根据简历和目标职位定制提问',
      '支持语音通话作答，也可文字回答',
      '结束后生成评分报告，全程录音留档',
    ],
  },
};

const SetupStep: React.FC<SetupStepProps> = ({
  mode,
  onModeChange,
  language,
  onLanguageChange,
  optimizations,
  optimizationsLoading,
  selectedOptimizationId,
  onSelectOptimization,
  personas,
  selectedPersonaId,
  onSelectPersona,
  onStart,
  starting,
}) => {
  const navigate = useNavigate();
  const { warning, success, error: showError } = useToast();

  const [vpStatus, setVpStatus] = useState<{
    available: boolean;
    enrolled: boolean;
    sampleCount: number;
  } | null>(null);
  const [vpEnrolling, setVpEnrolling] = useState(false);
  const [vpCountdown, setVpCountdown] = useState(0);

  useEffect(() => {
    if (mode !== 'assist') return;
    interviewService
      .getVoiceprintStatus()
      .then(setVpStatus)
      .catch(() => setVpStatus(null));
  }, [mode]);

  const handleEnrollVoiceprint = async () => {
    try {
      setVpEnrolling(true);
      const { base64, sampleRate } = await capturePcmBase64(9, setVpCountdown);
      const result = await interviewService.enrollVoiceprint(
        base64,
        sampleRate
      );
      if (result.success) {
        success('声纹注册成功，辅助面试将自动区分你与面试官');
        const status = await interviewService.getVoiceprintStatus();
        setVpStatus(status);
      } else {
        warning(result.message || '声纹注册失败，请重试');
      }
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        showError('声纹注册失败，请重试');
      } else {
        warning('无法访问麦克风，请检查浏览器权限');
      }
    } finally {
      setVpEnrolling(false);
      setVpCountdown(0);
    }
  };

  const handleDeleteVoiceprint = async () => {
    try {
      await interviewService.deleteVoiceprint();
      const status = await interviewService.getVoiceprintStatus();
      setVpStatus(status);
    } catch {
      showError('清除声纹失败');
    }
  };

  const mockRequiresOptimization = mode === 'mock' && !selectedOptimizationId;
  const hasOptimizations = optimizations.length > 0;

  const handleStart = () => {
    if (mockRequiresOptimization) {
      warning('模拟面试需要先选择一份简历优化记录');
      return;
    }
    onStart();
  };

  const formatOptDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="iv-two-col">
      <div className="iv-stack">
        <div className="iv-hero">
          <div
            className="iv-row"
            style={{ gap: '1rem', marginBottom: '0.75rem' }}
          >
            <div className="iv-hero-icon">
              <IconSparkles size={28} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="iv-hero-title">AI 面试精灵</h2>
              <p className="iv-hero-sub">
                远程视频面试实时辅助，或与 AI
                面试官进行全真模拟，面试结束后自动保存录音与评估报告。
              </p>
            </div>
          </div>
        </div>

        <div>
          <span className="iv-field-label">选择面试模式</span>
          <div className="iv-mode-grid">
            {(Object.keys(MODE_META) as InterviewMode[]).map((key) => {
              const meta = MODE_META[key];
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`iv-mode-card${active ? ' active' : ''}`}
                  data-mode={key}
                  onClick={() => onModeChange(key)}
                >
                  <div className="iv-row-between">
                    <div className="iv-row">
                      <div className="iv-mode-icon">{meta.icon}</div>
                      <div>
                        <span className="iv-mode-name">{meta.name}</span>
                        <span className="iv-mode-tag">{meta.tag}</span>
                      </div>
                    </div>
                    {active && (
                      <span className="iv-mode-check">
                        <IconCheck size={13} />
                      </span>
                    )}
                  </div>
                  <div className="iv-mode-desc">{meta.desc}</div>
                  <ul className="iv-mode-points">
                    {meta.points.map((point) => (
                      <li key={point}>
                        <IconCheck size={13} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <GlassCard padding="lg" className="iv-sticky">
        <Text strong className="iv-setup-title">
          配置面试
        </Text>

        <div className="iv-stack" style={{ marginTop: '1.25rem' }}>
          <div>
            <span className="iv-field-label">
              简历上下文
              {mode === 'assist' && (
                <Text type="secondary" className="iv-field-hint">
                  （来自「我的简历」页的优化记录，默认使用最新一份）
                </Text>
              )}
            </span>

            {optimizationsLoading ? (
              <div className="iv-empty">正在加载简历优化记录...</div>
            ) : !hasOptimizations ? (
              <div className="iv-empty">
                <IconFileText size={24} />
                <span>
                  {mode === 'mock'
                    ? '模拟面试需要基于一份简历优化记录进行，请先在「我的简历」页上传简历并完成优化'
                    : '暂无简历优化记录，将以通用模式开始（答案不基于简历）'}
                </span>
                {mode === 'mock' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/resumes')}
                  >
                    去「我的简历」上传并优化
                  </Button>
                )}
              </div>
            ) : (
              <div className="iv-opt-list">
                {mode === 'assist' && (
                  <button
                    type="button"
                    className={`iv-opt-item${selectedOptimizationId === null ? ' active' : ''}`}
                    onClick={() => onSelectOptimization(null)}
                  >
                    <div className="iv-row-between">
                      <span className="iv-opt-title">通用模式</span>
                      {selectedOptimizationId === null && (
                        <IconCheck size={16} />
                      )}
                    </div>
                    <div className="iv-opt-meta">
                      不使用简历，快速获取参考答案
                    </div>
                  </button>
                )}
                {optimizations.map((opt) => {
                  const active = selectedOptimizationId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`iv-opt-item${active ? ' active' : ''}`}
                      onClick={() => onSelectOptimization(opt.id)}
                    >
                      <div className="iv-row-between">
                        <span className="iv-opt-title">
                          {opt.job?.title || '未关联职位'}
                        </span>
                        {active && <IconCheck size={16} />}
                      </div>
                      <div className="iv-opt-meta">
                        {opt.job?.company || '未填写公司'} ·{' '}
                        {formatOptDate(opt.createdAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <span className="iv-field-label">
              <IconGlobe size={13} className="iv-label-icon" /> 答案语言
            </span>
            <Select
              value={language}
              onChange={(val) => onLanguageChange(val as InterviewLanguage)}
              options={[
                { value: 'zh', label: '中文' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>

          {mode === 'assist' && (
            <div>
              <span className="iv-field-label">
                <IconAudio size={13} className="iv-label-icon" />{' '}
                区分说话人（声纹）
              </span>
              {vpStatus && !vpStatus.available ? (
                <div className="iv-empty" style={{ padding: '0.875rem 1rem' }}>
                  <span>
                    声纹服务未在服务端启用，可改用「共享会议音频」区分说话人
                  </span>
                </div>
              ) : vpStatus?.enrolled ? (
                <div
                  className="iv-opt-item active"
                  style={{ cursor: 'default' }}
                >
                  <div className="iv-row-between">
                    <span
                      className="iv-opt-title"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      <span
                        style={{
                          verticalAlign: '-2px',
                          marginRight: 4,
                          display: 'inline-flex',
                        }}
                      >
                        <IconCheck size={14} />
                      </span>
                      已注册声纹（{vpStatus.sampleCount} 次采样）
                    </span>
                    <span className="iv-row" style={{ gap: '0.375rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleEnrollVoiceprint}
                        loading={vpEnrolling}
                      >
                        重新注册
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteVoiceprint}
                      >
                        清除
                      </Button>
                    </span>
                  </div>
                  <div className="iv-opt-meta">
                    辅助面试将自动区分面试官与你的发言
                  </div>
                </div>
              ) : (
                <div className="iv-opt-item" style={{ cursor: 'default' }}>
                  <div className="iv-row-between">
                    <span className="iv-opt-title">
                      {vpEnrolling
                        ? `请对麦克风说话...（${vpCountdown}s）`
                        : '未注册'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnrollVoiceprint}
                      loading={vpEnrolling && vpCountdown === 0}
                    >
                      {vpEnrolling ? '录制中' : '注册（9 秒）'}
                    </Button>
                  </div>
                  <div className="iv-opt-meta">
                    注册后系统按声纹自动区分你与面试官，字幕分别标注
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'mock' && (
            <div>
              <span className="iv-field-label">
                <IconUser size={13} className="iv-label-icon" /> 选择面试官
              </span>
              {personas.length === 0 ? (
                <div className="iv-empty">暂无可用面试官，将使用默认面试官</div>
              ) : (
                <div className="iv-persona-list">
                  {personas.map((persona) => {
                    const active = selectedPersonaId === persona.id;
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        className={`iv-persona-item${active ? ' active' : ''}`}
                        onClick={() => onSelectPersona(persona.id)}
                      >
                        <span className="iv-persona-avatar">
                          {persona.name.charAt(0)}
                        </span>
                        <span className="iv-persona-body">
                          <span className="iv-row-between">
                            <span
                              className="iv-opt-title"
                              style={{
                                color: active
                                  ? 'var(--primary-color)'
                                  : undefined,
                              }}
                            >
                              {persona.name}
                            </span>
                            <span className="iv-pill">
                              {PERSONA_STYLE_LABELS[persona.style] ??
                                persona.style}
                            </span>
                          </span>
                          {(persona.company || persona.position) && (
                            <span
                              className="iv-opt-meta"
                              style={{ display: 'block' }}
                            >
                              {[persona.company, persona.position]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStart}
            loading={starting}
            disabled={mockRequiresOptimization}
          >
            {mode === 'assist' ? (
              <>
                <IconHeadphones size={16} /> 开始实时辅助
              </>
            ) : (
              <>
                <IconMic size={16} /> 开始模拟面试
              </>
            )}
          </Button>

          <div className="iv-tip">
            <IconClock size={15} />
            <span>
              {mode === 'assist'
                ? '建议：手机端进行视频通话并开启外放，电脑端点击开始，系统将持续监听并自动录制整场面试。'
                : '建议选择安静环境，优先使用语音通话作答，回答表现将更接近真实面试。'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SetupStep;
