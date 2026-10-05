import { AnalyticsKpiDTO } from '@tracker/types';
import { Send, MessageSquare, Calendar, Award } from 'lucide-react';

interface AnalyticsKpiStripProps {
  kpis: AnalyticsKpiDTO;
}

export function AnalyticsKpiStrip({ kpis }: AnalyticsKpiDTO & { kpis?: AnalyticsKpiDTO } extends any ? any : any) {
  // Safe extraction
  const data: AnalyticsKpiDTO = (kpis as any)?.kpis || kpis;

  const {
    totalApplications = 0,
    activeApplications = 0,
    closedApplications = 0,
    responseCount = 0,
    responseRate = 0,
    interviewCount = 0,
    interviewRate = 0,
    offerCount = 0,
    offerRate = 0,
  } = data || {};

  return (
    <section
      className="grid grid-cols-4 max-[1023px]:grid-cols-2 max-[639px]:grid-cols-1 border-y border-border divide-x max-[1023px]:divide-x-0 divide-border"
      aria-label="Key Performance Indicators"
    >
      {/* 1. Total Applications */}
      <div className="py-5 pr-5 max-[1023px]:pb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium font-sans">
            Total applications
          </span>
          <div className="p-1.5 rounded-md bg-secondary text-muted-foreground">
            <Send size={15} strokeWidth={1.5} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[38px] leading-tight text-foreground tracking-tight">
          {totalApplications}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1.5 font-sans">
          {activeApplications} active · {closedApplications} closed
        </p>
      </div>

      {/* 2. Response Rate */}
      <div className="py-5 px-5 max-[1023px]:pl-0 max-[1023px]:pr-5 max-[1023px]:border-l-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium font-sans">
            Response rate
          </span>
          <div className="p-1.5 rounded-md bg-secondary text-muted-foreground">
            <MessageSquare size={15} strokeWidth={1.5} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[38px] leading-tight text-foreground tracking-tight">
          {responseRate}%
        </div>
        <p className="text-[12px] text-muted-foreground mt-1.5 font-sans">
          {responseCount} of {totalApplications} yielded replies
        </p>
      </div>

      {/* 3. Interview Conversion */}
      <div className="py-5 px-5 max-[1023px]:pl-0 max-[1023px]:border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium font-sans">
            Interview rate
          </span>
          <div className="p-1.5 rounded-md bg-secondary text-muted-foreground">
            <Calendar size={15} strokeWidth={1.5} />
          </div>
        </div>
        <div className="font-display font-semibold text-[32px] sm:text-[38px] leading-tight text-foreground tracking-tight">
          {interviewRate}%
        </div>
        <p className="text-[12px] text-muted-foreground mt-1.5 font-sans">
          {interviewCount} {interviewCount === 1 ? 'role' : 'roles'} reached interview stage
        </p>
      </div>

      {/* 4. Offer Conversion */}
      <div className="py-5 pl-5 max-[1023px]:pl-0 max-[1023px]:border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-muted-foreground font-medium font-sans">
            Offer rate
          </span>
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Award size={15} strokeWidth={1.5} />
          </div>
        </div>
        <div className="flex items-baseline gap-2.5">
          <div className="font-display font-semibold text-[32px] sm:text-[38px] leading-tight text-foreground tracking-tight">
            {offerRate}%
          </div>
          {offerCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold bg-[var(--marker)] text-[var(--marker-foreground)]">
              {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1.5 font-sans">
          {offerCount === 0 ? 'No offers received yet' : `${offerCount} final decision extended`}
        </p>
      </div>
    </section>
  );
}
