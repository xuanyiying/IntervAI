import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, Space, Divider, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GithubOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import './auth.css';

const { Title, Text } = Typography;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const response = await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });

      // Ensure we have a token
      const token = response.token || response.accessToken;
      if (!token) {
        throw new Error(t('common.error'));
      }

      // Set auth state
      setAuth(response.user, token);

      message.success(t('auth.register_success'));

      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (err: unknown) {
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.message ||
        t('auth.register_failed');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Logo and Title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <Title level={2} style={{ margin: 0 }}>
              {t('auth.register')}
            </Title>
            <Text type="secondary">{t('auth.title_register_sub')}</Text>
          </div>

          {/* Register Form */}
          <Form
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t('auth.username_required') },
                { min: 3, message: t('auth.username_min') },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder={t('auth.username')} />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('auth.email_required') },
                { type: 'email', message: t('auth.email_invalid') },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder={t('auth.email')} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('auth.password_required') },
                { min: 6, message: t('auth.password_min') },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('auth.password_required') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('auth.password_mismatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('auth.confirm_password')}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '48px',
                  fontSize: '16px',
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                {t('auth.register')}
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <Divider plain>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('auth.or_social')}
            </Text>
          </Divider>

          {/* Social Login */}
          <Space
            style={{ width: '100%', justifyContent: 'center' }}
            size="large"
          >
            <Button
              shape="circle"
              size="large"
              icon={<GoogleOutlined />}
              style={{ width: '48px', height: '48px' }}
            />
            <Button
              shape="circle"
              size="large"
              icon={<GithubOutlined />}
              style={{ width: '48px', height: '48px' }}
            />
          </Space>

          {/* Login Link */}
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              {t('auth.have_account')}{' '}
              <Link to="/login" style={{ color: '#667eea', fontWeight: 500 }}>
                {t('auth.login')}
              </Link>
            </Text>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default RegisterPage;
