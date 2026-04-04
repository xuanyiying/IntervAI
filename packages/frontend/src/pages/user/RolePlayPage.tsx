import React, { useState, useEffect } from 'react';
import { RolePlayCard } from '../../components/RolePlayCard';
import { FeatureGuideCard } from '@/components/FeatureGuideCard/FeatureGuideCard';
import { useResumeStore } from '@/stores';
import { useTranslation } from 'react-i18next';
import { Tabs } from 'antd';
import {
  PlayCircleOutlined,
  SettingOutlined,
  AudioOutlined,
  RocketOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '@/styles/common.css';
import '@/styles/agents.css';

export const RolePlayPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentResume, fetchResumes } = useResumeStore();
  const [jobDescription, setJobDescription] = useState('');
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (!currentResume) {
      fetchResumes();
    }
  }, [currentResume, fetchResumes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      setShowForm(false);
    }
  };

  const resumeData = currentResume?.parsedData;

  if (!showForm) {
    return (
      <div className="page-container">
        <div className="content-container">
          {jobDescription && (
            <RolePlayCard
              resumeData={resumeData as any}
              jobDescription={jobDescription}
              onBack={() => setShowForm(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="interview-page-container">
      <Tabs
        defaultActiveKey="start"
        className="interview-page-tabs mb-6"
        items={[
          {
            key: 'start',
            label: t('roleplay.tab_start', '开始模拟'),
          },
          {
            key: 'history',
            label: t('roleplay.tab_history', '模拟记录'),
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="product-hero-banner glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <PlayCircleOutlined
                    style={{ fontSize: 28, color: 'var(--primary-color)' }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    3分钟学会使用 IntervAI 模拟面试
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <FeatureGuideCard
              icon={<SettingOutlined />}
              title={t('roleplay.guide_setup', '面试设置')}
              description={t(
                'roleplay.guide_setup_desc',
                '首先，配置面试相关信息，选择岗位和面试语言。系统将根据您的目标岗位生成针对性问题。'
              )}
            />
            <FeatureGuideCard
              icon={<AudioOutlined />}
              title={t('roleplay.guide_audio', '录音测试')}
              description={t(
                'roleplay.guide_audio_desc',
                '选择并配置正确的音频设备，点击"录音测试"确保声音清晰。推荐使用耳机以获得最佳效果。'
              )}
            />
            <FeatureGuideCard
              icon={<RocketOutlined />}
              title={t('roleplay.guide_start', '开始面试')}
              description={t(
                'roleplay.guide_start_desc',
                '准备就绪后，点击"开始面试"按钮，系统将立即为您开启一场真实的模拟面试体验。'
              )}
            />
            <FeatureGuideCard
              icon={<FileTextOutlined />}
              title={t('roleplay.guide_report', '查看报告')}
              description={t(
                'roleplay.guide_report_desc',
                '面试结束后自动生成详细评估报告，包含表现评分和改进建议。可在模拟记录中随时回顾。'
              )}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
              {t('roleplay.config_title', '面试配置')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="config-field">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t('roleplay.personal_resume', '个人简历')}
                </label>
                {currentResume ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]">
                    <span className="text-sm truncate">
                      {currentResume.title || currentResume.originalFilename}
                    </span>
                    <button
                      type="button"
                      className="gradient-button text-xs !py-1.5 !px-3"
                      onClick={() => navigate('/resumes')}
                    >
                      {t('roleplay.upload', '去上传简历')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl border border-dashed border-[var(--glass-border)] text-sm text-[var(--text-tertiary)] hover:border-primary hover:text-primary transition-colors"
                    onClick={() => navigate('/resumes')}
                  >
                    {t('roleplay.no_resume', '暂无简历，点击上传')}
                  </button>
                )}
              </div>

              <div className="config-field">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t('roleplay.position', '岗位选择')}
                </label>
                <input
                  type="text"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={t(
                    'roleplay.position_placeholder',
                    '请选择或输入目标岗位'
                  )}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="config-field">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t('roleplay.language', '面试语言')}
                </label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-primary">
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="config-field flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {t('roleplay.audio_collection', '音频采集')}
                </span>
              </div>

              <div className="config-field flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {t('roleplay.interview_spirit', '面试精灵')}
                </span>
              </div>

              <button
                type="submit"
                className="w-full gradient-button !py-3 !rounded-xl mt-4"
              >
                {t('roleplay.start_interview', '开始面试')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePlayPage;
