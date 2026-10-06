import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import {
  useApplicationStatuses,
  useCreateStatusMutation,
  useUpdateStatusMutation,
  useReorderStatusesMutation,
  useDeleteStatusMutation,
} from '../hooks/use-application-statuses';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { CloseType } from '@tracker/types';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Lock,
  GitBranch,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Select, SelectOption } from '@/components/ui/select';

const ICON_OPTIONS: SelectOption<CloseType>[] = [
  { value: 'CANCELLED', label: 'Slash (⊘)', icon: <StageRing status={{ closeType: 'CANCELLED' }} size={16} /> },
  { value: 'OTHER', label: 'Minus (⊖)', icon: <StageRing status={{ closeType: 'OTHER' }} size={16} /> },
  { value: 'WITHDRAWN', label: 'Dashed Ring', icon: <StageRing status={{ closeType: 'WITHDRAWN' }} size={16} /> },
  { value: 'REJECTED', label: 'Cross (✕)', icon: <StageRing status={{ closeType: 'REJECTED' }} size={16} /> },
  { value: 'NO_RESPONSE', label: 'Dotted Ring', icon: <StageRing status={{ closeType: 'NO_RESPONSE' }} size={16} /> },
];

export function PipelineStagesSection() {
  const { data: statuses, isLoading, error: queryError } = useApplicationStatuses();
  const createMutation = useCreateStatusMutation();
  const updateMutation = useUpdateStatusMutation();
  const reorderMutation = useReorderStatusesMutation();
  const deleteMutation = useDeleteStatusMutation();

  const [newStageName, setNewStageName] = useState('');
  const [newClosedName, setNewClosedName] = useState('');
  const [newClosedType, setNewClosedType] = useState<CloseType>('CANCELLED');
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const activeStages = useMemo(() => {
    if (!statuses) return [];
    return statuses
      .filter((s) => s.closeType === null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [statuses]);

  const [localStages, setLocalStages] = useState(activeStages);
  const localStagesRef = useRef(localStages);
  localStagesRef.current = localStages;
  const initialOrderRef = useRef<string[]>([]);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevPositionsRef = useRef<Map<string, number>>(new Map());

  // FLIP layout animation: smooth slide transitions when rows reorder in real time
  useLayoutEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    localStages.forEach((stage) => {
      const el = itemRefs.current.get(stage.id);
      if (!el) return;

      const newTop = el.getBoundingClientRect().top;
      const prevTop = prevPositionsRef.current.get(stage.id);

      if (prevTop !== undefined && !prefersReducedMotion) {
        const deltaY = prevTop - newTop;
        if (deltaY !== 0 && stage.id !== draggedId) {
          el.animate(
            [
              { transform: `translateY(${deltaY}px)` },
              { transform: 'translateY(0px)' },
            ],
            {
              duration: 200,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
          );
        }
      }

      prevPositionsRef.current.set(stage.id, newTop);
    });
  }, [localStages, draggedId]);

  useEffect(() => {
    if (!draggedId) {
      setLocalStages(activeStages);
    }
  }, [activeStages, draggedId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-small text-muted-foreground font-sans">
          Loading pipeline configuration...
        </span>
      </div>
    );
  }

  if (queryError || !statuses) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
        <p className="text-body font-medium text-destructive">
          Failed to load pipeline stages
        </p>
        <p className="text-small text-muted-foreground mt-1">
          {queryError instanceof Error ? queryError.message : 'Please check your connection and try again.'}
        </p>
      </div>
    );
  }

  const closedOutcomes = statuses
    .filter((s) => s.closeType !== null);

  const totalActive = localStages.length;

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 6000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const trimmed = newStageName.trim();
    if (!trimmed) return;

    try {
      await createMutation.mutateAsync({ name: trimmed });
      setNewStageName('');
      showNotification(`Added stage "${trimmed}" to active pipeline.`);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to add stage.', true);
    }
  };

  const handleAddClosedOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const trimmed = newClosedName.trim();
    if (!trimmed) return;

    try {
      await createMutation.mutateAsync({ name: trimmed, closeType: newClosedType });
      setNewClosedName('');
      showNotification(`Added closed outcome "${trimmed}".`);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to add closed outcome.', true);
    }
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setActionError(null);
    setEditingStageId(id);
    setEditingStageName(currentName);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingStageName.trim();
    if (!trimmed) return;

    try {
      await updateMutation.mutateAsync({ id, input: { name: trimmed } });
      setEditingStageId(null);
      showNotification(`Renamed to "${trimmed}".`);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to rename.', true);
    }
  };

  const handleCancelEdit = () => {
    setEditingStageId(null);
    setEditingStageName('');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    initialOrderRef.current = localStagesRef.current.map((s) => s.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    requestAnimationFrame(() => {
      setDraggedId(id);
    });
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedId || draggedId === targetId) return;

    const sourceIndex = localStages.findIndex((s) => s.id === draggedId);
    const targetIndex = localStages.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const targetRect = e.currentTarget.getBoundingClientRect();
    const midY = targetRect.top + targetRect.height / 2;

    // Midpoint hysteresis: only swap once cursor passes target's vertical center
    if (sourceIndex < targetIndex && e.clientY < midY) return;
    if (sourceIndex > targetIndex && e.clientY > midY) return;

    setLocalStages((prev) => {
      const curSource = prev.findIndex((s) => s.id === draggedId);
      const curTarget = prev.findIndex((s) => s.id === targetId);
      if (curSource === -1 || curTarget === -1 || curSource === curTarget) return prev;

      const next = [...prev];
      const [moved] = next.splice(curSource, 1);
      next.splice(curTarget, 0, moved);
      return next;
    });
  };

  const handleDragEnd = async () => {
    const activeDraggedId = draggedId;
    setDraggedId(null);

    if (!activeDraggedId) return;

    const newIds = localStagesRef.current.map((s) => s.id);
    const initialIds = initialOrderRef.current;
    const hasChanged = newIds.some((id, idx) => id !== initialIds[idx]);

    if (hasChanged) {
      try {
        await reorderMutation.mutateAsync({ statusIds: newIds });
      } catch (err: any) {
        showNotification(err?.message || 'Failed to reorder stages.', true);
        setLocalStages(activeStages);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDeleteId(null);
      showNotification(`Deleted "${name}".`);
    } catch (err: any) {
      setConfirmDeleteId(null);
      showNotification(
        err?.message || 'Cannot delete while applications are currently assigned to it.',
        true
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2">
          <GitBranch size={20} className="text-primary" />
          <h2 className="font-display font-semibold text-heading text-foreground">
            Pipeline & Stages
          </h2>
        </div>
        <p className="text-small text-muted-foreground mt-1 max-w-2xl font-sans">
          Configure the dynamic stages of your hiring process. Active stages appear in sequential order
          on your Kanban board and funnel metrics. Closed outcomes track terminal results.
        </p>
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-small leading-tight">
            <span className="font-semibold">Unable to complete action: </span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-destructive/20 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-primary animate-fade-in">
          <span className="text-small font-medium">{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="p-1 hover:bg-primary/20 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Active Pipeline Stages */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b border-border/70 pb-2">
          <div>
            <h3 className="font-display font-semibold text-body text-foreground">
              Active Pipeline Stages ({totalActive})
            </h3>
          </div>
        </div>

        {/* Stage List */}
        <div
          className="flex flex-col divide-y divide-border/60"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        >
          {localStages.map((stage, idx) => {
            const isEditing = editingStageId === stage.id;
            const isConfirmingDelete = confirmDeleteId === stage.id;
            const isDragging = draggedId === stage.id;

            return (
              <div
                key={stage.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(stage.id, el);
                  else itemRefs.current.delete(stage.id);
                }}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, stage.id)}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center justify-between py-3 px-2.5 gap-3 rounded-lg transition-colors duration-150 ease-out select-none',
                  isEditing ? 'bg-secondary/40' : 'hover:bg-card/80 cursor-grab active:cursor-grabbing',
                  isDragging
                    ? 'opacity-35 bg-secondary/80 border border-dashed border-primary/30 scale-[0.99] shadow-xs'
                    : 'opacity-100'
                )}
              >
                {/* Left: Grip, Order, Ring, Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="text-muted-foreground/35 hover:text-foreground cursor-grab active:cursor-grabbing p-1 -ml-1 rounded transition-all duration-150 hover:scale-110 active:scale-95 shrink-0"
                    title="Drag to reorder"
                    aria-label={`Drag ${stage.name} to reorder`}
                  >
                    <GripVertical size={16} />
                  </div>

                  <span className="font-mono text-[12px] text-muted-foreground w-5 text-right shrink-0 tabular-nums transition-colors duration-150">
                    #{idx + 1}
                  </span>

                  <StageRing status={{ ...stage, order: idx }} size={20} totalStages={totalActive} />

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-[280px]">
                      <input
                        type="text"
                        value={editingStageName}
                        onChange={(e) => setEditingStageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(stage.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        className="h-8 px-2.5 text-body bg-background border border-primary rounded-md w-full focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={() => handleSaveEdit(stage.id)}
                        disabled={updateMutation.isPending || !editingStageName.trim()}
                        className="p-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all duration-150 active:scale-90"
                        title="Save name"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 active:scale-90"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display font-medium text-[15px] text-foreground truncate">
                        {stage.name}
                      </span>
                      {stage.isDefault && (
                        <span className="text-[10px] font-mono uppercase tracking-wider bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border/70">
                          Default
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Controls & Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit Button */}
                    <button
                      type="button"
                      draggable={false}
                      onDragStart={(e) => e.stopPropagation()}
                      onClick={() => handleStartEdit(stage.id, stage.name)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 active:scale-90"
                      title="Rename stage"
                      aria-label={`Rename ${stage.name}`}
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Delete with inline check and cross confirmation */}
                    {stage.isDefault ? (
                      <div
                        className="p-1.5 text-muted-foreground/40 flex items-center justify-center w-7 h-7"
                        title="Default pipeline stage (cannot be deleted)"
                      >
                        <Lock size={14} />
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-border animate-scale-up">
                        <button
                          type="button"
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                          onClick={() => handleDelete(stage.id, stage.name)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded hover:bg-destructive/15 text-destructive cursor-pointer disabled:opacity-50 transition-all duration-150 active:scale-90"
                          title="Confirm delete"
                          aria-label={`Confirm delete ${stage.name}`}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Check size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          draggable={false}
                          onDragStart={(e) => e.stopPropagation()}
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 active:scale-90"
                          title="Cancel delete"
                          aria-label="Cancel delete"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={() => setConfirmDeleteId(stage.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer ml-0.5 transition-all duration-150 active:scale-90"
                        title="Delete stage"
                        aria-label={`Delete ${stage.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Stage Form */}
        <form onSubmit={handleAddStage} className="flex items-center gap-2 pt-3 mt-1">
          <input
            type="text"
            placeholder="Add new stage (e.g. Technical Assignment, Executive Chat)..."
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="flex-1 h-9 px-3 text-body bg-background border border-input rounded-md focus-visible:outline-2 focus-visible:outline-primary transition-colors"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newStageName.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground font-medium text-small hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Plus size={15} />
            )}
            <span>Add Stage</span>
          </button>
        </form>
      </div>

      {/* Hairline Divider */}
      <div className="h-px bg-border my-2" />

      {/* 2. Closed Outcomes */}
      <div className="flex flex-col gap-4">
        <div className="border-b border-border/70 pb-2">
          <h3 className="font-display font-semibold text-body text-foreground">
            Closed Outcomes ({closedOutcomes.length})
          </h3>
        </div>

        <div className="flex flex-col divide-y divide-border/60">
          {closedOutcomes.map((outcome) => {
            const isEditing = editingStageId === outcome.id;
            const isConfirmingDelete = confirmDeleteId === outcome.id;

            return (
              <div
                key={outcome.id}
                className={cn(
                  'flex items-center justify-between py-3 px-2 gap-3 transition-colors duration-150',
                  isEditing ? 'bg-secondary/40 rounded-lg' : 'hover:bg-card/80'
                )}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <StageRing status={outcome} size={20} />

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-[280px]">
                      <input
                        type="text"
                        value={editingStageName}
                        onChange={(e) => setEditingStageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(outcome.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        className="h-8 px-2.5 text-body bg-background border border-primary rounded-md w-full focus-visible:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(outcome.id)}
                        disabled={updateMutation.isPending || !editingStageName.trim()}
                        className="p-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        title="Save name"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display font-medium text-[15px] text-foreground truncate">
                        {outcome.name}
                      </span>
                      {outcome.isDefault && (
                        <span className="text-[10px] font-mono uppercase tracking-wider bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border/70">
                          Default
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(outcome.id, outcome.name)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 active:scale-90"
                      title="Rename outcome"
                      aria-label={`Rename ${outcome.name}`}
                    >
                      <Pencil size={15} />
                    </button>

                    {outcome.isDefault ? (
                      <div
                        className="p-1.5 text-muted-foreground/40 flex items-center justify-center w-7 h-7"
                        title="Default system outcome (cannot be deleted)"
                      >
                        <Lock size={14} />
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-border animate-scale-up">
                        <button
                          type="button"
                          onClick={() => handleDelete(outcome.id, outcome.name)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded hover:bg-destructive/15 text-destructive cursor-pointer disabled:opacity-50 transition-all duration-150 active:scale-90"
                          title="Confirm delete"
                          aria-label={`Confirm delete ${outcome.name}`}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Check size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 active:scale-90"
                          title="Cancel delete"
                          aria-label="Cancel delete"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(outcome.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer ml-0.5 transition-all duration-150 active:scale-90"
                        title="Delete outcome"
                        aria-label={`Delete ${outcome.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Closed Outcome Form */}
        <form onSubmit={handleAddClosedOutcome} className="flex items-center gap-2 pt-3 mt-1">
          <input
            type="text"
            placeholder="Add closed outcome (e.g. Hiring Freeze, Offer Declined)..."
            value={newClosedName}
            onChange={(e) => setNewClosedName(e.target.value)}
            className="flex-1 h-9 px-3 text-body bg-background border border-input rounded-md focus-visible:outline-2 focus-visible:outline-primary transition-colors"
          />
          <div className="w-[170px] sm:w-[185px] shrink-0">
            <Select<CloseType>
              value={newClosedType}
              onChange={(val) => setNewClosedType(val)}
              options={ICON_OPTIONS}
              aria-label="Select icon style"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || !newClosedName.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground font-medium text-small hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
          >
            {createMutation.isPending ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Plus size={15} />
            )}
            <span>Add</span>
          </button>
        </form>
      </div>
    </div>
  );
}
