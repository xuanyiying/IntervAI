import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { accountService, DailyUsagePoint } from '../services/account-service';
import { formatDateTime } from '../i18n';

const { Title, Text } = Typography;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const MiniLineChart: React.FC<{
  points: DailyUsagePoint[];
  valueKey: 'totalCalls' | 'totalCost';
}> = ({ points, valueKey }) => {
  const width = 520;
  const height = 120;
  const padding = 10;

  const values = points.map((p) => p[valueKey]);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);

  const path = points
    .map((p, idx) => {
      const x =
        padding +
        (idx / Math.max(1, points.length - 1)) * (width - padding * 2);
      const yRatio = (p[valueKey] - min) / Math.max(1e-9, max - min);
      const y = padding + (1 - yRatio) * (height - padding * 2);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  if (!points.length) return null;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{
        display: 'block',
        borderRadius: 12,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <path
        d={path}
        fill="none"
        stroke="rgba(22, 119, 255, 0.95)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

const AccountUsagePage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await accountService.getUsage();
      setData(result);
    } catch (e) {
      setError(t('account.usage.load_failed', '使用量加载失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const quota = data?.quota;
  const ai = data?.ai;
  const dailySeries: DailyUsagePoint[] = data?.dailySeries || [];

  const quotaPercent = useMemo(() => {
    const optPercent =
      quota?.optimizationsLimit === -1
        ? 0
        : clamp(
            (quota?.optimizationsUsed /
              Math.max(1, quota?.optimizationsLimit)) *
              100,
            0,
            100
          );
    const pdfPercent =
      quota?.pdfGenerationsLimit === -1
        ? 0
        : clamp(
            (quota?.pdfGenerationsUsed /
              Math.max(1, quota?.pdfGenerationsLimit)) *
              100,
            0,
            100
          );
    return { optPercent, pdfPercent };
  }, [quota]);

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            {t('account.usage.title', '使用量')}
          </Title>
          <Text type="secondary">
            {t(
              'account.usage.subtitle',
              '查看当前计费周期内的 AI 使用情况与配额状态'
            )}
          </Text>
        </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            action={<a onClick={fetchData}>{t('common.retry', '重试')}</a>}
          />
        )}

        <Card title={t('account.usage.period', '计费周期')} loading={loading}>
          <Text>
            {data?.period?.start && data?.period?.end
              ? `${formatDateTime(data.period.start)} → ${formatDateTime(
                  data.period.end
                )}`
              : t('common.loading', '加载中...')}
          </Text>
        </Card>

        <Card
          title={t('account.usage.ai_usage', 'AI 使用情况')}
          loading={loading}
          extra={
            quota && (
              <Text strong className="text-primary-500">
                {t('account.usage.remaining_uses', {
                  count: (quota.optimizationsLimit === -1 ? 0 : Math.max(0, quota.optimizationsLimit - quota.optimizationsUsed)) as any,
                  remaining: (quota.optimizationsLimit === -1 ? '∞' : Math.max(0, quota.optimizationsLimit - quota.optimizationsUsed)) as any,
                  limit: quota.optimizationsLimit === -1 ? '∞' : quota.optimizationsLimit,
                })}
              </Text>
            )
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Statistic
                title={t('account.usage.metrics.total_calls', '调用次数')}
                value={ai?.totalCalls ?? 0}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={t('account.usage.metrics.successful_calls', '成功')}
                value={ai?.successfulCalls ?? 0}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={t('account.usage.metrics.failed_calls', '失败')}
                value={ai?.failedCalls ?? 0}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={t('account.usage.metrics.avg_latency', '平均延迟(ms)')}
                value={ai?.averageLatency ?? 0}
              />
            </Col>
            <Col xs={24} md={12}>
              <Statistic
                title={t('account.usage.metrics.input_tokens', '输入 Token')}
                value={ai?.totalInputTokens ?? 0}
              />
            </Col>
            <Col xs={24} md={12}>
              <Statistic
                title={t('account.usage.metrics.output_tokens', '输出 Token')}
                value={ai?.totalOutputTokens ?? 0}
              />
            </Col>
            <Col xs={24}>
              <Statistic
                title={t('account.usage.metrics.total_cost', '成本(USD)')}
                value={ai?.totalCost ?? 0}
                precision={4}
              />
            </Col>
          </Row>
        </Card>

        <Card title={t('account.usage.quota', '配额')} loading={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Text strong>
                  {t('account.usage.quota.optimizations', '简历优化')}
                </Text>
                <Text type="secondary">
                  {quota?.optimizationsLimit === -1
                    ? t('account.usage.unlimited', '无限制')
                    : `${quota?.optimizationsUsed ?? 0} / ${
                        quota?.optimizationsLimit ?? 0
                      }`}
                </Text>
                {quota?.optimizationsLimit !== -1 && (
                  <Progress percent={quotaPercent.optPercent} />
                )}
                {quota?.optimizationsResetAt && (
                  <Text type="secondary">
                    {t('account.usage.reset_at', '重置时间')}：{' '}
                    {formatDateTime(quota.optimizationsResetAt)}
                  </Text>
                )}
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Text strong>{t('account.usage.quota.pdf', 'PDF 导出')}</Text>
                <Text type="secondary">
                  {quota?.pdfGenerationsLimit === -1
                    ? t('account.usage.unlimited', '无限制')
                    : `${quota?.pdfGenerationsUsed ?? 0} / ${
                        quota?.pdfGenerationsLimit ?? 0
                      }`}
                </Text>
                {quota?.pdfGenerationsLimit !== -1 && (
                  <Progress percent={quotaPercent.pdfPercent} />
                )}
                {quota?.pdfGenerationsResetAt && (
                  <Text type="secondary">
                    {t('account.usage.reset_at', '重置时间')}：{' '}
                    {formatDateTime(quota.pdfGenerationsResetAt)}
                  </Text>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        <Card title={t('account.usage.trend', '趋势')} loading={loading}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text type="secondary">
              {t('account.usage.trend_hint', '近 30 天调用次数趋势')}
            </Text>
            <MiniLineChart points={dailySeries} valueKey="totalCalls" />
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default AccountUsagePage;
