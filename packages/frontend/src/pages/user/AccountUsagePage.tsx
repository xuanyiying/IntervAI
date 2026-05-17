import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { accountService, DailyUsagePoint } from '../../services/account-service';
import { formatDateTime } from '../../i18n';

const { Title, Text } = Typography;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

interface TrendChartProps {
  points: DailyUsagePoint[];
  valueKey: 'totalCalls' | 'totalCost';
  label: string;
  color: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  points,
  valueKey,
  label,
  color,
}) => {
  const width = 520;
  const height = 100;
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

  const gradientId = `gradient-${valueKey}`;
  const areaPath = path
    ? `${path} L ${(padding + (width - padding * 2)).toFixed(2)} ${(padding + (height - padding * 2)).toFixed(2)} L ${padding.toFixed(2)} ${(padding + (height - padding * 2)).toFixed(2)} Z`
    : '';

  if (!points.length) return null;

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          display: 'block',
          borderRadius: 8,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.08)',
          marginTop: 4,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        {areaPath && (
          <path d={areaPath} fill={`url(#${gradientId})`} />
        )}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

interface ChangeIndicatorProps {
  change: number;
  unit?: string;
  suffix?: string;
}

const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  change,
  unit = '',
  suffix = '',
}) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isZero = change === 0;

  const color =
    isZero ? 'default' : isPositive ? 'error' : 'success';
  const icon = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  const prefix = isNegative ? <ArrowDownOutlined /> : null;

  if (isZero) {
    return (
      <Tag color="default" style={{ marginLeft: 8 }}>
        无变化
      </Tag>
    );
  }

  return (
    <Tag color={color} icon={isPositive ? icon : prefix} style={{ marginLeft: 8 }}>
      {Math.abs(change)}%{suffix || unit}
    </Tag>
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
  const comparison = data?.comparison;
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

        <Card
          title={t('account.usage.period', '计费周期')}
          loading={loading}
        >
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
            comparison && (
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  环比:
                </Text>
                <ChangeIndicator change={comparison.totalCallsChange} suffix=" 调用" />
                <ChangeIndicator change={comparison.totalCostChange} suffix=" 成本" />
              </Space>
            )
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Statistic
                title={t('account.usage.metrics.total_calls', '调用次数')}
                value={ai?.totalCalls ?? 0}
                suffix={
                  comparison ? (
                    <ChangeIndicator change={comparison.totalCallsChange} />
                  ) : null
                }
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
                suffix={
                  comparison ? (
                    <ChangeIndicator change={comparison.inputTokensChange} />
                  ) : null
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <Statistic
                title={t('account.usage.metrics.output_tokens', '输出 Token')}
                value={ai?.totalOutputTokens ?? 0}
                suffix={
                  comparison ? (
                    <ChangeIndicator change={comparison.outputTokensChange} />
                  ) : null
                }
              />
            </Col>
            <Col xs={24}>
              <Statistic
                title={t('account.usage.metrics.total_cost', '成本(USD)')}
                value={ai?.totalCost ?? 0}
                precision={4}
                suffix={
                  comparison ? (
                    <ChangeIndicator change={comparison.totalCostChange} />
                  ) : null
                }
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

        <Card
          title={t('account.usage.trend', '趋势')}
          loading={loading}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <TrendChart
                  points={dailySeries}
                  valueKey="totalCalls"
                  label="每日调用次数"
                  color="rgba(22, 119, 255, 0.95)"
                />
              </Col>
              <Col xs={24} md={12}>
                <TrendChart
                  points={dailySeries}
                  valueKey="totalCost"
                  label="每日成本 (USD)"
                  color="rgba(255, 167, 38, 0.95)"
                />
              </Col>
            </Row>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default AccountUsagePage;
