import React, { useState } from 'react';
import { ResumeWithDetailsDTO } from '@tracker/types';
import { StageRing, STATUS_CONFIG } from '@/features/applications/components/application-status-badge';
import { resolveDocumentUrl } from '../api/resume-api';
import {
  FileText,
  Download,
  Star,
  Pencil,
  Trash2,
  Briefcase,
  Eye,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ResumeCardProps {
  resume: ResumeWithDetailsDTO;
  onSelect: (resume: ResumeWithDetailsDTO) => void;
  onEdit: (resume: ResumeWithDetailsDTO) => void;
  onDelete: (resume: ResumeWithDetailsDTO) => void;
  onSetDefault: (resume: ResumeWithDetailsDTO) => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function ResumeCard({
  resume,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: ResumeCardProps) {
  const [iframeError, setIframeError] = useState(false);
  const resolvedUrl = resolveDocumentUrl(resume.fileUrl);

  const isPdf =
    resume.mimeType?.includes('pdf') ||
    resume.filename?.toLowerCase().endsWith('.pdf') ||
    resume.fileUrl?.toLowerCase().includes('.pdf');

  const isDoc =
    resume.mimeType?.includes('word') ||
    resume.filename?.toLowerCase().endsWith('.doc') ||
    resume.filename?.toLowerCase().endsWith('.docx');

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={() => onSelect(resume)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(resume);
        }
      }}
      className={cn(
        'group bg-card border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-ring hover:shadow-md',
        resume.isDefault
          ? 'border-primary/50 shadow-[0_0_0_1px_rgba(var(--primary),0.15)]'
          : 'border-border hover:border-foreground/30'
      )}
    >
      {/* 1. File Preview Area */}
      <div className="relative w-full h-44 bg-muted/20 border-b border-border/70 overflow-hidden flex items-center justify-center group/preview">
        {resolvedUrl && isPdf && !iframeError ? (
          <>
            {/* Embedded Live PDF Preview - right edge scrollbar clipped */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <iframe
                src={`${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={resume.name}
                scrolling="no"
                onError={() => setIframeError(true)}
                className="w-[calc(100%+36px)] max-w-none h-full border-0 select-none bg-white/95 dark:bg-zinc-900/90 pointer-events-none"
                tabIndex={-1}
                loading="lazy"
              />
            </div>
            {/* Gradient bottom overlay to blend cleanly */}
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          /* Document Mock Preview for DOCX, links, or fallback */
          <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-card via-secondary/30 to-secondary/60">
            <div className="space-y-2 opacity-75">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center font-bold text-micro">
                  {isDoc ? 'DOC' : isPdf ? 'PDF' : 'CV'}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="h-2 bg-foreground/25 rounded w-1/3" />
                  <div className="h-1.5 bg-foreground/15 rounded w-1/2" />
                </div>
              </div>
              <div className="pt-2 space-y-1.5 border-t border-border/40">
                <div className="h-1.5 bg-foreground/20 rounded w-full" />
                <div className="h-1.5 bg-foreground/15 rounded w-11/12" />
                <div className="h-1.5 bg-foreground/10 rounded w-4/5" />
                <div className="h-1.5 bg-foreground/15 rounded w-3/4" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-micro text-muted-foreground font-mono">
              <FileText size={12} className="text-muted-foreground" />
              <span className="truncate">{resume.filename || 'Document Version'}</span>
            </div>
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          {resume.version && (
            <span className="px-2 py-0.5 rounded text-micro font-mono font-medium bg-background/90 text-foreground border border-border/80 shadow-xs backdrop-blur-xs">
              {resume.version}
            </span>
          )}
          {isPdf ? (
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 backdrop-blur-xs">
              PDF
            </span>
          ) : isDoc ? (
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-xs">
              DOC
            </span>
          ) : null}
        </div>

        {resume.isDefault && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none" title="Default Resume">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-background/90 text-amber-500 border border-border/80 shadow-xs backdrop-blur-xs">
              <Star size={13} className="fill-amber-500 text-amber-500" />
            </span>
          </div>
        )}

        {/* Hover Click-to-preview overlay */}
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-10">
          <span className="px-3 py-1 rounded-full bg-background/95 text-foreground text-micro font-semibold shadow-sm border border-border flex items-center gap-1.5">
            <Eye size={13} className="text-primary" />
            <span>Click to inspect</span>
          </span>
        </div>
      </div>

      {/* 2. Content Body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <h3 className="font-display font-semibold text-subheading text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
            {resume.name}
          </h3>

          {resume.targetRole && (
            <div className="text-small text-muted-foreground font-medium truncate mt-0.5 flex items-center gap-1.5">
              <Briefcase size={12} className="shrink-0 text-muted-foreground" />
              <span>{resume.targetRole}</span>
            </div>
          )}
        </div>

        {/* Skills Pills */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {resume.skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-micro font-medium bg-muted/60 text-muted-foreground border border-border/60"
              >
                {skill}
              </span>
            ))}
            {resume.skills.length > 4 && (
              <span className="px-1.5 py-0.5 rounded text-micro font-medium text-muted-foreground">
                +{resume.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Tailoring Notes */}
        {resume.notes && (
          <p className="text-micro text-muted-foreground line-clamp-1 italic mt-auto pt-1">
            "{resume.notes}"
          </p>
        )}
      </div>

      {/* 3. Card Footer with Icon-Only Actions */}
      <div className="px-4 py-3 border-t border-border bg-card flex items-center justify-between gap-2">
        {/* Left: Applications count + StageRings + File Size */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-micro text-muted-foreground shrink-0">
            <span className="font-bold text-foreground">{resume.applicationsCount}</span>
            <span>{resume.applicationsCount === 1 ? 'application' : 'applications'}</span>
          </div>

          {resume.fileSize ? (
            <span className="text-micro text-muted-foreground truncate">
              • {formatBytes(resume.fileSize)}
            </span>
          ) : null}

          {resume.applications && resume.applications.length > 0 && (
            <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden ml-1">
              {resume.applications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center p-0.5"
                  title={`${app.company?.name || 'Company'} — ${STATUS_CONFIG[app.status]?.label || app.status}`}
                >
                  <StageRing status={app.status} size={11} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Icon-Only Action Buttons */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Download Button (ICON ONLY) */}
          {resolvedUrl && (
            <a
              href={resolvedUrl}
              download={resume.filename || true}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors inline-flex items-center justify-center"
              title={`Download ${resume.filename || 'resume'}`}
              aria-label={`Download ${resume.filename || 'resume'}`}
            >
              <Download size={15} />
            </a>
          )}

          {/* Set Default Button */}
          {!resume.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(resume)}
              className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-secondary rounded-lg transition-colors inline-flex items-center justify-center"
              title="Set as default resume"
              aria-label="Set as default resume"
            >
              <Star size={15} />
            </button>
          )}

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(resume)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors inline-flex items-center justify-center"
            title="Edit resume"
            aria-label={`Edit ${resume.name}`}
          >
            <Pencil size={15} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(resume)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors inline-flex items-center justify-center"
            title="Delete resume"
            aria-label={`Delete ${resume.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
