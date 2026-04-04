import React, { useEffect, useState } from 'react';
import { message, Typography, Button } from 'antd';
import { FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useResumePage } from '../hooks/useResumePage';
import { ResumeSidebar } from '../components/MyResumes/ResumeSidebar';
import { ResumeDetail } from '../components/MyResumes/ResumeDetail';
import { ResumeEmptyState } from '../components/MyResumes/ResumeEmptyState';
import { ResumeViewMode } from '../components/MyResumes/ResumeDetailHeader';
import JobInputDialog from '../components/JobInputDialog';
import { jobService } from '../services/job-service';
import './MyResumesPage.css';

const { Title } = Typography;

const MyResumesPage: React.FC = () => {
  const {
    t,
    resumes,
    currentResume,
    setCurrentResume,
    state,
    data,
    fetchResumes,
    handleUpload,
    handleDelete,
    handleSetPrimary,
    fetchOptimizations,
  } = useResumePage();

  const [viewMode, setViewMode] = useState<ResumeViewMode>('analysis');
  const [initialOptimizationId, setInitialOptimizationId] = useState<
    string | undefined
  >(undefined);
  const [jobInputVisible, setJobInputVisible] = useState(false);

  const handleJobCreated = async (jobData: any) => {
    try {
      await jobService.createJob(jobData);
      message.success(t('chat.job_confirmed', '职位信息已确认'));
      setJobInputVisible(false);
    } catch (error) {
      console.error('Failed to create job:', error);
      message.error(t('common.error'));
    }
  };
  useEffect(() => {
    if (currentResume) {
      setViewMode('analysis');
      setInitialOptimizationId(undefined);
    }
  }, [currentResume?.id]);

  const handleOptimizationSuccess = () => {
    fetchResumes();
    if (currentResume) {
      fetchOptimizations(currentResume.id);
    }
    setViewMode('history');
    message.success(
      t('resume.optimization_success', '简历优化已完成并保存为新版本')
    );
  };

  const handleSelectOptimization = (id: string) => {
    setInitialOptimizationId(id);
    setViewMode('optimization');
  };

  return (
    <div className="my-resumes-container">
      <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
        <Title level={2} className="!mb-0 flex items-center gap-3">
          <FileTextOutlined className="text-primary" />
          {t('menu.my_resumes', '我的简历')}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setJobInputVisible(true)}
        >
          {t('menu.job_input', '职位输入')}
        </Button>
      </div>

      <div className="resumes-layout">
        <ResumeSidebar
          resumes={resumes}
          currentResume={currentResume}
          onSelect={setCurrentResume}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={state.uploading}
        />

        <main className="resume-content">
          {currentResume ? (
            <ResumeDetail
              resume={currentResume}
              viewMode={viewMode}
              onViewChange={setViewMode}
              onSetPrimary={() => handleSetPrimary(currentResume.id)}
              optimizations={data.optimizations}
              onSelectOptimization={handleSelectOptimization}
              initialOptimizationId={initialOptimizationId}
              onOptimizationSuccess={handleOptimizationSuccess}
            />
          ) : (
            <ResumeEmptyState
              onUpload={handleUpload}
              uploading={state.uploading}
            />
          )}
        </main>
      </div>
      <JobInputDialog
        visible={jobInputVisible}
        onClose={() => setJobInputVisible(false)}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
};

export default MyResumesPage;
