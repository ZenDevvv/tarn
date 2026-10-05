import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Select } from '@/components/ui/select';

export interface ContactFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCompany: string;
  onCompanyChange: (value: string) => void;
  companies: Array<{ id: string; name: string }>;
  hasApplicationFilter: string; // 'all' | 'linked' | 'unlinked'
  onHasApplicationFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onReset: () => void;
}

export function ContactFilters({
  search,
  onSearchChange,
  selectedCompany,
  onCompanyChange,
  companies,
  hasApplicationFilter,
  onHasApplicationFilterChange,
  sortBy,
  onSortByChange,
  onReset,
}: ContactFiltersProps) {
  const hasActiveFilters = Boolean(
    search || selectedCompany || hasApplicationFilter !== 'all' || sortBy !== 'name_asc'
  );

  const companyOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const applicationOptions = [
    { value: 'all', label: 'All Contacts' },
    { value: 'linked', label: 'Linked to Application' },
    { value: 'unlinked', label: 'No Application' },
  ];

  const sortOptions = [
    { value: 'name_asc', label: 'Name (A–Z)' },
    { value: 'name_desc', label: 'Name (Z–A)' },
    { value: 'recent_desc', label: 'Recently Added' },
    { value: 'role_asc', label: 'Role / Title' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, role, email, or notes..."
          className="w-full h-9 pl-9 pr-8 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Company Filter */}
        {companies.length > 0 && (
          <div className="w-[160px]">
            <Select
              options={companyOptions}
              value={selectedCompany}
              onChange={onCompanyChange}
              placeholder="Company"
              aria-label="Filter by company"
            />
          </div>
        )}

        {/* Application Link Status Filter */}
        <div className="w-[170px]">
          <Select
            options={applicationOptions}
            value={hasApplicationFilter}
            onChange={onHasApplicationFilterChange}
            aria-label="Filter by application status"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="w-[170px]">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={onSortByChange}
            aria-label="Sort contacts"
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-secondary hover:bg-accent text-secondary-foreground text-small font-medium transition-colors cursor-pointer"
            title="Reset all filters"
            aria-label="Reset all filters"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
