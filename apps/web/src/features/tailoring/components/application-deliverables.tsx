import React from 'react';
import {
  FileText,
  Download,
  Eye,
  Sparkles,
  Plus,
} from 'lucide-react';
import { ResumeDTO, CoverLetterDTO } from '@tracker/types';
import { resolveDocumentUrl } from '@/features/resumes/api/resume-api';
import { cn } from '@/lib/cn';

interface ApplicationDeliverablesProps {
  resume?: ResumeDTO | null;
  coverLetter?: CoverLetterDTO | null;
  onPreviewResume: () => void;
  onPreviewCoverLetter: () => void;
  onOpenStudio: () => void;
  className?: string;
}

export function ApplicationDeliverables({
  resume,
  coverLetter,
  onPreviewResume,
  onPreviewCoverLetter,
  onOpenStudio,
  className,
}: ApplicationDeliverablesProps) {
  const resumeDownloadUrl = resume?.fileUrl ? resolveDocumentUrl(resume.fileUrl) : null;
  const coverLetterDownloadUrl = coverLetter?.fileUrl ? resolveDocumentUrl(coverLetter.fileUrl) : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <div>
          <h3 className="font-display font-semibold text-subheading text-foreground">
            Application Deliverables
          </h3>
          <p className="text-caption text-muted-foreground mt-0.5">
            Tailored resume document and targeted cover letter created specifically for this opportunity.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex items-center gap-1.5 text-small text-primary hover:text-primary-hover font-medium cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Tailoring Studio</span>
        </button>
      </div>

      <div className="divide-y divide-border/60">
        {/* Deliverable 1: Resume */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={18} />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-small text-foreground">
                  Resume
                </span>
                {resume?.isTailored && (
                  <span className="px-2 py-0.2 rounded-full text-micro font-medium bg-primary/10 text-primary border border-primary/20">
                    {resume.matchScore ? `${resume.matchScore}% Match` : 'Tailored'}
                  </span>
                )}
              </div>

              {resume ? (
                <div className="flex items-center gap-2 text-caption text-muted-foreground truncate">
                  <span className="font-medium text-foreground truncate max-w-[280px]">
                    {resume.name}
                  </span>
                  {resume.targetRole && <span>• {resume.targetRole}</span>}
                </div>
              ) : (
                <p className="text-caption text-muted-foreground italic">
                  No tailored resume generated yet for this application.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            {resume ? (
              <>
                <button
                  type="button"
                  onClick={onPreviewResume}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-caption font-medium border border-border bg-background hover:bg-secondary text-foreground transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
                {resumeDownloadUrl && (
                  <a
                    href={resumeDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-caption font-medium border border-border bg-background hover:bg-secondary text-foreground transition-colors"
                    download
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </a>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenStudio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer border border-border"
              >
                <Plus size={13} />
                <span>Tailor resume</span>
              </button>
            )}
          </div>
        </div>

        {/* Deliverable 2: Cover Letter */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={18} />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-small text-foreground">
                  Cover Letter
                </span>
                {coverLetter && (
                  <span className="px-2 py-0.2 rounded-full text-micro font-medium bg-primary/10 text-primary border border-primary/20">
                    {coverLetter.echoedPhrases?.length || 0} Echoes
                  </span>
                )}
              </div>

              {coverLetter ? (
                <div className="flex items-center gap-2 text-caption text-muted-foreground truncate">
                  <span className="font-medium text-foreground truncate max-w-[280px]">
                    {coverLetter.name}
                  </span>
                  {coverLetter.role && (
                    <span>
                      • {coverLetter.role} {coverLetter.company ? `(${coverLetter.company})` : ''}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-caption text-muted-foreground italic">
                  No targeted cover letter generated yet.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            {coverLetter ? (
              <>
                <button
                  type="button"
                  onClick={onPreviewCoverLetter}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-caption font-medium border border-border bg-background hover:bg-secondary text-foreground transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Preview & Edit</span>
                </button>
                {coverLetterDownloadUrl && (
                  <a
                    href={coverLetterDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-caption font-medium border border-border bg-background hover:bg-secondary text-foreground transition-colors"
                    download
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </a>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenStudio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-caption font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer border border-border"
              >
                <Plus size={13} />
                <span>Draft targeted letter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
