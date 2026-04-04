import React, { useState } from 'react';
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
} from 'antd';
import {
  CheckOutlined,
  CreditCardOutlined,
  AlipayCircleOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { paymentService } from '../../services/payment-service';
import { loadPaddle } from '../../utils/paddle-loader';
import { SubscriptionTier } from '../../types';
import './pricing.css';
import SubscriptionManagementPage from '../user/SubscriptionManagementPage';

const { Title, Text } = Typography;

const PricingPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [selectedTier, setSelectedTier] = useState<
    SubscriptionTier | undefined
  >(undefined);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paddle'>(
    'stripe'
  );
  const [activeTab, setActiveTab] = useState('recharge');
  const { user } = useAuthStore();

  const isSubscribed =
    user?.subscriptionTier && user.subscriptionTier !== SubscriptionTier.FREE;

  if (isSubscribed) {
    return <SubscriptionManagementPage />;
  }

  const handleUpgrade = (priceId: string, tier: SubscriptionTier) => {
    if (!user) {
      message.warning(t('pricing.login_required'));
      return;
    }
    setSelectedPriceId(priceId);
    setSelectedTier(tier);
    setIsModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      if (paymentProvider === 'stripe') {
        const { url } = await paymentService.createCheckoutSession(
          selectedPriceId,
          'stripe',
          selectedTier
        );
        if (url) {
          window.location.href = url;
        }
      } else {
        // Paddle
        const { transactionId } = await paymentService.createCheckoutSession(
          selectedPriceId,
          'paddle',
          selectedTier
        );
        if (transactionId) {
          const paddle = await loadPaddle();
          paddle.Checkout.open({
            transactionId,
            settings: {
              successUrl: `${window.location.origin}/payment/success`,
            },
          });
          setIsModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Failed to start checkout session:', error);
      message.error(t('pricing.payment_failed'));
    } finally {
      setLoading(false);
    }
  };

  const getPriceId = (tier: string) => {
    const isPaddle = paymentProvider === 'paddle';

    if (tier === 'Pro') {
      if (isYearly) {
        return isPaddle
          ? import.meta.env.VITE_PADDLE_PRICE_PRO_YEARLY
          : import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY;
      }
      return isPaddle
        ? import.meta.env.VITE_PADDLE_PRICE_PRO_MONTHLY
        : import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY;
    }

    if (tier === 'Enterprise') {
      if (isYearly) {
        return isPaddle
          ? import.meta.env.VITE_PADDLE_PRICE_ENTERPRISE_YEARLY
          : import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY;
      }
      return isPaddle
        ? import.meta.env.VITE_PADDLE_PRICE_ENTERPRISE_MONTHLY
        : import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY;
    }
    return '';
  };

  const tiers = [
    {
      title: t('pricing.free_title'),
      price: '$0',
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
      price: isYearly ? '$190' : '$19',
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
      action: () => handleUpgrade(getPriceId('Pro'), SubscriptionTier.PRO),
      popular: true,
    },
    {
      title: t('pricing.enterprise_title'),
      price: isYearly ? '$990' : '$99',
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
      action: () =>
        handleUpgrade(getPriceId('Enterprise'), SubscriptionTier.ENTERPRISE),
    },
  ];

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
                onClick={() => handleUpgrade('', SubscriptionTier.PRO)}
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
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        okText={t('pricing.proceed')}
        cancelText={t('common.cancel')}
      >
        <div style={{ padding: '20px 0' }}>
          <Radio.Group
            onChange={(e) => setPaymentProvider(e.target.value)}
            value={paymentProvider}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio
                value="stripe"
                style={{
                  padding: '10px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  width: '100%',
                }}
              >
                <Space>
                  <CreditCardOutlined
                    style={{ fontSize: '20px', color: '#1890ff' }}
                  />
                  <div>
                    <Text strong>{t('pricing.credit_card')}</Text>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {t('pricing.stripe_desc')}
                    </div>
                  </div>
                </Space>
              </Radio>
              <Radio
                value="paddle"
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
                  <WechatOutlined
                    style={{ fontSize: '20px', color: '#52c41a' }}
                  />
                  <div>
                    <Text strong>{t('pricing.alipay_wechat')}</Text>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {t('pricing.paddle_desc')}
                    </div>
                  </div>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
};

export default PricingPage;
