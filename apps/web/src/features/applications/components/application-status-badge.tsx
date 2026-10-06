import { cn } from '@/lib/cn';
import { ApplicationStatus, ApplicationStatusDTO, CloseType } from '@tracker/types';

export type RingKind =
  | 'progress'
  | 'done'
  | 'rejected'
  | 'withdrawn'
  | 'no-response'
  | 'cancelled'
  | 'other';

export interface StatusConfig {
  label: string;
  kind: RingKind;
  /** 0 to 1 fill for progress rings */
  progress: number;
}

export type StatusInput =
  | ApplicationStatus
  | ApplicationStatusDTO
  | { name?: string; order?: number | null; closeType?: CloseType | null };

// Fallback configuration for standard default names and backward compatibility
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  SAVED:        { label: 'Saved',        kind: 'progress',    progress: 0 },
  APPLIED:      { label: 'Applied',      kind: 'progress',    progress: 1 / 4 },
  INTERVIEWING: { label: 'Interviewing', kind: 'progress',    progress: 2 / 4 },
  OFFER:        { label: 'Offer',        kind: 'progress',    progress: 3 / 4 },
  ACCEPTED:     { label: 'Accepted',     kind: 'done',        progress: 1 },
  REJECTED:     { label: 'Rejected',     kind: 'rejected',    progress: 0 },
  WITHDRAWN:    { label: 'Withdrawn',    kind: 'withdrawn',   progress: 0 },
  NO_RESPONSE:  { label: 'No response',  kind: 'no-response', progress: 0 },
  CANCELLED:    { label: 'Cancelled',    kind: 'cancelled',   progress: 0 },
  OTHER:        { label: 'Closed',       kind: 'other',       progress: 0 },
};

export function getStatusConfig(status: StatusInput, totalStages = 5): StatusConfig {
  if (typeof status === 'string') {
    if (STATUS_CONFIG[status]) {
      return STATUS_CONFIG[status];
    }
    const upper = status.toUpperCase().replace(/\s+/g, '_');
    if (STATUS_CONFIG[upper]) {
      return STATUS_CONFIG[upper];
    }
    return {
      label: status,
      kind: 'progress',
      progress: 0,
    };
  }

  if (typeof status === 'object' && status !== null) {
    const label = status.name || 'Unknown';
    if (status.closeType === 'REJECTED') {
      return { label, kind: 'rejected', progress: 0 };
    }
    if (status.closeType === 'WITHDRAWN') {
      return { label, kind: 'withdrawn', progress: 0 };
    }
    if (status.closeType === 'NO_RESPONSE') {
      return { label, kind: 'no-response', progress: 0 };
    }
    if (status.closeType === 'CANCELLED') {
      return { label, kind: 'cancelled', progress: 0 };
    }
    if (status.closeType === 'OTHER') {
      return { label, kind: 'other', progress: 0 };
    }

    const order = typeof status.order === 'number' ? status.order : 0;
    const denominator = Math.max(1, totalStages - 1);
    const progress = Math.max(0, Math.min(1, order / denominator));
    const isDone = order >= denominator;

    return {
      label,
      kind: isDone ? 'done' : 'progress',
      progress,
    };
  }

  return {
    label: 'Unknown',
    kind: 'progress',
    progress: 0,
  };
}

const kindColor: Record<RingKind, string> = {
  progress: 'text-stage-active',
  done: 'text-stage-active',
  rejected: 'text-stage-rejected',
  withdrawn: 'text-stage-closed',
  'no-response': 'text-stage-closed',
  cancelled: 'text-stage-closed',
  other: 'text-stage-closed',
};

// Pie geometry: r=2.25 with a 4.5 stroke paints a disc of radius 4.5,
// leaving a 1.25 gap inside the 1.5px outer ring.
const PIE_R = 2.25;
const PIE_C = 2 * Math.PI * PIE_R;

export function StageRing({
  status,
  size = 16,
  totalStages,
  className,
}: {
  status: StatusInput;
  size?: number;
  totalStages?: number;
  className?: string;
}) {
  const config = getStatusConfig(status, totalStages);
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

      {kind === 'cancelled' && (
        <path
          d="M4.25 11.75L11.75 4.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}

      {kind === 'other' && (
        <path
          d="M4.5 8H11.5"
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
  size,
  totalStages,
  className,
}: {
  status: StatusInput;
  size?: number;
  totalStages?: number;
  className?: string;
}) {
  const config = getStatusConfig(status, totalStages);

  return (
    <span className={cn('inline-flex items-center gap-2 text-small font-medium', className)}>
      <StageRing status={status} size={size} totalStages={totalStages} />
      {config.label}
    </span>
  );
}
