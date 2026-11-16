import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Tag, message, Descriptions, Space } from 'antd';
import {
  paymentService,
  SubscriptionDetails,
  BillingRecord,
} from '@/features/billing/api/payment-service';
import SubscriptionStatus from '@/features/billing/components/SubscriptionStatus';
import { SubscriptionStatus as SubStatus, BillingStatus } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '@/shared/utils/format';

const { Title, Text } = Typography;

const SubscriptionManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null
  );
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subData, billingData] = await Promise.all([
        paymentService.getUserSubscription(),
        paymentService.getBillingHistory(),
      ]);
      setSubscription(subData);
      setBillingHistory(billingData);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      message.error(t('subscription.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: t('subscription.columns.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date),
    },
    {
      title: t('subscription.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: BillingRecord) =>
        formatCurrency(amount, record.currency.toUpperCase()),
    },
    {
      title: t('subscription.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: BillingStatus) => {
        if (status === BillingStatus.PAID) {
          return (
            <Tag color="success">{t('subscription.billing_status.paid')}</Tag>
          );
        }
        if (status === BillingStatus.VOID) {
          return (
            <Tag color="default">
              {t('subscription.billing_status.refunded')}
            </Tag>
          );
        }
        return (
          <Tag color="error">{t('subscription.billing_status.failed')}</Tag>
        );
      },
    },
    {
      title: t('subscription.columns.invoice'),
      key: 'action',
      render: (_: any, record: BillingRecord) =>
        record.pdfUrl ? (
          <a href={record.pdfUrl} target="_blank" rel="noopener noreferrer">
            {t('subscription.download_invoice')}
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>{t('subscription.title')}</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={t('subscription.current_subscription')} loading={loading}>
          {subscription ? (
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('subscription.plan')}>
                <SubscriptionStatus
                  tier={subscription.tier}
                  status={subscription.status}
                  expiresAt={subscription.expiresAt}
                />
              </Descriptions.Item>
              <Descriptions.Item label={t('subscription.status')}>
                {subscription.status === SubStatus.ACTIVE
                  ? t('subscription.active')
                  : t('subscription.inactive')}
              </Descriptions.Item>
              {subscription.currentPeriodEnd && (
                <Descriptions.Item
                  label={t('subscription.current_period_ends')}
                >
                  {formatDate(subscription.currentPeriodEnd)}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Text>{t('subscription.no_active_subscription')}</Text>
          )}

          {subscription?.status === SubStatus.ACTIVE && (
            <div style={{ marginTop: 24 }}>
              <Text type="secondary">
                {t('subscription.auto_expire_note')}
              </Text>
            </div>
          )}
        </Card>

        <Card title={t('subscription.billing_history')} loading={loading}>
          <Table
            dataSource={billingHistory}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default SubscriptionManagementPage;
