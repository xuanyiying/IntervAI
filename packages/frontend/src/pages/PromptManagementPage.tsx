import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Tabs,
  Card,
  Typography,
  Tooltip,
  Popconfirm,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  promptAdminService,
  PromptTemplate,
  CreatePromptDto,
} from '../services/promptAdminService';
import './admin.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PromptManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(
    null
  );
  const [form] = Form.useForm();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedScenario, setSelectedScenario] = useState<
    string | undefined
  >();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('');

  useEffect(() => {
    loadPrompts();
  }, [selectedLanguage, selectedScenario]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await promptAdminService.listPrompts({
        language: selectedLanguage,
        scenario: selectedScenario,
        limit: 100,
      });
      setPrompts(response.data);
    } catch (error) {
      message.error(t('common.error', 'Error'));
      console.error('Load prompts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPrompt(null);
    form.resetFields();
    form.setFieldsValue({ language: selectedLanguage });
    setModalVisible(true);
  };

  const handleEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    form.setFieldsValue(prompt);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await promptAdminService.deletePrompt(id);
      message.success(t('common.success', 'Success'));
      loadPrompts();
    } catch (error) {
      message.error(t('common.error', 'Error'));
    }
  };

  const handleShowHistory = async (scenario: string) => {
    setActiveScenario(scenario);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const data = await promptAdminService.getVersions(scenario);
      setVersions(data);
    } catch (error) {
      message.error(t('common.error', 'Error'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRollback = async (version: number) => {
    try {
      await promptAdminService.rollback(activeScenario, version);
      message.success(t('common.success', 'Success'));
      setHistoryModalVisible(false);
      loadPrompts();
    } catch (error) {
      message.error(t('common.error', 'Error'));
    }
  };

  const handleSubmit = async (values: CreatePromptDto) => {
    try {
      if (editingPrompt) {
        await promptAdminService.updatePrompt(editingPrompt.id, values);
        message.success(t('common.success', 'Success'));
      } else {
        await promptAdminService.createPrompt(values);
        message.success(t('common.success', 'Success'));
      }
      setModalVisible(false);
      loadPrompts();
    } catch (error) {
      message.error(t('common.error', 'Error'));
    }
  };

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/{([^}]+)}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  };

  const columns: ColumnsType<PromptTemplate> = [
    {
      title: t('models.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
    },
    {
      title: t('prompts.scenario'),
      dataIndex: 'scenario',
      key: 'scenario',
      width: 180,
      render: (scenario: string) => (
        <Tag color="blue">
          {t(`scenario.${scenario}`, {
            defaultValue: scenario.replace(/_/g, ' '),
          })}
        </Tag>
      ),
    },
    {
      title: t('prompts.language'),
      dataIndex: 'language',
      key: 'language',
      width: 80,
      render: (lang: string) => (
        <Tag color={lang === 'en' ? 'green' : 'orange'}>
          {lang === 'en' ? 'EN' : 'CN'}
        </Tag>
      ),
    },
    {
      title: t('prompts.template'),
      dataIndex: 'template',
      key: 'template',
      ellipsis: true,
      render: (template: string) => (
        <Tooltip title={template}>
          <Text ellipsis>{template.substring(0, 100)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: t('prompts.variables'),
      dataIndex: 'variables',
      key: 'variables',
      width: 150,
      render: (variables: string[]) => (
        <Space size={[0, 4]} wrap>
          {variables.map((v) => (
            <Tag key={v} color="purple">
              {v}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('prompts.version'),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
    },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t('prompts.history')}>
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => handleShowHistory(record.scenario)}
            />
          </Tooltip>
          <Popconfirm
            title={t('common.delete_confirm', 'Are you sure to delete?')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-container">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <div className="admin-header">
            <Title level={3} style={{ margin: 0 }}>
              {t('prompts.title')}
            </Title>
            <Space>
              <Select
                placeholder={t(
                  'prompts.scenario_placeholder',
                  'Filter Scenario'
                )}
                style={{ width: 200 }}
                allowClear
                value={selectedScenario}
                onChange={setSelectedScenario}
              >
                <Select.Option value="resume_parsing">
                  {t('scenario.resume_parsing', 'Resume Parsing')}
                </Select.Option>
                <Select.Option value="job_description_parsing">
                  {t('scenario.job_description_parsing', 'JD Parsing')}
                </Select.Option>
                <Select.Option value="resume_optimization">
                  {t('scenario.resume_optimization', 'Resume Optimization')}
                </Select.Option>
                <Select.Option value="interview_question_generation">
                  {t(
                    'scenario.interview_question_generation',
                    'Interview Questions'
                  )}
                </Select.Option>
                <Select.Option value="match_score_calculation">
                  {t('scenario.match_score_calculation', 'Match Score')}
                </Select.Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => loadPrompts()}>
                {t('common.refresh')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                {t('prompts.new_prompt')}
              </Button>
            </Space>
          </div>

          <Tabs activeKey={selectedLanguage} onChange={setSelectedLanguage}>
            <TabPane tab={t('prompts.lang_en', 'English (EN)')} key="en" />
            <TabPane tab={t('prompts.lang_cn', 'Chinese (CN)')} key="zh-CN" />
          </Tabs>
        </div>

        <Table
          columns={columns}
          dataSource={prompts}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) =>
              t('common.total_items', { total, count: total }),
          }}
        />
      </Card>

      <Modal
        title={
          editingPrompt ? t('prompts.edit_prompt') : t('prompts.new_prompt')
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ language: 'en', isActive: true }}
        >
          <Form.Item
            name="name"
            label={t('models.name')}
            rules={[
              { required: true, message: t('common.required', 'Required') },
            ]}
          >
            <Input placeholder="e.g. resume_parsing_default" />
          </Form.Item>

          <Form.Item
            name="scenario"
            label={t('prompts.scenario')}
            rules={[
              { required: true, message: t('common.required', 'Required') },
            ]}
          >
            <Select placeholder={t('prompts.scenario_placeholder')}>
              <Select.Option value="resume_parsing">
                {t('scenario.resume_parsing')}
              </Select.Option>
              <Select.Option value="job_description_parsing">
                {t('scenario.job_description_parsing')}
              </Select.Option>
              <Select.Option value="resume_optimization">
                {t('scenario.resume_optimization')}
              </Select.Option>
              <Select.Option value="interview_question_generation">
                {t('scenario.interview_question_generation')}
              </Select.Option>
              <Select.Option value="match_score_calculation">
                {t('scenario.match_score_calculation')}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="language"
            label={t('prompts.language')}
            rules={[
              { required: true, message: t('common.required', 'Required') },
            ]}
          >
            <Select>
              <Select.Option value="en">{t('prompts.lang_en')}</Select.Option>
              <Select.Option value="zh-CN">
                {t('prompts.lang_cn')}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="template"
            label={t('prompts.template')}
            rules={[
              { required: true, message: t('common.required', 'Required') },
            ]}
            extra={t('prompts.template_extra', 'Use {variable_name} format')}
          >
            <TextArea
              rows={10}
              placeholder={t(
                'prompts.template_placeholder',
                'Enter prompt template...'
              )}
              onChange={(e) => {
                const vars = extractVariables(e.target.value);
                form.setFieldsValue({ variables: vars });
              }}
            />
          </Form.Item>

          <Form.Item name="variables" label={t('prompts.variables')}>
            <Select
              mode="tags"
              placeholder={t('prompts.variables_placeholder', 'Auto-extracted')}
              disabled
            />
          </Form.Item>

          <Form.Item name="provider" label={t('models.provider')}>
            <Input placeholder="e.g. openai, qwen" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPrompt ? t('common.save') : t('common.confirm')}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${t('prompts.history')} - ${activeScenario}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        width={700}
        footer={null}
      >
        <Table
          loading={historyLoading}
          dataSource={versions}
          rowKey="id"
          columns={[
            {
              title: t('prompts.version'),
              dataIndex: 'version',
              key: 'version',
              width: 80,
            },
            {
              title: t('common.author', 'Author'),
              dataIndex: 'author',
              key: 'author',
              width: 120,
            },
            {
              title: t('common.reason', 'Reason'),
              dataIndex: 'reason',
              key: 'reason',
            },
            {
              title: t('common.time', 'Time'),
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) => new Date(date).toLocaleString(),
            },
            {
              title: t('common.actions'),
              key: 'action',
              width: 100,
              render: (_, record) => (
                <Popconfirm
                  title={t(
                    'prompts.rollback_confirm',
                    'Are you sure to rollback?'
                  )}
                  onConfirm={() => handleRollback(record.version)}
                  okText={t('common.confirm')}
                  cancelText={t('common.cancel')}
                >
                  <Button type="link">{t('prompts.rollback')}</Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default PromptManagementPage;
