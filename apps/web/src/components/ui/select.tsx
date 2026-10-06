import React, {
  useState,
  useRef,
  useEffect,
  useId,
  isValidElement,
  Children,
  ReactNode,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption<T = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectItemProps<T = string> {
  value: T;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export function SelectItem<T = string>(_props: SelectItemProps<T>) {
  return null;
}

export interface SelectProps<T = string> {
  value?: T;
  onChange: (value: T) => void;
  options?: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  children?: ReactNode;
}

export function Select<T = string>({
  value,
  onChange,
  options: explicitOptions,
  placeholder = 'Select...',
  disabled = false,
  size = 'default',
  className,
  triggerClassName,
  menuClassName,
  id,
  name,
  'aria-label': ariaLabel,
  children,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse options from either explicit options array or SelectItem children
  const parsedOptions: SelectOption<T>[] = React.useMemo(() => {
    if (explicitOptions && explicitOptions.length > 0) {
      return explicitOptions;
    }

    const items: SelectOption<T>[] = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.props) {
        items.push({
          value: child.props.value,
          label: child.props.children,
          icon: child.props.icon,
          disabled: child.props.disabled,
        });
      }
    });
    return items;
  }, [explicitOptions, children]);

  // Find currently selected option
  const selectedOption = parsedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Calculate top/bottom placement to prevent viewport overflow
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 220 && spaceAbove > spaceBelow) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }

    // Initialize highlighted index to selected option
    const idx = parsedOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [isOpen, value, parsedOptions]);

  // Ensure highlighted option stays in view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [isOpen, highlightedIndex]);

  const handleSelect = (opt: SelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < parsedOptions.length && parsedOptions[next].disabled) {
            next++;
          }
          return next < parsedOptions.length ? next : prev;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && parsedOptions[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;

      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setHighlightedIndex(parsedOptions.length - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < parsedOptions.length) {
          handleSelect(parsedOptions[highlightedIndex]);
        }
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        // Type-ahead jump to matching option
        if (e.key.length === 1) {
          const char = e.key.toLowerCase();
          const matchIdx = parsedOptions.findIndex(
            (opt, i) =>
              i > highlightedIndex &&
              typeof opt.label === 'string' &&
              opt.label.toLowerCase().startsWith(char) &&
              !opt.disabled
          );
          const fallbackIdx =
            matchIdx === -1
              ? parsedOptions.findIndex(
                  (opt) =>
                    typeof opt.label === 'string' &&
                    opt.label.toLowerCase().startsWith(char) &&
                    !opt.disabled
                )
              : matchIdx;

          if (fallbackIdx !== -1) {
            setHighlightedIndex(fallbackIdx);
          }
        }
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block w-full', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for standard form serialization */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value !== undefined ? String(value) : ''}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full bg-card border border-input rounded-md text-foreground flex items-center justify-between gap-2 cursor-pointer transition-colors text-left',
          'focus-visible:outline-2 focus-visible:outline-primary',
          'hover:border-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed',
          size === 'sm' ? 'h-7.5 px-2.5 text-caption' : 'h-9 px-3 text-small',
          triggerClassName
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center">{selectedOption.icon}</span>
          )}
          <span
            className={cn(
              'truncate font-sans font-normal',
              !selectedOption && 'text-muted-foreground'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          size={14}
          className={cn(
            'text-muted-foreground shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180 text-foreground'
          )}
        />
      </button>

      {/* Dropdown Menu Portal / Floating Layer */}
      {isOpen && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={selectId}
          className={cn(
            'absolute left-0 z-50 w-full min-w-[160px] max-h-60 overflow-y-auto custom-scrollbar rounded-lg border border-border bg-card p-1 shadow-float text-foreground',
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            'animate-fade-in',
            menuClassName
          )}
        >
          {parsedOptions.length === 0 ? (
            <div className="py-3 px-3 text-center text-caption text-muted-foreground">
              No options available
            </div>
          ) : (
            parsedOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={String(opt.value)}
                  ref={(el) => (optionRefs.current[idx] = el)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2 cursor-pointer transition-colors select-none font-sans font-normal',
                    size === 'sm' ? 'text-caption' : 'text-small',
                    opt.disabled && 'opacity-40 cursor-not-allowed',
                    isHighlighted && !opt.disabled && 'bg-secondary text-foreground',
                    isSelected && 'text-foreground bg-accent/60',
                    isSelected && isHighlighted && 'bg-accent/80'
                  )}
                  style={{ transform: 'none' }}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && (
                      <span className="shrink-0 flex items-center">{opt.icon}</span>
                    )}
                    <span
                      className={cn(
                        'truncate font-normal',
                        size === 'sm' ? 'text-caption' : 'text-small'
                      )}
                    >
                      {opt.label}
                    </span>
                  </span>

                  <span className="w-4 h-4 shrink-0 flex items-center justify-center ml-auto">
                    {isSelected && (
                      <Check size={14} className="text-primary" />
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
