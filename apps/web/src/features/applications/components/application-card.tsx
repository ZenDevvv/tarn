import { ApplicationDTO } from '@tracker/types';
import { ApplicationStatusBadge } from './application-status-badge';
import { PriorityGlyph } from './priority-glyph';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface ApplicationCardProps {
  application: ApplicationDTO;
  className?: string;
}

function formatSalary(min?: number | null, max?: number | null, currency = 'USD') {
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isTodayOrPast(dateStr?: string | null) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return due <= endOfToday;
}

function formatDueText(dateStr?: string | null) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (due >= todayStart && due <= todayEnd) {
    return { text: 'Today', isLate: false };
  }

  if (due < todayStart) {
    const diffDays = Math.max(1, Math.round((todayStart.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    return { text: `Overdue ${diffDays}d`, isLate: true };
  }

  return {
    text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isLate: false,
  };
}

export function ApplicationCard({ application, className }: ApplicationCardProps) {
  const companyName = application.company?.name || 'Unknown Company';
  const roleTitle = application.job?.title || 'Unknown Position';
  const salaryText = formatSalary(application.job?.salaryMin, application.job?.salaryMax, application.job?.currency || 'USD');
  const appliedDate = formatDate(application.appliedAt);
  const workSetup = application.job?.workSetup ? application.job.workSetup.charAt(0) + application.job.workSetup.slice(1).toLowerCase() : null;
  const source = application.job?.source || null;

  const dueInfo = formatDueText(application.nextActionDueAt);
  const isActionable = Boolean(application.nextAction && isTodayOrPast(application.nextActionDueAt));

  return (
    <Link
      to={`/applications/${application.id}`}
      className={cn(
        'block bg-card border border-border rounded-lg p-[14px] px-4 transition-colors hover:border-input text-foreground text-left no-underline group focus-visible:outline-2 focus-visible:outline-primary',
        className
      )}
    >
      {/* 1. Header: Stage Ring + status (left), Priority (right) */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <ApplicationStatusBadge status={application.status} />
        <PriorityGlyph priority={application.priority} />
      </div>

      {/* 2. Heading: Company in Bricolage Grotesque, Role below in text-muted-foreground */}
      <h3 className="font-display font-semibold text-subheading text-foreground group-hover:text-primary transition-colors">
        {companyName}
      </h3>
      <p className="text-small text-muted-foreground mt-0.5">
        {roleTitle}
      </p>

      {/* 3. Facts row: work setup, salary, date applied, platform (separated by 14px whitespace gaps) */}
      <div className="flex flex-wrap items-center gap-x-[14px] gap-y-1 text-small text-muted-foreground mt-3 pt-2.5 border-t border-border/60">
        {workSetup && <span>{workSetup}</span>}
        {salaryText && <span>{salaryText}</span>}
        {appliedDate && <span>Applied {appliedDate}</span>}
        {source && <span>{source}</span>}
      </div>

      {/* 4. Next action footer */}
      <div className="mt-3 pt-2.5 border-t border-border flex items-baseline justify-between gap-3 text-small">
        {application.nextAction ? (
          <>
            <span className={cn('truncate', isActionable && 'marker')}>
              {application.nextAction}
            </span>
            {dueInfo && (
              <span
                className={cn(
                  'shrink-0 text-caption',
                  dueInfo.isLate ? 'text-destructive font-medium' : 'text-muted-foreground'
                )}
              >
                {dueInfo.text}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-caption">No next action</span>
        )}
      </div>
    </Link>
  );
}
