import { describe, it, expect } from 'vitest';
import type { ApplicationDTO } from '@tracker/types';
import { describeSubmission } from './submission-display';

const resume = (id: string, revision: number) =>
  ({ id, name: `Resume r${revision}`, applicationId: 'a1', revision, isCanonical: false }) as any;

const app = (over: Partial<ApplicationDTO>) =>
  ({ id: 'a1', resumeId: null, submittedResumeId: null, submittedAt: null, ...over }) as ApplicationDTO;

describe('describeSubmission', () => {
  it('offers the action when a resume exists and none is submitted', () => {
    const state = describeSubmission(app({ resumeId: resume('r3', 3).id }));
    expect(state.canSubmit).toBe(true);
    expect(state.submitted).toBe(false);
    expect(state.submittedResumeId).toBeNull();
  });

  it('reports the submitted attempt and freezes it', () => {
    const submitted = resume('r2', 2);
    const state = describeSubmission(
      app({
        resumeId: resume('r3', 3).id,
        submittedResumeId: submitted.id,
        submittedResume: submitted,
        submittedAt: '2026-10-10T00:00:00.000Z',
      })
    );
    expect(state.canSubmit).toBe(false);
    expect(state.submitted).toBe(true);
    expect(state.submittedResumeId).toBe('r2');
    expect(state.submittedRevisionLabel).toBe('r2');
    expect(state.submittedAt).toBe('2026-10-10T00:00:00.000Z');
  });

  it('does not offer the action when there is no resume at all', () => {
    expect(describeSubmission(app({})).canSubmit).toBe(false);
  });

  it('keeps showing the submitted snapshot even when no resume is currently generated', () => {
    const submitted = resume('r1', 1);
    const state = describeSubmission(
      app({ submittedResumeId: submitted.id, submittedResume: submitted })
    );
    expect(state.submitted).toBe(true);
    expect(state.submittedRevisionLabel).toBe('r1');
  });

  it('handles a manual resume with no lineage', () => {
    const manual = { id: 'm1', name: 'Manual', applicationId: null, revision: 1 } as any;
    const state = describeSubmission(app({ resumeId: manual.id, submittedResume: manual, submittedResumeId: manual.id }));
    expect(state.submitted).toBe(true);
    expect(state.submittedRevisionLabel).toBeNull();
  });
});