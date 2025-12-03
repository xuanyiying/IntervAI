import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import ResumeUploadDialog from './ResumeUploadDialog';

vi.mock('../services/resumeService');

describe('ResumeUploadDialog Component', () => {
  const mockOnClose = vi.fn();
  const mockOnUploadSuccess = vi.fn();

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<ConfigProvider>{ui}</ConfigProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload dialog when visible is true', () => {
    renderWithProvider(
      <ResumeUploadDialog
        visible={true}
        onClose={mockOnClose}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );
    expect(screen.getByText('上传简历')).toBeInTheDocument();
    expect(screen.getByText('点击或拖拽文件到此区域上传')).toBeInTheDocument();
  });

  it('should display file format requirements', () => {
    renderWithProvider(
      <ResumeUploadDialog
        visible={true}
        onClose={mockOnClose}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );
    expect(
      screen.getByText('支持 PDF、Word、TXT 格式，文件大小不超过 10MB')
    ).toBeInTheDocument();
  });

  it('should disable confirm button when no file is uploaded', () => {
    renderWithProvider(
      <ResumeUploadDialog
        visible={true}
        onClose={mockOnClose}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );
    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(
      (btn) => btn.textContent === '确认并继续'
    );
    expect(confirmButton).toBeDisabled();
  });
});
