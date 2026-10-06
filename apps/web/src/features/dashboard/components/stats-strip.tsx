import { DashboardSummaryDTO } from '@tracker/types';
import { Briefcase, Calendar, Bell, Send } from 'lucide-react';
import { useInView, useCountUp } from '@/hooks';

interface StatsStripProps {
  summary: DashboardSummaryDTO;
}

export function StatsStrip({ summary }: StatsStripProps) {
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.15, triggerOnce: true });

  const activeApps = useCountUp(summary.activeApplications, { isInView, duration: 1000 });
  const interviews = useCountUp(summary.interviewCount, { isInView, duration: 1000 });
  const followUps = useCountUp(summary.followUpsDue, { isInView, duration: 1000 });
  const appliedWeek = useCountUp(summary.appliedThisWeek, { isInView, duration: 1000 });

  return (
    <section
      ref={ref}
      className="grid grid-cols-4 max-[719px]:grid-cols-2 border-y border-border"
      aria-label="Summary"
    >
      {/* 1. Active applications */}
      <div
        className="py-5 pl-0 pr-4 transition-all duration-500 ease-out"
        style={{
          opacity: isInView ? 1 : 0.4,
          transform: isInView ? 'translateY(0)' : 'translateY(4px)',
          transitionDelay: '0ms',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium">Active applications</span>
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Briefcase size={16} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground tabular-nums">
          {activeApps}
        </div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.activeDeltaNote}
        </div>
      </div>

      {/* 2. Interviews */}
      <div
        className="py-5 pl-4 sm:pl-6 pr-4 border-l border-border transition-all duration-500 ease-out"
        style={{
          opacity: isInView ? 1 : 0.4,
          transform: isInView ? 'translateY(0)' : 'translateY(4px)',
          transitionDelay: '70ms',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium">Interviews</span>
          <div className="p-1.5 rounded-md bg-secondary text-foreground">
            <Calendar size={16} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground tabular-nums">
          {interviews}
        </div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.interviewDeltaNote}
        </div>
      </div>

      {/* 3. Follow-ups due */}
      <div
        className="py-5 pl-0 sm:pl-6 pr-4 max-[719px]:border-t border-border sm:border-l transition-all duration-500 ease-out"
        style={{
          opacity: isInView ? 1 : 0.4,
          transform: isInView ? 'translateY(0)' : 'translateY(4px)',
          transitionDelay: '140ms',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium">Follow-ups due</span>
          <div className="p-1.5 rounded-md bg-secondary text-foreground">
            <Bell size={16} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground tabular-nums">
          {followUps}
        </div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.followUpsOverdueCount > 0
            ? `Includes ${summary.followUpsOverdueCount} overdue`
            : 'None overdue'}
        </div>
      </div>

      {/* 4. Applied this week */}
      <div
        className="py-5 pl-4 sm:pl-6 pr-0 max-[719px]:border-t border-l border-border transition-all duration-500 ease-out"
        style={{
          opacity: isInView ? 1 : 0.4,
          transform: isInView ? 'translateY(0)' : 'translateY(4px)',
          transitionDelay: '210ms',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium">Applied this week</span>
          <div className="p-1.5 rounded-md bg-secondary text-foreground">
            <Send size={16} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground tabular-nums">
          {appliedWeek}
        </div>
        <div className="text-[12px] leading-[16px] text-muted-foreground mt-1.5">
          {summary.appliedThisMonth} this month
        </div>
      </div>
    </section>
  );
}
