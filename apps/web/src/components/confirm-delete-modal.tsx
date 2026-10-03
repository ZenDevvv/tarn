import React, { useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  itemName?: string;
  variant?: 'destructive' | 'archive';
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete item?',
  description = 'Are you sure you want to proceed?',
  itemName,
  variant = 'destructive',
  confirmLabel,
  cancelLabel = 'Cancel',
  isPending = false,
}: ConfirmDeleteModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const defaultConfirmLabel = variant === 'archive' ? 'Archive' : 'Delete';
  const resolvedConfirmLabel = confirmLabel || defaultConfirmLabel;

  const formattedTitle = title.trim();
  const titleSeparator = /[.?!]$/.test(formattedTitle) ? ' ' : '. ';

  // Focus management, body scroll lock, Escape & focus trap
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap within modal
      if (e.key === 'Tab' && modalContentRef.current) {
        const focusable = modalContentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, isPending]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        ref={modalContentRef}
        className="relative bg-card border border-border rounded-lg shadow-float w-full max-w-[400px] p-5 animate-scale-up text-foreground"
      >
        {/* Subtle top-right close icon */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute top-3.5 right-3.5 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X size={15} />
        </button>

        {/* Message block: bold title aligned inline with the description */}
        <p id="confirm-modal-description" className="text-body leading-relaxed text-muted-foreground pr-5">
          <strong id="confirm-modal-title" className="font-semibold text-foreground">
            {formattedTitle}{titleSeparator}
          </strong>
          {description}
          {itemName && (
            <span className="block mt-2 text-small font-medium text-foreground truncate">
              {itemName}
            </span>
          )}
        </p>

        {/* Right-aligned action buttons */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md border border-input/50 bg-card hover:bg-secondary text-foreground text-small font-medium transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-small font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs focus-visible:outline-2',
              variant === 'archive'
                ? 'bg-primary hover:bg-primary-hover text-primary-foreground focus-visible:outline-primary'
                : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:outline-destructive'
            )}
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            <span>{resolvedConfirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
