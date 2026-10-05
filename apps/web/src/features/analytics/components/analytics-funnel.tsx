import { FunnelStageDTO } from '@tracker/types';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AnalyticsFunnelProps {
  funnel: FunnelStageDTO[];
}

export function AnalyticsFunnel({ funnel }: AnalyticsFunnelProps) {
  const maxCount = Math.max(...funnel.map((s) => s.count), 1);

  return (
    <section className="flex flex-col gap-4 w-full" aria-labelledby="h-funnel">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2
            id="h-funnel"
            className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground"
          >
            Application conversion funnel
          </h2>
          <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
            Stage progression and drop-off rate from initial application to offer.
          </p>
        </div>
        <span className="text-[12px] text-muted-foreground font-sans max-[639px]:hidden">
          Conversion efficiency
        </span>
      </div>

      <div
        className="p-5 sm:p-6 rounded-lg bg-card border border-border flex flex-col gap-3.5"
        role="region"
        aria-label="Conversion funnel visualization"
      >
        {funnel.map((stage, idx) => {
          const widthPercent = Math.max(8, Math.round((stage.count / maxCount) * 100));
          const isOffer = stage.id === 'offer';
          const isInitial = idx === 0;

          return (
            <div key={stage.id} className="flex flex-col gap-1.5 group">
              {/* Stage Info Row */}
              <div className="flex items-center justify-between text-[13px] font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-secondary text-muted-foreground text-[11px] font-semibold grid place-items-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-foreground">
                    {stage.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {!isInitial && (
                    <span className="text-[12px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
                      <ArrowDown size={12} className="text-muted-foreground/70" />
                      {stage.stepConversion}% from prev
                    </span>
                  )}
                  <span className="font-display font-semibold text-[15px] text-foreground min-w-[28px] text-right">
                    {stage.count}
                  </span>
                  <span className="text-[12px] text-muted-foreground min-w-[42px] text-right">
                    ({stage.conversionFromTotal}%)
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="w-full h-4 rounded bg-secondary overflow-hidden relative">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className={cn(
                    'h-full rounded transition-all duration-300 ease-out',
                    isOffer
                      ? 'bg-[var(--marker)] ring-1 ring-border/80'
                      : idx === 0
                      ? 'bg-primary'
                      : 'bg-primary/80'
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
