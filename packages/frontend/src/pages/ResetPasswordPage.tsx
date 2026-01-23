import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth-service';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  const onFinish = async (values: { password: string }) => {
    if (!token) {
      message.error(t('auth.reset_invalid_token'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, values.password);
      setSuccess(true);
      message.success(t('auth.reset_success_message'));
    } catch (error) {
      console.error('Failed to reset password:', error);
      message.error(t('auth.reset_failed_message'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Result
          status="error"
          title={t('auth.reset_invalid_title')}
          subTitle={t('auth.reset_invalid_subtitle')}
          extra={[
            <Button
              type="primary"
              key="login"
              onClick={() => navigate('/login')}
            >
              {t('auth.reset_action_login')}
            </Button>,
          ]}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Result
          status="success"
          title={t('auth.reset_success_title')}
          subTitle={t('auth.reset_success_subtitle')}
          extra={[
            <Button
              type="primary"
              key="login"
              onClick={() => navigate('/login')}
            >
              {t('auth.reset_action_login')}
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>{t('auth.reset_title')}</Title>
          <Text type="secondary">{t('auth.reset_subtitle')}</Text>
        </div>

        <Form name="reset_password" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('auth.reset_password_required') },
              { min: 8, message: t('auth.reset_password_min') },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.reset_new_password_placeholder')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: t('auth.reset_confirm_required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t('auth.reset_password_mismatch'))
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.reset_confirm_placeholder')}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              {t('auth.reset_submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
