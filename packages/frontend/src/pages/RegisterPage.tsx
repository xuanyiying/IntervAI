import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  Divider,
  message,
  Checkbox,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GithubOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth-service';
import { getApiBaseUrl } from '../config/axios';
import { Logo } from '../components/Logo';
import './auth.css';

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSocialLogin = (provider: string) => {
    const baseUrl = getApiBaseUrl();
    const absoluteBaseUrl = baseUrl.startsWith('http')
      ? baseUrl
      : new URL(baseUrl, window.location.origin).toString();
    const normalizedBaseUrl = absoluteBaseUrl.replace(/\/$/, '');
    window.location.href = `${normalizedBaseUrl}/auth/${provider}`;
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const { agreement: _agreement, ...payload } = values ?? {};
      await authService.register(payload);
      message.success(t('auth.register_success', 'Registration successful!'));
      navigate('/login');
    } catch (error) {
      message.error(t('auth.register_failed', 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary/5">
      {/* Background Decor - Simplified for CSS Polyfill */}
      <div className="absolute w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="glass-card p-8 w-full max-w-md relative z-10 mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo width={64} height={64} className="shadow-lg rounded-2xl" />
          </div>
          <Title
            level={2}
            className="!font-bold !mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            创建账号
          </Title>
          <Text style={{ color: 'var(--text-secondary)' }}>
            开启您的 AI 职业助手之旅
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          <Form.Item
            label={t('auth.username_label', '用户名')}
            name="username"
            rules={[
              {
                required: true,
                message: t(
                  'auth.username_required',
                  'Please input your username!'
                ),
              },
            ]}
          >
            <Input
              id="register-username"
              prefix={<UserOutlined />}
              placeholder={t('auth.username_placeholder', 'Username')}
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label={t('auth.email_label', '邮箱')}
            name="email"
            rules={[
              {
                required: true,
                message: t('auth.email_required', 'Please input your email!'),
              },
              {
                type: 'email',
                message: t('auth.email_invalid', 'Invalid email format!'),
              },
            ]}
          >
            <Input
              id="register-email"
              prefix={<MailOutlined />}
              placeholder={t('auth.email_placeholder', 'Email Address')}
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label={t('auth.password_label', '密码')}
            name="password"
            rules={[
              {
                required: true,
                message: t(
                  'auth.password_required',
                  'Please input your password!'
                ),
              },
            ]}
          >
            <Input.Password
              id="register-password"
              prefix={<LockOutlined />}
              placeholder={t('auth.password_placeholder', 'Password')}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Should accept agreement')),
              },
            ]}
          >
            <Checkbox style={{ color: 'var(--text-secondary)' }}>
              我已阅读并同意{' '}
              <a href="/terms-of-service" className="text-primary-400">
                服务条款
              </a>{' '}
              和{' '}
              <a href="/privacy-policy" className="text-primary-400">
                隐私政策
              </a>
            </Checkbox>
          </Form.Item>

          <Form.Item className="mb-4">
            <button
              type="submit"
              disabled={loading}
              className="gradient-button w-full h-12 text-base font-bold shadow-lg hover:shadow-secondary-500/20"
            >
              {loading ? '注册中...' : '立即注册'}
            </button>
          </Form.Item>

          <Divider
            className="auth-divider !text-xs"
            style={{
              borderColor: 'var(--glass-border)',
              color: 'var(--text-tertiary)',
            }}
          >
            或使用以下方式
          </Divider>

          <div className="flex justify-center gap-4 mb-6">
            <Button
              shape="circle"
              size="large"
              icon={<GoogleOutlined />}
              onClick={() => handleSocialLogin('google')}
              className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 hover:!border-primary-500 hover:!text-primary-400 !w-12 !h-12 !min-w-[48px] !min-h-[48px] !p-0 !rounded-full flex items-center justify-center transition-all"
            />
            <Button
              shape="circle"
              size="large"
              icon={<GithubOutlined />}
              onClick={() => handleSocialLogin('github')}
              className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 hover:!border-primary-500 hover:!text-primary-400 !w-12 !h-12 !min-w-[48px] !min-h-[48px] !p-0 !rounded-full flex items-center justify-center transition-all"
            />
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <Text style={{ color: 'var(--text-secondary)' }}>
              {t('auth.have_account')}{' '}
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-medium hover:underline transition-all"
              >
                {t('auth.login')}
              </Link>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;
