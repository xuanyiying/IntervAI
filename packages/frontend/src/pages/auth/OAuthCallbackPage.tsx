import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth-service';

const { Title } = Typography;

const OAuthCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!token) {
          throw new Error(
            t('auth.oauth_token_missing', '认证失败：未收到访问令牌')
          );
        }

        // Verify the token and get user info
        const user = await authService.verifyToken(token);

        // Set auth state
        setAuth(user, token);

        message.success(t('auth.login_success', '登录成功！'));

        // Redirect to home page
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } catch (err) {
        const errorMessage =
          (err as Error)?.message ||
          t('auth.oauth_failed', 'OAuth 认证失败，请重试');
        message.error(errorMessage);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    };

    handleOAuthCallback();
  }, [location, navigate, setAuth, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/5">
      <div className="text-center">
        <Spin size="large" />
        <Title level={4} className="mt-4">
          {t('auth.oauth_processing', '正在处理认证...')}
        </Title>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
