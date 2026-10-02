import { Search } from 'lucide-react';
import { ApplicationStatus, WorkSetup } from '@tracker/types';
import { STATUS_CONFIG } from './application-status-badge';

interface ApplicationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: ApplicationStatus;
  onStatusChange: (status?: ApplicationStatus) => void;
  workSetup?: WorkSetup;
  onWorkSetupChange: (setup?: WorkSetup) => void;
}

export function ApplicationFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  workSetup,
  onWorkSetupChange,
}: ApplicationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      {/* Search Input with / shortcut badge */}
      <div className="relative flex-1 min-w-[240px] max-w-[360px]">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          id="q"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search company, role, or action..."
          className="w-full h-9 pl-9 pr-12 rounded-md bg-card border border-input text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors"
        />
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] leading-[18px] px-1.5 rounded-[4px] border border-border bg-background text-muted-foreground font-mono select-none"
          aria-hidden="true"
        >
          /
        </span>
      </div>

      {/* Status Filter */}
      <select
        value={status || ''}
        onChange={(e) => onStatusChange((e.target.value as ApplicationStatus) || undefined)}
        className="h-9 px-3 rounded-md bg-card border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </select>

      {/* Work Setup Filter */}
      <select
        value={workSetup || ''}
        onChange={(e) => onWorkSetupChange((e.target.value as WorkSetup) || undefined)}
        className="h-9 px-3 rounded-md bg-card border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Filter by work setup"
      >
        <option value="">All setups</option>
        <option value="REMOTE">Remote</option>
        <option value="HYBRID">Hybrid</option>
        <option value="ONSITE">Onsite</option>
      </select>
    </div>
  );
}
