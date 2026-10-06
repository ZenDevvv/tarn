import { describe, it, expect } from 'vitest';
import { STATUS_CONFIG } from './application-status-badge';
import { ApplicationStatus } from '@tracker/types';

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
});
