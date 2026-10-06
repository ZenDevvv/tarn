import { Link } from 'react-router-dom';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { PipelineSummaryDTO, ApplicationStatusDTO } from '@tracker/types';
import { cn } from '@/lib/cn';

interface PipelineStripProps {
  pipeline?: PipelineSummaryDTO | Record<string, number>;
}

const DEFAULT_ACTIVE_STAGES: Array<{ name: string; order: number }> = [
  { name: 'Saved', order: 0 },
  { name: 'Applied', order: 1 },
  { name: 'Interviewing', order: 2 },
  { name: 'Offer', order: 3 },
  { name: 'Accepted', order: 4 },
];

const DEFAULT_CLOSED_OUTCOMES: Array<{ name: string; closeType: 'REJECTED' | 'WITHDRAWN' | 'NO_RESPONSE' }> = [
  { name: 'Rejected', closeType: 'REJECTED' },
  { name: 'Withdrawn', closeType: 'WITHDRAWN' },
  { name: 'No response', closeType: 'NO_RESPONSE' },
];

export function PipelineStrip({ pipeline }: PipelineStripProps) {
  // Normalize pipeline data whether it is PipelineSummaryDTO or Record<string, number>
  let activeStages: Array<{ status: ApplicationStatusDTO | { name: string; order: number; closeType: null }; count: number }> = [];
  let closedOutcomes: Array<{ status: ApplicationStatusDTO | { name: string; closeType: 'REJECTED' | 'WITHDRAWN' | 'NO_RESPONSE' }; count: number }> = [];

  if (pipeline && typeof pipeline === 'object' && 'activeStages' in pipeline && Array.isArray((pipeline as any).activeStages)) {
    activeStages = (pipeline as any).activeStages;
    closedOutcomes = (pipeline as any).closedOutcomes || [];
  } else if (pipeline && typeof pipeline === 'object') {
    const record = pipeline as Record<string, number>;
    activeStages = DEFAULT_ACTIVE_STAGES.map((s) => ({
      status: { ...s, closeType: null },
      count: record[s.name.toUpperCase()] ?? record[s.name] ?? 0,
    }));
    closedOutcomes = DEFAULT_CLOSED_OUTCOMES.map((s) => ({
      status: s,
      count: record[s.closeType] ?? record[s.name] ?? 0,
    }));
  } else {
    activeStages = DEFAULT_ACTIVE_STAGES.map((s) => ({
      status: { ...s, closeType: null },
      count: 0,
    }));
    closedOutcomes = DEFAULT_CLOSED_OUTCOMES.map((s) => ({
      status: s,
      count: 0,
    }));
  }

  const totalActive = activeStages.length;

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

      {/* Active Pipeline Grid */}
      <div
        className={cn(
          'grid gap-2 max-[719px]:grid-cols-2 max-[719px]:gap-y-5',
          totalActive <= 3 && 'sm:grid-cols-3',
          totalActive === 4 && 'sm:grid-cols-4',
          totalActive === 5 && 'sm:grid-cols-5',
          totalActive === 6 && 'sm:grid-cols-6',
          totalActive > 6 && 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
        )}
      >
        {activeStages.map(({ status, count }) => {
          const isZero = count === 0;
          const statusName = status.name;
          const statusId = 'id' in status ? status.id : undefined;
          const linkTarget = statusId
            ? `/applications?status=${encodeURIComponent(statusName)}`
            : `/applications?status=${encodeURIComponent(statusName.toUpperCase())}`;

          return (
            <Link
              key={statusId || statusName}
              to={linkTarget}
              className={cn(
                'flex flex-col gap-1.5 items-start pr-2 py-0.5 no-underline group',
                isZero && 'opacity-65 hover:opacity-100 transition-opacity'
              )}
            >
              <StageRing status={status as any} size={22} totalStages={totalActive} />
              <div
                className={cn(
                  'font-display font-semibold text-[24px] leading-[28px] tracking-tight transition-colors',
                  isZero ? 'text-muted-foreground font-medium' : 'text-foreground group-hover:text-primary'
                )}
              >
                {count}
              </div>
              <div className="text-[12px] leading-[15px] text-muted-foreground truncate max-w-full">
                {statusName}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Closed Outcomes Strip */}
      {closedOutcomes.length > 0 && (
        <div className="flex gap-6 flex-wrap mt-4 pt-3.5 border-t border-border text-[13px] font-sans">
          {closedOutcomes.map(({ status, count }) => {
            const statusName = status.name;
            const statusId = 'id' in status ? status.id : undefined;
            const linkTarget = statusId
              ? `/applications?status=${encodeURIComponent(statusName)}`
              : `/applications?status=${encodeURIComponent(status.closeType || statusName)}`;

            return (
              <Link
                key={statusId || statusName}
                to={linkTarget}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground no-underline"
              >
                <StageRing status={status as any} size={16} />
                <span className="text-foreground font-semibold">{count}</span>
                <span>{statusName}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
