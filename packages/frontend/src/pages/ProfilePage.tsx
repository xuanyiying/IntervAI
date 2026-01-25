import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Space,
  Typography,
  Tabs,
  Form,
  Input,
  Upload,
  message,
  List,
  Tag,
  Badge,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  LockOutlined,
  HistoryOutlined,
  BellOutlined,
  CheckOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime } from '../i18n';
import {
  userService,
  UserActivity,
  UserNotification,
  ChangePasswordDto,
} from '../services/user-service';
import { accountService } from '../services/account-service';
import './common.css';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [profileForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [passwordForm] = Form.useForm();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      if (user) {
        try {
          const data = await accountService.getUsage();
          setUsage(data);
        } catch (error) {
          console.error('Failed to fetch usage:', error);
        }
      }
    };
    fetchUsage();
  }, [user]);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio,
        phone: user.phone,
      });
    }
  }, [user, profileForm]);

  const handleUpdateProfile = async (values: {
    username?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
  }) => {
    try {
      setLoading(true);
      const updatedUser = await userService.updateProfile(values);
      updateUser(updatedUser);
      message.success(t('profile.update_success'));
      setEditing(false);
    } catch {
      message.error(t('profile.update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (
    values: ChangePasswordDto & { confirmPassword: string }
  ) => {
    try {
      setLoading(true);
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(t('profile.password_changed'));
      passwordForm.resetFields();
    } catch {
      message.error(t('profile.password_change_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (options: {
    file: File;
    onSuccess: (url: string) => void;
    onError: (error: unknown) => void;
  }) => {
    const { file, onSuccess, onError } = options;
    try {
      const avatarUrl = await userService.uploadAvatar(file);
      const updatedUser = await userService.updateProfile({
        avatar: avatarUrl,
      });
      updateUser(updatedUser);
      message.success(t('profile.avatar_upload_success'));
      onSuccess(avatarUrl);
    } catch (error) {
      message.error(t('profile.avatar_upload_failed'));
      onError(error);
    }
  };

  const handleBindEmail = async () => {
    message.info(t('profile.feature_coming_soon'));
  };

  const handleBindPhone = async () => {
    message.info(t('profile.feature_coming_soon'));
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await userService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      message.success(t('common.success'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await userService.getHistory({ page: 1, limit: 20 });
      setActivities(res.data);
    } catch {
      setActivities([
        {
          id: '1',
          action: 'LOGIN',
          description: 'Logged in',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          action: 'UPDATE_PROFILE',
          description: 'Updated profile',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await userService.getNotifications({ page: 1, limit: 20 });
      setNotifications(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 404) {
        message.warning(t('profile.notification_feature_unavailable'));
      } else {
        message.error(t('profile.load_notifications_failed'));
      }
      setNotifications([
        {
          id: '1',
          title: t('profile.demo_notification_welcome_title'),
          content: t('profile.demo_notification_welcome_content'),
          type: 'INFO',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: t('profile.demo_notification_system_update_title'),
          content: t('profile.demo_notification_system_update_content'),
          type: 'WARNING',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    if (key === 'history') loadHistory();
    if (key === 'notifications') loadNotifications();
  };

  const UsageTab = () => (
    <div className="tab-content">
      <Title level={5}>{t('account.usage.ai_usage', 'AI 使用情况')}</Title>
      {usage ? (
        <Card bordered={false} className="!bg-white/5 !border-white/10 !text-white">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Text className="!text-gray-400">{t('account.usage.quota_items.optimizations', '简历优化')}</Text>
              <Text className="!text-primary-400 font-bold">
                {t('account.usage.remaining_uses', {
                  count: usage.quota.optimizationsLimit === -1 ? 0 : Math.max(0, usage.quota.optimizationsLimit - usage.quota.optimizationsUsed),
                  remaining: usage.quota.optimizationsLimit === -1 ? '∞' : Math.max(0, usage.quota.optimizationsLimit - usage.quota.optimizationsUsed),
                  limit: usage.quota.optimizationsLimit === -1 ? '∞' : usage.quota.optimizationsLimit,
                })}
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="!text-gray-400">{t('account.usage.quota_items.pdf', 'PDF 导出')}</Text>
              <Text className="!text-primary-400 font-bold">
                {usage.quota.pdfGenerationsUsed} / {usage.quota.pdfGenerationsLimit === -1 ? '∞' : usage.quota.pdfGenerationsLimit}
              </Text>
            </div>
            <Button 
              type="primary" 
              className="mt-4" 
              onClick={() => navigate('/account/usage')}
            >
              {t('account.usage.view_details', '查看详情')}
            </Button>
          </div>
        </Card>
      ) : (
        <Text>{t('common.loading')}</Text>
      )}
    </div>
  );

  const ProfileTab = () => (
    <div className="tab-content">
      <div className="avatar-section">
        <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} />
        {editing && (
          <Upload
            showUploadList={false}
            customRequest={handleAvatarUpload as never}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>
              {t('profile.change_avatar')}
            </Button>
          </Upload>
        )}
      </div>
      <Form
        form={profileForm}
        layout="vertical"
        disabled={!editing}
        onFinish={handleUpdateProfile}
      >
        <Form.Item
          name="username"
          label={t('profile.username')}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('profile.email')}>
          <Input disabled />
        </Form.Item>
        <Form.Item name="phone" label={t('profile.phone')}>
          <Input />
        </Form.Item>
        <Form.Item name="bio" label={t('profile.bio')}>
          <Input.TextArea rows={4} />
        </Form.Item>
        {editing ? (
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('profile.save_changes')}
            </Button>
            <Button onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={() => setEditing(true)}>
            {t('profile.edit_profile')}
          </Button>
        )}
      </Form>
    </div>
  );

  const SecurityTab = () => (
    <div className="tab-content">
      <Title level={5}>{t('profile.change_password')}</Title>
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handleChangePassword}
      >
        <Form.Item
          name="currentPassword"
          label={t('profile.current_password')}
          rules={[{ required: true }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={t('profile.new_password')}
          rules={[{ required: true, min: 6 }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('profile.confirm_new_password')}
          dependencies={['newPassword']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value)
                  return Promise.resolve();
                return Promise.reject(
                  new Error(t('profile.password_mismatch'))
                );
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('profile.change_password')}
        </Button>
      </Form>
      <div style={{ marginTop: 40 }}>
        <Title level={5}>{t('profile.account_bindings')}</Title>
        <List
          itemLayout="horizontal"
          dataSource={[
            {
              title: t('profile.email'),
              description: user?.email || t('profile.not_bound'),
              icon: <MailOutlined />,
              action: handleBindEmail,
              buttonText: user?.email ? t('profile.change') : t('profile.bind'),
            },
            {
              title: t('profile.phone'),
              description: user?.phone || t('profile.not_bound'),
              icon: <PhoneOutlined />,
              action: handleBindPhone,
              buttonText: user?.phone ? t('profile.change') : t('profile.bind'),
            },
          ]}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" onClick={item.action} key="action">
                  {item.buttonText}
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={item.icon}
                    style={{ backgroundColor: '#f0f2f5', color: '#1890ff' }}
                  />
                }
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );

  const HistoryTab = () => (
    <List
      loading={historyLoading}
      itemLayout="horizontal"
      dataSource={activities}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar
                icon={<HistoryOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
            }
            title={item.action}
            description={
              <Space direction="vertical" size={0}>
                <Text>{item.description}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(item.createdAt)}
                </Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  const NotificationsTab = () => (
    <List
      loading={notifLoading}
      itemLayout="horizontal"
      dataSource={notifications}
      renderItem={(item) => (
        <List.Item
          actions={[
            !item.read && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleMarkAsRead(item.id)}
                key="mark-read"
              >
                {t('profile.mark_as_read')}
              </Button>
            ),
          ]}
        >
          <List.Item.Meta
            avatar={
              <Badge dot={!item.read}>
                <Avatar icon={<BellOutlined />} />
              </Badge>
            }
            title={
              <Space>
                <Text strong={!item.read}>{item.title}</Text>
                <Tag
                  color={
                    item.type === 'ERROR'
                      ? 'red'
                      : item.type === 'WARNING'
                        ? 'orange'
                        : 'blue'
                  }
                >
                  {item.type}
                </Tag>
              </Space>
            }
            description={
              <Space direction="vertical" size={0}>
                <Text>{item.content}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(item.createdAt)}
                </Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  const items = [
    {
      key: 'profile',
      label: t('profile.tab_profile'),
      children: <ProfileTab />,
      icon: <UserOutlined />,
    },
    {
      key: 'security',
      label: t('profile.tab_security'),
      children: <SecurityTab />,
      icon: <LockOutlined />,
    },
    {
      key: 'usage',
      label: t('account.usage.title', '使用量'),
      children: <UsageTab />,
      icon: <HistoryOutlined />,
    },
    {
      key: 'history',
      label: t('profile.tab_history'),
      children: <HistoryTab />,
      icon: <HistoryOutlined />,
    },
    {
      key: 'notifications',
      label: t('profile.tab_notifications'),
      children: <NotificationsTab />,
      icon: <BellOutlined />,
    },
  ];

  return (
    <div className="profile-container animate-fade-in relative overflow-hidden">
      <div className="section-card">
        <div className="mb-8">
          <Title
            level={2}
            className="!m-0 !text-white !font-bold tracking-tight"
          >
            {t('profile.title')}
          </Title>
          <Text className="!text-gray-400 mt-1 block">
            {t('profile.subtitle', '管理您的个人资料、安全设置和账户通知')}
          </Text>
        </div>

        <Tabs
          items={items}
          onChange={handleTabChange}
          className="modern-tabs"
        />
      </div>
    </div>
  );
};

export default ProfilePage;
