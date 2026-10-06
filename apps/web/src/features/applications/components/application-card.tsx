import { ApplicationDTO, formatWorkSetup } from '@tracker/types';
import { ApplicationStatusBadge } from './application-status-badge';
import { PriorityGlyph } from './priority-glyph';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ApplicationCardProps {
  application: ApplicationDTO;
  className?: string;
}

function formatSalary(min?: number | null, max?: number | null, currency = 'PHP') {
  if (!min && !max) return null;
  const sym = currency === 'PHP' ? '₱' : '$';
  const formatNum = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

  if (min && max) {
    return `${sym}${formatNum(min)}–${sym}${formatNum(max)}`;
  }
  if (min) return `From ${sym}${formatNum(min)}`;
  return `Up to ${sym}${formatNum(max!)}`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRelativeTime(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function ApplicationCard({ application, className }: ApplicationCardProps) {
  const companyName = application.company?.name || 'Unknown Company';
  const roleTitle = application.job?.title || 'Unknown Position';
  const salaryText = formatSalary(
    application.job?.salaryMin,
    application.job?.salaryMax,
    application.job?.currency || 'PHP'
  );
  const workSetup = application.job?.workSetup
    ? formatWorkSetup(application.job.workSetup)
    : null;
  const source = application.job?.source || null;

  const dateToUse = application.appliedAt || application.createdAt;
  const formattedDate = formatDate(dateToUse);
  const relativeTime = getRelativeTime(dateToUse);
  const dateLabel = application.status === 'SAVED' && !application.appliedAt ? 'Saved' : 'Applied';

  return (
    <Link
      to={`/applications/${application.id}`}
      className={cn(
        'group flex flex-col justify-between h-full min-h-[172px] bg-card border border-border rounded-lg p-4 transition-all duration-150 hover:border-input text-foreground text-left no-underline focus-visible:outline-2 focus-visible:outline-primary',
        className
      )}
    >
      {/* Top block */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 1. Header: Stage Ring + status (left), Priority (right) */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <ApplicationStatusBadge status={application.status} />
          <PriorityGlyph priority={application.priority} />
        </div>

        {/* 2. Heading: Company in Bricolage Grotesque, Role below in text-muted-foreground */}
        <div className="min-w-0 mb-3">
          <h3 className="font-display font-semibold text-subheading text-foreground group-hover:text-primary transition-colors truncate">
            {companyName}
          </h3>
          <p className="text-small text-muted-foreground mt-0.5 truncate">
            {roleTitle}
          </p>
        </div>

        {/* 3. Facts row: work setup, salary, platform (separated by 14px whitespace gaps, no middle dots) */}
        <div className="flex items-center gap-x-[14px] text-small text-muted-foreground pt-2.5 border-t border-border/60 overflow-hidden whitespace-nowrap">
          {workSetup && <span className="shrink-0">{workSetup}</span>}
          {salaryText && <span className="shrink-0">{salaryText}</span>}
          {source && <span className="truncate">{source}</span>}
          {!workSetup && !salaryText && !source && (
            <span className="text-muted-foreground/50">No details specified</span>
          )}
        </div>
      </div>

      {/* 4. Date footer (replaces next action) */}
      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2 text-small text-muted-foreground">
        <span className="flex items-center gap-1.5 truncate">
          <Calendar size={13} className="shrink-0 text-muted-foreground/70" />
          <span className="truncate">
            {dateLabel} {formattedDate}
          </span>
        </span>
        {relativeTime && (
          <span className="shrink-0 text-caption text-muted-foreground/80 font-mono">
            {relativeTime}
          </span>
        )}
      </div>
    </Link>
  );
}
