import React, { useState } from 'react';
import { Card, Button, Space, Tag, Divider, Modal, message, Spin } from 'antd';
import { EditOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  jobService,
  type Job,
  type ParsedJobData,
} from '../services/job-service';
import { useTranslation } from 'react-i18next';

interface JobInfoCardProps {
  job: Job;
  onConfirm?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onDelete?: (jobId: string) => void;
  isEditing?: boolean;
}

const JobInfoCard: React.FC<JobInfoCardProps> = ({
  job,
  onConfirm,
  onEdit,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(job);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(job);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t('job.delete_title'),
      content: t('job.delete_confirm'),
      okText: t('job.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setLoading(true);
          await jobService.deleteJob(job.id);
          message.success(t('job.delete_success'));
          if (onDelete) {
            onDelete(job.id);
          }
        } catch (error) {
          console.error('Failed to delete job:', error);
          message.error(t('job.delete_failed'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const parsedData = job.parsedRequirements as ParsedJobData | undefined;

  return (
    <Card
      style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}
      bodyStyle={{ padding: '20px' }}
    >
      <Spin spinning={loading}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 200px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span>{job.title}</span>
              <span
                style={{ color: '#8c8c8c', fontSize: '14px', fontWeight: 400 }}
              >
                @ {job.company}
              </span>
            </h3>
          </div>
          <Space wrap size="small">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleConfirm}
              style={{ borderRadius: '8px' }}
            >
              {t('job.confirm')}
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={handleEdit}
              style={{ borderRadius: '8px' }}
            >
              {t('job.edit')}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={loading}
              style={{ borderRadius: '8px' }}
            >
              {t('job.delete')}
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: '12px' }}>
          {job.location && (
            <Tag color="blue" style={{ marginRight: '8px' }}>
              📍 {job.location}
            </Tag>
          )}
          {job.jobType && (
            <Tag color="green" style={{ marginRight: '8px' }}>
              💼 {job.jobType}
            </Tag>
          )}
          {job.salaryRange && (
            <Tag color="gold" style={{ marginRight: '8px' }}>
              💰 {job.salaryRange}
            </Tag>
          )}
        </div>

        {job.sourceUrl && (
          <div style={{ marginBottom: '12px' }}>
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
              查看原始链接
            </a>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          <strong>职位描述：</strong>
          <p style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
            {job.jobDescription}
          </p>
        </div>

        {job.requirements && (
          <div style={{ marginBottom: '12px' }}>
            <strong>任职要求：</strong>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
              {job.requirements}
            </p>
          </div>
        )}

        {parsedData && (
          <>
            <Divider style={{ margin: '12px 0' }} />

            {parsedData.requiredSkills &&
              parsedData.requiredSkills.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>必需技能：</strong>
                  <div style={{ marginTop: '8px' }}>
                    {parsedData.requiredSkills.map((skill: string) => (
                      <Tag
                        key={skill}
                        color="cyan"
                        style={{ marginRight: '4px' }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

            {parsedData.preferredSkills &&
              parsedData.preferredSkills.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>优先技能：</strong>
                  <div style={{ marginTop: '8px' }}>
                    {parsedData.preferredSkills.map((skill: string) => (
                      <Tag
                        key={skill}
                        color="purple"
                        style={{ marginRight: '4px' }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

            {parsedData.experienceYears && (
              <div style={{ marginBottom: '12px' }}>
                <strong>工作经验：</strong>
                <span style={{ marginLeft: '8px' }}>
                  {parsedData.experienceYears}+ 年
                </span>
              </div>
            )}

            {parsedData.educationLevel && (
              <div style={{ marginBottom: '12px' }}>
                <strong>教育背景：</strong>
                <span style={{ marginLeft: '8px' }}>
                  {parsedData.educationLevel}
                </span>
              </div>
            )}

            {parsedData.responsibilities &&
              parsedData.responsibilities.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>主要职责：</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    {parsedData.responsibilities
                      .slice(0, 5)
                      .map((resp: string, idx: number) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    {parsedData.responsibilities.length > 5 && (
                      <li>
                        ... 等 {parsedData.responsibilities.length - 5} 项
                      </li>
                    )}
                  </ul>
                </div>
              )}

            {parsedData.keywords && parsedData.keywords.length > 0 && (
              <div>
                <strong>关键词：</strong>
                <div style={{ marginTop: '8px' }}>
                  {parsedData.keywords.slice(0, 10).map((keyword: string) => (
                    <Tag key={keyword} style={{ marginRight: '4px' }}>
                      {keyword}
                    </Tag>
                  ))}
                  {parsedData.keywords.length > 10 && (
                    <Tag>... 等 {parsedData.keywords.length - 10} 个</Tag>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Spin>
    </Card>
  );
};

export default JobInfoCard;
