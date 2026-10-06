import { useState } from 'react';
import { FollowUpDTO } from '@tracker/types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Link } from 'react-router-dom';

interface FollowUpItemProps {
  followUp: FollowUpDTO;
  onComplete: (id: string) => Promise<void>;
  showApplication?: boolean;
}

export function FollowUpItem({ followUp, onComplete, showApplication = true }: FollowUpItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedLocally, setCompletedLocally] = useState(followUp.status === 'COMPLETED');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const due = new Date(followUp.dueAt);

  const isToday = due >= todayStart && due <= todayEnd;
  const isOverdue = due < todayStart && followUp.status === 'PENDING';
  const isActionable = (isToday || isOverdue) && !completedLocally;

  let dueBadgeText = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (isToday) dueBadgeText = 'Today';
  if (isOverdue) {
    const diffDays = Math.max(1, Math.round((todayStart.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    dueBadgeText = `Overdue ${diffDays}d`;
  }

  const handleToggle = async () => {
    if (completedLocally || isCompleting) return;
    setIsCompleting(true);
    setCompletedLocally(true);
    try {
      await onComplete(followUp.id);
    } catch {
      setCompletedLocally(false);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 py-2.5 px-3 rounded-lg border border-border bg-card hover:bg-secondary/40 transition-colors',
        completedLocally && 'opacity-60 bg-transparent'
      )}
    >
      {/* Interactive Circular Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={completedLocally}
        aria-label={`Mark "${followUp.action}" as complete`}
        onClick={handleToggle}
        disabled={completedLocally || isCompleting}
        className={cn(
          'w-5 h-5 rounded-full border border-input mt-0.5 grid place-items-center transition-colors cursor-pointer shrink-0',
          completedLocally
            ? 'bg-success border-success text-success-foreground cursor-default'
            : 'hover:border-primary hover:bg-primary/10'
        )}
      >
        {completedLocally && <Check size={12} strokeWidth={2.5} />}
      </button>

      {/* Action Text & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'text-body font-medium transition-all',
              isActionable ? 'marker' : 'text-foreground',
              completedLocally && 'line-through text-muted-foreground'
            )}
          >
            {followUp.action}
          </span>

          <span
            className={cn(
              'text-caption shrink-0 font-medium',
              isOverdue
                ? 'text-destructive'
                : isToday
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {dueBadgeText}
          </span>
        </div>

        {/* Company + Job Link */}
        {showApplication && followUp.application && (
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground mt-0.5">
            <Link
              to={`/applications/${followUp.applicationId}`}
              className="hover:text-primary transition-colors truncate"
            >
              {followUp.application.company?.name} — {followUp.application.job?.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
