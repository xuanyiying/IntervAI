import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Modal,
  message,
  Descriptions,
  Space,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  paymentService,
  SubscriptionDetails,
  BillingRecord,
} from '../services/payment-service';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { SubscriptionStatus as SubStatus, BillingStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../i18n';

const { Title, Text } = Typography;
const { confirm } = Modal;

const SubscriptionManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null
  );
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

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

  const handleCancelSubscription = () => {
    confirm({
      title: t('subscription.cancel_confirm_title'),
      icon: <ExclamationCircleOutlined />,
      content: t('subscription.cancel_confirm_content'),
      okText: t('subscription.cancel_confirm_ok'),
      okType: 'danger',
      cancelText: t('subscription.cancel_confirm_cancel'),
      onOk: async () => {
        try {
          setCanceling(true);
          await paymentService.cancelSubscription();
          message.success(t('subscription.cancel_success'));
          fetchData(); // Refresh data
        } catch (error) {
          console.error('Failed to cancel subscription:', error);
          message.error(t('subscription.cancel_failed'));
        } finally {
          setCanceling(false);
        }
      },
    });
  };

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
      render: (status: BillingStatus) => (
        <Tag color={status === BillingStatus.PAID ? 'success' : 'error'}>
          {status === BillingStatus.PAID
            ? t('subscription.billing_status.paid')
            : t('subscription.billing_status.failed')}
        </Tag>
      ),
    },
    {
      title: t('subscription.columns.invoice'),
      key: 'action',
      render: (_: any, record: BillingRecord) => (
        <a href={record.pdfUrl} target="_blank" rel="noopener noreferrer">
          {t('subscription.download_invoice')}
        </a>
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
                  cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
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

          {subscription?.status === SubStatus.ACTIVE &&
            !subscription.cancelAtPeriodEnd && (
              <div style={{ marginTop: 24 }}>
                <Button
                  danger
                  onClick={handleCancelSubscription}
                  loading={canceling}
                >
                  {t('subscription.cancel')}
                </Button>
              </div>
            )}
        </Card>

        <Card title={t('subscription.billing_history')} loading={loading}>
          <Table
            dataSource={billingHistory}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default SubscriptionManagementPage;
