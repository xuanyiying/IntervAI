import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  List,
  message,
  Switch,
  Tag,
  Modal,
  Radio,
  Space,
  Tabs,
  QRCode,
  Spin,
} from 'antd';
import {
  CheckOutlined,
  AlipayCircleOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import {
  paymentService,
  type PaymentChannel,
  type OrderStatusResult,
} from '@/features/billing/api/payment-service';
import { SubscriptionTier } from '@/shared/types';
import './pricing.css';
import SubscriptionManagementPage from '@/features/billing/pages/SubscriptionManagementPage';

const { Title, Text } = Typography;

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 120;

const PricingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | undefined>(
    undefined
  );
  const [paymentProvider, setPaymentProvider] = useState<PaymentChannel>(
    'alipay'
  );
  const [activeTab, setActiveTab] = useState('recharge');
  // 微信扫码：等待支付结果
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pendingOrderNo, setPendingOrderNo] = useState('');
  const [payResult, setPayResult] = useState<'success' | 'timeout' | null>(
    null
  );
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuthStore();

  const isSubscribed =
    user?.subscriptionTier && user.subscriptionTier !== SubscriptionTier.FREE;

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      stopPolling();
    },
    []
  );

  const startPolling = (orderNo: string) => {
    stopPolling();
    let attempts = 0;
    pollTimerRef.current = setInterval(async () => {
      attempts += 1;
      if (attempts > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setPayResult('timeout');
        return;
      }
      try {
        const order: OrderStatusResult = await paymentService.getOrderStatus(
          orderNo
        );
        if (order.status === 'PAID') {
          stopPolling();
          setPayResult('success');
          await useAuthStore.getState().refreshProfile();
        }
      } catch {
        // 单次查询失败继续轮询，渠道回调可能尚未到达
      }
    }, POLL_INTERVAL_MS);
  };

  if (isSubscribed) {
    return <SubscriptionManagementPage />;
  }

  const getPlanId = (tier: SubscriptionTier) =>
    `${tier.toLowerCase()}_${isYearly ? 'yearly' : 'monthly'}`;

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (!user) {
      message.warning(t('pricing.login_required'));
      return;
    }
    setSelectedTier(tier);
    setPaymentProvider('alipay');
    setIsModalVisible(true);
  };

  const closePaymentModal = () => {
    stopPolling();
    setIsModalVisible(false);
    setQrCodeUrl('');
    setPendingOrderNo('');
    setPayResult(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTier) return;
    setLoading(true);
    try {
      const order = await paymentService.createOrder(
        getPlanId(selectedTier),
        paymentProvider
      );
      if (paymentProvider === 'alipay' && order.payUrl) {
        closePaymentModal();
        window.location.href = order.payUrl;
        return;
      }
      if (paymentProvider === 'wechat' && order.codeUrl) {
        setPendingOrderNo(order.orderNo);
        setQrCodeUrl(order.codeUrl);
        setPayResult(null);
        startPolling(order.orderNo);
        return;
      }
      message.error(t('pricing.payment_failed'));
    } catch (error) {
      console.error('Failed to create payment order:', error);
      message.error(t('pricing.payment_failed'));
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      title: t('pricing.free_title'),
      price: '¥0',
      period: isYearly ? t('pricing.year_suffix') : t('pricing.month_suffix'),
      features: [
        t('pricing.features.basic_parsing'),
        t('pricing.features.standard_templates'),
        t('pricing.features.limited_optimizations'),
        t('pricing.features.watermark_export'),
      ],
      buttonText: t('pricing.current_plan'),
      isCurrent: user?.subscriptionTier === 'FREE',
      action: null,
    },
    {
      title: t('pricing.pro_title'),
      price: isYearly ? '¥190' : '¥19',
      period: isYearly ? t('pricing.year_suffix') : t('pricing.month_suffix'),
      save: isYearly ? t('pricing.save', { percent: 17 }) : null,
      features: [
        t('pricing.features.unlimited_parsing'),
        t('pricing.features.premium_templates'),
        t('pricing.features.unlimited_optimizations'),
        t('pricing.features.no_watermark'),
        t('pricing.features.cover_letter'),
        t('pricing.features.priority_support'),
      ],
      buttonText: t('pricing.upgrade_pro'),
      isCurrent: user?.subscriptionTier === 'PRO',
      action: () => handleUpgrade(SubscriptionTier.PRO),
      popular: true,
    },
    {
      title: t('pricing.enterprise_title'),
      price: isYearly ? '¥990' : '¥99',
      period: isYearly ? t('pricing.year_suffix') : t('pricing.month_suffix'),
      save: isYearly ? t('pricing.save', { percent: 17 }) : null,
      features: [
        t('pricing.features.everything_pro'),
        t('pricing.features.custom_templates'),
        t('pricing.features.api_access'),
        t('pricing.features.dedicated_manager'),
        t('pricing.features.sso'),
      ],
      buttonText: t('pricing.contact_sales'),
      isCurrent: user?.subscriptionTier === 'ENTERPRISE',
      action: () => handleUpgrade(SubscriptionTier.ENTERPRISE),
    },
  ];

  const renderWechatQrPanel = () => (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      {payResult === 'success' ? (
        <div>
          <CheckOutlined
            style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }}
          />
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {t('pricing.pay_success')}
            </Text>
          </div>
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              closePaymentModal();
              navigate('/payment/success');
            }}
          >
            {t('pricing.view_result')}
          </Button>
        </div>
      ) : payResult === 'timeout' ? (
        <div>
          <Text type="secondary">{t('pricing.pay_timeout')}</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setIsModalVisible(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      ) : qrCodeUrl ? (
        <div>
          <QRCode value={qrCodeUrl} size={200} />
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              <WechatOutlined style={{ marginRight: 6 }} />
              {t('pricing.scan_to_pay')}
            </Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Spin indicator={<WechatOutlined spin />} />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              {t('pricing.waiting_payment')}
            </Text>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className="pricing-container"
      style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Title className="pricing-title" level={1}>
          {t('pricing.title')}
        </Title>
        <Text
          className="pricing-subtitle"
          type="secondary"
          style={{ fontSize: 18, display: 'block', marginBottom: 24 }}
        >
          {t('pricing.subtitle')}
        </Text>

        <Tabs
          defaultActiveKey="recharge"
          centered
          items={[
            {
              key: 'recharge',
              label: t('pricing.tab_recharge', '充值'),
            },
            {
              key: 'orders',
              label: t('pricing.tab_orders', '我的订单'),
            },
            {
              key: 'history',
              label: t('pricing.tab_history', '使用记录'),
            },
          ]}
          className="pricing-tabs mb-8"
          onChange={(key) => setActiveTab(key)}
        />

        <div
          className="pricing-switch-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Text strong={!isYearly}>{t('pricing.monthly')}</Text>
          <Switch checked={isYearly} onChange={setIsYearly} />
          <Text strong={isYearly}>
            {t('pricing.yearly')}{' '}
            <Tag color="green">{t('pricing.save', { percent: 17 })}</Tag>
          </Text>
        </div>
      </div>

      {activeTab === 'recharge' && (
        <Row gutter={[32, 32]} justify="center">
          {tiers.map((tier) => (
            <Col xs={24} md={8} key={tier.title}>
              <Card
                hoverable
                className="glass-card pricing-tier-card"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: tier.popular
                    ? 'var(--primary-color)'
                    : undefined,
                  borderWidth: tier.popular ? 2 : 1,
                  position: 'relative',
                }}
                bodyStyle={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {tier.popular && (
                  <Tag
                    color="primary"
                    className="absolute top-0 right-0 rounded-bl-lg rounded-tr-none"
                  >
                    {t('pricing.most_popular')}
                  </Tag>
                )}

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Title level={3}>{tier.title}</Title>
                  <div style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: tier.popular ? 42 : 36,
                        fontWeight: 'bold',
                      }}
                    >
                      {tier.price}
                    </Text>
                    <Text type="secondary">{tier.period}</Text>
                  </div>
                </div>

                <List
                  dataSource={tier.features}
                  renderItem={(item) => (
                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                      <CheckOutlined
                        style={{ color: '#52c41a', marginRight: 8 }}
                      />
                      {item}
                    </List.Item>
                  )}
                  style={{ marginBottom: 32, flex: 1 }}
                />

                <Button
                  type={tier.popular ? 'primary' : 'default'}
                  size="large"
                  block
                  onClick={tier.action || undefined}
                  disabled={tier.isCurrent || !tier.action}
                  loading={loading && !tier.isCurrent && !!tier.action}
                >
                  {tier.isCurrent ? t('pricing.current_plan') : tier.buttonText}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {activeTab === 'recharge' && (
        <div className="credits-section mt-12">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {t('pricing.credits_title', '积分购买')}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {t(
              'pricing.credits_desc',
              '100 积分可兑换一次测试模拟面试，200 积分可兑换一次面试精灵'
            )}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { points: 100, price: '¥9.9', popular: false },
              { points: 200, price: '¥19.9', popular: true },
              { points: 500, price: '¥49.9', popular: false },
              { points: 1000, price: '¥89.9', popular: false },
            ].map((tier) => (
              <div
                key={tier.points}
                className={`glass-card credit-tier-card p-4 rounded-xl text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 ${tier.popular ? 'credit-tier-popular' : ''}`}
                onClick={() => handleUpgrade(SubscriptionTier.PRO)}
              >
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  {tier.points}
                  <span className="text-sm font-normal text-[var(--text-tertiary)]">
                    {' '}
                    {t('pricing.points', '积分')}
                  </span>
                </div>
                <div className="text-base font-semibold text-primary mb-2">
                  {tier.price}
                </div>
                {tier.popular && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {t('pricing.hot', '热门')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        title={t('pricing.select_method')}
        open={isModalVisible}
        onOk={handleConfirmPayment}
        onCancel={closePaymentModal}
        confirmLoading={loading}
        okText={t('pricing.proceed')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: !!qrCodeUrl }}
        footer={
          qrCodeUrl
            ? [
                <Button key="close" onClick={closePaymentModal}>
                  {t('common.close')}
                </Button>,
              ]
            : undefined
        }
      >
        {qrCodeUrl || payResult ? (
          renderWechatQrPanel()
        ) : (
          <div style={{ padding: '20px 0' }}>
            <Radio.Group
              onChange={(e) => setPaymentProvider(e.target.value)}
              value={paymentProvider}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio
                  value="alipay"
                  style={{
                    padding: '10px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    width: '100%',
                  }}
                >
                  <Space>
                    <AlipayCircleOutlined
                      style={{ fontSize: '20px', color: '#1677ff' }}
                    />
                    <div>
                      <Text strong>{t('pricing.alipay')}</Text>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {t('pricing.alipay_desc')}
                      </div>
                    </div>
                  </Space>
                </Radio>
                <Radio
                  value="wechat"
                  style={{
                    padding: '10px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    width: '100%',
                  }}
                >
                  <Space>
                    <WechatOutlined
                      style={{ fontSize: '20px', color: '#52c41a' }}
                    />
                    <div>
                      <Text strong>{t('pricing.wechat')}</Text>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {t('pricing.wechat_desc')}
                      </div>
                    </div>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PricingPage;
