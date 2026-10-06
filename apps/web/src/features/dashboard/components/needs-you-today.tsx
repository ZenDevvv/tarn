import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView, useReducedMotion } from '@/hooks';

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
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.15, triggerOnce: true });
  const reducedMotion = useReducedMotion();

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
    <section ref={ref} aria-labelledby="h-today">
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
            {items.map((item, i) => {
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
                  style={{
                    opacity: reducedMotion || isInView ? 1 : 0.4,
                    transform: reducedMotion || isInView ? 'translateY(0)' : 'translateY(4px)',
                    transition: reducedMotion ? 'none' : 'opacity 400ms ease-out, transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: reducedMotion ? '0ms' : `${i * 50}ms`,
                  }}
                  className={cn(
                    'grid grid-cols-[22px_minmax(0,1fr)_auto] max-[719px]:grid-cols-[22px_minmax(0,1fr)] gap-3.5 items-start py-4 transition-opacity',
                    isDone && 'opacity-60'
                  )}
                >
                  {/* Circular Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    disabled={isDone || completeMutation.isPending}
                    aria-label={`Mark "${item.action}" as completed`}
                    className={cn(
                      'mt-0.5 w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-colors cursor-pointer',
                      isDone
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    {isDone && <Check size={12} strokeWidth={2.5} />}
                  </button>

                  {/* Body: Action + Application */}
                  <div className="min-w-0 pr-2">
                    <div
                      className={cn(
                        'text-[14px] leading-[20px] font-medium text-foreground',
                        isDone && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.action}
                    </div>
                    <div className="text-[12px] leading-[16px] text-muted-foreground mt-0.5 truncate">
                      <Link
                        to={`/applications/${item.applicationId}`}
                        className="hover:text-primary transition-colors no-underline text-muted-foreground"
                      >
                        {company}
                      </Link>
                      <span className="mx-1.5">•</span>
                      <span>{role}</span>
                    </div>
                  </div>

                  {/* Due date tag */}
                  <div className="pt-0.5 flex justify-end max-[719px]:col-start-2 max-[719px]:pt-0">
                    <span
                      className={cn(
                        'text-[12px] leading-[16px] font-medium px-2 py-0.5 rounded-[4px]',
                        isOverdue
                          ? 'bg-destructive/10 text-destructive'
                          : isToday
                          ? 'bg-[var(--marker)] text-[var(--marker-foreground)] font-semibold'
                          : 'text-muted-foreground'
                      )}
                    >
                      {dueText}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
