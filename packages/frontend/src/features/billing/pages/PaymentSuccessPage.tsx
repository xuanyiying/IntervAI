import React, { useEffect, useRef, useState } from 'react';
import { Result, Button, Typography, Card, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { paymentService } from '@/features/billing/api/payment-service';

const { Paragraph, Text } = Typography;

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 服务端跳转参数为 orderNo；支付宝同步回跳自动附加 out_trade_no
  const orderNo = searchParams.get('orderNo') || searchParams.get('out_trade_no');
  const [loading, setLoading] = useState(!!orderNo);
  const [paid, setPaid] = useState(!orderNo);
  const { refreshProfile } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderNo) return;

    let attempts = 0;
    // 渠道异步通知可能比页面跳转慢，这里轮询兜底确认订单状态
    timerRef.current = setInterval(async () => {
      attempts += 1;
      if (attempts > POLL_MAX_ATTEMPTS) {
        if (timerRef.current) clearInterval(timerRef.current);
        await refreshProfile().catch(() => undefined);
        setLoading(false);
        return;
      }
      try {
        const order = await paymentService.getOrderStatus(orderNo);
        if (order.status === 'PAID') {
          if (timerRef.current) clearInterval(timerRef.current);
          setPaid(true);
          await refreshProfile().catch(() => undefined);
          setLoading(false);
        }
      } catch {
        // 查询失败继续重试
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orderNo, refreshProfile]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="正在确认支付结果..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Payment Successful!"
          subTitle="Thank you for upgrading. Your subscription is now active."
          extra={[
            <Button
              type="primary"
              key="dashboard"
              onClick={() => navigate('/')}
            >
              Go to Dashboard
            </Button>,
            <Button
              key="subscription"
              onClick={() => navigate('/subscription')}
            >
              Manage Subscription
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'center' }}>
            <Paragraph>
              <Text strong>Order No:</Text> {orderNo || 'N/A'}
            </Paragraph>
            <Paragraph>
              {paid
                ? 'You now have access to all premium features.'
                : 'Payment confirmation is still processing. Your plan will activate automatically once the channel confirms the payment.'}
            </Paragraph>
          </div>
        </Result>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
