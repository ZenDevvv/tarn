import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewApi } from '@/features/interviews/api/interview-api';
import { InterviewCard } from '@/features/interviews/components/interview-card';
import { ScheduleInterviewModal } from '@/features/interviews/components/schedule-interview-modal';
import { InterviewDTO } from '@tracker/types';
import { CreateInterviewInput, UpdateInterviewInput } from '@tracker/validation';
import { Calendar, Plus, Video } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ApplicationInterviewsTabProps {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  className?: string;
}

export function ApplicationInterviewsTab({
  applicationId,
  companyName,
  jobTitle,
  className,
}: ApplicationInterviewsTabProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewDTO | null>(null);

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews', applicationId],
    queryFn: () => interviewApi.getByApplication(applicationId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateInterviewInput) => interviewApi.createInterview(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInterviewInput }) =>
      interviewApi.updateInterview(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, result }: { id: string; status: string; result?: string }) =>
      interviewApi.updateStatus(id, { status: status as any, result: result as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewApi.deleteInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['timeline', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
  });

  const handleCreateOrUpdate = async (input: CreateInterviewInput | UpdateInterviewInput) => {
    if (editingInterview) {
      await updateMutation.mutateAsync({ id: editingInterview.id, input });
    } else {
      await createMutation.mutateAsync({
        ...input,
        applicationId,
      } as CreateInterviewInput);
    }
    setEditingInterview(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <h3 className="font-display font-semibold text-subheading text-foreground">
            Interview Rounds
          </h3>
          <span className="text-caption text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
            {interviews.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingInterview(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors"
        >
          <Plus size={14} />
          <span>Schedule round</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-muted-foreground text-small">
          Loading interviews...
        </div>
      ) : interviews.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2">
          <Video size={24} className="text-muted-foreground" strokeWidth={1.5} />
          <p className="text-small text-muted-foreground">
            No interview rounds scheduled yet for this role.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingInterview(null);
              setIsModalOpen(true);
            }}
            className="text-small text-primary hover:underline font-medium mt-1 cursor-pointer"
          >
            + Schedule an interview round
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {interviews.map((iv) => (
            <InterviewCard
              key={iv.id}
              interview={{
                ...iv,
                application: {
                  id: applicationId,
                  company: { name: companyName },
                  job: { title: jobTitle },
                },
              }}
              onStatusChange={(id, status, result) =>
                statusMutation.mutate({ id, status, result })
              }
              onEdit={(interview) => {
                setEditingInterview(interview);
                setIsModalOpen(true);
              }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <ScheduleInterviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInterview(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingInterview}
        defaultApplicationId={applicationId}
      />
    </div>
  );
}
