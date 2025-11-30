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
} from 'antd';
import {
  CheckOutlined,
  CreditCardOutlined,
  AlipayCircleOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { paymentService } from '../services/payment.service';
import { loadPaddle } from '../utils/paddle-loader';
import './pricing.css';

const { Title, Text } = Typography;

const PricingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paddle'>(
    'stripe'
  );
  const { user } = useAuthStore();

  const handleUpgrade = (priceId: string) => {
    if (!user) {
      message.warning('Please log in to upgrade your plan');
      return;
    }
    setSelectedPriceId(priceId);
    setIsModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      if (paymentProvider === 'stripe') {
        const { url } = await paymentService.createCheckoutSession(
          selectedPriceId,
          'stripe'
        );
        if (url) {
          window.location.href = url;
        }
      } else {
        // Paddle
        const { transactionId } = await paymentService.createCheckoutSession(
          selectedPriceId,
          'paddle'
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
      message.error('Failed to start payment process. Please try again.');
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
      title: 'Free',
      price: '$0',
      period: isYearly ? '/year' : '/month',
      features: [
        'Basic Resume Parsing',
        'Standard Templates',
        '3 Optimizations / Month',
        'PDF Export (Watermarked)',
      ],
      buttonText: 'Current Plan',
      isCurrent: user?.subscriptionTier === 'FREE',
      action: null,
    },
    {
      title: 'Pro',
      price: isYearly ? '$190' : '$19',
      period: isYearly ? '/year' : '/month',
      save: isYearly ? 'Save 17%' : null,
      features: [
        'Unlimited Parsing',
        'Premium Templates',
        'Unlimited Optimizations',
        'No Watermark',
        'Cover Letter Generation',
        'Priority Support',
      ],
      buttonText: 'Upgrade to Pro',
      isCurrent: user?.subscriptionTier === 'PRO',
      action: () => handleUpgrade(getPriceId('Pro')),
      popular: true,
    },
    {
      title: 'Enterprise',
      price: isYearly ? '$990' : '$99',
      period: isYearly ? '/year' : '/month',
      save: isYearly ? 'Save 17%' : null,
      features: [
        'Everything in Pro',
        'Custom Templates',
        'API Access',
        'Dedicated Account Manager',
        'SSO Integration',
      ],
      buttonText: 'Contact Sales', // Or Upgrade if self-serve
      isCurrent: user?.subscriptionTier === 'ENTERPRISE',
      action: () => handleUpgrade(getPriceId('Enterprise')),
    },
  ];

  return (
    <div
      className="pricing-container"
      style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Title className="pricing-title" level={1}>
          Simple, Transparent Pricing
        </Title>
        <Text
          className="pricing-subtitle"
          type="secondary"
          style={{ fontSize: 18, display: 'block', marginBottom: 24 }}
        >
          Choose the plan that best fits your career goals.
        </Text>

        <div
          className="pricing-switch-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Text strong={!isYearly}>Monthly</Text>
          <Switch checked={isYearly} onChange={setIsYearly} />
          <Text strong={isYearly}>
            Yearly <Tag color="green">Save ~17%</Tag>
          </Text>
        </div>
      </div>

      <Row gutter={[32, 32]} justify="center">
        {tiers.map((tier) => (
          <Col xs={24} md={8} key={tier.title}>
            <Card
              hoverable
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderColor: tier.popular ? '#1890ff' : undefined,
                borderWidth: tier.popular ? 2 : 1,
                position: 'relative',
              }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {tier.popular && (
                <Tag
                  color="#1890ff"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    borderTopLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  MOST POPULAR
                </Tag>
              )}

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={3}>{tier.title}</Title>
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 36, fontWeight: 'bold' }}>
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
                {tier.isCurrent ? 'Current Plan' : tier.buttonText}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Select Payment Method"
        open={isModalVisible}
        onOk={handleConfirmPayment}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        okText="Proceed to Payment"
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
                    <Text strong>Credit Card</Text>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      Secure payment via Stripe
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
                    <Text strong>Alipay / WeChat Pay</Text>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      Local payment methods via Paddle
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
