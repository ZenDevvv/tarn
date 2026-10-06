import { Link, useNavigate } from 'react-router-dom';
import { ApplicationStatusBadge } from '@/features/applications/components/application-status-badge';
import { PriorityGlyph } from '@/features/applications/components/priority-glyph';
import { ApplicationDTO } from '@tracker/types';
import { cn } from '@/lib/cn';

interface RecentApplicationsTableProps {
  applications: ApplicationDTO[];
  totalCount: number;
}

export function RecentApplicationsTable({ applications, totalCount }: RecentApplicationsTableProps) {
  const navigate = useNavigate();

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return (
    <section aria-labelledby="h-rec">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="h-rec" className="font-display font-semibold text-[20px] leading-[26px] tracking-tight text-foreground">
          Recent applications
        </h2>
        <Link
          to="/applications"
          className="text-[13px] text-muted-foreground hover:text-foreground hover:underline no-underline"
        >
          View all {totalCount}
        </Link>
      </div>

      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full text-left text-small border-collapse">
          <thead>
            <tr className="border-b border-border text-[12px] font-medium text-muted-foreground">
              <th className="py-2.5 px-3 pl-3">Company</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Next action</th>
              <th className="py-2.5 px-3 max-[719px]:hidden">Platform</th>
              <th className="py-2.5 px-3 max-[719px]:hidden">Applied</th>
              <th className="py-2.5 px-3 text-right max-[719px]:hidden">
                <span className="sr-only">Priority</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground text-small">
                  No applications logged yet.
                </td>
              </tr>
            ) : (
              applications.map((app) => {
              const isActionable = Boolean(
                app.nextAction &&
                app.nextActionDueAt &&
                new Date(app.nextActionDueAt) <= todayEnd
              );

              return (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="hover:bg-secondary/50 cursor-pointer transition-colors group"
                >
                  {/* Company & Role */}
                  <td className="py-3.5 px-3 pl-3">
                    <div className="font-display font-semibold text-[15px] leading-[20px] text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {app.company?.name || 'Company'}
                    </div>
                    <div className="text-[13px] leading-[18px] text-muted-foreground">
                      {app.job?.title || 'Position'}
                    </div>
                  </td>

                  {/* Status with StageRing */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <ApplicationStatusBadge status={app.status} />
                  </td>

                  {/* Next action */}
                  <td className="py-3.5 px-3">
                    {app.nextAction ? (
                      <div>
                        <span
                          className={cn(
                            'text-[13px] leading-[18px]',
                            isActionable ? 'marker font-medium' : 'text-foreground'
                          )}
                        >
                          {app.nextAction}
                        </span>
                        {app.nextActionDueAt && (
                          <span className="block text-[12px] text-muted-foreground">
                            {new Date(app.nextActionDueAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[12px]">—</span>
                    )}
                  </td>

                  {/* Platform */}
                  <td className="py-3.5 px-3 text-[13px] text-muted-foreground max-[719px]:hidden">
                    {app.job?.source || 'Direct'}
                  </td>

                  {/* Applied date */}
                  <td className="py-3.5 px-3 text-[13px] text-muted-foreground whitespace-nowrap max-[719px]:hidden">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>

                  {/* Priority 3-bar glyph */}
                  <td className="py-3.5 px-3 text-right max-[719px]:hidden">
                    <PriorityGlyph priority={app.priority} />
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
