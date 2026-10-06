import { Link } from 'react-router-dom';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { ApplicationStatus } from '@tracker/types';
import { cn } from '@/lib/cn';

interface PipelineStripProps {
  pipeline: Record<ApplicationStatus, number>;
}

const ACTIVE_STAGES: Array<{ status: ApplicationStatus; label: string }> = [
  { status: 'SAVED', label: 'Saved' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'INTERVIEWING', label: 'Interviewing' },
  { status: 'OFFER', label: 'Offer' },
  { status: 'ACCEPTED', label: 'Accepted' },
];

export function PipelineStrip({ pipeline }: PipelineStripProps) {
  const rejectedCount = pipeline['REJECTED'] || 0;
  const withdrawnCount = pipeline['WITHDRAWN'] || 0;
  const noResponseCount = pipeline['NO_RESPONSE'] || 0;

  return (
    <section aria-labelledby="h-pipe">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="h-pipe" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Pipeline
        </h2>
        <Link
          to="/applications?view=pipeline"
          className="text-[13px] text-muted-foreground hover:text-foreground hover:underline no-underline"
        >
          Open board
        </Link>
      </div>

      {/* Active Pipeline: 5 Columns */}
      <div className="grid grid-cols-5 max-[719px]:grid-cols-3 max-[719px]:gap-y-5">
        {ACTIVE_STAGES.map(({ status, label }) => {
          const count = pipeline[status] || 0;
          const isZero = count === 0;

          return (
            <Link
              key={status}
              to={`/applications?status=${status}`}
              className={cn(
                'flex flex-col gap-1.5 items-start pr-2 py-0.5 no-underline group',
                isZero && 'opacity-65 hover:opacity-100 transition-opacity'
              )}
            >
              <StageRing status={status} size={22} />
              <div
                className={cn(
                  'font-display font-semibold text-[24px] leading-[28px] tracking-tight transition-colors',
                  isZero ? 'text-muted-foreground font-medium' : 'text-foreground group-hover:text-primary'
                )}
              >
                {count}
              </div>
              <div className="text-[12px] leading-[15px] text-muted-foreground">
                {label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Closed Outcomes Strip */}
      <div className="flex gap-6 flex-wrap mt-4 pt-3.5 border-t border-border text-[13px] font-sans">
        <Link
          to="/applications?status=REJECTED"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground no-underline"
        >
          <StageRing status="REJECTED" size={16} />
          <span className="text-foreground font-semibold">{rejectedCount}</span>
          <span>Rejected</span>
        </Link>

        <Link
          to="/applications?status=WITHDRAWN"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground no-underline"
        >
          <StageRing status="WITHDRAWN" size={16} />
          <span className="text-foreground font-semibold">{withdrawnCount}</span>
          <span>Withdrawn</span>
        </Link>

        <Link
          to="/applications?status=NO_RESPONSE"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground no-underline"
        >
          <StageRing status="NO_RESPONSE" size={16} />
          <span className="text-foreground font-semibold">{noResponseCount}</span>
          <span>No response</span>
        </Link>
      </div>
    </section>
  );
}
