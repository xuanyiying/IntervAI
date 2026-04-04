import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Descriptions, Space, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  accountService,
  SubscriptionRecord,
} from '../services/account-service';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { SubscriptionStatus as SubStatus, BillingStatus } from '../types';
import { formatCurrency, formatDate } from '../i18n';

const { Title, Text } = Typography;

const getActionColor = (action: SubscriptionRecord['action']) => {
  switch (action) {
    case 'upgrade':
      return 'blue';
    case 'downgrade':
      return 'gold';
    case 'cancel':
      return 'red';
    case 'renew':
      return 'green';
    default:
      return 'default';
  }
};

const AccountSubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<any>(null);
  const [records, setRecords] = useState<SubscriptionRecord[]>([]);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await accountService.getSubscription();
      setCurrent(data.current);
      setRecords(data.subscriptionRecords || []);
      setBillingHistory(data.billingHistory || []);
    } catch (e) {
      setError(t('account.subscription.load_failed', '订阅信息加载失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const recordColumns = useMemo(
    () => [
      {
        title: t('account.subscription.columns.effective_at', '生效时间'),
        dataIndex: 'effectiveAt',
        key: 'effectiveAt',
        render: (date: string) => formatDate(date),
      },
      {
        title: t('account.subscription.columns.action', '操作'),
        dataIndex: 'action',
        key: 'action',
        render: (action: SubscriptionRecord['action']) => (
          <Tag color={getActionColor(action)}>
            {t(`account.subscription.action.${action}`, action)}
          </Tag>
        ),
      },
      {
        title: t('account.subscription.columns.plan', '计划'),
        dataIndex: 'tier',
        key: 'tier',
        render: (tier: string) => (
          <Tag>{t(`account.subscription.tier.${tier}`, tier)}</Tag>
        ),
      },
      {
        title: t('account.subscription.columns.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={status === SubStatus.ACTIVE ? 'success' : 'default'}>
            {t(`account.subscription.status.${status}`, status)}
          </Tag>
        ),
      },
      {
        title: t('account.subscription.columns.expires_at', '到期时间'),
        dataIndex: 'expiresAt',
        key: 'expiresAt',
        render: (date?: string | null) =>
          date ? formatDate(date) : <Text type="secondary">—</Text>,
      },
    ],
    [t]
  );

  const billingColumns = useMemo(
    () => [
      {
        title: t('account.subscription.billing.columns.date', '日期'),
        dataIndex: 'date',
        key: 'date',
        render: (date: string) => formatDate(date),
      },
      {
        title: t('account.subscription.billing.columns.amount', '金额'),
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number, record: any) =>
          formatCurrency(amount, String(record.currency || '').toUpperCase()),
      },
      {
        title: t('account.subscription.billing.columns.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        render: (status: BillingStatus) => (
          <Tag color={status === BillingStatus.PAID ? 'success' : 'error'}>
            {status === BillingStatus.PAID
              ? t('account.subscription.billing_status.paid', '已支付')
              : t('account.subscription.billing_status.failed', '失败')}
          </Tag>
        ),
      },
      {
        title: t('account.subscription.billing.columns.invoice', '发票'),
        key: 'invoice',
        render: (_: any, record: any) => (
          <a href={record.pdfUrl} target="_blank" rel="noopener noreferrer">
            {t('account.subscription.billing.download_invoice', '下载')}
          </a>
        ),
      },
    ],
    [t]
  );

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            {t('account.subscription.title', '订阅记录')}
          </Title>
          <Text type="secondary">
            {t(
              'account.subscription.subtitle',
              '查看当前计划、续费日期与历史订阅变更'
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
          title={t('account.subscription.current_plan', '当前计划')}
          loading={loading}
        >
          {current ? (
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('account.subscription.plan', '计划')}>
                <SubscriptionStatus
                  tier={current.tier}
                  status={current.status}
                  expiresAt={current.expiresAt}
                  cancelAtPeriodEnd={current.cancelAtPeriodEnd}
                />
              </Descriptions.Item>
              <Descriptions.Item
                label={t('account.subscription.state', '状态')}
              >
                {current.status === SubStatus.ACTIVE
                  ? t('account.subscription.active', '已激活')
                  : t('account.subscription.inactive', '未激活')}
              </Descriptions.Item>
              {current.currentPeriodEnd && (
                <Descriptions.Item
                  label={t('account.subscription.renew_date', '续费日期')}
                >
                  {formatDate(current.currentPeriodEnd)}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Text>{t('account.subscription.no_active', '暂无有效订阅')}</Text>
          )}
        </Card>

        <Card
          title={t('account.subscription.records', '订阅变更记录')}
          loading={loading}
        >
          <Table
            dataSource={records}
            columns={recordColumns as any}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            locale={{
              emptyText: t('account.subscription.records_empty', '暂无记录'),
            }}
          />
        </Card>

        <Card
          title={t('account.subscription.billing_history', '账单历史')}
          loading={loading}
        >
          <Table
            dataSource={billingHistory}
            columns={billingColumns as any}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            locale={{
              emptyText: t('account.subscription.billing_empty', '暂无账单'),
            }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default AccountSubscriptionPage;
