import { WorkSetupMetricDTO, SalaryInsightsDTO } from '@tracker/types';
import { DollarSign, Laptop } from 'lucide-react';

interface WorkSetupAndSalaryProps {
  workSetups: WorkSetupMetricDTO[];
  salaryInsights: SalaryInsightsDTO;
}

export function WorkSetupAndSalary({ workSetups, salaryInsights }: WorkSetupAndSalaryProps) {
  const formatCurrency = (val: number | null, curr: string) => {
    if (val === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section className="grid grid-cols-2 max-[1023px]:grid-cols-1 gap-6" aria-label="Work setup and salary insights">
      {/* 1. Work Setup Breakdown */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground flex items-center gap-2">
            <Laptop size={18} strokeWidth={1.5} className="text-muted-foreground" />
            Work environment
          </h2>
          <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
            Distribution and interview yield across Remote, Hybrid, and On-site roles.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-card border border-border flex flex-col gap-3.5">
          {workSetups.map((ws) => (
            <div key={ws.setup} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[13px] font-sans">
                <span className="font-medium text-foreground">{ws.label}</span>
                <div className="flex items-center gap-2 text-muted-foreground text-[12px]">
                  <span>{ws.count} apps ({ws.percentage}%)</span>
                  <span>·</span>
                  <span className="font-medium text-foreground">{ws.interviewRate}% interview yield</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, ws.percentage)}%` }}
                  className="h-full bg-primary rounded-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Salary Insights */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground flex items-center gap-2">
            <DollarSign size={18} strokeWidth={1.5} className="text-muted-foreground" />
            Compensation insights
          </h2>
          <p className="text-[13px] text-muted-foreground font-sans mt-0.5">
            Salary metrics aggregated from postings with disclosed ranges.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-card border border-border flex flex-col justify-between gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[12px] text-muted-foreground font-sans font-medium">Average minimum</span>
              <div className="font-display font-semibold text-[22px] sm:text-[24px] text-foreground tracking-tight mt-1">
                {formatCurrency(salaryInsights.avgSalaryMin, salaryInsights.currency)}
              </div>
            </div>

            <div>
              <span className="text-[12px] text-muted-foreground font-sans font-medium">Average maximum</span>
              <div className="font-display font-semibold text-[22px] sm:text-[24px] text-foreground tracking-tight mt-1">
                {formatCurrency(salaryInsights.avgSalaryMax, salaryInsights.currency)}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[12px] text-muted-foreground font-sans">
            <span>
              {salaryInsights.disclosedCount} postings disclosed salary ({salaryInsights.disclosedPercentage}% of total)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[11px]">
              {salaryInsights.currency}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
