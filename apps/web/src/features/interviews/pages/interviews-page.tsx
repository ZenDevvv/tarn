import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewApi } from '../api/interview-api';
import { InterviewCard } from '../components/interview-card';
import { ScheduleInterviewModal } from '../components/schedule-interview-modal';
import { InterviewDTO } from '@tracker/types';
import { CreateInterviewInput, UpdateInterviewInput } from '@tracker/validation';
import { Calendar, Plus, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

export function InterviewsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewDTO | null>(null);

  // Fetch interviews
  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewApi.getInterviews(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateInterviewInput) => interviewApi.createInterview(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInterviewInput }) =>
      interviewApi.updateInterview(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, result }: { id: string; status: string; result?: string }) =>
      interviewApi.updateStatus(id, { status: status as any, result: result as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewApi.deleteInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  // Categorize
  const now = new Date();
  const upcomingInterviews = interviews.filter(
    (i) => i.status === 'SCHEDULED' && new Date(i.scheduledAt) >= new Date(now.getTime() - 2 * 60 * 60 * 1000)
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const pastInterviews = interviews.filter(
    (i) => i.status !== 'SCHEDULED' || new Date(i.scheduledAt) < new Date(now.getTime() - 2 * 60 * 60 * 1000)
  ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const displayedInterviews =
    activeTab === 'upcoming'
      ? upcomingInterviews
      : activeTab === 'past'
      ? pastInterviews
      : interviews;

  const handleCreateOrUpdate = async (input: CreateInterviewInput | UpdateInterviewInput) => {
    if (editingInterview) {
      await updateMutation.mutateAsync({ id: editingInterview.id, input });
    } else {
      await createMutation.mutateAsync(input as CreateInterviewInput);
    }
    setEditingInterview(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-8 animate-fade-in text-foreground">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
            Interviews
          </h1>
          <p className="text-small text-muted-foreground mt-1">
            Track interview rounds, prepare talking points, and join meetings with one click.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingInterview(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span>Schedule interview</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-3 gap-4 border-y border-border py-3 text-small">
        <div className="flex flex-col">
          <span className="font-display font-bold text-subheading text-foreground">
            {upcomingInterviews.length}
          </span>
          <span className="text-caption text-muted-foreground uppercase tracking-wider">
            Upcoming
          </span>
        </div>
        <div className="flex flex-col border-x border-border px-4">
          <span className="font-display font-bold text-subheading text-foreground">
            {interviews.filter((i) => i.status === 'COMPLETED').length}
          </span>
          <span className="text-caption text-muted-foreground uppercase tracking-wider">
            Completed
          </span>
        </div>
        <div className="flex flex-col pl-2">
          <span className="font-display font-bold text-subheading text-foreground">
            {interviews.length}
          </span>
          <span className="text-caption text-muted-foreground uppercase tracking-wider">
            Total Rounds
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          onClick={() => setActiveTab('upcoming')}
          className={cn(
            'px-4 py-2 text-small font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'upcoming'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Clock size={15} />
          <span>Upcoming ({upcomingInterviews.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'past'}
          onClick={() => setActiveTab('past')}
          className={cn(
            'px-4 py-2 text-small font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'past'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <CheckCircle size={15} />
          <span>Past / Completed ({pastInterviews.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 text-small font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
            activeTab === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar size={15} />
          <span>All ({interviews.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground text-small">
          Loading interviews...
        </div>
      ) : displayedInterviews.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Calendar size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-display font-medium text-body text-foreground">
              {activeTab === 'upcoming'
                ? 'No upcoming interviews'
                : activeTab === 'past'
                ? 'No past interviews'
                : 'No interviews recorded'}
            </h3>
            <p className="text-small text-muted-foreground max-w-sm mt-1">
              When an employer schedules an HR call, technical screen, or presentation, record it here to track prep notes and dates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingInterview(null);
              setIsModalOpen(true);
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-small font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={15} />
            <span>Schedule interview</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onStatusChange={(id, status, result) =>
                statusMutation.mutate({ id, status, result })
              }
              onEdit={(iv) => {
                setEditingInterview(iv);
                setIsModalOpen(true);
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <ScheduleInterviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInterview(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingInterview}
      />
    </div>
  );
}
