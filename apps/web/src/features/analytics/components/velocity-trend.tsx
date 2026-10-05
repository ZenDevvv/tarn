import { useState } from 'react';
import { VelocityMetricDTO } from '@tracker/types';
import { cn } from '@/lib/cn';

interface VelocityTrendProps {
  weekly: VelocityMetricDTO[];
  monthly: VelocityMetricDTO[];
}

export function VelocityTrend({ weekly, monthly }: VelocityTrendProps) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const items = view === 'weekly' ? weekly : monthly;
  const maxCount = Math.max(...items.map((i) => i.count), 6);
  const totalInPeriod = items.reduce((acc, i) => acc + i.count, 0);
  const average = items.length > 0 ? (totalInPeriod / items.length).toFixed(1) : '0';

  return (
    <section className="flex flex-col gap-3" aria-labelledby="h-velocity">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="h-velocity" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
            Application velocity
          </h2>
          <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
            Volume of submitted applications over historical time periods.
          </p>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-md bg-secondary border border-border" role="group">
          <button
            type="button"
            onClick={() => setView('weekly')}
            className={cn(
              'px-2.5 py-1 rounded text-[12px] font-sans transition-colors',
              view === 'weekly'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setView('monthly')}
            className={cn(
              'px-2.5 py-1 rounded text-[12px] font-sans transition-colors',
              view === 'monthly'
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-lg bg-card border border-border flex flex-col gap-4">
        {/* Bars Container */}
        <div
          className="flex items-end gap-2 sm:gap-3 h-[140px] border-b border-border pt-4"
          role="img"
          aria-label={`Application velocity chart: averaging ${average} applications per ${view === 'weekly' ? 'week' : 'month'}`}
        >
          {items.map((item, idx) => {
            const heightPercent = Math.max(10, Math.round((item.count / maxCount) * 85));
            const isCurrent = item.isCurrent || (view === 'weekly' && idx === items.length - 1);

            return (
              <div
                key={item.label || idx}
                className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full text-[12px] text-muted-foreground font-sans group relative"
              >
                {/* Count tooltip on hover */}
                <span className="leading-none font-semibold text-foreground text-[11px] group-hover:scale-110 transition-transform">
                  {item.count}
                </span>

                <i
                  style={{ height: `${heightPercent}%` }}
                  className={cn(
                    'block w-full rounded-t-sm transition-all duration-200',
                    isCurrent
                      ? 'bg-[var(--marker)] ring-1 ring-border/80'
                      : 'bg-primary group-hover:bg-primary-hover'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Labels row */}
        <div className="flex gap-2 sm:gap-3 text-[11px] text-muted-foreground font-sans" aria-hidden="true">
          {items.map((item, idx) => (
            <span key={item.label || idx} className="flex-1 text-center truncate">
              {item.label}
            </span>
          ))}
        </div>

        {/* Footer summary */}
        <p className="text-[12px] text-muted-foreground font-sans">
          You averaged <strong className="text-foreground font-semibold">{average}</strong> applications per {view === 'weekly' ? 'week' : 'month'} across this timeline.
        </p>
      </div>
    </section>
  );
}
