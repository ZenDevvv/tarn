import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useInView, useReducedMotion } from '@/hooks';

interface InterviewItem {
  id: string;
  applicationId?: string;
  companyName: string;
  roleTitle: string;
  stage: string;
  date: string;
  location: string;
  meetingUrl?: string | null;
  prepDone: number;
  prepTotal: number;
}

interface UpcomingInterviewsProps {
  interviews: InterviewItem[];
}

export function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.15, triggerOnce: true });
  const reducedMotion = useReducedMotion();

  return (
    <section ref={ref} aria-labelledby="h-iv">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="h-act" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Upcoming interviews
        </h2>
        <Link
          to="/interviews"
          className="text-[13px] text-muted-foreground hover:text-foreground hover:underline no-underline transition-colors"
        >
          View all
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-small border border-dashed border-border rounded-lg">
          No interviews scheduled yet.{' '}
          <Link to="/interviews" className="text-primary hover:underline font-medium ml-1">
            Schedule one
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {interviews.map((iv, index) => {
            const dateObj = new Date(iv.date);
            const dayNum = dateObj.getDate();
            const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const timeStr = dateObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            const prepPercent = Math.round((iv.prepDone / (iv.prepTotal || 1)) * 100);
            const isAnimated = reducedMotion || isInView;

            return (
              <li
                key={iv.id || index}
                style={{
                  opacity: isAnimated ? 1 : 0.4,
                  transform: isAnimated ? 'translateY(0)' : 'translateY(4px)',
                  transition: reducedMotion ? 'none' : 'opacity 400ms ease-out, transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: reducedMotion ? '0ms' : `${index * 60}ms`,
                }}
                className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-3.5 first:pt-0"
              >
                <div>
                  <div className="font-display font-semibold text-[28px] leading-[30px] tracking-tight text-foreground">
                    {dayNum}
                  </div>
                  <div className="text-[12px] leading-[16px] text-muted-foreground font-sans">
                    {dayOfWeek}, {monthShort}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    {iv.applicationId ? (
                      <Link
                        to={`/applications/${iv.applicationId}`}
                        className="font-semibold text-foreground capitalize hover:text-primary transition-colors no-underline"
                      >
                        {iv.stage}
                      </Link>
                    ) : (
                      <div className="font-semibold text-foreground capitalize">
                        {iv.stage}
                      </div>
                    )}

                    {iv.meetingUrl && (
                      <a
                        href={iv.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caption text-primary hover:underline font-medium"
                      >
                        <span>Join</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-[13px] text-muted-foreground mt-0.5">
                    <span>{timeStr}</span>
                    <span className="font-medium text-foreground">{iv.companyName}</span>
                    <span>{iv.location}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 mt-2 text-[13px] text-muted-foreground">
                    <span className="w-[72px] h-1 rounded-sm bg-secondary overflow-hidden inline-block shrink-0">
                      <i
                        className="block h-full bg-primary rounded-sm transition-all"
                        style={{
                          width: isAnimated ? `${prepPercent}%` : '0%',
                          transition: reducedMotion ? 'none' : 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </span>
                    <span>
                      {iv.prepDone}/{iv.prepTotal} prep tasks
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
