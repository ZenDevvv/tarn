import type { ApplicationDTO } from '@tracker/types';

export interface SubmissionState {
  /** Whether the user can mark a resume as submitted right now. */
  canSubmit: boolean;
  submitted: boolean;
  submittedResumeId: string | null;
  /** Revision label for the submitted attempt, when it belongs to a lineage. */
  submittedRevisionLabel: string | null;
  submittedAt: string | null;
}

/**
 * The submitted snapshot is deliberately independent of the working copy: regenerating advances
 * the resume but must never move what the employer already received, so the displayed submission
 * is read from submittedResume rather than resume.
 */
export function describeSubmission(application: ApplicationDTO): SubmissionState {
  const submittedResume = application.submittedResume ?? null;
  const submitted = Boolean(application.submittedResumeId);

  return {
    canSubmit: !submitted && Boolean(application.resumeId),
    submitted,
    submittedResumeId: application.submittedResumeId ?? null,
    submittedRevisionLabel:
      submittedResume?.applicationId && submittedResume.revision > 0
        ? `r${submittedResume.revision}`
        : null,
    submittedAt: application.submittedAt ?? null,
  };
}