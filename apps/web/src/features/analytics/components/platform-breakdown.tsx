import { PlatformMetricDTO } from '@tracker/types';
import { Globe } from 'lucide-react';

interface PlatformBreakdownProps {
  platforms: PlatformMetricDTO[];
}

export function PlatformBreakdown({ platforms }: PlatformBreakdownProps) {
  if (!platforms || platforms.length === 0) {
    return (
      <section className="flex flex-col gap-3" aria-labelledby="h-platform">
        <h2 id="h-platform" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Platform performance
        </h2>
        <div className="p-8 rounded-lg bg-card border border-border text-center">
          <p className="text-[13px] text-muted-foreground font-sans">
            No platform data available for this range.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="h-platform">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="h-platform" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
            Platform performance
          </h2>
          <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
            Applications, interview yield, and offers grouped by posting source.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px] font-sans">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-medium text-[12px]">
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4 text-right">Applied</th>
                <th className="py-2.5 px-4 text-right">Interviews</th>
                <th className="py-2.5 px-4 text-right">Interview rate</th>
                <th className="py-2.5 px-4 text-right">Offers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {platforms.map((p) => (
                <tr key={p.platform} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                    <Globe size={14} className="text-muted-foreground shrink-0" />
                    <span>{p.platform}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-display font-semibold text-foreground">
                    {p.totalApplications}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    {p.interviewCount}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5 font-medium">
                      <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden max-[639px]:hidden">
                        <div
                          style={{ width: `${Math.min(100, p.interviewRate)}%` }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                      <span className="text-foreground">{p.interviewRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.offerCount > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[var(--marker)] text-[var(--marker-foreground)]">
                        {p.offerCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
