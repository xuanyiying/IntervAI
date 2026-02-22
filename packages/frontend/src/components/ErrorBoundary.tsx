import React from 'react';
import { Result, Button, Typography } from 'antd';
import { useNavigate, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text } = Typography;

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError() as Error & { status?: number };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const isNotFoundError = error?.status === 404;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: 'var(--bg-base, #030712)',
      }}
    >
      <Result
        status={isNotFoundError ? '404' : '500'}
        title={
          <span style={{ color: 'var(--text-primary, #f8fafc)' }}>
            {isNotFoundError
              ? t('error.404_title', 'Page Not Found')
              : t('error.500_title', 'Something went wrong')}
          </span>
        }
        subTitle={
          <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>
            {isNotFoundError
              ? t('error.404_message', 'The page you are looking for does not exist.')
              : t('error.500_message', 'An unexpected error occurred. Please try again.')}
          </span>
        }
        extra={[
          <Button type="primary" key="home" onClick={handleGoHome}>
            {t('error.go_home', 'Go Home')}
          </Button>,
          <Button key="back" onClick={handleGoBack}>
            {t('error.go_back', 'Go Back')}
          </Button>,
          !isNotFoundError && (
            <Button key="reload" onClick={handleReload}>
              {t('error.reload', 'Reload Page')}
            </Button>
          ),
        ].filter(Boolean)}
      >
        {!isNotFoundError && (
          <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <Paragraph>
              <Text
                strong
                style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px' }}
              >
                {t('error.error_details', 'Error Details:')}
              </Text>
            </Paragraph>
            <Paragraph>
              <Text
                code
                style={{
                  color: 'var(--color-error, #ef4444)',
                  fontSize: '12px',
                  wordBreak: 'break-word',
                }}
              >
                {error?.message || t('error.unknown_error', 'Unknown error')}
              </Text>
            </Paragraph>
          </div>
        )}
      </Result>
    </div>
  );
};

export default ErrorBoundary;
