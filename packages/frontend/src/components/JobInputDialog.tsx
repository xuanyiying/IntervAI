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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        message.success(t('resume.jobInput.updated_success'));
      } else {
        onJobCreated(jobInput);
        message.success(t('resume.jobInput.submitted'));
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
        message.error(t('resume.jobInput.url_required'));
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
      message.success(t('resume.jobInput.extracted'));
    } catch (error) {
      console.error('Failed to fetch job from URL:', error);
      message.error(
        error instanceof Error
          ? error.message
          : t('resume.jobInput.extract_failed')
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
      title={
        isEditMode
          ? t('resume.jobInput.edit_title')
          : t('resume.jobInput.add_title')
      }
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
                    <FileTextOutlined /> {t('resume.jobInput.tab_paste')}
                  </span>
                ),
                children: (
                  <div style={{ marginTop: '16px' }}>
                    <Form.Item
                      label={t('resume.jobInput.field_title')}
                      name="title"
                      rules={[
                        {
                          required: true,
                          message: t('resume.jobInput.title_required'),
                        },
                      ]}
                    >
                      <Input placeholder={t('resume.jobInput.title_placeholder')} />
                    </Form.Item>

                    <Form.Item
                      label={t('resume.jobInput.field_company')}
                      name="company"
                      rules={[
                        {
                          required: true,
                          message: t('resume.jobInput.company_required'),
                        },
                      ]}
                    >
                      <Input
                        placeholder={t('resume.jobInput.company_placeholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('resume.jobInput.field_location')}
                      name="location"
                    >
                      <Input
                        placeholder={t('resume.jobInput.location_placeholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('resume.jobInput.field_job_type')}
                      name="jobType"
                    >
                      <Input
                        placeholder={t('resume.jobInput.job_type_placeholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('resume.jobInput.field_salary')}
                      name="salaryRange"
                    >
                      <Input
                        placeholder={t('resume.jobInput.salary_placeholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('resume.jobInput.field_description')}
                      name="jobDescription"
                      rules={[
                        {
                          required: true,
                          message: t('resume.jobInput.description_required'),
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={6}
                        placeholder={t(
                          'resume.jobInput.description_placeholder'
                        )}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('resume.jobInput.field_requirements')}
                      name="requirements"
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder={t(
                          'resume.jobInput.requirements_placeholder'
                        )}
                      />
                    </Form.Item>

                    <Space
                      style={{ width: '100%', justifyContent: 'flex-end' }}
                    >
                      <Button onClick={handleCancel}>{t('common.cancel')}</Button>
                      <Button
                        type="primary"
                        onClick={handleTextSubmit}
                        loading={loading}
                      >
                        {isEditMode
                          ? t('resume.jobInput.update')
                          : t('common.submit')}
                      </Button>
                    </Space>
                  </div>
                ),
              },
              {
                key: 'url',
                label: (
                  <span>
                    <LinkOutlined /> {t('resume.jobInput.tab_url')}
                  </span>
                ),
                children: (
                  <div style={{ marginTop: '16px' }}>
                    <Alert
                      message={t('resume.jobInput.url_hint')}
                      type="info"
                      style={{ marginBottom: '16px' }}
                    />

                    <Form.Item
                      label={t('resume.jobInput.field_url')}
                      name="jobUrl"
                      rules={[
                        {
                          required: true,
                          message: t('resume.jobInput.url_required'),
                        },
                        {
                          pattern: /^https?:\/\/.+/,
                          message: t('resume.jobInput.url_invalid'),
                        },
                      ]}
                    >
                      <Input
                        placeholder={t('resume.jobInput.url_placeholder')}
                        type="url"
                      />
                    </Form.Item>

                    <Space
                      style={{ width: '100%', justifyContent: 'flex-end' }}
                    >
                      <Button onClick={handleCancel}>{t('common.cancel')}</Button>
                      <Button
                        type="primary"
                        onClick={handleUrlFetch}
                        loading={urlLoading}
                      >
                        {t('resume.jobInput.extract')}
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
