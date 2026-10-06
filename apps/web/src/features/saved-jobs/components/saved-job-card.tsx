import React, { useState } from 'react';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { ApplicationDTO, formatWorkSetup } from '@tracker/types';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { PriorityGlyph } from '@/features/applications/components/priority-glyph';
import { ExternalLink, Check, Trash2, Calendar, MapPin, DollarSign, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SavedJobCardProps {
  application: ApplicationDTO;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  isApplying?: boolean;
}

export function SavedJobCard({
  application,
  onApply,
  onDelete,
  isApplying = false,
}: SavedJobCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { job, company } = application;

  const dateSaved = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const salaryDisplay =
    job?.salaryMin || job?.salaryMax
      ? `${job.currency || '$'}${job.salaryMin ? job.salaryMin.toLocaleString() : '0'} – ${
          job.salaryMax ? job.salaryMax.toLocaleString() : 'N/A'
        }`
      : null;

  return (
    <article className="border border-border rounded-lg bg-card p-4 transition-colors hover:border-foreground/20 flex flex-col justify-between gap-3 text-foreground">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <StageRing status="SAVED" size={18} />
          <span className="text-caption uppercase tracking-wider font-semibold text-muted-foreground">
            Saved opportunity
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PriorityGlyph priority={application.priority} />
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Remove from saved"
            aria-label="Remove from saved"
          >
            <Trash2 size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Role & Company */}
      <div>
        <Link
          to={`/applications/${application.id}`}
          className="font-display font-semibold text-subheading text-foreground tracking-tight hover:text-primary transition-colors no-underline block"
        >
          {job?.title || 'Untitled Opportunity'}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-small font-medium text-muted-foreground">
            {company?.name || 'Company Opportunity'}
          </span>
          {job?.source && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-caption text-muted-foreground bg-secondary px-2 py-0.2 rounded border border-border">
                {job.source}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Facts Row: Work Setup, Location, Salary, Saved Date */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-border text-small text-muted-foreground">
        {job?.workSetup && (
          <div className="flex items-center gap-1">
            <Building size={13} strokeWidth={1.5} />
            <span>{formatWorkSetup(job.workSetup)}</span>
          </div>
        )}

        {job?.location && (
          <div className="flex items-center gap-1">
            <MapPin size={13} strokeWidth={1.5} />
            <span>{job.location}</span>
          </div>
        )}

        {salaryDisplay && (
          <div className="flex items-center gap-1 text-foreground font-medium">
            <DollarSign size={13} strokeWidth={1.5} />
            <span>{salaryDisplay}</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Calendar size={13} strokeWidth={1.5} />
          <span>Saved {dateSaved}</span>
        </div>
      </div>

      {/* Notes preview if any */}
      {application.notes && (
        <p className="text-small text-muted-foreground line-clamp-2 italic bg-secondary/30 p-2 rounded border border-border">
          "{application.notes}"
        </p>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border mt-1">
        <div>
          {job?.sourceUrl ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-small text-primary hover:underline font-medium"
            >
              <span>View job posting</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-caption text-muted-foreground">No URL linked</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onApply(application.id)}
          disabled={isApplying}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Check size={14} strokeWidth={2} />
          <span>Mark as applied</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete(application.id);
          setIsDeleteModalOpen(false);
        }}
        title="Remove saved job?"
        description="This will remove the opportunity from your wishlist."
        itemName={`${job?.title || 'Job Opportunity'} at ${company?.name || 'Company'}`}
        variant="destructive"
        confirmLabel="Remove"
      />
    </article>
  );
}
