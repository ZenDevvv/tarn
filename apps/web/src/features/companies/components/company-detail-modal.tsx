import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyWithDetailsDTO } from '@tracker/types';
import { StageRing, STATUS_CONFIG } from '@/features/applications/components/application-status-badge';
import {
  X,
  Building2,
  ExternalLink,
  MapPin,
  Tag,
  Calendar,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  DollarSign,
  Laptop,
} from 'lucide-react';

export interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyWithDetailsDTO | null;
  isLoading?: boolean;
  onEdit: (company: CompanyWithDetailsDTO) => void;
  onDelete: (company: CompanyWithDetailsDTO) => void;
}

export function CompanyDetailModal({
  isOpen,
  onClose,
  company,
  isLoading = false,
  onEdit,
  onDelete,
}: CompanyDetailModalProps) {
  // Escape key handler
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Loading company details"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl p-8 flex flex-col items-center justify-center gap-4 animate-scale-up text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-small text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Company not found"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center gap-3 animate-scale-up text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Building2 size={32} className="text-muted-foreground/60 mb-1" />
          <h3 className="font-display font-semibold text-subheading text-foreground">
            Company Not Found
          </h3>
          <p className="text-small text-muted-foreground">
            The requested company could not be found or you may not have permission to view it.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small transition-colors cursor-pointer"
          >
            Back to companies
          </button>
        </div>
      </div>
    );
  }

  const websiteUrl = company.website
    ? company.website.startsWith('http')
      ? company.website
      : `https://${company.website}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 shrink-0 bg-background/50">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="company-detail-title"
                className="font-display font-bold text-heading text-foreground tracking-tight"
              >
                {company.name}
              </h2>
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-accent text-secondary-foreground text-small font-medium transition-colors"
                >
                  <span>Visit website</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Sub-header attributes */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-small text-muted-foreground">
              {company.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 size={13} className="text-muted-foreground" />
                  <span>{company.industry}</span>
                </span>
              )}
              {company.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-muted-foreground" />
                  <span>{company.location}</span>
                </span>
              )}
              {company.createdAt && (
                <span className="inline-flex items-center gap-1 text-micro">
                  <Calendar size={13} className="text-muted-foreground" />
                  <span>Tracked since {new Date(company.createdAt).toLocaleDateString()}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(company)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Edit company"
              aria-label="Edit company"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(company)}
              className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors cursor-pointer"
              title="Delete company"
              aria-label="Delete company"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer ml-1"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
          {/* Company Notes / Description */}
          {company.description ? (
            <div className="p-4 rounded-lg bg-secondary/40 border border-border/80">
              <h4 className="text-micro uppercase font-semibold text-muted-foreground tracking-wider mb-1.5">
                About & Notes
              </h4>
              <p className="text-body text-foreground whitespace-pre-wrap leading-relaxed">
                {company.description}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-dashed border-border text-muted-foreground text-small flex items-center justify-between">
              <span>No company notes or description recorded yet.</span>
              <button
                type="button"
                onClick={() => onEdit(company)}
                className="text-primary hover:text-primary-hover font-medium underline text-small cursor-pointer"
              >
                Add notes
              </button>
            </div>
          )}

          {/* Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-y border-border py-4">
            <div>
              <div className="text-micro font-medium text-muted-foreground uppercase tracking-wider">
                Total Applications
              </div>
              <div className="font-display font-semibold text-display text-foreground mt-0.5">
                {company.applicationsCount}
              </div>
            </div>
            <div>
              <div className="text-micro font-medium text-muted-foreground uppercase tracking-wider">
                Active in Pipeline
              </div>
              <div className="font-display font-semibold text-display text-primary mt-0.5">
                {company.activeApplicationsCount}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-micro font-medium text-muted-foreground uppercase tracking-wider">
                Action
              </div>
              <div className="mt-1">
                <Link
                  to={`/applications/new?company=${encodeURIComponent(company.name)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small no-underline transition-colors shadow-xs"
                >
                  <Plus size={14} />
                  <span>Apply to role</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Applications History Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-primary" />
                <h3 className="font-display font-semibold text-subheading text-foreground">
                  Application History
                </h3>
              </div>
              <span className="text-small text-muted-foreground">
                {company.applications.length} recorded
              </span>
            </div>

            {company.applications.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {company.applications.map((app) => {
                  const statusCfg = STATUS_CONFIG[app.status] || { label: app.status };
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
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-card hover:border-foreground/30 hover:bg-secondary/30 transition-all text-foreground no-underline"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <StageRing status={app.status} size={18} />
                        <div className="min-w-0">
                          <h4 className="font-medium text-body text-foreground group-hover:text-primary transition-colors truncate">
                            {app.job?.title || 'Untitled position'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-micro text-muted-foreground">
                            <span>Applied: {appliedDate}</span>
                            {app.job?.workSetup && (
                              <span className="inline-flex items-center gap-1 capitalize">
                                <Laptop size={11} />
                                {app.job.workSetup.toLowerCase()}
                              </span>
                            )}
                            {(app.job?.salaryMin || app.job?.salaryMax) && (
                              <span className="inline-flex items-center gap-0.5">
                                <DollarSign size={11} />
                                {app.job.salaryMin ? `${app.job.salaryMin.toLocaleString()}` : ''}
                                {app.job.salaryMin && app.job.salaryMax ? ' – ' : ''}
                                {app.job.salaryMax ? `${app.job.salaryMax.toLocaleString()}` : ''}
                                {' '}{app.job.currency || 'PHP'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <span className="px-2 py-0.5 rounded text-micro font-medium bg-secondary text-secondary-foreground">
                          {statusCfg.label}
                        </span>
                        <div className="flex items-center text-primary group-hover:translate-x-0.5 transition-transform text-small">
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-2">
                <Briefcase size={28} className="text-muted-foreground/60 mb-1" />
                <p className="text-body font-medium text-foreground">
                  No applications submitted yet
                </p>
                <p className="text-small text-muted-foreground max-w-sm">
                  Track your job search for {company.name} by adding your first application.
                </p>
                <Link
                  to={`/applications/new?company=${encodeURIComponent(company.name)}`}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small no-underline transition-colors"
                >
                  <Plus size={14} />
                  <span>Start application</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-border flex items-center justify-between shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border text-foreground hover:bg-secondary text-small font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
          <Link
            to={`/applications/new?company=${encodeURIComponent(company.name)}`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-small no-underline transition-colors"
          >
            <Plus size={15} />
            <span>New application for {company.name}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
