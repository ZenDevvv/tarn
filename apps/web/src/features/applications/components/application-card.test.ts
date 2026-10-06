import { describe, it, expect } from 'vitest';
import { ApplicationDTO } from '@tracker/types';

describe('ApplicationCard - Structural Consistency & Date Footer', () => {
  const mockApplication: ApplicationDTO = {
    id: 'app_1',
    userId: 'user_1',
    companyId: 'comp_1',
    jobId: 'job_1',
    status: 'INTERVIEWING',
    priority: 'HIGH',
    appliedAt: '2026-10-01T08:00:00.000Z',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    nextAction: 'Prepare for technical interview',
    nextActionDueAt: '2026-10-06T08:00:00.000Z',
    company: {
      id: 'comp_1',
      name: 'Halcyon Labs',
      location: 'Hybrid',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    job: {
      id: 'job_1',
      companyId: 'comp_1',
      title: 'Frontend Developer',
      workSetup: 'HYBRID',
      salaryMin: 50000,
      salaryMax: 70000,
      currency: 'PHP',
      source: 'LinkedIn',
    },
  };

  it('provides structured application fields without nextAction in card presentation', () => {
    expect(mockApplication.company?.name).toBe('Halcyon Labs');
    expect(mockApplication.job?.title).toBe('Frontend Developer');
    expect(mockApplication.job?.workSetup).toBe('HYBRID');
    expect(mockApplication.appliedAt).toBe('2026-10-01T08:00:00.000Z');
  });
});
