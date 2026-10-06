import React from 'react';
import { Link } from 'react-router-dom';
import { ResumeWithDetailsDTO } from '@tracker/types';
import { StageRing, getStatusConfig } from '@/features/applications/components/application-status-badge';
import { resolveDocumentUrl } from '../api/resume-api';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Briefcase,
  Calendar,
  Sparkles,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ResumeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeWithDetailsDTO | null;
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

export function ResumeDetailModal({
  isOpen,
  onClose,
  resume,
  onEdit,
  onDelete,
  onSetDefault,
}: ResumeDetailModalProps) {
  if (!isOpen || !resume) return null;

  const isPdf = resume.mimeType?.includes('pdf') || resume.filename?.toLowerCase().endsWith('.pdf');
  const resolvedUrl = resolveDocumentUrl(resume.fileUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileText size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="resume-detail-title" className="font-display font-bold text-heading text-foreground tracking-tight">
                  {resume.name}
                </h2>
                {resume.version && (
                  <span className="px-2 py-0.5 rounded text-micro font-mono font-medium bg-secondary text-secondary-foreground border border-border">
                    {resume.version}
                  </span>
                )}
                {resume.isDefault && (
                  <span
                    className="inline-flex items-center justify-center text-amber-500 shrink-0"
                    title="Default Resume"
                    aria-label="Default Resume"
                  >
                    <Star size={16} className="fill-amber-500 text-amber-500" />
                  </span>
                )}
              </div>

              {resume.targetRole && (
                <div className="text-small text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-muted-foreground" />
                  <span>Target: {resume.targetRole}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!resume.isDefault && (
              <button
                type="button"
                onClick={() => onSetDefault(resume)}
                className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-secondary rounded-lg transition-colors"
                title="Set as default resume"
                aria-label="Set as default resume"
              >
                <Star size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(resume)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              title="Edit resume"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(resume)}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Delete resume"
            >
              <Trash2 size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors ml-1"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {/* Document File / Download Card */}
          {resolvedUrl ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={24} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-small font-semibold text-foreground truncate">
                      {resume.filename || 'Attached Resume Document'}
                    </p>
                    <p className="text-micro text-muted-foreground flex items-center gap-2">
                      {resume.fileSize ? <span>{formatBytes(resume.fileSize)}</span> : null}
                      {resume.mimeType ? <span>• {resume.mimeType}</span> : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={resolvedUrl}
                    download={resume.filename || true}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-small font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-95 transition-opacity inline-flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Embedded Document Viewer if PDF */}
              {isPdf && (
                <div className="w-full h-80 rounded-xl overflow-hidden border border-border bg-muted/20">
                  <iframe
                    src={`${resolvedUrl}#toolbar=0&navpanes=0&view=FitH`}
                    title={resume.name}
                    className="w-full h-full border-0 bg-white dark:bg-zinc-900"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-secondary/30 border border-dashed border-border text-center text-small text-muted-foreground">
              No file attachment or document URL linked to this resume version.
            </div>
          )}

          {/* Highlighted Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-small font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" />
                <span>Highlighted Skills & Core Competencies</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-small font-medium bg-muted text-foreground border border-border"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tailoring Notes */}
          {resume.notes && (
            <div className="space-y-2">
              <h3 className="text-small font-semibold text-foreground">
                Tailoring Strategy & Version Notes
              </h3>
              <div className="p-4 rounded-xl bg-secondary/30 border border-border text-small text-foreground leading-relaxed whitespace-pre-wrap">
                {resume.notes}
              </div>
            </div>
          )}

          {/* Linked Applications */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-subheading font-display font-semibold text-foreground">
              Applications Using This Resume ({resume.applicationsCount})
            </h3>

            {resume.applications && resume.applications.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {resume.applications.map((app) => {
                  const statusCfg = getStatusConfig(app.status);
                  const appliedDate = app.appliedAt
                    ? new Date(app.appliedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not submitted';

                  return (
                    <Link
                      key={app.id}
                      to={`/applications/${app.id}`}
                      onClick={onClose}
                      className="group/item flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-secondary/60 hover:border-foreground/20 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StageRing status={app.status} size={18} />
                        <div className="min-w-0">
                          <p className="font-semibold text-small text-foreground truncate group-hover/item:text-primary transition-colors">
                            {app.job?.title || 'Unknown Position'}
                          </p>
                          <p className="text-micro text-muted-foreground flex items-center gap-1.5 truncate">
                            <Building2 size={12} />
                            <span>{app.company?.name || 'Company'}</span>
                            <span>• Applied {appliedDate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-micro font-medium text-muted-foreground">
                          {statusCfg.label}
                        </span>
                        <ChevronRight size={14} className="text-muted-foreground group-hover/item:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-1 bg-muted/10">
                <p className="text-small font-medium text-foreground">
                  No applications currently linked
                </p>
                <p className="text-micro text-muted-foreground">
                  When creating or updating an application, select this resume version to track where it was submitted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between text-micro text-muted-foreground">
          <span>Created on {new Date(resume.createdAt).toLocaleDateString()}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-small font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
