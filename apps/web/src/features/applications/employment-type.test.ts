import { describe, it, expect } from 'vitest';
import {
  formatEmploymentType,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  formatWorkSetup,
  WORK_SETUP_LABELS,
  WORK_SETUP_OPTIONS,
  EmploymentType,
  WorkSetup,
} from '@tracker/types';

describe('Employment Type Mapper & Formatter', () => {
  it('maps all EmploymentType enum values to user-friendly labels', () => {
    expect(formatEmploymentType('FULL_TIME')).toBe('Full-time');
    expect(formatEmploymentType('PART_TIME')).toBe('Part-time');
    expect(formatEmploymentType('CONTRACT')).toBe('Contract');
    expect(formatEmploymentType('FREELANCE')).toBe('Freelance');
    expect(formatEmploymentType('INTERNSHIP')).toBe('Internship');
  });

  it('handles null, undefined, and empty string with default fallback "Not specified"', () => {
    expect(formatEmploymentType(null)).toBe('Not specified');
    expect(formatEmploymentType(undefined)).toBe('Not specified');
    expect(formatEmploymentType('')).toBe('Not specified');
  });

  it('respects a custom fallback when provided', () => {
    expect(formatEmploymentType(null, 'Full-time')).toBe('Full-time');
    expect(formatEmploymentType(undefined, '—')).toBe('—');
    expect(formatEmploymentType('', 'N/A')).toBe('N/A');
  });

  it('returns unmapped string values as-is when not in enum', () => {
    expect(formatEmploymentType('CUSTOM_TYPE' as any)).toBe('CUSTOM_TYPE');
  });

  it('provides a complete EMPLOYMENT_TYPE_LABELS record', () => {
    const expectedKeys: EmploymentType[] = [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACT',
      'FREELANCE',
      'INTERNSHIP',
    ];
    for (const key of expectedKeys) {
      expect(EMPLOYMENT_TYPE_LABELS[key]).toBeDefined();
      expect(typeof EMPLOYMENT_TYPE_LABELS[key]).toBe('string');
    }
  });

  it('provides EMPLOYMENT_TYPE_OPTIONS suitable for dropdown selectors', () => {
    expect(EMPLOYMENT_TYPE_OPTIONS).toHaveLength(6);
    expect(EMPLOYMENT_TYPE_OPTIONS[0]).toEqual({ value: '', label: 'Not specified' });
    expect(EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === 'FULL_TIME')?.label).toBe('Full-time');
    expect(EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === 'PART_TIME')?.label).toBe('Part-time');
    expect(EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === 'CONTRACT')?.label).toBe('Contract');
    expect(EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === 'FREELANCE')?.label).toBe('Freelance');
    expect(EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === 'INTERNSHIP')?.label).toBe('Internship');
  });
});

describe('Work Setup Mapper & Formatter', () => {
  it('maps all WorkSetup enum values to user-friendly labels', () => {
    expect(formatWorkSetup('REMOTE')).toBe('Remote');
    expect(formatWorkSetup('HYBRID')).toBe('Hybrid');
    expect(formatWorkSetup('ONSITE')).toBe('Onsite');
  });

  it('handles null, undefined, and empty string with default and custom fallbacks', () => {
    expect(formatWorkSetup(null)).toBe('Not specified');
    expect(formatWorkSetup(undefined)).toBe('Not specified');
    expect(formatWorkSetup('', '—')).toBe('—');
  });

  it('provides WORK_SETUP_OPTIONS suitable for dropdown selectors', () => {
    expect(WORK_SETUP_OPTIONS).toHaveLength(4);
    expect(WORK_SETUP_OPTIONS[0]).toEqual({ value: '', label: 'Not specified' });
    expect(WORK_SETUP_OPTIONS.find((o) => o.value === 'REMOTE')?.label).toBe('Remote');
    expect(WORK_SETUP_OPTIONS.find((o) => o.value === 'HYBRID')?.label).toBe('Hybrid');
    expect(WORK_SETUP_OPTIONS.find((o) => o.value === 'ONSITE')?.label).toBe('Onsite');
  });
});
