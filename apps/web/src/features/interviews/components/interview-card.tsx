import React, { useState } from 'react';
import { InterviewDTO, ApplicationStatus } from '@tracker/types';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { Calendar, Clock, Video, MapPin, User, ExternalLink, CheckCircle2, ChevronDown, ChevronUp, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface InterviewCardProps {
  interview: InterviewDTO;
  onStatusChange?: (id: string, status: string, result?: string) => void;
  onEdit?: (interview: InterviewDTO) => void;
  onDelete?: (id: string) => void;
}

export function InterviewCard({
  interview,
  onStatusChange,
  onEdit,
  onDelete,
}: InterviewCardProps) {
  const [showPrepNotes, setShowPrepNotes] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Map interview type to ApplicationStatus for StageRing
  const stageRingStatus: ApplicationStatus = (() => {
    switch (interview.type) {
      case 'HR':
        return 'HR_INTERVIEW';
      case 'TECHNICAL':
      case 'CODING_ASSESSMENT':
      case 'SYSTEM_DESIGN':
        return 'TECHNICAL_INTERVIEW';
      case 'FINAL':
      case 'HIRING_MANAGER':
      case 'CLIENT':
        return 'FINAL_INTERVIEW';
      case 'RECRUITER':
        return 'RECRUITER_CONTACTED';
      default:
        return 'HR_INTERVIEW';
    }
  })();

  const scheduledDate = new Date(interview.scheduledAt);
  const now = new Date();
  const isToday =
    scheduledDate.getFullYear() === now.getFullYear() &&
    scheduledDate.getMonth() === now.getMonth() &&
    scheduledDate.getDate() === now.getDate();

  const isPast = scheduledDate < now && interview.status === 'SCHEDULED';

  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const typeDisplay = interview.type.replace(/_/g, ' ').toLowerCase();
  const typeLabel = typeDisplay.charAt(0).toUpperCase() + typeDisplay.slice(1);

  return (
    <article className="border border-border rounded-lg bg-card p-4 transition-colors hover:border-foreground/20 flex flex-col justify-between gap-3 text-foreground">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StageRing status={stageRingStatus} size={18} />
          <span className="font-sans text-small font-medium text-foreground">
            {typeLabel} interview
          </span>
          <span className="text-caption text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
            Round {interview.round}
          </span>

          {interview.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1 text-caption text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
              <CheckCircle2 size={12} />
              Completed {interview.result && interview.result !== 'PENDING' ? `(${interview.result.toLowerCase()})` : ''}
            </span>
          )}

          {interview.status === 'CANCELLED' && (
            <span className="text-caption text-muted-foreground line-through bg-secondary px-2 py-0.5 rounded">
              Cancelled
            </span>
          )}
        </div>

        {/* Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Interview options"
          >
            <MoreVertical size={16} strokeWidth={1.5} />
          </button>

          {showActionsMenu && (
            <div className="absolute right-0 top-7 w-40 bg-card border border-border rounded-md shadow-md py-1 z-10 text-small">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    onEdit(interview);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-secondary text-foreground"
                >
                  <Edit2 size={14} />
                  <span>Edit details</span>
                </button>
              )}
              {interview.status === 'SCHEDULED' && onStatusChange && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onStatusChange(interview.id, 'COMPLETED', 'PASSED');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-secondary text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark passed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onStatusChange(interview.id, 'COMPLETED', 'PENDING');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-secondary text-foreground"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark completed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsMenu(false);
                      onStatusChange(interview.id, 'CANCELLED');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-secondary text-muted-foreground"
                  >
                    <span>Cancel interview</span>
                  </button>
                </>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    if (window.confirm('Delete this interview record?')) {
                      onDelete(interview.id);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-destructive/10 text-destructive border-t border-border mt-1"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role & Company */}
      <div>
        <h4 className="font-display font-semibold text-subheading text-foreground tracking-tight m-0">
          {interview.application?.job.title || interview.title || 'Role Interview'}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <Link
            to={`/applications/${interview.applicationId}`}
            className="text-small text-muted-foreground hover:text-primary font-medium transition-colors"
          >
            {interview.application?.company.name || 'Company Opportunity'}
          </Link>
          {interview.title && interview.application?.job.title && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-caption text-muted-foreground">{interview.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Date, Time & Meeting Platform */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 border-t border-border text-small">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-muted-foreground" strokeWidth={1.5} />
          {isToday ? (
            <span className="marker font-medium">Today, {formattedTime}</span>
          ) : (
            <span className={cn('font-medium', isPast && 'text-amber-600 dark:text-amber-400')}>
              {formattedDate}, {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock size={14} strokeWidth={1.5} />
          <span>{interview.durationMinutes} min</span>
        </div>

        {(interview.location || interview.meetingUrl) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {interview.meetingUrl ? (
              <Video size={14} strokeWidth={1.5} />
            ) : (
              <MapPin size={14} strokeWidth={1.5} />
            )}
            <span>{interview.location || 'Online'}</span>
          </div>
        )}

        {interview.interviewerName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User size={14} strokeWidth={1.5} />
            <span>
              {interview.interviewerName}
              {interview.interviewerRole ? ` (${interview.interviewerRole})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Action Strip: Join Meeting Button & Prep Notes */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border mt-1">
        <div className="flex items-center gap-2">
          {interview.meetingUrl ? (
            <a
              href={interview.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-primary text-primary-foreground text-small font-medium hover:bg-primary-hover no-underline transition-colors"
            >
              <span>Join meeting</span>
              <ExternalLink size={13} strokeWidth={1.5} />
            </a>
          ) : null}

          {interview.prepNotes && (
            <button
              type="button"
              onClick={() => setShowPrepNotes(!showPrepNotes)}
              className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-secondary transition-colors"
            >
              <span>Prep notes</span>
              {showPrepNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {interview.status === 'SCHEDULED' && onStatusChange && (
          <button
            type="button"
            onClick={() => onStatusChange(interview.id, 'COMPLETED')}
            className="text-caption font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            Mark completed
          </button>
        )}
      </div>

      {/* Expandable Prep Notes */}
      {showPrepNotes && interview.prepNotes && (
        <div className="bg-secondary/40 border border-border rounded p-3 text-small text-foreground whitespace-pre-wrap mt-2">
          <div className="text-caption uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Preparation & Talking Points
          </div>
          {interview.prepNotes}
        </div>
      )}
    </article>
  );
}
