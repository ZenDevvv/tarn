import { Priority } from '@tracker/types';
import { cn } from '@/lib/cn';

interface PriorityGlyphProps {
  priority: Priority;
  className?: string;
}

const countMap: Record<Priority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const labelMap: Record<Priority, string> = {
  LOW: 'Low priority',
  MEDIUM: 'Medium priority',
  HIGH: 'High priority',
};

export function PriorityGlyph({ priority, className }: PriorityGlyphProps) {
  const n = countMap[priority] || 1;
  const label = labelMap[priority] || 'Priority';

  return (
    <span
      className={cn('inline-flex items-end gap-[2px] h-[14px]', className)}
      role="img"
      aria-label={label}
    >
      <i
        className={cn(
          'w-[3px] rounded-[1px] transition-colors',
          'h-[6px]',
          n >= 1 ? 'bg-foreground' : 'bg-border'
        )}
      />
      <i
        className={cn(
          'w-[3px] rounded-[1px] transition-colors',
          'h-[10px]',
          n >= 2 ? 'bg-foreground' : 'bg-border'
        )}
      />
      <i
        className={cn(
          'w-[3px] rounded-[1px] transition-colors',
          'h-[14px]',
          n >= 3 ? 'bg-foreground' : 'bg-border'
        )}
      />
    </span>
  );
}
