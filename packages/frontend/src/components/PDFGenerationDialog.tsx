import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Button,
  Slider,
  Select,
  Checkbox,
  Space,
  Spin,
  message,
  Divider,
  Image,
  Empty,
  Tooltip,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { Template } from '../stores/generateStore';
import { useGenerateStore } from '@/stores';
import { generateService } from '@/services';
import { formatDateTime } from '../i18n';
import { useTranslation } from 'react-i18next';

interface PDFGenerationDialogProps {
  visible: boolean;
  optimizationId: string;
  onClose: () => void;
  onGenerateSuccess: (pdf: any) => void;
}

const PDFGenerationDialog: React.FC<PDFGenerationDialogProps> = ({
  visible,
  optimizationId,
  onClose,
  onGenerateSuccess,
}) => {
  const {
    templates,
    selectedTemplate,
    pdfOptions,
    generatedPDF,
    loading,
    previewUrl,
    setTemplates,
    setSelectedTemplate,
    setPDFOptions,
    setGeneratedPDF,
    setLoading,
    setPreviewUrl,
  } = useGenerateStore();

  const { t } = useTranslation();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load templates on mount
  useEffect(() => {
    if (visible && templates.length === 0) {
      loadTemplates();
    }
  }, [visible]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await generateService.listTemplates();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      message.error(t('pdfDialog.load_templates_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewUrl(null);
    setShowPreview(false);
  };

  const handlePreview = async () => {
    if (!selectedTemplate) {
      message.warning(t('pdfDialog.select_template_first'));
      return;
    }

    try {
      setPreviewLoading(true);
      const url = await generateService.previewPDF(
        optimizationId,
        selectedTemplate.id,
        pdfOptions
      );
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to preview PDF:', error);
      message.error(t('pdfDialog.preview_failed'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedTemplate) {
      message.warning(t('pdfDialog.select_template_first'));
      return;
    }

    try {
      setLoading(true);
      const pdf = await generateService.generatePDF(
        optimizationId,
        selectedTemplate.id,
        pdfOptions
      );
      setGeneratedPDF(pdf);
      message.success('PDF 生成成功！');
      onGenerateSuccess(pdf);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      message.error('生成 PDF 失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedPDF) {
      message.warning('请先生成 PDF');
      return;
    }

    try {
      await generateService.downloadPDF(
        generatedPDF.fileUrl,
        `resume-${new Date().getTime()}.pdf`
      );
      message.success('PDF 下载成功！');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      message.error('下载 PDF 失败');
    }
  };

  const colorThemes = [
    { label: '专业蓝', value: 'professional' },
    { label: '现代黑', value: 'modern' },
    { label: '创意彩', value: 'creative' },
  ];

  const margins = [
    { label: '紧凑', value: 'compact' },
    { label: '标准', value: 'normal' },
    { label: '宽松', value: 'wide' },
  ];

  const sections = [
    { label: '个人信息', value: 'personalInfo' },
    { label: '职业总结', value: 'summary' },
    { label: '工作经历', value: 'experience' },
    { label: '教育背景', value: 'education' },
    { label: '技能', value: 'skills' },
    { label: '项目经验', value: 'projects' },
  ];

  return (
    <Modal
      title="📄 生成 PDF 简历"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        <Row gutter={[24, 24]}>
          {/* Template Selection */}
          <Col span={24}>
            <div>
              <h3>选择模板</h3>
              {templates.length === 0 ? (
                <Empty description="暂无可用模板" />
              ) : (
                <Row gutter={[16, 16]}>
                  {templates.map((template) => (
                    <Col key={template.id} xs={24} sm={12} md={8}>
                      <Card
                        hoverable
                        onClick={() => handleTemplateSelect(template)}
                        style={{
                          border:
                            selectedTemplate?.id === template.id
                              ? '2px solid #1890ff'
                              : '1px solid #d9d9d9',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          {template.previewUrl && (
                            <Image
                              src={template.previewUrl}
                              alt={template.name}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                marginBottom: '12px',
                                borderRadius: '4px',
                              }}
                              preview={false}
                            />
                          )}
                          <h4>{template.name}</h4>
                          <p style={{ fontSize: '12px', color: '#666' }}>
                            {template.description}
                          </p>
                          {template.isPremium && (
                            <span
                              style={{
                                display: 'inline-block',
                                background: '#faad14',
                                color: '#fff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              高级
                            </span>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </Col>

          <Divider />

          {/* Customization Options */}
          <Col span={24}>
            <h3>自定义选项</h3>
            <Row gutter={[24, 24]}>
              {/* Font Size */}
              <Col span={24}>
                <div>
                  <label>字体大小: {pdfOptions.fontSize}px</label>
                  <Slider
                    min={9}
                    max={14}
                    value={pdfOptions.fontSize}
                    onChange={(value) => setPDFOptions({ fontSize: value })}
                    marks={{
                      9: '9px',
                      11: '11px',
                      14: '14px',
                    }}
                  />
                </div>
              </Col>

              {/* Color Theme */}
              <Col xs={24} sm={12}>
                <div>
                  <label>颜色主题</label>
                  <Select
                    value={pdfOptions.colorTheme}
                    onChange={(value) => setPDFOptions({ colorTheme: value })}
                    options={colorThemes}
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>

              {/* Margin */}
              <Col xs={24} sm={12}>
                <div>
                  <label>页边距</label>
                  <Select
                    value={pdfOptions.margin}
                    onChange={(value) => setPDFOptions({ margin: value })}
                    options={margins}
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>

              {/* Include Photo */}
              <Col span={24}>
                <Checkbox
                  checked={pdfOptions.includePhoto}
                  onChange={(e) =>
                    setPDFOptions({ includePhoto: e.target.checked })
                  }
                >
                  包含照片
                </Checkbox>
              </Col>

              {/* Visible Sections */}
              <Col span={24}>
                <label>显示部分</label>
                <div style={{ marginTop: '8px' }}>
                  <Checkbox.Group
                    value={pdfOptions.visibleSections}
                    onChange={(values) =>
                      setPDFOptions({
                        visibleSections: values as string[],
                      })
                    }
                    options={sections}
                  />
                </div>
              </Col>
            </Row>
          </Col>

          <Divider />

          {/* Preview and Generate */}
          <Col span={24}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Tooltip title="预览 PDF 效果">
                <Button
                  icon={<EyeOutlined />}
                  loading={previewLoading}
                  onClick={handlePreview}
                  disabled={!selectedTemplate}
                >
                  预览
                </Button>
              </Tooltip>
              <Button
                type="primary"
                loading={loading}
                onClick={handleGeneratePDF}
                disabled={!selectedTemplate}
              >
                生成 PDF
              </Button>
              {generatedPDF && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                >
                  下载
                </Button>
              )}
            </Space>
          </Col>

          {/* Preview Modal */}
          {showPreview && previewUrl && (
            <Col span={24}>
              <Card title="PDF 预览">
                <iframe
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '500px',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                  title="PDF Preview"
                />
              </Card>
            </Col>
          )}

          {/* Generated PDF Info */}
          {generatedPDF && (
            <Col span={24}>
              <Card
                title="✅ PDF 生成成功"
                style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <p>
                      <strong>文件大小:</strong>{' '}
                      {(generatedPDF.fileSize / 1024).toFixed(2)} KB
                    </p>
                  </Col>
                  <Col span={24}>
                    <p>
                      <strong>生成时间:</strong>{' '}
                      {formatDateTime(generatedPDF.createdAt)}
                    </p>
                  </Col>
                  <Col span={24}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      block
                    >
                      立即下载
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
        </Row>
      </Spin>
    </Modal>
  );
};

export default PDFGenerationDialog;
