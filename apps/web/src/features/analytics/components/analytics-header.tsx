import { cn } from '@/lib/cn';

interface AnalyticsHeaderProps {
  range: 'all' | '30d' | '90d' | 'ytd';
  onRangeChange: (range: 'all' | '30d' | '90d' | 'ytd') => void;
  totalApplications: number;
}

export function AnalyticsHeader({
  range,
  onRangeChange,
  totalApplications,
}: AnalyticsHeaderProps) {
  const ranges: Array<{ id: 'all' | '30d' | '90d' | 'ytd'; label: string }> = [
    { id: 'all', label: 'All time' },
    { id: '30d', label: 'Past 30 days' },
    { id: '90d', label: 'Past 90 days' },
    { id: 'ytd', label: 'Year to date' },
  ];

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-border">
      <div>
        <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
          Analytics
        </h1>
        <p className="text-small text-muted-foreground mt-1">
          Descriptive conversion dynamics, platform breakdown, and cycle velocity for your search.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Time range pills */}
        <div
          className="inline-flex items-center p-1 rounded-lg bg-secondary/80 border border-border"
          role="group"
          aria-label="Time range filter"
        >
          {ranges.map((r) => {
            const isActive = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onRangeChange(r.id)}
                className={cn(
                  'px-3 py-1 rounded-md text-[13px] font-sans transition-all duration-150',
                  isActive
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-pressed={isActive}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

