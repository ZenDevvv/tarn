import type { CoverLetterDTO, ResumeWithDetailsDTO } from '@tracker/types';

/**
 * Revision labels are only meaningful within an application. A resume carries a revision
 * because it was generated against one job description; a manual upload belongs to no lineage
 * and showing "r1" on it would imply an attempt sequence that does not exist.
 */
export interface AttemptDisplay {
  showRevision: boolean;
  revisionLabel: string | null;
  isCanonical: boolean;
}

export function describeResumeAttempt(resume: ResumeWithDetailsDTO): AttemptDisplay {
  const hasLineage = Boolean(resume.applicationId) && resume.revision > 0;
  return {
    showRevision: hasLineage,
    revisionLabel: hasLineage ? `r${resume.revision}` : null,
    isCanonical: Boolean(resume.isCanonical),
  };
}

export interface ResumeGroup {
  key: string | null;
  resumes: ResumeWithDetailsDTO[];
}

/**
 * Group attempts under the application that produced them, in lineage order. Manual uploads
 * share a single ungrouped bucket keyed by null.
 */
export function groupResumesByApplication(resumes: ResumeWithDetailsDTO[]): ResumeGroup[] {
  const groups = new Map<string | null, ResumeWithDetailsDTO[]>();

  resumes.forEach((resume) => {
    const key = resume.applicationId ?? null;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(resume);
    } else {
      groups.set(key, [resume]);
    }
  });

  return Array.from(groups.entries()).map(([key, bucket]) => ({
    key,
    resumes: key === null ? bucket : [...bucket].sort((a, b) => a.revision - b.revision),
  }));
}
/**
 * Cover letters carry the same lineage shape as resumes, so the display rules are shared.
 * A standalone letter (no application) has no lineage and shows nothing.
 */
export function describeLetterAttempt(letter: CoverLetterDTO): AttemptDisplay {
  const hasLineage = Boolean(letter.applicationId) && letter.revision > 0;
  return {
    showRevision: hasLineage,
    revisionLabel: hasLineage ? `r${letter.revision}` : null,
    isCanonical: Boolean(letter.isCanonical),
  };
}
