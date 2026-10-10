import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoverLetterWithDetailsDTO } from '@tracker/types';
import { resolveDocumentUrl } from '../api/resume-api';
import { describeLetterAttempt } from '../attempt-display';
import {
  FileText,
  Download,
  Pencil,
  Trash2,
  Briefcase,
  Eye,
  Building2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CoverLetterCardProps {
  coverLetter: CoverLetterWithDetailsDTO;
  onSelect: (letter: CoverLetterWithDetailsDTO) => void;
  onEdit: (letter: CoverLetterWithDetailsDTO) => void;
  onDelete: (letter: CoverLetterWithDetailsDTO) => void;
}

export function CoverLetterCard({
  coverLetter,
  onSelect,
  onEdit,
  onDelete,
}: CoverLetterCardProps) {
  const [iframeError, setIframeError] = useState(false);
  const attempt = describeLetterAttempt(coverLetter);
  const resolvedUrl = coverLetter.fileUrl ? resolveDocumentUrl(coverLetter.fileUrl) : null;
  const isPdf = Boolean(resolvedUrl && (coverLetter.fileUrl?.toLowerCase().includes('.pdf') || coverLetter.fileUrl?.includes('uploads/cover-letters')));

  const linkedApp = coverLetter.application;

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={() => onSelect(coverLetter)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(coverLetter);
        }
      }}
      className={cn(
        'group bg-card border border-border hover:border-foreground/30 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-ring hover:shadow-md'
      )}
    >
      {/* 1. File Preview Area */}
      <div className="relative w-full h-44 bg-muted/20 border-b border-border/70 overflow-hidden flex items-center justify-center group/preview">
        {resolvedUrl && isPdf && !iframeError ? (
          <>
            {/* Embedded Live PDF Preview */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <iframe
                src={`${resolvedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={coverLetter.name}
                scrolling="no"
                onError={() => setIframeError(true)}
                className="w-[calc(100%+36px)] max-w-none h-full border-0 select-none bg-white/95 dark:bg-zinc-900/90 pointer-events-none"
                tabIndex={-1}
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          /* Editorial Markdown Snippet Preview */
          <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-card via-secondary/20 to-secondary/50">
            <div className="space-y-1.5 opacity-80 overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-micro">
                  CL
                </div>
                <span className="text-micro font-mono text-muted-foreground uppercase tracking-wider">
                  Cover Letter Document
                </span>
              </div>
              <p className="text-micro text-muted-foreground line-clamp-4 font-sans leading-relaxed italic">
                {coverLetter.content.slice(0, 220)}...
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-micro text-muted-foreground font-mono">
              <FileText size={12} className="text-muted-foreground" />
              <span className="truncate">{coverLetter.company || 'Direct Submission'}</span>
            </div>
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-background/90 text-foreground border border-border/80 shadow-xs backdrop-blur-xs">
            COVER LETTER
          </span>
          {attempt.showRevision && attempt.revisionLabel ? (
            <span
              className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-muted text-muted-foreground border border-border backdrop-blur-xs"
              title="Revision in this application's lineage"
            >
              {attempt.revisionLabel.toUpperCase()}
            </span>
          ) : null}
          {attempt.isCanonical ? (
            <span
              className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-xs"
              title="Letter you chose to keep"
            >
              KEPT
            </span>
          ) : null}
          {coverLetter.matchScore ? (
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/15 text-primary border border-primary/20 backdrop-blur-xs">
              {coverLetter.matchScore}% MATCH
            </span>
          ) : null}
          {isPdf && (
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 backdrop-blur-xs">
              PDF
            </span>
          )}
        </div>

        {/* Hover Click-to-inspect overlay */}
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
            {coverLetter.name}
          </h3>

          {(coverLetter.role || coverLetter.company) && (
            <div className="text-small text-muted-foreground font-medium truncate mt-0.5 flex items-center gap-1.5">
              <Briefcase size={12} className="shrink-0 text-muted-foreground" />
              <span>
                {coverLetter.role || 'Role'} {coverLetter.company ? `at ${coverLetter.company}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Echoed phrases tag */}
        {coverLetter.echoedPhrases && coverLetter.echoedPhrases.length > 0 && (
          <div className="flex items-center gap-1 text-micro text-primary font-medium">
            <Sparkles size={12} className="shrink-0" />
            <span>{coverLetter.echoedPhrases.length} JD phrases targeted</span>
          </div>
        )}

        {/* Linked Application Pill */}
        {linkedApp ? (
          <div className="flex items-center justify-between gap-1.5 text-micro font-medium text-foreground bg-secondary/60 border border-border/60 rounded-md px-2 py-1 max-w-full">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 size={12} className="text-primary shrink-0" />
              <span className="truncate">
                {linkedApp.company?.name || 'Company'}
                {linkedApp.job?.title ? ` • ${linkedApp.job.title}` : ''}
              </span>
            </div>
            <Link
              to={`/applications/${linkedApp.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-0.5 text-muted-foreground hover:text-primary rounded shrink-0 transition-colors"
              title="Open application"
              aria-label="Open application"
            >
              <ExternalLink size={12} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-micro text-muted-foreground bg-muted/40 border border-border/40 rounded-md px-2 py-1">
            <span className="truncate">General Document (Unlinked)</span>
          </div>
        )}
      </div>

      {/* 3. Card Footer with Actions */}
      <div className="px-4 py-3 border-t border-border bg-card flex items-center justify-between gap-2">
        {/* Left: Document type / Date */}
        <div className="flex items-center gap-2 min-w-0 text-micro text-muted-foreground">
          <span>{new Date(coverLetter.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Right: Icon-Only Action Buttons */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Download PDF Button */}
          {resolvedUrl && (
            <a
              href={resolvedUrl}
              download={true}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors inline-flex items-center justify-center"
              title={`Download ${coverLetter.name}`}
              aria-label={`Download ${coverLetter.name}`}
            >
              <Download size={15} />
            </a>
          )}

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(coverLetter)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors inline-flex items-center justify-center"
            title="Edit cover letter"
            aria-label={`Edit ${coverLetter.name}`}
          >
            <Pencil size={15} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(coverLetter)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors inline-flex items-center justify-center"
            title="Delete cover letter"
            aria-label={`Delete ${coverLetter.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
