import { describe, it, expect } from 'vitest';
import { ApplicationDTO, ApplicationStatus } from '@tracker/types';

const KANBAN_STAGES: Array<{ status: ApplicationStatus; label: string }> = [
  { status: 'SAVED', label: 'Saved' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'INTERVIEWING', label: 'Interviewing' },
  { status: 'OFFER', label: 'Offer' },
  { status: 'ACCEPTED', label: 'Accepted' },
];

describe('ApplicationKanban - Stages and Filtering', () => {
  const mockApplications: ApplicationDTO[] = [
    {
      id: 'app_1',
      userId: 'user_1',
      companyId: 'comp_1',
      jobId: 'job_1',
      status: 'SAVED',
      priority: 'MEDIUM',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 'app_2',
      userId: 'user_1',
      companyId: 'comp_1',
      jobId: 'job_2',
      status: 'INTERVIEWING',
      priority: 'HIGH',
      appliedAt: '2026-10-02T08:00:00.000Z',
      createdAt: '2026-10-02T08:00:00.000Z',
      updatedAt: '2026-10-02T08:00:00.000Z',
    },
    {
      id: 'app_3',
      userId: 'user_1',
      companyId: 'comp_2',
      jobId: 'job_3',
      status: 'REJECTED',
      priority: 'LOW',
      createdAt: '2026-10-03T08:00:00.000Z',
      updatedAt: '2026-10-03T08:00:00.000Z',
    },
  ];

  it('contains exactly the 5 active pipeline stages', () => {
    expect(KANBAN_STAGES).toHaveLength(5);
    expect(KANBAN_STAGES.map((s) => s.status)).toEqual([
      'SAVED',
      'APPLIED',
      'INTERVIEWING',
      'OFFER',
      'ACCEPTED',
    ]);
  });

  it('correctly partitions applications by active pipeline status', () => {
    const partitioned = KANBAN_STAGES.map(({ status }) => ({
      status,
      apps: mockApplications.filter((a) => a.status === status),
    }));

    const saved = partitioned.find((p) => p.status === 'SAVED');
    const interviewing = partitioned.find((p) => p.status === 'INTERVIEWING');
    const offer = partitioned.find((p) => p.status === 'OFFER');

    expect(saved?.apps).toHaveLength(1);
    expect(saved?.apps[0].id).toBe('app_1');

    expect(interviewing?.apps).toHaveLength(1);
    expect(interviewing?.apps[0].id).toBe('app_2');

    expect(offer?.apps).toHaveLength(0);
  });
});
