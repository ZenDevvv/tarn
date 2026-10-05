import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationDTO, ApplicationStatus } from '@tracker/types';
import { StageRing, STATUS_CONFIG } from './application-status-badge';
import { PriorityGlyph } from './priority-glyph';
import { useApplicationStatusMutation } from '../hooks/use-application-mutations';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/select';

interface ApplicationKanbanProps {
  applications: ApplicationDTO[];
}

const STAGES: Array<{ status: ApplicationStatus; label: string }> = [
  { status: 'SAVED', label: 'Saved' },
  { status: 'APPLIED', label: 'Applied' },
  { status: 'APPLICATION_VIEWED', label: 'Viewed' },
  { status: 'RECRUITER_CONTACTED', label: 'Screen' },
  { status: 'HR_INTERVIEW', label: 'HR Interview' },
  { status: 'TECHNICAL_INTERVIEW', label: 'Tech Interview' },
  { status: 'FINAL_INTERVIEW', label: 'Final Round' },
  { status: 'OFFER', label: 'Offer' },
  { status: 'ACCEPTED', label: 'Accepted' },
];

export function ApplicationKanban({ applications }: ApplicationKanbanProps) {
  const statusMutation = useApplicationStatusMutation();
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAppId(id);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== status) {
      setDragOverStage(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column itself
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      statusMutation.mutate({ id: appId, status: targetStatus });
    }
  };

  const moveStage = (appId: string, currentStatus: ApplicationStatus, direction: 'prev' | 'next') => {
    const currentIndex = STAGES.findIndex((s) => s.status === currentStatus);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < STAGES.length) {
      statusMutation.mutate({ id: appId, status: STAGES[nextIndex].status });
    }
  };

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 select-none scrollbar-thin">
      {STAGES.map(({ status, label }, stageIdx) => {
        const stageApps = applications.filter((a) => a.status === status);
        const isDragTarget = dragOverStage === status;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              'w-[280px] shrink-0 flex flex-col rounded-xl bg-card/60 border border-border transition-colors duration-150',
              isDragTarget && 'bg-primary/5 border-primary ring-1 ring-primary/40'
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-card rounded-t-xl">
              <div className="flex items-center gap-2 min-w-0">
                <StageRing status={status} size={18} />
                <span className="font-display font-semibold text-[14px] text-foreground truncate">
                  {label}
                </span>
              </div>
              <span className="text-[12px] font-mono font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {stageApps.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 p-2.5 flex flex-col gap-2.5 min-h-[360px] overflow-y-auto custom-scrollbar">
              {stageApps.length === 0 ? (
                <div className="h-28 border border-dashed border-border/70 rounded-lg grid place-items-center text-caption text-muted-foreground">
                  Drop here
                </div>
              ) : (
                stageApps.map((app) => {
                  const isActionable = Boolean(
                    app.nextAction &&
                    app.nextActionDueAt &&
                    new Date(app.nextActionDueAt) <= todayEnd
                  );

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'group bg-card border border-border rounded-lg p-3 shadow-xs hover:border-input transition-all cursor-grab active:cursor-grabbing text-left',
                        draggedAppId === app.id && 'opacity-40 ring-1 ring-primary'
                      )}
                    >
                      {/* Top: Drag handle + Priority */}
                      <div className="flex items-center justify-between gap-1 mb-1.5 text-muted-foreground">
                        <GripVertical size={13} className="text-muted-foreground/60" />
                        <PriorityGlyph priority={app.priority} />
                      </div>

                      {/* Heading: Company & Role */}
                      <Link
                        to={`/applications/${app.id}`}
                        className="block font-display font-semibold text-[14px] leading-tight text-foreground hover:text-primary no-underline truncate"
                      >
                        {app.company?.name || 'Company'}
                      </Link>
                      <div className="text-[12px] text-muted-foreground mt-0.5 truncate">
                        {app.job?.title || 'Position'}
                      </div>

                      {/* Next action */}
                      {app.nextAction && (
                        <div className="mt-2.5 pt-2 border-t border-border text-[12px]">
                          <span className={cn('block truncate', isActionable && 'marker')}>
                            {app.nextAction}
                          </span>
                        </div>
                      )}

                      {/* Stage Move Controls (accessible click / touch) */}
                      <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={stageIdx === 0}
                          onClick={() => moveStage(app.id, status, 'prev')}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          title="Move to previous stage"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <div className="w-[115px]">
                          <Select<ApplicationStatus>
                            size="sm"
                            value={status}
                            onChange={(newStatus) =>
                              statusMutation.mutate({
                                id: app.id,
                                status: newStatus,
                              })
                            }
                            aria-label="Change stage"
                            triggerClassName="h-6 px-1.5 text-[11px] bg-transparent border-border/40 hover:bg-secondary text-muted-foreground hover:text-foreground"
                            options={STAGES.map((s) => ({
                              value: s.status,
                              label: s.label,
                              icon: <StageRing status={s.status} size={12} />,
                            }))}
                          />
                        </div>

                        <button
                          type="button"
                          disabled={stageIdx === STAGES.length - 1}
                          onClick={() => moveStage(app.id, status, 'next')}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                          title="Move to next stage"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
