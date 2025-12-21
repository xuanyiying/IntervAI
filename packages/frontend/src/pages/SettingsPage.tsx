import React from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Typography,
  Divider,
  message,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import './common.css';

const { Title } = Typography;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: Record<string, unknown>) => {
    console.log('Settings saved:', values);
    message.success('设置已保存');
  };

  return (
    <div className="settings-container">
      <Title level={2}>设置</Title>

      <Card style={{ marginTop: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            notifications: true,
            autoSave: true,
            theme: 'light',
          }}
        >
          <Title level={4}>通知设置</Title>
          <Form.Item
            name="notifications"
            label="启用通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Title level={4}>编辑器设置</Title>
          <Form.Item name="autoSave" label="自动保存" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;
