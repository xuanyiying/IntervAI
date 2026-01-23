import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminService, InviteCode } from '../services/admin-service';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../i18n';
import './admin.css';

const { Title } = Typography;
const { Option } = Select;

const InviteCodeManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InviteCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await adminService.listInviteCodes({
        page,
        limit: pageSize,
      });
      setData(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error(t('invite_codes.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const handleGenerate = async (values: any) => {
    try {
      setGenerating(true);
      await adminService.generateInviteCodes(values);
      message.success(t('invite_codes.generate_success'));
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(t('invite_codes.generate_failed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteInviteCode(id);
      message.success(t('invite_codes.delete_success'));
      loadData();
    } catch (error) {
      message.error(t('invite_codes.delete_failed'));
    }
  };

  const columns: ColumnsType<InviteCode> = [
    {
      title: t('invite_codes.columns.code'),
      dataIndex: 'code',
      key: 'code',
      render: (text) => (
        <Space>
          <Typography.Text copyable={{ text: text }}>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('invite_codes.columns.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'BATCH' ? 'blue' : 'cyan'}>
          {type === 'BATCH'
            ? t('invite_codes.type.batch')
            : t('invite_codes.type.single')}
        </Tag>
      ),
    },
    {
      title: t('invite_codes.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'UNUSED') color = 'success';
        if (status === 'USED') color = 'processing';
        if (status === 'EXPIRED') color = 'error';
        const label =
          status === 'UNUSED'
            ? t('invite_codes.status.unused')
            : status === 'USED'
              ? t('invite_codes.status.used')
              : status === 'EXPIRED'
                ? t('invite_codes.status.expired')
                : status;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: t('invite_codes.columns.valid_until'),
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date) => (date ? formatDate(date) : t('invite_codes.permanent')),
    },
    {
      title: t('invite_codes.columns.used_by'),
      dataIndex: 'usedBy',
      key: 'usedBy',
      render: (user) => user || t('common.none'),
    },
    {
      title: t('invite_codes.columns.created_at'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateTime(date),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={t('invite_codes.delete_confirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-container">
      <Card>
        <div className="admin-header">
          <Title level={3} style={{ margin: 0 }}>
            {t('invite_codes.title')}
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              {t('common.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              {t('invite_codes.generate')}
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={t('invite_codes.generate_modal_title')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          initialValues={{ type: 'SINGLE', count: 1, validDays: 7 }}
        >
          <Form.Item
            name="type"
            label={t('invite_codes.form.type')}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="SINGLE">{t('invite_codes.type.single')}</Option>
              <Option value="BATCH">{t('invite_codes.type.batch')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, current) => prev.type !== current.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'BATCH' ? (
                <Form.Item
                  name="count"
                  label={t('invite_codes.form.count')}
                  rules={[{ required: true, min: 1, max: 100 }]}
                >
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="validDays"
            label={t('invite_codes.form.valid_days')}
            rules={[{ required: true, min: 1 }]}
            help={t('invite_codes.form.valid_days_help')}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={generating}>
                {t('invite_codes.generate')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InviteCodeManagementPage;
