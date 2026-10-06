import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApplicationDTO, ApplicationStatus, ApplicationStatusDTO } from '@tracker/types';
import { StageRing } from './application-status-badge';
import { PriorityGlyph } from './priority-glyph';
import { useApplicationStatusMutation } from '../hooks/use-application-mutations';
import { useApplicationStatuses } from '@/features/settings/hooks/use-application-statuses';
import { ChevronLeft, ChevronRight, GripVertical, Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui';

interface ApplicationKanbanProps {
  applications: ApplicationDTO[];
}

const FALLBACK_STAGES: Array<{ id: string; name: string; order: number; closeType: null }> = [
  { id: 'SAVED', name: 'Saved', order: 0, closeType: null },
  { id: 'APPLIED', name: 'Applied', order: 1, closeType: null },
  { id: 'INTERVIEWING', name: 'Interviewing', order: 2, closeType: null },
  { id: 'OFFER', name: 'Offer', order: 3, closeType: null },
  { id: 'ACCEPTED', name: 'Accepted', order: 4, closeType: null },
];

export function ApplicationKanban({ applications }: ApplicationKanbanProps) {
  const { data: userStatuses } = useApplicationStatuses();
  const statusMutation = useApplicationStatusMutation();
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Active stages strictly sorted by order
  const activeStages =
    userStatuses && userStatuses.length > 0
      ? userStatuses
          .filter((s) => s.closeType === null)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : FALLBACK_STAGES;

  const totalActiveStages = activeStages.length;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';

    const card = e.currentTarget as HTMLElement;
    if (card && e.dataTransfer.setDragImage) {
      const rect = card.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const offsetY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      e.dataTransfer.setDragImage(card, offsetX, offsetY);
    }

    setDraggedAppId(id);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: ApplicationStatusDTO | typeof FALLBACK_STAGES[0]) => {
    e.preventDefault();
    setDragOverStageId(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      statusMutation.mutate({
        id: appId,
        statusId: targetStage.id,
        status: targetStage.name as ApplicationStatus,
      });
    }
  };

  const moveStage = (appId: string, currentStageIdx: number, direction: 'prev' | 'next') => {
    const nextIndex = direction === 'next' ? currentStageIdx + 1 : currentStageIdx - 1;
    if (nextIndex >= 0 && nextIndex < activeStages.length) {
      const targetStage = activeStages[nextIndex];
      statusMutation.mutate({
        id: appId,
        statusId: targetStage.id,
        status: targetStage.name as ApplicationStatus,
      });
    }
  };

  // Full status list (active + closed) for the card dropdown
  const allSelectOptions = (userStatuses || activeStages).map((s) => ({
    value: s.id,
    label: s.name,
    icon: <StageRing status={s} size={12} totalStages={totalActiveStages} />,
  }));

  return (
    <ScrollArea
      orientation="horizontal"
      hoverOnly
      containerClassName="max-[719px]:-mx-4"
      className="flex gap-4 pb-6 pt-1 max-[719px]:px-4 select-none"
    >
      {activeStages.map((stage, stageIdx) => {
        const stageApps = applications.filter(
          (a) =>
            a.statusId === stage.id ||
            a.status === stage.name ||
            (typeof a.status === 'string' && a.status.toUpperCase() === stage.name.toUpperCase())
        );
        const isDragTarget = dragOverStageId === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
            className={cn(
              'min-w-[260px] flex-1 max-w-[360px] shrink-0 flex flex-col rounded-xl bg-card/60 border border-border transition-colors duration-150',
              isDragTarget && 'bg-primary/5 border-primary ring-1 ring-primary/40'
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-card rounded-t-xl">
              <div className="flex items-center gap-2 min-w-0">
                <StageRing status={stage} size={18} totalStages={totalActiveStages} />
                <span className="font-display font-semibold text-[14px] text-foreground truncate">
                  {stage.name}
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
                  const relevantDate = app.appliedAt || app.createdAt;
                  const isApplied = Boolean(app.appliedAt);
                  const dateLabel = isApplied ? 'Applied' : 'Created';
                  const formattedDate = relevantDate
                    ? new Date(relevantDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : null;

                  const relativeTime = (() => {
                    if (!relevantDate) return null;
                    const diffDays = Math.floor(
                      (Date.now() - new Date(relevantDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return 'Yesterday';
                    if (diffDays < 30) return `${diffDays}d ago`;
                    const diffMonths = Math.floor(diffDays / 30);
                    return `${diffMonths}mo ago`;
                  })();

                  const activeInterview =
                    app.interviews?.find((iv) => iv.status === 'SCHEDULED') || app.interviews?.[0];
                  const interviewLabel = activeInterview
                    ? activeInterview.title ||
                      `Round ${activeInterview.round} • ${activeInterview.type.replace(/_/g, ' ').toLowerCase()}`
                    : null;

                  const currentStatusId = app.statusId || stage.id;

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'group/card bg-card border border-border rounded-lg p-3 shadow-xs hover:border-input transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between min-h-[140px]',
                        draggedAppId === app.id && 'opacity-40 ring-1 ring-primary'
                      )}
                    >
                      <div>
                        {/* Top: Drag handle + Priority */}
                        <div className="flex items-center justify-between gap-1 mb-1.5 text-muted-foreground">
                          <GripVertical size={13} className="text-muted-foreground/60" />
                          <PriorityGlyph priority={app.priority} />
                        </div>

                        {/* Heading: Company & Role */}
                        <Link
                          to={`/applications/${app.id}`}
                          draggable={false}
                          className="block font-display font-semibold text-[14px] leading-tight text-foreground hover:text-primary no-underline truncate"
                        >
                          {app.company?.name || 'Company'}
                        </Link>
                        <div className="text-[12px] text-muted-foreground mt-0.5 truncate">
                          {app.job?.title || 'Position'}
                        </div>

                        {/* Interview round badge */}
                        {(app.status === 'INTERVIEWING' || stage.name.toUpperCase() === 'INTERVIEWING') && interviewLabel && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/80 border border-border/60 rounded px-1.5 py-0.5 w-fit max-w-full">
                            <Calendar size={11} className="shrink-0 text-foreground" />
                            <span className="truncate capitalize">{interviewLabel}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom section: Date footer + Stage Move Controls */}
                      <div className="mt-2.5 pt-2 border-t border-border flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar size={11} className="shrink-0 text-muted-foreground/70" />
                            <span className="truncate">
                              {dateLabel} {formattedDate}
                            </span>
                          </span>
                          {relativeTime && (
                            <span className="shrink-0 text-[10px] text-muted-foreground/80 font-mono">
                              {relativeTime}
                            </span>
                          )}
                        </div>

                        {/* Stage Move Controls (accessible click / touch / focus) */}
                        <div className="flex items-center justify-between gap-1 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={stageIdx === 0}
                            onClick={() => moveStage(app.id, stageIdx, 'prev')}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                            title="Move to previous stage"
                          >
                            <ChevronLeft size={14} />
                          </button>

                          <div className="w-[115px]">
                            <Select<string>
                              size="sm"
                              value={currentStatusId}
                              onChange={(newStatusId) => {
                                const target = (userStatuses || activeStages).find((s) => s.id === newStatusId);
                                if (target) {
                                  statusMutation.mutate({
                                    id: app.id,
                                    statusId: target.id,
                                    status: target.name as ApplicationStatus,
                                  });
                                }
                              }}
                              aria-label="Change stage"
                              triggerClassName="h-6 px-1.5 text-[11px] bg-transparent border-border/40 hover:bg-secondary text-muted-foreground hover:text-foreground"
                              options={allSelectOptions}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={stageIdx === activeStages.length - 1}
                            onClick={() => moveStage(app.id, stageIdx, 'next')}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                            title="Move to next stage"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </ScrollArea>
  );
}
