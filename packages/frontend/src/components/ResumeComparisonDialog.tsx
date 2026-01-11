import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Button,
  Space,
  Typography,
  Tag,
  ConfigProvider,
} from 'antd';
import {
  DownloadOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text } = Typography;

interface ResumeComparisonDialogProps {
  visible: boolean;
  onClose: () => void;
  originalContent: string;
  optimizedContent: string;
  onDownload: () => void;
}

const ResumeComparisonDialog: React.FC<ResumeComparisonDialogProps> = ({
  visible,
  onClose,
  originalContent,
  optimizedContent,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState('comparison');

  const items = [
    {
      key: 'comparison',
      label: (
        <span className="flex items-center gap-2">
          <SwapOutlined /> 对比视图
        </span>
      ),
      children: (
        <div className="flex flex-col md:flex-row gap-6 h-[65vh] overflow-hidden py-2">
          {/* Original Content */}
          <div className="flex-1 flex flex-col h-full border border-white/5 rounded-2xl bg-black/40 backdrop-blur-sm overflow-hidden group transition-all duration-500 hover:border-white/10">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <Space>
                <HistoryOutlined className="text-gray-500" />
                <span className="font-semibold text-gray-500 uppercase tracking-widest text-xs">
                  原始版本
                </span>
              </Space>
              <Tag
                color="default"
                className="!bg-white/5 !border-white/10 !text-gray-500 !m-0 !rounded-full !text-[10px] px-2"
              >
                ORIGINAL
              </Tag>
            </div>
            <div className="flex-1 overflow-auto p-6 custom-scrollbar text-sm text-gray-400/80 leading-relaxed font-serif">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {originalContent}
              </ReactMarkdown>
            </div>
          </div>

          {/* Optimized Content */}
          <div className="flex-1 flex flex-col h-full border border-primary-500/20 rounded-2xl bg-primary-500/[0.02] backdrop-blur-md overflow-hidden shadow-[0_0_40px_-15px_rgba(var(--primary-rgb),0.2)] transition-all duration-500 hover:border-primary-500/40">
            <div className="px-5 py-3 border-b border-primary-500/10 bg-primary-500/[0.05] flex items-center justify-between">
              <Space>
                <ThunderboltOutlined className="text-primary-400" />
                <span className="font-semibold text-primary-400 uppercase tracking-widest text-xs">
                  AI 优化版本
                </span>
              </Space>
              <Tag
                color="processing"
                className="!bg-primary-500/20 !border-primary-500/30 !text-primary-300 !m-0 !rounded-full !text-[10px] px-2 animate-pulse"
              >
                OPTIMIZED
              </Tag>
            </div>
            <div className="flex-1 overflow-auto p-6 custom-scrollbar text-sm text-gray-200 leading-relaxed font-serif">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {optimizedContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'optimized',
      label: (
        <span className="flex items-center gap-2">
          <ThunderboltOutlined /> 优化后全文
        </span>
      ),
      children: (
        <div className="h-[65vh] overflow-auto p-8 border border-primary-500/10 rounded-2xl bg-black/40 backdrop-blur-md custom-scrollbar text-gray-200 leading-relaxed font-serif">
          <div className="max-w-3xl mx-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {optimizedContent}
            </ReactMarkdown>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          colorBgBase: '#0a0a0a',
          colorTextBase: '#ffffff',
          borderRadius: 16,
        },
      }}
    >
      <Modal
        title={
          <div className="py-2">
            <Title
              level={4}
              style={{
                margin: 0,
                color: '#fff',
                letterSpacing: '-0.02em',
                fontWeight: 700,
              }}
            >
              简历优化对比报告
            </Title>
            <Text
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.45)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              基于 AI 深度解析与岗位匹配，为您打造的专业版简历
            </Text>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={1100}
        footer={[
          <div
            key="footer"
            className="flex items-center justify-between w-full px-2 py-1"
          >
            <div className="text-[11px] text-gray-500 italic hidden sm:block">
              * 优化内容已自动保存至您的简历库
            </div>
            <Space size="middle">
              <Button
                key="close"
                onClick={onClose}
                className="!bg-white/5 !border-white/10 !text-gray-400 hover:!text-white hover:!bg-white/10 transition-all !rounded-full px-6"
              >
                关闭
              </Button>
              <Button
                key="download"
                type="primary"
                icon={<DownloadOutlined />}
                onClick={onDownload}
                className="!bg-primary-500 !border-primary-500 shadow-lg shadow-primary-500/20 hover:scale-105 transition-all !rounded-full px-8 font-semibold"
              >
                下载简历
              </Button>
            </Space>
          </div>,
        ]}
        className="resume-comparison-modal"
        centered
        closeIcon={
          <span className="text-gray-500 hover:text-white transition-colors">
            ✕
          </span>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          className="custom-tabs mt-2"
        />
        <style>{`
          .resume-comparison-modal .ant-modal-content {
            background: #0d0d0d;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
            padding: 24px;
            position: relative;
            overflow: hidden;
          }
          .resume-comparison-modal .ant-modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
          }
          .resume-comparison-modal .ant-modal-header {
            background: transparent;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            margin-bottom: 16px;
          }
          .resume-comparison-modal .ant-modal-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            margin-top: 24px;
            padding-top: 16px;
          }
          .custom-tabs .ant-tabs-nav::before {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .custom-tabs .ant-tabs-tab {
            color: rgba(255, 255, 255, 0.4) !important;
            padding: 12px 16px !important;
            margin: 0 8px 0 0 !important;
            transition: all 0.3s ease;
          }
          .custom-tabs .ant-tabs-tab:hover {
            color: rgba(255, 255, 255, 0.8) !important;
          }
          .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #3b82f6 !important;
            font-weight: 600;
          }
          .custom-tabs .ant-tabs-ink-bar {
            background: #3b82f6 !important;
            height: 3px !important;
            border-radius: 3px 3px 0 0;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .markdown-content h1, .markdown-content h2, .markdown-content h3 {
            color: #fff;
            margin-top: 1.5em;
            margin-bottom: 0.8em;
            font-weight: 700;
          }
          .markdown-content h1 { font-size: 1.5rem; letter-spacing: -0.02em; border-left: 4px solid #3b82f6; padding-left: 12px; }
          .markdown-content h2 { font-size: 1.25rem; }
          .markdown-content p {
            margin-bottom: 1.2em;
            line-height: 1.7;
          }
          .markdown-content ul, .markdown-content ol {
            margin-bottom: 1.2em;
            padding-left: 1.2em;
          }
          .markdown-content li {
            margin-bottom: 0.6em;
            position: relative;
          }
          
          /* Typography enhancement */
          .font-serif {
            font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .group {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}</style>
      </Modal>
    </ConfigProvider>
  );
};

export default ResumeComparisonDialog;
