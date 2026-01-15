import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeBuilder } from './ResumeBuilder';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock URL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    Reorder: {
      Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  };
});

describe('ResumeBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ResumeBuilder component', () => {
    render(<ResumeBuilder />);
    expect(screen.getByText('AI.RESUME')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('should switch between Build and Preview modes', () => {
    render(<ResumeBuilder />);

    // Initially in Build mode
    expect(screen.getByText('Content Editor')).toBeInTheDocument();

    // Switch to Preview
    const previewButton = screen.getByRole('tab', { name: /preview/i });
    fireEvent.click(previewButton);

    // Should see Preview content
    expect(screen.queryByText('Content Editor')).not.toBeInTheDocument();
  });

  it('should add a new section', () => {
    render(<ResumeBuilder />);

    // Use regex to match exact text to avoid multiple matches if they exist
    // But since these are titles, they should be unique enough or at least present
    expect(screen.getByText('Personal Information')).toBeInTheDocument();

    const addButton = screen.getByLabelText('Add Section');
    fireEvent.click(addButton);

    expect(screen.getByText('New Section')).toBeInTheDocument();
  });
});
