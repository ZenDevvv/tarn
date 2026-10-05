import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Select } from '@/components/ui/select';

export interface CompanyFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedIndustry: string;
  onIndustryChange: (value: string) => void;
  industries: string[];
  activeFilter: string; // 'all' | 'active' | 'inactive'
  onActiveFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onReset: () => void;
}

export function CompanyFilters({
  search,
  onSearchChange,
  selectedIndustry,
  onIndustryChange,
  industries,
  activeFilter,
  onActiveFilterChange,
  sortBy,
  onSortByChange,
  onReset,
}: CompanyFiltersProps) {
  const hasActiveFilters = Boolean(search || selectedIndustry || activeFilter !== 'all' || sortBy !== 'name_asc');

  const industryOptions = [
    { value: '', label: 'All Industries' },
    ...industries.map((ind) => ({ value: ind, label: ind })),
  ];

  const activeOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active Pipeline Only' },
    { value: 'inactive', label: 'No Active Pipeline' },
  ];

  const sortOptions = [
    { value: 'name_asc', label: 'Company Name (A–Z)' },
    { value: 'name_desc', label: 'Company Name (Z–A)' },
    { value: 'apps_desc', label: 'Most Applications' },
    { value: 'recent_desc', label: 'Recently Added' },
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
          placeholder="Search by company name, location, or industry..."
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
        {/* Industry Filter */}
        {industries.length > 0 && (
          <div className="w-[160px]">
            <Select
              options={industryOptions}
              value={selectedIndustry}
              onChange={onIndustryChange}
              placeholder="Industry"
              aria-label="Filter by industry"
            />
          </div>
        )}

        {/* Pipeline Status Filter */}
        <div className="w-[170px]">
          <Select
            options={activeOptions}
            value={activeFilter}
            onChange={onActiveFilterChange}
            aria-label="Filter by pipeline status"
          />
        </div>

        {/* Sort Options */}
        <div className="w-[180px]">
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={onSortByChange}
            aria-label="Sort companies"
          />
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-small font-medium transition-colors cursor-pointer"
            title="Reset filters"
          >
            <X size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
