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
  Alert,
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
  const [oauthStatus, setOauthStatus] = useState({
    google: false,
    github: false,
    loaded: false,
  });
  const [oauthNotice, setOauthNotice] = useState<{
    type: 'info' | 'error';
    message: string;
  } | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    let active = true;
    const loadOAuthStatus = async () => {
      try {
        const status = await authService.getOAuthProviders();
        if (!active) return;
        setOauthStatus({
          google: status.google.enabled,
          github: status.github.enabled,
          loaded: true,
        });
      } catch (error) {
        if (!active) return;
        setOauthStatus({ google: false, github: false, loaded: true });
        setOauthNotice({
          type: 'error',
          message: t(
            'auth.oauth_status_failed',
            '无法获取第三方登录状态，请稍后重试。'
          ),
        });
      }
    };
    loadOAuthStatus();
    return () => {
      active = false;
    };
  }, [t]);

  const isGoogleEnvEnabled =
    String(import.meta.env.VITE_GOOGLE_OAUTH_ENABLED).toLowerCase() === 'true';
  const isGithubEnvEnabled =
    String(import.meta.env.VITE_GITHUB_OAUTH_ENABLED).toLowerCase() === 'true';
  const googleEnabled = isGoogleEnvEnabled && oauthStatus.google;
  const githubEnabled = isGithubEnvEnabled && oauthStatus.github;

  const handleSocialLogin = (provider: string) => {
    if (!oauthStatus.loaded) {
      setOauthNotice({
        type: 'info',
        message: t(
          'auth.oauth_checking',
          '正在检测第三方登录状态，请稍候再试。'
        ),
      });
      return;
    }
    if (provider === 'google' && !googleEnabled) {
      setOauthNotice({
        type: 'info',
        message: t('auth.google_disabled', 'Google 登录暂不可用，请稍后重试。'),
      });
      return;
    }
    if (provider === 'github' && !githubEnabled) {
      setOauthNotice({
        type: 'info',
        message: t('auth.github_disabled', 'GitHub 登录暂不可用，请稍后重试。'),
      });
      return;
    }
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

      <div className="glass-card p-8 w-full max-w-md relative z-10 mx-4 border border-white/10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo width={64} height={64} className="shadow-lg rounded-2xl" />
          </div>
          <Title level={2} className="!text-white !font-bold !mb-2">
            创建账号
          </Title>
          <Text className="!text-gray-400">开启您的 AI 职业助手之旅</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          <Form.Item
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
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder={t('auth.username_placeholder', 'Username')}
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-gray-500"
            />
          </Form.Item>

          <Form.Item
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
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder={t('auth.email_placeholder', 'Email Address')}
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-gray-500"
            />
          </Form.Item>

          <Form.Item
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
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder={t('auth.password_placeholder', 'Password')}
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-gray-500"
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
            <Checkbox className="!text-gray-400">
              我已阅读并同意{' '}
              <a href="/terms" className="text-primary-400">
                服务条款
              </a>{' '}
              和{' '}
              <a href="/privacy" className="text-primary-400">
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

          <Divider className="!border-white/10 !text-gray-500 !text-xs">
            或使用以下方式
          </Divider>

          {oauthNotice && (
            <Alert
              type={oauthNotice.type}
              message={oauthNotice.message}
              showIcon
              className="mb-4"
            />
          )}

          <div className="flex justify-center gap-4 mb-6">
            <Button
              shape="circle"
              size="large"
              icon={<GoogleOutlined />}
              onClick={() => handleSocialLogin('google')}
              disabled={!googleEnabled}
              className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 hover:!border-primary-500 hover:!text-primary-400 w-12 h-12 flex items-center justify-center transition-all"
            />
            <Button
              shape="circle"
              size="large"
              icon={<GithubOutlined />}
              onClick={() => handleSocialLogin('github')}
              disabled={!githubEnabled}
              className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 hover:!border-primary-500 hover:!text-primary-400 w-12 h-12 flex items-center justify-center transition-all"
            />
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <Text className="!text-gray-400">
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
