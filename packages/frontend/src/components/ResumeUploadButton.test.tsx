import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigProvider } from 'antd';
import ResumeUploadButton from './ResumeUploadButton';
import i18n from '../i18n';
import { I18nextProvider } from 'react-i18next';

// Mock the resume service
vi.mock('../services/resume-service', () => ({
  resumeService: {
    uploadResume: vi.fn(),
    parseResume: vi.fn(),
    getResume: vi.fn(),
  },
}));

// Mock the resume store
vi.mock('../stores', () => ({
  useResumeStore: () => ({
    addResume: vi.fn(),
  }),
}));

describe('ResumeUploadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <ConfigProvider>{component}</ConfigProvider>
      </I18nextProvider>
    );
  };

  it('should render upload button initially', () => {
    const mockOnFileSelect = vi.fn();
    renderWithProvider(<ResumeUploadButton onFileSelect={mockOnFileSelect} />);
    expect(screen.getByText('上传简历')).toBeInTheDocument();
  });

  it('should trigger file input when button is clicked', () => {
    const mockOnFileSelect = vi.fn();
    renderWithProvider(<ResumeUploadButton onFileSelect={mockOnFileSelect} />);
    const button = screen.getByText('上传简历');

    // Create a spy on the click event
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should accept PDF and DOCX files', () => {
    const mockOnFileSelect = vi.fn();
    renderWithProvider(<ResumeUploadButton onFileSelect={mockOnFileSelect} />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    expect(fileInput.accept).toBe('.pdf,.doc,.docx');
  });

  it('should validate file type before calling onFileSelect', async () => {
    const mockOnFileSelect = vi.fn();
    renderWithProvider(<ResumeUploadButton onFileSelect={mockOnFileSelect} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Try to select an invalid file type
    const invalidFile = new File(['content'], 'test.txt', {
      type: 'text/plain',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: true,
      configurable: true,
    });

    fireEvent.change(fileInput);

    // Should not call onFileSelect for invalid file type
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('should validate file size before calling onFileSelect', async () => {
    const mockOnFileSelect = vi.fn();
    renderWithProvider(<ResumeUploadButton onFileSelect={mockOnFileSelect} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: true,
      configurable: true,
    });

    fireEvent.change(fileInput);

    // Should not call onFileSelect for file too large
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('should call onFileSelect for valid file', async () => {
    const mockOnFileSelect = vi.fn();
    renderWithProvider(<ResumeUploadButton onFileSelect={mockOnFileSelect} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const validFile = new File(['content'], 'resume.pdf', {
      type: 'application/pdf',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: true,
      configurable: true,
    });

    fireEvent.change(fileInput);

    // Should call onFileSelect for valid file
    expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
  });
});
