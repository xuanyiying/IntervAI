import React from 'react';
import { message, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useResumePage } from '../hooks/useResumePage';
import { ResumeSidebar } from '../components/MyResumes/ResumeSidebar';
import { ResumeDetail } from '../components/MyResumes/ResumeDetail';
import { ResumeEmptyState } from '../components/MyResumes/ResumeEmptyState';
import { ResumeHistoryModal } from '../components/MyResumes/ResumeHistoryModal';
import { ResumePreviewModal } from '../components/MyResumes/ResumePreviewModal';
import { ResumeOptimizationDialog } from '../components/ResumeOptimizationDialog';
import { ResumeAnalysisDrawer } from '../components/ResumeAnalysisDrawer';
import './MyResumesPage.css';

const { Title, Paragraph } = Typography;

const MyResumesPage: React.FC = () => {
  const {
    t,
    resumes,
    currentResume,
    setCurrentResume,
    state,
    setState,
    data,
    setData,
    fetchResumes,
    handleUpload,
    handleDelete,
    handleSetPrimary,
  } = useResumePage();

  const handlePreview = (resume: any) => {
    setData((prev) => ({ ...prev, selectedPreviewResume: resume }));
    setState((prev) => ({ ...prev, previewVisible: true }));
  };

  return (
    <div className="my-resumes-container">
      <div className="max-w-7xl mx-auto mb-10">
        <Title level={2} className="!mb-2 flex items-center gap-3">
          <FileTextOutlined className="text-primary" />
          {t('menu.my_resumes', '我的简历')}
        </Title>
        <Paragraph className="!text-lg text-secondary">
          {t(
            'resume.my_resumes_desc',
            '管理您的简历版本，查看解析后的结构化数据'
          )}
        </Paragraph>
      </div>

      <div className="resumes-layout">
        <ResumeSidebar
          resumes={resumes}
          currentResume={currentResume}
          onSelect={setCurrentResume}
          onUpload={handleUpload}
          uploading={state.uploading}
        />

        <main className="resume-content">
          {currentResume ? (
            <ResumeDetail
              resume={currentResume}
              onPreview={() => handlePreview(currentResume)}
              onHistory={() =>
                setState((prev) => ({ ...prev, historyVisible: true }))
              }
              onAnalyze={() => {
                setData((prev) => ({
                  ...prev,
                  selectedAnalysisResumeId: currentResume.id,
                }));
                setState((prev) => ({ ...prev, analysisVisible: true }));
              }}
              onOptimize={() =>
                setState((prev) => ({ ...prev, optimizationVisible: true }))
              }
              onSetPrimary={() => handleSetPrimary(currentResume.id)}
              onDelete={() =>
                handleDelete(
                  currentResume.id,
                  currentResume.title || currentResume.originalFilename || ''
                )
              }
            />
          ) : (
            <ResumeEmptyState
              onUpload={handleUpload}
              uploading={state.uploading}
            />
          )}
        </main>
      </div>

      <ResumeOptimizationDialog
        visible={state.optimizationVisible}
        resumeId={currentResume?.id || ''}
        initialOptimizationId={data.selectedOptimizationId}
        onClose={() => {
          setState((prev) => ({ ...prev, optimizationVisible: false }));
          setData((prev) => ({ ...prev, selectedOptimizationId: undefined }));
        }}
        onSuccess={() => {
          setState((prev) => ({ ...prev, optimizationVisible: false }));
          setData((prev) => ({ ...prev, selectedOptimizationId: undefined }));
          fetchResumes();
          message.success(
            t('resume.optimization_success', '简历优化已完成并保存为新版本')
          );
        }}
      />

      <ResumeAnalysisDrawer
        visible={state.analysisVisible}
        resumeId={data.selectedAnalysisResumeId}
        onClose={() => {
          setState((prev) => ({ ...prev, analysisVisible: false }));
          setData((prev) => ({ ...prev, selectedAnalysisResumeId: null }));
        }}
      />

      <ResumeHistoryModal
        visible={state.historyVisible}
        optimizations={data.optimizations}
        onClose={() => setState((prev) => ({ ...prev, historyVisible: false }))}
        onSelectOptimization={(id) => {
          setData((prev) => ({ ...prev, selectedOptimizationId: id }));
          setState((prev) => ({
            ...prev,
            optimizationVisible: true,
            historyVisible: false,
          }));
        }}
      />

      <ResumePreviewModal
        visible={state.previewVisible}
        resume={data.selectedPreviewResume}
        onClose={() => setState((prev) => ({ ...prev, previewVisible: false }))}
      />
    </div>
  );
};

export default MyResumesPage;
