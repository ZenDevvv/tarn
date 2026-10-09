import { describe, it, expect } from 'vitest';
import { tailoringApi } from '../api/tailoring-api';
import { resolveDocumentUrl } from '@/features/resumes/api/resume-api';

describe('Document Preview Modal & Delivery Endpoints - Unit Tests', () => {
  it('generates correct preview HTML endpoint URLs for resumes', () => {
    const resumeId = 'resume_abc_123';
    const previewUrl = tailoringApi.getResumeHtmlUrl(resumeId);

    expect(previewUrl).toContain(`/tailoring/resumes/${resumeId}/preview-html`);
  });

  it('generates correct preview HTML endpoint URLs for cover letters', () => {
    const coverLetterId = 'cl_xyz_789';
    const previewUrl = tailoringApi.getCoverLetterHtmlUrl(coverLetterId);

    expect(previewUrl).toContain(`/tailoring/cover-letters/${coverLetterId}/preview-html`);
  });

  it('resolves relative and absolute document URLs for PDF preview and download', () => {
    const relativeUrl = '/uploads/resumes/resume_tailored_123.pdf';
    const resolvedRelative = resolveDocumentUrl(relativeUrl);
    expect(resolvedRelative).toContain('/uploads/resumes/resume_tailored_123.pdf');

    const absoluteUrl = 'https://storage.googleapis.com/tarn/resume.pdf';
    const resolvedAbsolute = resolveDocumentUrl(absoluteUrl);
    expect(resolvedAbsolute).toBe(absoluteUrl);

    expect(resolveDocumentUrl(null)).toBe('');
    expect(resolveDocumentUrl(undefined)).toBe('');
  });
});
