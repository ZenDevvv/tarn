import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Select } from '@/components/ui/select';

export interface ResumeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  availableRoles: string[];
  sortBy: string;
  onSortByChange: (value: string) => void;
  onReset: () => void;
}

export function ResumeFilters({
  search,
  onSearchChange,
  selectedRole,
  onRoleChange,
  availableRoles,
  sortBy,
  onSortByChange,
  onReset,
}: ResumeFiltersProps) {
  const hasActiveFilters = Boolean(
    search || selectedRole || sortBy !== 'recent_desc'
  );

  const roleOptions = [
    { value: '', label: 'All Target Roles' },
    ...availableRoles.map((r) => ({ value: r, label: r })),
  ];

  const sortOptions = [
    { value: 'recent_desc', label: 'Recently Created' },
    { value: 'updated_desc', label: 'Recently Updated' },
    { value: 'name_asc', label: 'Resume Name (A–Z)' },
    { value: 'version_desc', label: 'Version (Newest)' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, role, skills, notes..."
          className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role Filter */}
        <div className="w-full sm:w-[170px]">
          <Select
            value={selectedRole}
            onChange={(val) => onRoleChange(val)}
            options={roleOptions}
            placeholder="Target Role"
          />
        </div>


        {/* Sort Filter */}
        <div className="w-full sm:w-[170px]">
          <Select
            value={sortBy}
            onChange={(val) => onSortByChange(val)}
            options={sortOptions}
          />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary border border-border transition-colors flex items-center justify-center shrink-0"
            title="Reset filters"
            aria-label="Reset filters"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
