import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigProvider } from 'antd';
import MarkdownPDFCard from './MarkdownPDFCard';
import * as generateService from '../services/generate-service';

// Mock the generate service
vi.mock('../services/generate-service', () => ({
  generateService: {
    generatePDFFromMarkdown: vi.fn(),
    downloadPDF: vi.fn(),
  },
}));

describe('MarkdownPDFCard', () => {
  const mockMarkdown = '# Test Resume\n\n## Experience\n\n- Software Engineer';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<ConfigProvider>{component}</ConfigProvider>);
  };

  it('should render PDF generation card', () => {
    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);
    expect(screen.getByText('📄 生成专业 PDF 简历')).toBeInTheDocument();
    expect(
      screen.getByText('将优化后的简历导出为 PDF 格式')
    ).toBeInTheDocument();
  });

  it('should show generate button initially', () => {
    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);
    expect(screen.getByText('生成 PDF')).toBeInTheDocument();
  });

  it('should generate PDF when button is clicked', async () => {
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    // Should show loading state
    await waitFor(() => {
      expect(
        generateService.generateService.generatePDFFromMarkdown
      ).toHaveBeenCalledWith(mockMarkdown, {
        fontSize: 12,
        margin: { top: 20, bottom: 20, left: 20, right: 20 },
      });
    });
  });

  it('should show download button after PDF is generated', async () => {
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    // Wait for PDF generation to complete
    await waitFor(() => {
      expect(screen.getByText('下载 PDF')).toBeInTheDocument();
    });
  });

  it('should download PDF when download button is clicked', async () => {
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);
    vi.mocked(generateService.generateService.downloadPDF).mockResolvedValue();

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    // Generate PDF first
    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    // Wait for download button to appear
    await waitFor(() => {
      expect(screen.getByText('下载 PDF')).toBeInTheDocument();
    });

    // Click download button
    const downloadButton = screen.getByText('下载 PDF');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(generateService.generateService.downloadPDF).toHaveBeenCalledWith(
        mockPDFResult.downloadUrl,
        expect.stringContaining('resume-optimized-')
      );
    });
  });

  it('should show expiration time after PDF is generated', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: expiresAt.toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    // Wait for expiration info to appear
    await waitFor(() => {
      expect(screen.getByText(/有效期至/)).toBeInTheDocument();
    });
  });

  it('should show regenerate button after PDF is generated', async () => {
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    // Wait for regenerate button to appear
    await waitFor(() => {
      expect(screen.getByText('重新生成')).toBeInTheDocument();
    });
  });

  it('should handle PDF generation error', async () => {
    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockRejectedValue(new Error('Generation failed'));

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    // Should handle error gracefully
    await waitFor(() => {
      expect(
        generateService.generateService.generatePDFFromMarkdown
      ).toHaveBeenCalled();
    });
  });

  it('should call onGenerateSuccess callback when PDF is generated', async () => {
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);

    const mockOnGenerateSuccess = vi.fn();
    renderWithProvider(
      <MarkdownPDFCard
        markdown={mockMarkdown}
        onGenerateSuccess={mockOnGenerateSuccess}
      />
    );

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockOnGenerateSuccess).toHaveBeenCalled();
    });
  });

  it('should disable download button when PDF is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago
    const mockPDFResult = {
      fileId: 'pdf-123',
      filePath: '/path/to/pdf',
      expiresAt: expiredDate.toISOString(),
      downloadUrl: '/api/v1/generate/pdfs/pdf-123/download',
    };

    vi.mocked(
      generateService.generateService.generatePDFFromMarkdown
    ).mockResolvedValue(mockPDFResult);

    renderWithProvider(<MarkdownPDFCard markdown={mockMarkdown} />);

    const generateButton = screen.getByText('生成 PDF');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('重新生成')).toBeInTheDocument();
      expect(screen.getByText('链接已过期，请重新生成')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /下载\s*PDF/i });
    expect(downloadButton).toBeDisabled();
  });
});
