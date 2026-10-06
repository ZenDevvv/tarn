import { describe, it, expect } from 'vitest';
import { STATUS_CONFIG, getStatusConfig } from './application-status-badge';
import { ApplicationStatus, ApplicationStatusDTO } from '@tracker/types';

describe('Marker Design System - Status & Stage Ring Specifications', () => {
  it('defines valid labels and ring styles for all 8 ApplicationStatus values', () => {
    const expectedStatuses: ApplicationStatus[] = [
      'SAVED',
      'APPLIED',
      'INTERVIEWING',
      'OFFER',
      'ACCEPTED',
      'REJECTED',
      'WITHDRAWN',
      'NO_RESPONSE',
    ];

    expectedStatuses.forEach((status) => {
      const config = STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(typeof config.label).toBe('string');
      expect(config.label.length).toBeGreaterThan(0);
    });
  });

  it('assigns color roles strictly adhering to Marker specification (no rainbow pills)', () => {
    // REJECTED must use rejected kind
    expect(STATUS_CONFIG['REJECTED'].kind).toBe('rejected');
    // WITHDRAWN and NO_RESPONSE must use closed kinds
    expect(STATUS_CONFIG['WITHDRAWN'].kind).toBe('withdrawn');
    expect(STATUS_CONFIG['NO_RESPONSE'].kind).toBe('no-response');
    // Active pipeline stages must use progress kind
    expect(STATUS_CONFIG['APPLIED'].kind).toBe('progress');
    expect(STATUS_CONFIG['INTERVIEWING'].kind).toBe('progress');
    expect(STATUS_CONFIG['OFFER'].kind).toBe('progress');
    // ACCEPTED must be done with progress = 1
    expect(STATUS_CONFIG['ACCEPTED'].kind).toBe('done');
    expect(STATUS_CONFIG['ACCEPTED'].progress).toBe(1);
  });

  it('correctly calculates dynamic progress for custom pipeline stages with order', () => {
    // 6-stage pipeline: order 0..5. Denominator = 5.
    const customStage2: ApplicationStatusDTO = {
      id: 'custom-2',
      userId: 'u1',
      name: 'Technical Assessment',
      order: 2,
      closeType: null,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const config = getStatusConfig(customStage2, 6);
    expect(config.label).toBe('Technical Assessment');
    expect(config.kind).toBe('progress');
    expect(config.progress).toBe(2 / 5);

    // Final stage in 6-stage pipeline (order = 5)
    const finalStage: ApplicationStatusDTO = {
      ...customStage2,
      id: 'custom-5',
      name: 'Hired!',
      order: 5,
    };
    const finalConfig = getStatusConfig(finalStage, 6);
    expect(finalConfig.label).toBe('Hired!');
    expect(finalConfig.kind).toBe('done');
    expect(finalConfig.progress).toBe(1);
  });

  it('correctly sets kinds for dynamic closed outcomes', () => {
    const rejectedStatus: ApplicationStatusDTO = {
      id: 'closed-rej',
      userId: 'u1',
      name: 'Not Selected',
      order: null,
      closeType: 'REJECTED',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };
    const rejConfig = getStatusConfig(rejectedStatus);
    expect(rejConfig.label).toBe('Not Selected');
    expect(rejConfig.kind).toBe('rejected');
    expect(rejConfig.progress).toBe(0);

    const withdrawnStatus: ApplicationStatusDTO = {
      ...rejectedStatus,
      name: 'Candidate Withdrew',
      closeType: 'WITHDRAWN',
    };
    const withConfig = getStatusConfig(withdrawnStatus);
    expect(withConfig.kind).toBe('withdrawn');

    const ghostedStatus: ApplicationStatusDTO = {
      ...rejectedStatus,
      name: 'Ghosted / No Reply',
      closeType: 'NO_RESPONSE',
    };
    const ghostConfig = getStatusConfig(ghostedStatus);
    expect(ghostConfig.kind).toBe('no-response');

    const cancelledStatus: ApplicationStatusDTO = {
      ...rejectedStatus,
      name: 'Hiring Frozen / Cancelled',
      closeType: 'CANCELLED',
    };
    const cancelConfig = getStatusConfig(cancelledStatus);
    expect(cancelConfig.label).toBe('Hiring Frozen / Cancelled');
    expect(cancelConfig.kind).toBe('cancelled');

    const otherStatus: ApplicationStatusDTO = {
      ...rejectedStatus,
      name: 'Archived / Cold',
      closeType: 'OTHER',
    };
    const otherConfig = getStatusConfig(otherStatus);
    expect(otherConfig.label).toBe('Archived / Cold');
    expect(otherConfig.kind).toBe('other');
  });
});
