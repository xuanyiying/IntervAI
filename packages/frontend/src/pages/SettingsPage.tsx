import React, { useState } from 'react';
import {
  Card,
  Form,
  Switch,
  Typography,
  Divider,
  message,
  Tabs,
  Select,
  Button,
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  BellOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './common.css';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('Settings saved:', values);
      message.success(t('common.saved'));

      // Handle language change if needed
      if (values.language && values.language !== i18n.language) {
        i18n.changeLanguage(values.language as string);
      }
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const GeneralSettings = () => (
    <div className="tab-content">
      <Title level={5}>
        <GlobalOutlined /> {t('common.language')}
      </Title>
      <Form.Item name="language" initialValue={i18n.language}>
        <Select onChange={(val) => i18n.changeLanguage(val)}>
          <Option value="zh-CN">简体中文</Option>
          <Option value="en-US">English</Option>
        </Select>
      </Form.Item>

      <Divider />

      <Title level={5}>
        <BgColorsOutlined /> {t('settings.theme')}
      </Title>
      <Form.Item
        name="theme"
        initialValue="light"
        label={t('settings.theme_mode')}
      >
        <Select>
          <Option value="light">{t('settings.light')}</Option>
          <Option value="dark">{t('settings.dark')}</Option>
          <Option value="system">{t('settings.system')}</Option>
        </Select>
      </Form.Item>
    </div>
  );

  const EditorSettings = () => (
    <div className="tab-content">
      <Title level={5}>
        <EditOutlined /> {t('settings.editor')}
      </Title>
      <Form.Item
        name="autoSave"
        label={t('settings.auto_save')}
        valuePropName="checked"
        initialValue={true}
      >
        <Switch />
      </Form.Item>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('settings.auto_save_desc')}
      </Text>
    </div>
  );

  const NotificationSettings = () => (
    <div className="tab-content">
      <Title level={5}>
        <BellOutlined /> {t('settings.notifications')}
      </Title>
      <Form.Item
        name="notifications"
        label={t('settings.enable_notifications')}
        valuePropName="checked"
        initialValue={true}
      >
        <Switch />
      </Form.Item>
      <Divider />
      <Form.Item
        name="emailNotifications"
        label={t('settings.email_notifications')}
        valuePropName="checked"
        initialValue={true}
      >
        <Switch />
      </Form.Item>
    </div>
  );

  const items = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined /> {t('settings.general')}
        </span>
      ),
      children: <GeneralSettings />,
    },
    {
      key: 'editor',
      label: (
        <span>
          <EditOutlined /> {t('settings.editor')}
        </span>
      ),
      children: <EditorSettings />,
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined /> {t('settings.notifications')}
        </span>
      ),
      children: <NotificationSettings />,
    },
  ];

  return (
    <div className="settings-container">
      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>
          {t('menu.settings')}
        </Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Tabs items={items} />

          <Divider />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;
