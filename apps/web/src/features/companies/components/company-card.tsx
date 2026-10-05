import React from 'react';
import { Link } from 'react-router-dom';
import { CompanyWithDetailsDTO } from '@tracker/types';
import { StageRing, STATUS_CONFIG } from '@/features/applications/components/application-status-badge';
import {
  ExternalLink,
  MapPin,
  Building2,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
} from 'lucide-react';

export interface CompanyCardProps {
  company: CompanyWithDetailsDTO;
  onSelect: (company: CompanyWithDetailsDTO) => void;
  onEdit: (company: CompanyWithDetailsDTO) => void;
  onDelete: (company: CompanyWithDetailsDTO) => void;
}

export function CompanyCard({ company, onSelect, onEdit, onDelete }: CompanyCardProps) {
  const recentApplications = (company.applications || []).slice(0, 2);

  return (
    <div
      role="article"
      onClick={() => onSelect(company)}
      className="group bg-card border border-border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-foreground/30 hover:shadow-sm cursor-pointer relative"
    >
      {/* Card Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-subheading text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                {company.name}
              </h3>
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                  title="Visit website"
                  aria-label={`Visit ${company.name} website`}
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Badges / Location & Industry */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-micro text-muted-foreground">
              {company.industry && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                  <Building2 size={11} className="text-muted-foreground" />
                  <span className="truncate max-w-[140px]">{company.industry}</span>
                </span>
              )}
              {company.location && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-medium">
                  <MapPin size={11} className="text-muted-foreground" />
                  <span className="truncate max-w-[140px]">{company.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onEdit(company)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Edit company"
              aria-label="Edit company"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(company)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors cursor-pointer"
              title="Delete company"
              aria-label="Delete company"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Company Description */}
        {company.description && (
          <p className="text-small text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
            {company.description}
          </p>
        )}
      </div>

      {/* Applications Pipeline Section */}
      <div className="border-t border-border/70 pt-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-micro font-medium">
          <div className="flex items-center gap-2">
            {company.activeApplicationsCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {company.activeApplicationsCount} active
              </span>
            ) : (
              <span className="text-muted-foreground">0 active</span>
            )}
            <span className="text-muted-foreground">
              {company.applicationsCount} {company.applicationsCount === 1 ? 'role' : 'roles'} applied
            </span>
          </div>
        </div>

        {/* Recent Applications Snippets */}
        {recentApplications.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {recentApplications.map((app) => {
              const statusCfg = STATUS_CONFIG[app.status] || { label: app.status };
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-secondary/50 text-small text-foreground"
                >
                  <div className="flex items-center gap-2 truncate">
                    <StageRing status={app.status} size={14} />
                    <span className="font-medium truncate text-body">
                      {app.job?.title || 'Untitled position'}
                    </span>
                  </div>
                  <span className="text-micro text-muted-foreground shrink-0">
                    {statusCfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-micro text-muted-foreground italic py-1">
            No job applications recorded yet.
          </p>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div
        className="flex items-center justify-between pt-2 border-t border-border/40 text-small"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelect(company)}
          className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium text-small cursor-pointer transition-colors"
        >
          <span>View details</span>
          <ChevronRight size={14} />
        </button>

        <Link
          to={`/applications/new?company=${encodeURIComponent(company.name)}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-accent text-secondary-foreground text-small font-medium no-underline transition-colors"
          title={`Add new application at ${company.name}`}
        >
          <Plus size={13} />
          <span>New role</span>
        </Link>
      </div>
    </div>
  );
}
