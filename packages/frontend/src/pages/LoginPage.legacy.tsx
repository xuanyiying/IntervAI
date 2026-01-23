import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Divider,
  message,
  Alert,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GithubOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth-service';
import { getApiBaseUrl } from '../config/axios';
import './auth.css';
import { Logo } from '@/components/Logo';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

const LegacyLoginPage: React.FC = () => {
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
  const { setAuth, isAuthenticated } = useAuthStore();

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

  const onFinish = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const { user, token } = await authService.login(values);
      if (token) {
        setAuth(user, token);
        message.success(t('auth.login_success', 'Login successful!'));
        navigate('/chat');
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      message.error(
        t('auth.login_failed', 'Login failed. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary/5">
      <div className="absolute w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="glass-card p-8 w-full max-w-md relative z-10 mx-4 border border-white/10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo width={64} height={64} className="shadow-lg rounded-2xl" />
          </div>
          <Title level={2} className="!text-white !font-bold !mb-2">
            AI 简历助手
          </Title>
          <Text className="!text-gray-400">登录您的账号</Text>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
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
              prefix={<UserOutlined />}
              placeholder={t('auth.email_placeholder', 'Email Address')}
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
              prefix={<LockOutlined />}
              placeholder={t('auth.password_placeholder', 'Password')}
            />
          </Form.Item>

          <div className="flex justify-between items-center mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="!text-gray-400">记住我</Checkbox>
            </Form.Item>
            <Link to="/forgot-password">
              <span className="text-primary-400 hover:text-primary transition-colors">
                忘记密码?
              </span>
            </Link>
          </div>

          <Form.Item className="mb-4">
            <button
              type="submit"
              disabled={loading}
              className="gradient-button w-full h-12 text-base font-bold shadow-lg hover:shadow-primary-500/20"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </Form.Item>
        </Form>

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
            icon={<GoogleOutlined />}
            size="large"
            onClick={() => handleSocialLogin('google')}
            disabled={!googleEnabled}
            className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10"
          />
          <Button
            shape="circle"
            icon={<GithubOutlined />}
            size="large"
            onClick={() => handleSocialLogin('github')}
            disabled={!githubEnabled}
            className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10"
          />
        </div>

        <div className="text-center mt-6">
          <Text className="!text-gray-400">
            {t('auth.no_account')}{' '}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-medium hover:underline transition-all"
            >
              {t('auth.register')}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LegacyLoginPage;
