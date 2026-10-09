import { describe, it, expect } from 'vitest';
import { ApiError, toErrorMessage } from './api-client';

describe('toErrorMessage — field-level error surfacing (D5)', () => {
  const fieldDetails = [
    { field: 'workExperience.1.company', message: 'Required' },
    { field: 'basics.name', message: 'Name is required' },
  ];

  it('renders field: message lines when ApiError carries details', () => {
    const err = new ApiError('Invalid request data', 'VALIDATION_ERROR', fieldDetails);

    expect(toErrorMessage(err, 'Fallback')).toBe(
      'Invalid request data\nworkExperience.1.company: Required\nbasics.name: Name is required'
    );
  });

  it('falls back to err.message alone when there are no details', () => {
    const err = new ApiError('Request failed with status 500', 'INTERNAL_SERVER_ERROR');

    expect(toErrorMessage(err, 'Fallback')).toBe('Request failed with status 500');
  });

  it('falls back to the provided default for a non-ApiError with no message', () => {
    expect(toErrorMessage(new Error(''), 'Failed to save application')).toBe(
      'Failed to save application'
    );
  });

  it('surfaces details even when the top-level message is generic', () => {
    // This is the actual reported bug: the user saw only "Invalid request data".
    const err = new ApiError('Invalid request data', 'VALIDATION_ERROR', fieldDetails);

    expect(toErrorMessage(err, 'x')).toContain('workExperience.1.company');
  });

  it('ignores legacy axios-style err.response shapes without throwing', () => {
    const legacy = Object.assign(new Error('boom'), {
      response: { data: { message: 'legacy message' } },
    });

    expect(toErrorMessage(legacy, 'Fallback')).toBe('boom');
  });

  it('tolerates details entries missing a field name', () => {
    const err = new ApiError('Bad', 'VALIDATION_ERROR', [{ message: 'Something wrong' }]);

    expect(toErrorMessage(err, 'x')).toContain('Something wrong');
  });

  it('skips empty detail messages rather than rendering blank lines', () => {
    const err = new ApiError('Bad', 'VALIDATION_ERROR', [
      { field: 'a.b', message: '' },
      { field: 'c.d', message: 'Real problem' },
    ]);

    const out = toErrorMessage(err, 'x');

    expect(out).toBe('Bad\nc.d: Real problem');
    expect(out).not.toContain('\n\n');
  });
});
