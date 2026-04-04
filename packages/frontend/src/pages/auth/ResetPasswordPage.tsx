import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Result } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth-service';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: { code: string; password: string }) => {
    setLoading(true);
    try {
      await authService.resetPassword(values.code, values.password);
      setSuccess(true);
      message.success(t('auth.reset_success_message'));
    } catch (error) {
      console.error('Failed to reset password:', error);
      message.error(t('auth.reset_failed_message'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary/5"
        style={{ background: 'var(--bg-primary, #0a0a0f)' }}
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
              className="gradient-button"
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
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary/5"
      style={{
        background: 'var(--bg-primary, #0a0a0f)',
      }}
    >
      <div className="absolute w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card
        className="glass-card"
        style={{
          width: 400,
          background: 'var(--glass-bg, rgba(255,255,255,0.05))',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title
            level={3}
            style={{ color: 'var(--text-primary, #fff)', marginBottom: 8 }}
          >
            {t('auth.reset_title')}
          </Title>
          <Text style={{ color: 'var(--text-secondary, #aaa)' }}>
            {t('auth.reset_subtitle')}
          </Text>
        </div>

        <Form
          name="reset_password"
          onFinish={onFinish}
          layout="vertical"
          className="auth-form"
        >
          <Form.Item
            name="code"
            rules={[
              { required: true, message: t('auth.reset_code_required') },
              { len: 6, message: t('auth.reset_code_length') },
            ]}
            label={
              <span style={{ color: 'var(--text-secondary, #aaa)' }}>
                {t('auth.reset_code_label', '验证码')}
              </span>
            }
          >
            <Input
              prefix={<SafetyOutlined style={{ color: '#666' }} />}
              placeholder={t('auth.reset_code_placeholder', '请输入6位验证码')}
              size="large"
              maxLength={6}
              className="!bg-transparent !border-white/10 !text-white placeholder:!text-gray-500"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('auth.reset_password_required') },
              { min: 8, message: t('auth.reset_password_min') },
            ]}
            label={
              <span style={{ color: 'var(--text-secondary, #aaa)' }}>
                {t('auth.reset_new_password_label', '新密码')}
              </span>
            }
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#666' }} />}
              placeholder={t('auth.reset_new_password_placeholder')}
              size="large"
              className="!bg-transparent !border-white/10 !text-white placeholder:!text-gray-500"
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
            label={
              <span style={{ color: 'var(--text-secondary, #aaa)' }}>
                {t('auth.reset_confirm_label', '确认密码')}
              </span>
            }
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#666' }} />}
              placeholder={t('auth.reset_confirm_placeholder')}
              size="large"
              className="!bg-transparent !border-white/10 !text-white placeholder:!text-gray-500"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="gradient-button h-12"
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
