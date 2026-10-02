import { WeeklyVelocityDTO } from '@tracker/types';

interface WeeklyVelocityChartProps {
  velocity: WeeklyVelocityDTO;
}

export function WeeklyVelocityChart({ velocity }: WeeklyVelocityChartProps) {
  const weeks = velocity.weeks || [];
  const maxCount = Math.max(...weeks.map((w) => w.count), 10);

  const ariaDescription = `Applications per week: ${weeks
    .map((w) => w.count)
    .join(', ')}. The current week is still in progress.`;

  return (
    <section aria-labelledby="h-act">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="h-act" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Applications per week
        </h2>
        <span className="text-[13px] text-muted-foreground font-sans">
          Last 8 weeks
        </span>
      </div>

      {/* Bars container */}
      <div
        className="flex items-end gap-2.5 h-[132px] border-b border-border"
        role="img"
        aria-label={ariaDescription}
      >
        {weeks.map((w, i) => {
          const isCurrent = i === weeks.length - 1;
          const heightPercent = Math.max(12, Math.round((w.count / maxCount) * 85));

          return (
            <div
              key={w.weekLabel || i}
              className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full text-[12px] text-muted-foreground font-sans"
            >
              <span className="leading-none">{w.count}</span>
              <i
                style={{ height: `${heightPercent}%` }}
                className={
                  isCurrent
                    ? 'block w-full bg-[var(--marker)] rounded-t-sm ring-1 ring-border/80 ring-inset'
                    : 'block w-full bg-primary rounded-t-sm transition-all'
                }
              />
            </div>
          );
        })}
      </div>

      {/* Week Labels */}
      <div className="flex gap-2.5 mt-1.5 text-[12px] text-muted-foreground font-sans" aria-hidden="true">
        {weeks.map((w, i) => (
          <span key={w.weekLabel || i} className="flex-1 text-center truncate">
            {w.weekLabel}
          </span>
        ))}
      </div>

      {/* Chart Note */}
      <p className="text-[13px] text-muted-foreground mt-3.5 leading-relaxed font-sans">
        You averaged {velocity.averagePerWeek} applications a week. The week of {velocity.currentWeekLabel}
      </p>
    </section>
  );
}
