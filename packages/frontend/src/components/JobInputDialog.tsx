import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Tabs,
  message,
  Spin,
  Alert,
} from 'antd';
import { LinkOutlined, FileTextOutlined } from '@ant-design/icons';
import { jobService, type JobInput, type Job } from '../services/job-service';

interface JobInputDialogProps {
  visible: boolean;
  onClose: () => void;
  onJobCreated: (jobData: JobInput) => void;
  onJobUpdated?: (job: Job) => void;
  initialData?: Job | null;
}

const JobInputDialog: React.FC<JobInputDialogProps> = ({
  visible,
  onClose,
  onJobCreated,
  onJobUpdated,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [urlLoading, setUrlLoading] = useState(false);

  const isEditMode = !!initialData;

  // Set form values when initialData changes or modal becomes visible
  useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue({
          title: initialData.title,
          company: initialData.company,
          location: initialData.location,
          jobType: initialData.jobType,
          salaryRange: initialData.salaryRange,
          jobDescription: initialData.jobDescription,
          requirements: initialData.requirements,
        });
        setActiveTab('text');
      } else {
        form.resetFields();
        setActiveTab('text');
      }
    }
  }, [visible, initialData, form]);

  const handleTextSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields([
        'title',
        'company',
        'jobDescription',
        'location',
        'jobType',
        'salaryRange',
        'requirements',
      ]);

      const jobInput: JobInput = {
        title: values.title,
        company: values.company,
        location: values.location,
        jobType: values.jobType,
        salaryRange: values.salaryRange,
        jobDescription: values.jobDescription,
        requirements: values.requirements || '',
      };

      if (isEditMode && initialData && onJobUpdated) {
        const updatedJob = await jobService.updateJob(initialData.id, jobInput);
        onJobUpdated(updatedJob);
        message.success('职位信息已更新');
      } else {
        onJobCreated(jobInput);
        message.success('职位信息已提交');
      }

      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Operation failed:', error);
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUrlFetch = async () => {
    try {
      const url = form.getFieldValue('jobUrl');
      if (!url) {
        message.error('请输入职位链接');
        return;
      }

      setUrlLoading(true);
      const jobData = await jobService.fetchJobFromUrl(url);

      form.setFieldsValue({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        jobType: jobData.jobType,
        salaryRange: jobData.salaryRange,
        jobDescription: jobData.jobDescription,
        requirements: jobData.requirements,
      });

      setActiveTab('text');
      message.success('职位信息已从链接提取，请确认后提交');
    } catch (error) {
      console.error('Failed to fetch job from URL:', error);
      message.error(
        error instanceof Error ? error.message : '从链接提取职位信息失败'
      );
    } finally {
      setUrlLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setActiveTab('text');
    onClose();
  };

  return (
    <Modal
      title={isEditMode ? '编辑职位信息' : '输入职位信息'}
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={null}
    >
      <Spin spinning={loading || urlLoading}>
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'text',
                label: (
                  <span>
                    <FileTextOutlined /> 粘贴职位描述
                  </span>
                ),
                children: (
                  <div style={{ marginTop: '16px' }}>
                    <Form.Item
                      label="职位名称"
                      name="title"
                      rules={[{ required: true, message: '请输入职位名称' }]}
                    >
                      <Input placeholder="例如：Java 后端工程师" />
                    </Form.Item>

                    <Form.Item
                      label="公司名称"
                      name="company"
                      rules={[{ required: true, message: '请输入公司名称' }]}
                    >
                      <Input placeholder="例如：阿里巴巴" />
                    </Form.Item>

                    <Form.Item label="工作地点" name="location">
                      <Input placeholder="例如：北京" />
                    </Form.Item>

                    <Form.Item label="工作类型" name="jobType">
                      <Input placeholder="例如：全职" />
                    </Form.Item>

                    <Form.Item label="薪资范围" name="salaryRange">
                      <Input placeholder="例如：15k-25k" />
                    </Form.Item>

                    <Form.Item
                      label="职位描述"
                      name="jobDescription"
                      rules={[{ required: true, message: '请输入职位描述' }]}
                    >
                      <Input.TextArea
                        rows={6}
                        placeholder="粘贴职位描述内容..."
                      />
                    </Form.Item>

                    <Form.Item label="任职要求" name="requirements">
                      <Input.TextArea
                        rows={4}
                        placeholder="粘贴任职要求内容..."
                      />
                    </Form.Item>

                    <Space
                      style={{ width: '100%', justifyContent: 'flex-end' }}
                    >
                      <Button onClick={handleCancel}>取消</Button>
                      <Button
                        type="primary"
                        onClick={handleTextSubmit}
                        loading={loading}
                      >
                        {isEditMode ? '更新' : '提交'}
                      </Button>
                    </Space>
                  </div>
                ),
              },
              {
                key: 'url',
                label: (
                  <span>
                    <LinkOutlined /> 从链接提取
                  </span>
                ),
                children: (
                  <div style={{ marginTop: '16px' }}>
                    <Alert
                      message="输入职位链接，系统将自动提取职位信息"
                      type="info"
                      style={{ marginBottom: '16px' }}
                    />

                    <Form.Item
                      label="职位链接"
                      name="jobUrl"
                      rules={[
                        { required: true, message: '请输入职位链接' },
                        {
                          pattern: /^https?:\/\/.+/,
                          message: '请输入有效的 URL',
                        },
                      ]}
                    >
                      <Input
                        placeholder="例如：https://www.example.com/jobs/123"
                        type="url"
                      />
                    </Form.Item>

                    <Space
                      style={{ width: '100%', justifyContent: 'flex-end' }}
                    >
                      <Button onClick={handleCancel}>取消</Button>
                      <Button
                        type="primary"
                        onClick={handleUrlFetch}
                        loading={urlLoading}
                      >
                        提取
                      </Button>
                    </Space>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default JobInputDialog;
