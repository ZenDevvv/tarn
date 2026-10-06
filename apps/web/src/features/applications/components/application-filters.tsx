import { Search } from 'lucide-react';
import { ApplicationStatus, WorkSetup, WORK_SETUP_OPTIONS } from '@tracker/types';
import { STATUS_CONFIG, StageRing } from './application-status-badge';
import { useApplicationStatuses } from '@/features/settings/hooks/use-application-statuses';
import { Select } from '@/components/ui/select';

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
  const { data: userStatuses } = useApplicationStatuses();

  const totalActiveStages = userStatuses?.filter((s) => s.closeType === null).length || 5;

  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...(userStatuses && userStatuses.length > 0
      ? userStatuses.map((s) => ({
          value: s.name,
          label: s.name,
          icon: <StageRing status={s} size={15} totalStages={totalActiveStages} />,
        }))
      : Object.entries(STATUS_CONFIG).map(([key, config]) => ({
          value: key,
          label: config.label,
          icon: <StageRing status={key as ApplicationStatus} size={15} />,
        }))),
  ];

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
      <div className="w-[180px]">
        <Select<string>
          value={status || ''}
          onChange={(val) => onStatusChange((val as ApplicationStatus) || undefined)}
          placeholder="All statuses"
          aria-label="Filter by status"
          options={statusOptions}
        />
      </div>

      {/* Work Setup Filter */}
      <div className="w-[140px]">
        <Select<string>
          value={workSetup || ''}
          onChange={(val) => onWorkSetupChange((val as WorkSetup) || undefined)}
          placeholder="All setups"
          aria-label="Filter by work setup"
          options={[
            { value: '', label: 'All setups' },
            ...WORK_SETUP_OPTIONS.filter((o) => o.value !== ''),
          ]}
        />
      </div>
    </div>
  );
}
