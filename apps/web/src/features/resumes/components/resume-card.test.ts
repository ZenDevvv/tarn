import { describe, it, expect } from 'vitest';
import { ResumeWithDetailsDTO } from '@tracker/types';

describe('Resumes Feature - Unit Tests', () => {
  const mockResume: ResumeWithDetailsDTO = {
    id: 'resume_123',
    userId: 'user_123',
    name: 'Frontend Specialist 2026',
    version: 'v3.0',
    targetRole: 'Senior Frontend Engineer',
    fileUrl: '/uploads/resumes/resume_123.pdf',
    filename: 'Frontend_Specialist_2026.pdf',
    fileSize: 1048576,
    mimeType: 'application/pdf',
    isDefault: true,
    isTailored: false,
    matchScore: null,
    skills: ['React', 'TypeScript', 'Tailwind', 'Performance'],
    notes: 'Tailored with focus on design systems and web performance.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    applicationsCount: 2,
    applications: [
      {
        id: 'app_1',
        status: 'INTERVIEWING',
        priority: 'HIGH',
        appliedAt: new Date().toISOString(),
        company: { id: 'comp_1', name: 'Linear' },
        job: { id: 'job_1', title: 'Senior Frontend Engineer' },
      },
      {
        id: 'app_2',
        status: 'APPLIED',
        priority: 'MEDIUM',
        appliedAt: new Date().toISOString(),
        company: { id: 'comp_2', name: 'Vercel' },
        job: { id: 'job_2', title: 'UI Architect' },
      },
    ],
  };

  it('validates resume entity fields and relationships', () => {
    expect(mockResume.name).toBe('Frontend Specialist 2026');
    expect(mockResume.targetRole).toBe('Senior Frontend Engineer');
    expect(mockResume.isDefault).toBe(true);
    expect(mockResume.skills).toContain('React');
    expect(mockResume.applicationsCount).toBe(2);
    expect(mockResume.applications[0].company?.name).toBe('Linear');
  });

  it('handles file metadata and download link', () => {
    expect(mockResume.fileUrl).toBe('/uploads/resumes/resume_123.pdf');
    expect(mockResume.filename).toBe('Frontend_Specialist_2026.pdf');
    expect(mockResume.fileSize).toBe(1048576);
    expect(mockResume.mimeType).toBe('application/pdf');
  });
});
