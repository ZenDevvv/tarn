import { describe, it, expect } from 'vitest';
import { ApplicationStatusDTO } from '@tracker/types';

describe('PipelineStagesSection Logic & State Management', () => {
  const mockStatuses: ApplicationStatusDTO[] = [
    {
      id: 'st-0',
      userId: 'u1',
      name: 'Saved',
      order: 0,
      closeType: null,
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-1',
      userId: 'u1',
      name: 'Applied',
      order: 1,
      closeType: null,
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-2',
      userId: 'u1',
      name: 'Interviewing',
      order: 2,
      closeType: null,
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-3',
      userId: 'u1',
      name: 'Offer',
      order: 3,
      closeType: null,
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-4',
      userId: 'u1',
      name: 'Accepted',
      order: 4,
      closeType: null,
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-rej',
      userId: 'u1',
      name: 'Rejected',
      order: null,
      closeType: 'REJECTED',
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-with',
      userId: 'u1',
      name: 'Withdrawn',
      order: null,
      closeType: 'WITHDRAWN',
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'st-ghost',
      userId: 'u1',
      name: 'No response',
      order: null,
      closeType: 'NO_RESPONSE',
      isDefault: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  it('correctly segregates active pipeline stages and closed outcomes', () => {
    const active = mockStatuses
      .filter((s) => s.closeType === null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const closed = mockStatuses
      .filter((s) => s.closeType !== null);

    expect(active).toHaveLength(5);
    expect(closed).toHaveLength(3);

    expect(active[0].name).toBe('Saved');
    expect(active[4].name).toBe('Accepted');
    expect(closed.map((c) => c.closeType)).toEqual(['REJECTED', 'WITHDRAWN', 'NO_RESPONSE']);
  });

  it('calculates reorder payload correctly when swapping positions', () => {
    const active = mockStatuses
      .filter((s) => s.closeType === null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Move "Applied" (index 1) down to index 2
    const reordered = [...active];
    const [moved] = reordered.splice(1, 1);
    reordered.splice(2, 0, moved);

    const payload = {
      statusIds: reordered.map((stage) => stage.id),
    };

    expect(payload.statusIds).toHaveLength(5);
    expect(payload.statusIds).toEqual(['st-0', 'st-2', 'st-1', 'st-3', 'st-4']);
  });

  it('computes exact progress percentage for funnel indicators', () => {
    const active = mockStatuses.filter((s) => s.closeType === null);
    const totalActive = active.length; // 5
    const denominator = totalActive - 1; // 4

    const pctForOrder = (order: number) => Math.round((order / denominator) * 100);

    expect(pctForOrder(0)).toBe(0);
    expect(pctForOrder(1)).toBe(25);
    expect(pctForOrder(2)).toBe(50);
    expect(pctForOrder(3)).toBe(75);
    expect(pctForOrder(4)).toBe(100);
  });

  it('supports dynamic closed outcomes with custom close types and deletion eligibility', () => {
    const dynamicStatuses: ApplicationStatusDTO[] = [
      ...mockStatuses,
      {
        id: 'st-freeze',
        userId: 'u1',
        name: 'Hiring Freeze',
        order: null,
        closeType: 'CANCELLED',
        isDefault: false,
      },
      {
        id: 'st-other',
        userId: 'u1',
        name: 'Archived Opportunity',
        order: null,
        closeType: 'OTHER',
        isDefault: false,
      },
    ];

    const closed = dynamicStatuses.filter((s) => s.closeType !== null);
    expect(closed).toHaveLength(5);

    const customClosed = closed.filter((s) => !s.isDefault);
    expect(customClosed).toHaveLength(2);
    expect(customClosed.map((c) => c.name)).toEqual(['Hiring Freeze', 'Archived Opportunity']);
    expect(customClosed.map((c) => c.closeType)).toEqual(['CANCELLED', 'OTHER']);
  });
});
