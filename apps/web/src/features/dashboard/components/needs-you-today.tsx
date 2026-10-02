import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NeedsYouTodayProps {
  items: Array<{
    id: string;
    action: string;
    dueAt: string;
    applicationId: string;
    application?: {
      company?: { name: string };
      job?: { title: string };
    };
  }>;
}

export function NeedsYouToday({ items }: NeedsYouTodayProps) {
  const queryClient = useQueryClient();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/follow-ups/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleToggle = (id: string) => {
    if (completedIds.has(id)) return;
    setCompletedIds((prev) => new Set(prev).add(id));
    completeMutation.mutate(id);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const activeCount = items.filter((item) => !completedIds.has(item.id)).length;

  return (
    <section aria-labelledby="h-today">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="h-today" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Needs you today
        </h2>
        <span className="text-[13px] text-muted-foreground font-sans">
          {activeCount} {activeCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="bg-card border border-border rounded-[18px] px-5 py-1">
        {items.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-small">
            You're all caught up for today.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const isDone = completedIds.has(item.id);
              const due = new Date(item.dueAt);
              const isToday = due >= todayStart && due <= todayEnd;
              const isOverdue = due < todayStart;

              let dueText = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              if (isToday) dueText = 'Today';
              if (isOverdue) {
                const diffDays = Math.max(1, Math.round((todayStart.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
                dueText = `Overdue ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
              }

              const company = item.application?.company?.name || 'Company';
              const role = item.application?.job?.title || 'Application';

              return (
                <li
                  key={item.id}
                  className={cn(
                    'grid grid-cols-[22px_minmax(0,1fr)_auto] max-[719px]:grid-cols-[22px_minmax(0,1fr)] gap-3.5 items-start py-4 transition-opacity',
                    isDone && 'opacity-60'
                  )}
                >
                  {/* Circular Checkbox */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`Mark done: ${item.action}`}
                    onClick={() => handleToggle(item.id)}
                    disabled={isDone}
                    className={cn(
                      'w-5 h-5 rounded-full border border-input bg-card mt-0.5 grid place-items-center transition-colors cursor-pointer shrink-0',
                      isDone
                        ? 'bg-primary border-primary text-primary-foreground cursor-default'
                        : 'hover:border-primary'
                    )}
                  >
                    {isDone && <Check size={12} strokeWidth={2.5} />}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0">
                    <div className="text-[15px] leading-[22px] text-foreground">
                      <span
                        className={cn(
                          'transition-colors',
                          !isDone && (isToday || isOverdue) && 'marker',
                          isDone && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.action}
                      </span>
                    </div>
                    <div className="text-[13px] leading-[18px] text-muted-foreground mt-0.5 truncate">
                      <Link
                        to={`/applications/${item.applicationId}`}
                        className="hover:text-foreground no-underline transition-colors"
                      >
                        {company}, {role}
                      </Link>
                    </div>
                  </div>

                  {/* Due badge */}
                  <span
                    className={cn(
                      'text-[13px] leading-[22px] whitespace-nowrap text-right max-[719px]:col-start-2 max-[719px]:text-left max-[719px]:-mt-1 max-[719px]:text-[12px]',
                      isOverdue && !isDone
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    {dueText}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
