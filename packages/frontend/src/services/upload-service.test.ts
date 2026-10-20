import { describe, it, expect } from 'vitest';
import {
  KB_ALLOWED_TYPES,
  MAX_FILE_SIZE_MB,
  RESUME_ALLOWED_EXTENSIONS,
  RESUME_ALLOWED_TYPES,
  resolveUploadFile,
  validateFile,
} from './upload-service';

describe('validateFile', () => {
  it('accepts allowed file types', () => {
    const file = new File(['content'], 'resume.pdf', {
      type: RESUME_ALLOWED_TYPES[0],
    });

    const result = validateFile(file, {
      allowedTypes: RESUME_ALLOWED_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });

    expect(result).toEqual({ valid: true });
  });

  it('rejects disallowed file types', () => {
    const file = new File(['content'], 'note.txt', { type: 'text/plain' });

    const result = validateFile(file, {
      allowedTypes: RESUME_ALLOWED_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });

    expect(result).toEqual({ valid: false, error: 'type' });
  });

  it('rejects files larger than the limit', () => {
    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: RESUME_ALLOWED_TYPES[0],
    });

    const result = validateFile(file, {
      allowedTypes: RESUME_ALLOWED_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });

    expect(result).toEqual({ valid: false, error: 'size' });
  });

  it('accepts knowledge base file types', () => {
    const file = new File(['content'], 'kb.txt', { type: KB_ALLOWED_TYPES[2] });

    const result = validateFile(file, {
      allowedTypes: KB_ALLOWED_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });

    expect(result).toEqual({ valid: true });
  });

  it('accepts Word files with empty MIME type via extension fallback', () => {
    // 部分浏览器对 .doc/.docx 返回空 MIME，需按扩展名放行
    const docFile = new File(['content'], 'resume.doc', { type: '' });
    const docxFile = new File(['content'], 'resume.docx', { type: '' });

    expect(
      validateFile(docFile, {
        allowedTypes: RESUME_ALLOWED_TYPES,
        allowedExtensions: RESUME_ALLOWED_EXTENSIONS,
        maxSizeMB: MAX_FILE_SIZE_MB,
      })
    ).toEqual({ valid: true });

    expect(
      validateFile(docxFile, {
        allowedTypes: RESUME_ALLOWED_TYPES,
        allowedExtensions: RESUME_ALLOWED_EXTENSIONS,
        maxSizeMB: MAX_FILE_SIZE_MB,
      })
    ).toEqual({ valid: true });
  });

  it('rejects disallowed extensions even with extension fallback', () => {
    const file = new File(['content'], 'malware.exe', { type: '' });

    const result = validateFile(file, {
      allowedTypes: RESUME_ALLOWED_TYPES,
      allowedExtensions: RESUME_ALLOWED_EXTENSIONS,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });

    expect(result).toEqual({ valid: false, error: 'type' });
  });
});

describe('resolveUploadFile', () => {
  it('returns File instances directly', () => {
    const file = new File(['content'], 'resume.pdf', {
      type: RESUME_ALLOWED_TYPES[0],
    });

    expect(resolveUploadFile(file)).toBe(file);
  });

  it('returns originFileObj when provided', () => {
    const file = new File(['content'], 'resume.pdf', {
      type: RESUME_ALLOWED_TYPES[0],
    });

    const uploadFile = { originFileObj: file } as any;

    expect(resolveUploadFile(uploadFile)).toBe(file);
  });

  it('returns null when no file can be resolved', () => {
    const uploadFile = { originFileObj: null } as any;

    expect(resolveUploadFile(uploadFile)).toBeNull();
  });
});
