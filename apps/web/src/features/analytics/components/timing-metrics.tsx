import { TimingMetricsDTO } from '@tracker/types';
import { Clock, CalendarCheck, CheckCircle2 } from 'lucide-react';

interface TimingMetricsProps {
  timing: TimingMetricsDTO;
}

export function TimingMetrics({ timing }: TimingMetricsProps) {
  const { avgDaysToResponse, avgDaysToInterview, avgDaysToRejection } = timing || {};

  return (
    <section className="flex flex-col gap-3" aria-labelledby="h-timing">
      <div>
        <h2 id="h-timing" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Cycle velocity & timing
        </h2>
        <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
          Empirical turnaround time from submission to milestones.
        </p>
      </div>

      <div className="grid grid-cols-3 max-[639px]:grid-cols-1 gap-4">
        {/* 1. Time to Response */}
        <div className="p-4 rounded-lg bg-card border border-border flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium font-sans">Time to response</span>
            <Clock size={15} strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-[28px] text-foreground tracking-tight">
              {avgDaysToResponse !== null ? `${avgDaysToResponse}d` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-sans">
              Average days to initial reply or status movement
            </p>
          </div>
        </div>

        {/* 2. Time to Interview */}
        <div className="p-4 rounded-lg bg-card border border-border flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium font-sans">Time to interview</span>
            <CalendarCheck size={15} strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-[28px] text-foreground tracking-tight">
              {avgDaysToInterview !== null ? `${avgDaysToInterview}d` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-sans">
              Average days to first scheduled conversation
            </p>
          </div>
        </div>

        {/* 3. Time to Rejection / Resolution */}
        <div className="p-4 rounded-lg bg-card border border-border flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[12px] font-medium font-sans">Time to closure</span>
            <CheckCircle2 size={15} strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-[28px] text-foreground tracking-tight">
              {avgDaysToRejection !== null ? `${avgDaysToRejection}d` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-sans">
              Average turnaround on closed positions
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
