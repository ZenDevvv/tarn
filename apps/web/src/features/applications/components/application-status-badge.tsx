import { cn } from '@/lib/cn';
import { ApplicationStatus } from '@tracker/types';

type RingKind = 'progress' | 'done' | 'rejected' | 'withdrawn' | 'no-response';

export interface StatusConfig {
  label: string;
  kind: RingKind;
  /** 0 to 1 fill for progress rings */
  progress: number;
}

// Order here is the Kanban column order for the active pipeline.
export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  SAVED:        { label: 'Saved',        kind: 'progress',    progress: 0 },
  APPLIED:      { label: 'Applied',      kind: 'progress',    progress: 1 / 4 },
  INTERVIEWING: { label: 'Interviewing', kind: 'progress',    progress: 2 / 4 },
  OFFER:        { label: 'Offer',        kind: 'progress',    progress: 3 / 4 },
  ACCEPTED:     { label: 'Accepted',     kind: 'done',        progress: 1 },
  REJECTED:     { label: 'Rejected',     kind: 'rejected',    progress: 0 },
  WITHDRAWN:    { label: 'Withdrawn',    kind: 'withdrawn',   progress: 0 },
  NO_RESPONSE:  { label: 'No response',  kind: 'no-response', progress: 0 },
};

const kindColor: Record<RingKind, string> = {
  progress: 'text-stage-active',
  done: 'text-stage-active',
  rejected: 'text-stage-rejected',
  withdrawn: 'text-stage-closed',
  'no-response': 'text-stage-closed',
};

// Pie geometry: r=2.25 with a 4.5 stroke paints a disc of radius 4.5,
// leaving a 1.25 gap inside the 1.5px outer ring.
const PIE_R = 2.25;
const PIE_C = 2 * Math.PI * PIE_R;

export function StageRing({
  status,
  size = 16,
  className,
}: {
  status: ApplicationStatus;
  size?: number;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    kind: 'progress' as RingKind,
    progress: 0,
  };
  const { kind, progress } = config;

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', kindColor[kind], className)}
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeWidth={kind === 'no-response' ? 1.8 : 1.5}
        strokeLinecap="round"
        strokeDasharray={
          kind === 'withdrawn' ? '3 2.4' : kind === 'no-response' ? '0.01 3.4' : undefined
        }
      />

      {(kind === 'progress' || kind === 'done') && progress > 0 && (
        <circle
          cx="8"
          cy="8"
          r={PIE_R}
          stroke="currentColor"
          strokeWidth={PIE_R * 2}
          strokeDasharray={`${progress * PIE_C} ${PIE_C}`}
          transform="rotate(-90 8 8)"
        />
      )}

      {kind === 'done' && <circle cx="8" cy="8" r="1.5" fill="var(--marker)" />}

      {kind === 'rejected' && (
        <path
          d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] || { label: status };

  return (
    <span className={cn('inline-flex items-center gap-2 text-small font-medium', className)}>
      <StageRing status={status} />
      {config.label}
    </span>
  );
}
