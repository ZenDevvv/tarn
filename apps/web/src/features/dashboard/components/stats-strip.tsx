import { DashboardSummaryDTO } from '@tracker/types';

interface StatsStripProps {
  summary: DashboardSummaryDTO;
}

export function StatsStrip({ summary }: StatsStripProps) {
  return (
    <section className="grid grid-cols-4 max-[719px]:grid-cols-2 border-y border-border" aria-label="Summary">
      {/* 1. Active applications */}
      <div className="py-5 pl-0 pr-4">
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground">
          {summary.activeApplications}
        </div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Active applications</div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.activeDeltaNote}
        </div>
      </div>

      {/* 2. Interviews */}
      <div className="py-5 pl-4 sm:pl-6 pr-4 border-l border-border">
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground">
          {summary.interviewCount}
        </div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Interviews</div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.interviewDeltaNote}
        </div>
      </div>

      {/* 3. Follow-ups due */}
      <div className="py-5 pl-0 sm:pl-6 pr-4 max-[719px]:border-t border-border sm:border-l">
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground">
          {summary.followUpsDue}
        </div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Follow-ups due</div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.followUpsOverdueCount > 0
            ? `Includes ${summary.followUpsOverdueCount} overdue`
            : 'None overdue'}
        </div>
      </div>

      {/* 4. Applied this week */}
      <div className="py-5 pl-4 sm:pl-6 pr-0 max-[719px]:border-t border-l border-border">
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground">
          {summary.appliedThisWeek}
        </div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Applied this week</div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.appliedThisMonth} this month
        </div>
      </div>
    </section>
  );
}
