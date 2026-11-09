import React, { useState } from 'react';
import { pitchPerfectService } from '@/features/pitch-perfect';
import {
  PitchPerfectAgentOutput,
  PitchVersion,
  type ParsedResumeData,
} from '@/shared/types';
import { useOptimizationStore } from '@/features/resume';
import {
  Select,
  Button,
  Space,
  Typography,
  Card,
  Divider,
  Tag,
  Tabs,
  List,
  Empty,
  Alert,
  Input,
} from 'antd';
import {
  HistoryOutlined,
  SendOutlined,
  RedoOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/shared/utils/format';
import './PitchPerfectCard.css';

const { Title, Text, Paragraph } = Typography;

type PitchVersionKey = 'oneMinute' | 'threeMinute' | 'fiveMinute';

const VERSION_TABS: Array<{
  key: PitchVersionKey;
  label: string;
  scenario: string;
}> = [
  { key: 'oneMinute', label: '1 分钟版', scenario: 'oneMinute' },
  { key: 'threeMinute', label: '3 分钟版', scenario: 'threeMinute' },
  { key: 'fiveMinute', label: '5 分钟版', scenario: 'fiveMinute' },
];

interface PitchPerfectCardProps {
  resumeId: string;
  resumeData: ParsedResumeData;
  jobDescription: string;
  /** Optional JD match analysis result to emphasize candidate advantages. */
  matchAnalysis?: Record<string, unknown>;
  onBack?: () => void;
}

export const PitchPerfectCard: React.FC<PitchPerfectCardProps> = ({
  resumeId,
  resumeData,
  jobDescription,
  matchAnalysis,
  onBack,
}) => {
  const [style, setStyle] = useState<'technical' | 'managerial' | 'sales'>(
    'technical'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PitchPerfectAgentOutput | null>(null);
  const [activeVersion, setActiveVersion] =
    useState<PitchVersionKey>('oneMinute');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [refining, setRefining] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { addVersion, getHistoryByResumeId } = useOptimizationStore();
  const history = getHistoryByResumeId(resumeId);

  const currentVersion: PitchVersion | null = result
    ? result.versions[activeVersion]
    : null;

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pitchPerfectService.generatePitch(
        resumeData,
        jobDescription,
        style,
        matchAnalysis
      );
      setResult(response);
      setActiveVersion('oneMinute');

      // Save to history
      addVersion({
        id: Date.now().toString(),
        resumeId,
        jobDescription,
        timestamp: Date.now(),
        output: response,
        style,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pitch');
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!currentVersion || !feedback.trim()) {
      setError('Please provide feedback for refinement');
      return;
    }

    try {
      setRefining(true);
      setError(null);
      const response = await pitchPerfectService.refinePitch(
        currentVersion.text,
        feedback
      );
      const updatedResult: PitchPerfectAgentOutput = {
        ...result!,
        versions: {
          ...result!.versions,
          [activeVersion]: {
            ...currentVersion,
            text: response.refinedIntroduction,
          },
        },
      };
      setResult(updatedResult);
      setFeedback('');

      // Save refined version to history too
      addVersion({
        id: Date.now().toString(),
        resumeId,
        jobDescription: `${jobDescription} (Refined: ${feedback})`,
        timestamp: Date.now(),
        output: updatedResult,
        style,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine pitch');
    } finally {
      setRefining(false);
    }
  };

  const selectVersion = (version: any) => {
    setResult(version.output);
    setStyle(version.style as any);
    setActiveVersion('oneMinute');
    setShowHistory(false);
  };

  const renderVersionContent = (version: PitchVersion) => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-200 leading-relaxed italic">
        "{version.text}"
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Text className="text-xs text-gray-500 block mb-2 uppercase tracking-wider">
            关键要点
          </Text>
          <ul className="space-y-1">
            {version.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-gray-400 text-sm">
                <span className="text-primary-400">•</span> {point}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Text className="text-xs text-gray-500 block mb-2 uppercase tracking-wider">
            使用场景
          </Text>
          <Paragraph className="!text-gray-400 text-sm !mb-2">
            {version.useScenario}
          </Paragraph>
          <Tag
            icon={<ClockCircleOutlined />}
            className="!bg-white/5 !border-white/10 !text-gray-300"
          >
            约 {version.wordCount} 字
          </Tag>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pitch-perfect-card-container space-y-6">
      <Card className="glass-card !border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                className="integrated-back-btn"
              />
            )}
            <Title level={4} className="!text-white !m-0">
              自我介绍
            </Title>
          </div>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setShowHistory(!showHistory)}
            type={showHistory ? 'primary' : 'default'}
          >
            历史版本 ({history.length})
          </Button>
        </div>

        {showHistory ? (
          <div className="history-section animate-fade-in">
            <List
              dataSource={history}
              locale={{ emptyText: <Empty description="暂无历史优化记录" /> }}
              renderItem={(item) => (
                <List.Item
                  className="cursor-pointer hover:bg-white/5 rounded-lg p-3 transition-colors"
                  onClick={() => selectVersion(item)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text className="text-white font-medium">
                          {formatDateTime(item.timestamp)}
                        </Text>
                        <Tag color="blue">{item.style}</Tag>
                      </Space>
                    }
                    description={
                      <Paragraph
                        ellipsis={{ rows: 1 }}
                        className="!text-gray-400 !m-0"
                      >
                        {item.output.versions?.oneMinute?.text}
                      </Paragraph>
                    }
                  />
                </List.Item>
              )}
            />
            <Button
              className="w-full mt-4"
              onClick={() => setShowHistory(false)}
            >
              返回当前
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">风格偏好</label>
                <Select
                  className="w-full"
                  value={style}
                  onChange={setStyle}
                  options={[
                    { value: 'technical', label: '技术型' },
                    { value: 'managerial', label: '管理型' },
                    { value: 'sales', label: '销售/市场型' },
                  ]}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="primary"
                  block
                  icon={<RedoOutlined />}
                  onClick={handleGenerate}
                  loading={loading}
                >
                  {result ? '重新生成' : '开始生成'}
                </Button>
              </div>
            </div>

            {error && (
              <Alert message={error} type="error" showIcon className="mb-6" />
            )}

            {result && (
              <div className="results-display space-y-8 animate-fade-in">
                <section>
                  <Title level={5} className="!text-primary-400">
                    <CheckCircleOutlined /> 推荐个人介绍
                  </Title>
                  <Tabs
                    activeKey={activeVersion}
                    onChange={(key) => setActiveVersion(key as PitchVersionKey)}
                    items={VERSION_TABS.map((tab) => ({
                      key: tab.key,
                      label: tab.label,
                      children: renderVersionContent(result.versions[tab.key]),
                    }))}
                  />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <Title level={5} className="!text-gray-300">
                      关键亮点 (Highlights)
                    </Title>
                    <ul className="space-y-2">
                      {result.highlights.map((h, i) => (
                        <li key={i} className="flex gap-2 text-gray-400">
                          <span className="text-primary-400">•</span> {h}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <Title level={5} className="!text-gray-300">
                      关键词匹配 ({result.keywordOverlap.overlapPercentage}%)
                    </Title>
                    <div className="space-y-4">
                      <div>
                        <Text className="text-xs text-gray-500 block mb-2 uppercase tracking-wider">
                          已命中
                        </Text>
                        <Space wrap>
                          {result.keywordOverlap.matched.map((kw) => (
                            <Tag
                              key={kw}
                              className="!bg-green-500/10 !border-green-500/20 !text-green-400 m-0"
                            >
                              {kw}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <div>
                        <Text className="text-xs text-gray-500 block mb-2 uppercase tracking-wider">
                          建议补充
                        </Text>
                        <Space wrap>
                          {result.keywordOverlap.missing.map((kw) => (
                            <Tag
                              key={kw}
                              className="!bg-yellow-500/10 !border-yellow-500/20 !text-yellow-400 m-0"
                            >
                              {kw}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  </section>
                </div>

                {result.suggestions.length > 0 && (
                  <section>
                    <Title level={5} className="!text-gray-300">
                      改进建议
                    </Title>
                    <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10">
                      <List
                        size="small"
                        dataSource={result.suggestions}
                        renderItem={(item) => (
                          <List.Item className="!border-none !text-gray-400 !py-1">
                            • {item}
                          </List.Item>
                        )}
                      />
                    </div>
                  </section>
                )}

                <Divider className="!border-white/5" />

                <section className="refinement-box">
                  <Title level={5} className="!text-gray-300">
                    继续微调
                  </Title>
                  <Text type="secondary" className="text-xs block mb-2">
                    将对当前选中的「
                    {
                      VERSION_TABS.find((tab) => tab.key === activeVersion)
                        ?.label
                    }
                    」版本进行微调
                  </Text>
                  <Space.Compact className="w-full">
                    <Input
                      placeholder="例如：'让语气更强硬一些'、'突出我的领导力'..."
                      value={feedback}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFeedback(e.target.value)
                      }
                      onPressEnter={handleRefine}
                      className="!bg-white/5 !border-white/10 !text-white"
                      disabled={refining}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleRefine}
                      loading={refining}
                    >
                      发送
                    </Button>
                  </Space.Compact>
                </section>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
