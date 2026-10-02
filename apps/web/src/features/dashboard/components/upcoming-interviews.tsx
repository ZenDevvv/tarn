import { Link } from 'react-router-dom';

interface InterviewItem {
  id: string;
  companyName: string;
  roleTitle: string;
  stage: string;
  date: string;
  location: string;
  prepDone: number;
  prepTotal: number;
}

interface UpcomingInterviewsProps {
  interviews: InterviewItem[];
}

export function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <section aria-labelledby="h-iv">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="h-iv" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Upcoming interviews
        </h2>
        <Link
          to="/applications?status=TECHNICAL_INTERVIEW"
          className="text-[13px] text-muted-foreground hover:text-foreground hover:underline no-underline"
        >
          View all
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-small border border-dashed border-border rounded-lg">
          No interviews scheduled yet.
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

            return (
              <li
                key={iv.id || index}
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
                  <div className="font-semibold text-foreground capitalize">
                    {iv.stage}
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
                        style={{ width: `${prepPercent}%` }}
                      />
                    </span>
                    <span>
                      {iv.prepDone > 0
                        ? `${iv.prepDone} of ${iv.prepTotal} prep items done`
                        : 'Not started'}
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
