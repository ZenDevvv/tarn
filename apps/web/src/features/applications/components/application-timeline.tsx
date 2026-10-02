import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TimelineEventDTO, ApplicationStatus } from '@tracker/types';
import { StageRing } from './application-status-badge';
import { apiClient } from '@/lib/api-client';
import { MessageSquare, CheckCircle, Calendar, Plus, Send } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ApplicationTimelineProps {
  applicationId: string;
  events: TimelineEventDTO[];
  className?: string;
}

export function ApplicationTimeline({ applicationId, events, className }: ApplicationTimelineProps) {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const queryClient = useQueryClient();

  const noteMutation = useMutation({
    mutationFn: (note: string) =>
      apiClient.post(`/applications/${applicationId}/timeline/note`, { note }),
    onSuccess: () => {
      setNewNote('');
      setIsAddingNote(false);
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || noteMutation.isPending) return;
    noteMutation.mutate(newNote.trim());
  };

  const getEventIcon = (event: TimelineEventDTO) => {
    if (event.type === 'STATUS_CHANGED') {
      // Extract status from title if possible or default to APPLIED
      const statusMatch = event.description?.match(/to\s+([A-Z_]+)/);
      const targetStatus = (statusMatch ? statusMatch[1] : 'APPLIED') as ApplicationStatus;
      return <StageRing status={targetStatus} size={20} />;
    }

    if (event.type === 'FOLLOW_UP_COMPLETED') {
      return (
        <div className="w-5 h-5 rounded-full bg-success-tint text-success flex items-center justify-center">
          <CheckCircle size={13} strokeWidth={2} />
        </div>
      );
    }

    if (event.type === 'FOLLOW_UP_CREATED') {
      return (
        <div className="w-5 h-5 rounded-full bg-secondary text-foreground flex items-center justify-center">
          <Calendar size={12} strokeWidth={1.5} />
        </div>
      );
    }

    if (event.type === 'NOTE_ADDED') {
      return (
        <div className="w-5 h-5 rounded-full bg-secondary text-foreground flex items-center justify-center">
          <MessageSquare size={12} strokeWidth={1.5} />
        </div>
      );
    }

    // Default: APPLICATION_CREATED
    return (
      <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background my-1" />
    );
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-subheading text-foreground">
          Activity Timeline
        </h3>
        {!isAddingNote && (
          <button
            type="button"
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center gap-1 text-small text-primary hover:text-primary-hover font-medium cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Add note</span>
          </button>
        )}
      </div>

      {/* Inline Add Note Form */}
      {isAddingNote && (
        <form onSubmit={handleAddNote} className="flex flex-col gap-2 p-3 bg-secondary/50 rounded-lg border border-border">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type your notes or interview takeaways here..."
            rows={2}
            className="w-full p-2.5 rounded-md bg-background border border-input text-small text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary resize-y"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNote(false);
                setNewNote('');
              }}
              className="px-2.5 py-1 text-small text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newNote.trim() || noteMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium disabled:opacity-50 cursor-pointer"
            >
              <Send size={12} />
              <span>{noteMutation.isPending ? 'Saving...' : 'Post note'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
        {events.length === 0 ? (
          <p className="text-small text-muted-foreground py-2">No activity recorded yet.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="relative flex items-start gap-3">
              {/* Timeline marker icon/ring */}
              <div className="absolute -left-6 top-0.5 bg-background pr-1">
                {getEventIcon(event)}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-small font-medium text-foreground">
                    {event.title}
                  </span>
                  <span className="text-caption text-muted-foreground shrink-0">
                    {new Date(event.occurredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {event.description && (
                  <p className="text-small text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
