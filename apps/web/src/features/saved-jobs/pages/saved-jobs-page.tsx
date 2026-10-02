import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@/features/applications/api/application-api';
import { SavedJobCard } from '../components/saved-job-card';
import { QuickSaveModal } from '../components/quick-save-modal';
import { CreateApplicationInput } from '@tracker/validation';
import { Bookmark, Plus, Search, Filter, Building, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SavedJobsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [workSetupFilter, setWorkSetupFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Fetch saved applications
  const { data, isLoading } = useQuery({
    queryKey: ['saved-jobs', search, workSetupFilter],
    queryFn: () =>
      applicationApi.getApplications({
        status: 'SAVED',
        search: search.trim() || undefined,
        workSetup: (workSetupFilter as any) || undefined,
        limit: 50,
      }),
  });

  const savedApplications = data?.data || [];

  // Mutations
  const createSavedMutation = useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationApi.createApplication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (id: string) =>
      applicationApi.updateStatus(id, 'APPLIED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      setApplyingId(null);
    },
    onError: () => {
      setApplyingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationApi.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const handleApply = (id: string) => {
    setApplyingId(id);
    applyMutation.mutate(id);
  };

  const highInterestCount = savedApplications.filter((a) => a.priority === 'HIGH').length;
  const remoteCount = savedApplications.filter((a) => a.job?.workSetup === 'REMOTE').length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-8 animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark size={22} className="text-primary" />
            <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
              Saved Jobs
            </h1>
          </div>
          <p className="text-small text-muted-foreground mt-1">
            Pre-application wishlist and bookmarked opportunities to research and apply to.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span>Save new job</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-3 gap-4 border-y border-border py-3 text-small">
        <div className="flex flex-col">
          <span className="font-display font-bold text-subheading text-foreground">
            {savedApplications.length}
          </span>
          <span className="text-caption text-muted-foreground uppercase tracking-wider">
            Bookmarked
          </span>
        </div>
        <div className="flex flex-col border-x border-border px-4">
          <span className="font-display font-bold text-subheading text-foreground">
            {remoteCount}
          </span>
          <span className="text-caption text-muted-foreground uppercase tracking-wider">
            Remote Roles
          </span>
        </div>
        <div className="flex flex-col pl-2">
          <span className="font-display font-bold text-subheading text-foreground">
            {highInterestCount}
          </span>
          <span className="text-caption text-muted-foreground uppercase tracking-wider">
            High Priority
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search saved jobs by company or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={workSetupFilter}
            onChange={(e) => setWorkSetupFilter(e.target.value)}
            aria-label="Filter by work setup"
            className="bg-background border border-border rounded-md px-2.5 py-1.5 text-small text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Work Setups</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-small">
          Loading saved jobs...
        </div>
      ) : savedApplications.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Bookmark size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display font-medium text-body text-foreground">
              {search || workSetupFilter ? 'No matching saved jobs' : 'No saved jobs yet'}
            </h3>
            <p className="text-small text-muted-foreground max-w-sm mt-1">
              Found a listing on LinkedIn or Indeed you want to tailor your resume for? Bookmark it here before applying.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-small font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={15} />
            <span>Save an opportunity</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedApplications.map((app) => (
            <SavedJobCard
              key={app.id}
              application={app}
              onApply={handleApply}
              onDelete={(id) => deleteMutation.mutate(id)}
              isApplying={applyingId === app.id}
            />
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <QuickSaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (input) => {
          await createSavedMutation.mutateAsync(input);
        }}
      />
    </div>
  );
}
