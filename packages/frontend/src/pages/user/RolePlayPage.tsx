import React, { useState, useEffect } from 'react';
import { GlassCard, Button, Select, Tabs, Switch, Badge } from '@/components/ui';
import { useToast } from '@/components/ui';
import { FeatureGuideCard } from '@/components/FeatureGuideCard/FeatureGuideCard';
import { useResumeStore } from '@/stores/resumeStore';
import { useAuthStore } from '@/stores/authStore';
import { interviewService } from '@/services/interview-service';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const IconSettings: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconVideo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const IconClock: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCheck: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const RolePlayPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const { currentResume } = useResumeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('start');
  const [jobPosition, setJobPosition] = useState('');
  const [language, setLanguage] = useState('zh');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [useAssistant, setUseAssistant] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInterviewHistory();
  }, []);

  const loadInterviewHistory = async () => {
    try {
      const history = await interviewService.getInterviewHistory();
      setInterviewHistory(history);
    } catch (err) {
      console.error('Failed to load interview history:', err);
    }
  };

  const handleStartInterview = async () => {
    if (!currentResume) {
      warning('请先上传简历');
      navigate('/resumes');
      return;
    }

    if (!jobPosition.trim()) {
      warning('请输入目标岗位');
      return;
    }

    setLoading(true);
    try {
      const result = await interviewService.startRolePlay({
        resumeId: currentResume.id,
        jobPosition: jobPosition.trim(),
        language,
        audioEnabled,
        useAssistant,
      });
      success('面试会话已创建');
      navigate(`/interview/${result.sessionId}`);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      error(axiosError.response?.data?.message || '启动失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            模拟面试
          </h1>
          <p className="text-[var(--text-secondary)]">
            选择面试场景，AI 面试官将根据您的简历和目标岗位进行面试
          </p>
        </div>

        <Tabs
          items={[
            { key: 'start', label: '开始面试' },
            { key: 'history', label: '面试记录' },
          ]}
          defaultActiveKey={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />

        {activeTab === 'start' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <GlassCard padding="lg" className="product-hero-banner">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <IconVideo size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      AI 模拟面试
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      真人模拟面试体验
                    </p>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)]">
                  通过 AI 技术模拟真实面试场景，帮助您熟悉面试流程，提升面试技巧。
                </p>
              </GlassCard>

              <div className="space-y-3">
                <FeatureGuideCard
                  icon={<IconSettings />}
                  title="面试设置"
                  description="首先，配置面试相关信息，包括简历、岗位和语言偏好"
                />
                <FeatureGuideCard
                  icon={<IconVideo />}
                  title="开始面试"
                  description="AI 面试官将根据您的简历和目标岗位提出专业的面试问题"
                />
                <FeatureGuideCard
                  icon={<IconClock />}
                  title="实时反馈"
                  description="在面试过程中获得实时的回答建议和指导"
                />
                <FeatureGuideCard
                  icon={<IconCheck />}
                  title="综合评估"
                  description="面试结束后获得详细的表现评估报告和改进建议"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <GlassCard padding="lg" className="sticky top-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
                  面试配置
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      个人简历
                    </label>
                    {currentResume ? (
                      <div className="glass-card p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <IconCheck size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {currentResume.title || currentResume.originalFilename || '简历文件'}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            已上传
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate('/resumes')}
                        className="w-full glass-card p-4 border-dashed border-2 text-center hover:border-primary/50 transition-colors"
                      >
                        <p className="text-sm text-[var(--text-secondary)]">
                          暂无简历，点击上传
                        </p>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      目标岗位
                    </label>
                    <input
                      type="text"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                      placeholder="例如：前端开发工程师"
                      className="glass-input w-full"
                    />
                  </div>

                  <Select
                    label="面试语言"
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: 'zh', label: '中文' },
                      { value: 'en', label: 'English' },
                    ]}
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          音频采集
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          启用语音输入功能
                        </p>
                      </div>
                      <Switch
                        checked={audioEnabled}
                        onChange={setAudioEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          面试精灵
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          实时获取参考答案
                        </p>
                      </div>
                      <Switch
                        checked={useAssistant}
                        onChange={setUseAssistant}
                      />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleStartInterview}
                    disabled={!currentResume || !jobPosition.trim() || loading}
                    loading={loading}
                  >
                    开始模拟面试
                  </Button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {interviewHistory.length === 0 ? (
              <GlassCard padding="lg" className="text-center">
                <p className="text-[var(--text-secondary)] mb-4">
                  暂无面试记录
                </p>
                <Button variant="primary" onClick={() => setActiveTab('start')}>
                  开始第一次面试
                </Button>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {interviewHistory.map((item) => (
                  <GlassCard key={item.id} padding="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)]">
                          {item.jobPosition || '模拟面试'}
                        </h4>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={item.status === 'COMPLETED' ? 'success' : 'default'}>
                          {item.status === 'COMPLETED' ? '已完成' : '进行中'}
                        </Badge>
                        {item.score && (
                          <span className="text-lg font-bold text-primary">
                            {item.score}
                          </span>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/interview/${item.id}`)}
                        >
                          查看
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePlayPage;