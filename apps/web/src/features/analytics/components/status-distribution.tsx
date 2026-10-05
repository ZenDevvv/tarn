import { Link } from 'react-router-dom';
import { StatusDistributionDTO, ApplicationStatus } from '@tracker/types';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { cn } from '@/lib/cn';

interface StatusDistributionProps {
  distribution: StatusDistributionDTO[];
}

const STAGE_LABELS: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  APPLICATION_VIEWED: 'Viewed',
  RECRUITER_CONTACTED: 'Contacted',
  HR_INTERVIEW: 'HR round',
  TECHNICAL_INTERVIEW: 'Tech round',
  FINAL_INTERVIEW: 'Final round',
  OFFER: 'Offer',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  NO_RESPONSE: 'No response',
};

export function StatusDistribution({ distribution }: StatusDistributionProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="h-status-dist">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="h-status-dist" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
            Stage distribution
          </h2>
          <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
            Full inventory across all 12 pipeline stages.
          </p>
        </div>
        <Link
          to="/applications"
          className="text-[13px] text-muted-foreground hover:text-foreground hover:underline no-underline font-sans"
        >
          View all applications
        </Link>
      </div>

      <div className="grid grid-cols-6 max-[1023px]:grid-cols-4 max-[639px]:grid-cols-2 gap-3">
        {distribution.map(({ status, count, percentage }) => {
          const isZero = count === 0;
          const label = STAGE_LABELS[status] || status;

          return (
            <Link
              key={status}
              to={`/applications?status=${status}`}
              className={cn(
                'p-3.5 rounded-lg bg-card border border-border flex flex-col justify-between gap-2.5 no-underline transition-all group',
                isZero
                  ? 'opacity-60 hover:opacity-100'
                  : 'hover:border-foreground/30 hover:shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <StageRing status={status} size={20} />
                <span className="text-[11px] text-muted-foreground font-sans">
                  {percentage}%
                </span>
              </div>

              <div>
                <div className="font-display font-semibold text-[22px] leading-tight text-foreground group-hover:text-primary transition-colors">
                  {count}
                </div>
                <div className="text-[12px] text-muted-foreground font-sans truncate mt-0.5">
                  {label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
