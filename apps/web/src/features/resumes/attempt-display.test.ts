import { describe, it, expect } from 'vitest';
import type { ResumeWithDetailsDTO } from '@tracker/types';
import {
  describeResumeAttempt,
  describeLetterAttempt,
  groupResumesByApplication,
} from './attempt-display';

const base = {
  id: 'r1',
  userId: 'u1',
  name: 'Resume - Acme (Backend Engineer)',
  targetRole: 'Backend Engineer',
  fileUrl: null,
  filename: null,
  fileSize: null,
  mimeType: 'application/pdf',
  isDefault: false,
  skills: [],
  notes: null,
  isTailored: true,
  matchScore: 71,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  applicationsCount: 0,
  applications: [],
} as unknown as ResumeWithDetailsDTO;

describe('describeResumeAttempt', () => {
  it('labels a tailored attempt with its revision number', () => {
    const label = describeResumeAttempt({ ...base, applicationId: 'a1', revision: 3 });
    expect(label).toEqual({ showRevision: true, revisionLabel: 'r3', isCanonical: false });
  });

  it('marks the canonical attempt', () => {
    const label = describeResumeAttempt({
      ...base,
      applicationId: 'a1',
      revision: 1,
      isCanonical: true,
    });
    expect(label.isCanonical).toBe(true);
  });

  it('shows no revision for a manual upload', () => {
    const label = describeResumeAttempt({
      ...base,
      applicationId: null,
      revision: 1,
      isTailored: false,
      matchScore: null,
    });
    expect(label.showRevision).toBe(false);
    expect(label.revisionLabel).toBeNull();
  });

  it('never shows a revision for a tailored resume that is not tied to an application', () => {
    const label = describeResumeAttempt({ ...base, applicationId: null, revision: 7 });
    expect(label.showRevision).toBe(false);
  });
});

describe('groupResumesByApplication', () => {
  const r = (id: string, applicationId: string | null, revision: number) =>
    ({ ...base, id, applicationId, revision }) as ResumeWithDetailsDTO;

  it('groups attempts of one application in revision order', () => {
    const groups = groupResumesByApplication([
      r('r3', 'a1', 3),
      r('r1', 'a1', 1),
      r('r2', 'a1', 2),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('a1');
    expect(groups[0].resumes.map((x) => x.revision)).toEqual([1, 2, 3]);
  });

  it('keeps separate applications apart', () => {
    const groups = groupResumesByApplication([r('x', 'a1', 1), r('y', 'a2', 1)]);
    expect(groups).toHaveLength(2);
  });

  it('groups manual uploads together as ungrouped', () => {
    const groups = groupResumesByApplication([r('m1', null, 1), r('m2', null, 1)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBeNull();
    expect(groups[0].resumes).toHaveLength(2);
  });

  it('returns an empty list for no input', () => {
    expect(groupResumesByApplication([])).toEqual([]);
  });
});
describe('describeLetterAttempt', () => {
  const letter = (over: Record<string, unknown>) =>
    ({ id: 'l1', name: 'Letter', content: 'x', echoedPhrases: [], ...over }) as any;

  it('labels a letter tied to an application with its revision', () => {
    const label = describeLetterAttempt(letter({ applicationId: 'a1', revision: 2, isCanonical: false }));
    expect(label).toEqual({ showRevision: true, revisionLabel: 'r2', isCanonical: false });
  });

  it('marks the canonical letter', () => {
    expect(describeLetterAttempt(letter({ applicationId: 'a1', revision: 1, isCanonical: true })).isCanonical).toBe(true);
  });

  it('shows nothing for a standalone letter', () => {
    const label = describeLetterAttempt(letter({ applicationId: null, revision: 1 }));
    expect(label.showRevision).toBe(false);
  });
});
