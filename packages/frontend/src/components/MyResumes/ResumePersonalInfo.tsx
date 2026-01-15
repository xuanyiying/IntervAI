import React from 'react';
import { Avatar } from 'antd';
import {
  InfoCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumePersonalInfoProps {
  data: ParsedResumeData['personalInfo'];
}

export const ResumePersonalInfo: React.FC<ResumePersonalInfoProps> = ({
  data,
}) => {
  const { t } = useTranslation();

  return (
    <section className="data-section">
      <div className="section-title">
        <Avatar
          icon={<InfoCircleOutlined />}
          className="section-avatar bg-primary"
        />
        {t('resume.personal_info', '个人信息')}
      </div>
      <div className="info-grid">
        <div className="info-card">
          <div className="info-card-icon">
            <UserOutlined />
          </div>
          <div className="info-card-content">
            <div className="info-label">{t('resume.name', '姓名')}</div>
            <div className="info-value">{data?.name || '-'}</div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-card-icon">
            <MailOutlined />
          </div>
          <div className="info-card-content">
            <div className="info-label">{t('resume.email', '邮箱')}</div>
            <div className="info-value">{data?.email || '-'}</div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-card-icon">
            <PhoneOutlined />
          </div>
          <div className="info-card-content">
            <div className="info-label">{t('resume.phone', '电话')}</div>
            <div className="info-value">{data?.phone || '-'}</div>
          </div>
        </div>
        <div className="info-card">
          <div className="info-card-icon">
            <EnvironmentOutlined />
          </div>
          <div className="info-card-content">
            <div className="info-label">{t('resume.location', '地点')}</div>
            <div className="info-value">{data?.location || '-'}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
