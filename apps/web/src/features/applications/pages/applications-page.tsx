import { useState, useTransition, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, LayoutGrid, List, Columns3, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { applicationApi } from '../api/application-api';
import { ApplicationCard } from '../components/application-card';
import { ApplicationFilters } from '../components/application-filters';
import { ApplicationStatusBadge } from '../components/application-status-badge';
import { PriorityGlyph } from '../components/priority-glyph';
import { ApplicationKanban } from '../components/application-kanban';
import { ApplicationStatus, WorkSetup, formatWorkSetup } from '@tracker/types';
import { cn } from '@/lib/cn';

export function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as 'grid' | 'table' | 'pipeline') || 'grid';
  const initialStatus = (searchParams.get('status') as ApplicationStatus) || undefined;
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();

  const [status, setStatus] = useState<ApplicationStatus | undefined>(initialStatus);
  const [workSetup, setWorkSetup] = useState<WorkSetup | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'pipeline'>(initialView);
  const [page, setPage] = useState(1);
  const limit = viewMode === 'pipeline' ? 100 : 18;

  useEffect(() => {
    const qView = searchParams.get('view') as 'grid' | 'table' | 'pipeline' | null;
    if (qView && ['grid', 'table', 'pipeline'].includes(qView)) {
      setViewMode(qView);
    }
    const qStatus = searchParams.get('status') as ApplicationStatus | null;
    if (qStatus) {
      setStatus(qStatus);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    startTransition(() => {
      setDebouncedSearch(val);
      setPage(1);
    });
  };

  const handleStatusChange = (newStatus?: ApplicationStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleWorkSetupChange = (newSetup?: WorkSetup) => {
    setWorkSetup(newSetup);
    setPage(1);
  };

  const handleViewChange = (newView: 'grid' | 'table' | 'pipeline') => {
    setViewMode(newView);
    setSearchParams((prev) => {
      prev.set('view', newView);
      return prev;
    });
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['applications', { page, limit, status, workSetup, search: debouncedSearch, viewMode }],
    queryFn: () =>
      applicationApi.getApplications({
        page,
        limit,
        status,
        workSetup,
        search: debouncedSearch || undefined,
        sortBy: 'appliedAt',
        sortOrder: 'desc',
      }),
  });

  const applications = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
            Applications
          </h1>
          <p className="text-small text-muted-foreground mt-1">
            {isLoading
              ? 'Loading applications...'
              : `Tracking ${meta.total} active and archived applications`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-card border border-border rounded-md p-0.5">
            <button
              type="button"
              onClick={() => handleViewChange('grid')}
              className={cn(
                'p-1.5 rounded-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('table')}
              className={cn(
                'p-1.5 rounded-sm transition-colors',
                viewMode === 'table'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Table view"
              title="Table view"
            >
              <List size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('pipeline')}
              className={cn(
                'p-1.5 rounded-sm transition-colors',
                viewMode === 'pipeline'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Pipeline Kanban view"
              title="Pipeline board"
            >
              <Columns3 size={16} strokeWidth={1.5} />
            </button>
          </div>

          <Link
            to="/applications/new"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-body no-underline transition-colors"
          >
            <Plus size={16} strokeWidth={1.5} />
            <span>Add application</span>
          </Link>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <ApplicationFilters
          search={search}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
          workSetup={workSetup}
          onWorkSetupChange={handleWorkSetupChange}
        />

        {(status || workSetup || search) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setStatus(undefined);
              setWorkSetup(undefined);
              setPage(1);
            }}
            className="text-small text-muted-foreground hover:text-foreground underline underline-offset-4 self-start md:self-auto cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Main Listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-lg border border-border bg-card/60 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-secondary rounded" />
                <div className="h-4 w-10 bg-secondary rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-40 bg-secondary rounded" />
                <div className="h-4 w-28 bg-secondary rounded" />
              </div>
              <div className="h-4 w-full bg-secondary/80 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
          <p className="text-body font-medium text-destructive">
            Failed to load applications
          </p>
          <p className="text-small text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      ) : applications.length === 0 ? (
        <div className="w-full py-16 px-4 text-center border border-dashed border-border rounded-lg bg-card/40 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3">
            <Briefcase size={22} strokeWidth={1.5} />
          </div>
          <h3 className="font-display font-semibold text-subheading text-foreground">
            No applications found
          </h3>
          <p className="text-small text-muted-foreground mt-1 max-w-sm">
            {search || status || workSetup
              ? 'Try changing your search terms or clearing your filters.'
              : 'Start your pipeline by logging your first job application.'}
          </p>
          <div className="mt-5">
            <Link
              to="/applications/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-body no-underline transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span>Add application</span>
            </Link>
          </div>
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="animate-fade-in w-full">
          <ApplicationKanban applications={applications} />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      ) : (
        /* Table / Compact List View */
        <div className="border border-border rounded-lg overflow-x-auto bg-card animate-fade-in">
          <table className="w-full text-left text-small border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-caption uppercase tracking-wider text-muted-foreground font-medium">
                <th className="py-3 px-4">Company & Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Work Setup</th>
                <th className="py-3 px-4">Applied</th>
                <th className="py-3 px-4">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                  onClick={() => {
                    window.location.href = `/applications/${app.id}`;
                  }}
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/applications/${app.id}`}
                      className="font-display font-semibold text-foreground group-hover:text-primary no-underline block"
                    >
                      {app.company?.name || 'Unknown Company'}
                    </Link>
                    <span className="text-muted-foreground text-caption block">
                      {app.job?.title}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                  <td className="py-3 px-4">
                    <PriorityGlyph priority={app.priority} />
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatWorkSetup(app.job?.workSetup, '—')}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {app.nextAction ? (
                      <span className="text-foreground truncate max-w-[200px] block">
                        {app.nextAction}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-caption">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-small text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center justify-center h-8 px-2.5 rounded-md border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors text-small"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="inline-flex items-center justify-center h-8 px-2.5 rounded-md border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors text-small"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
