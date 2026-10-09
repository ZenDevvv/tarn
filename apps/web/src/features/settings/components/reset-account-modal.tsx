import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';

export interface ResetAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export function ResetAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}: ResetAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const isConfirmed = confirmText.trim() === 'RESET';

  // Reset state whenever modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  // Focus trap, body scroll lock, Escape key
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalContentRef.current) {
        const focusable = modalContentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isPending) return;

    try {
      setError(null);
      await onConfirm();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset account data. Please try again.');
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      aria-describedby="reset-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        ref={modalContentRef}
        className="relative bg-card border border-destructive/30 rounded-xl shadow-float w-full max-w-[440px] p-6 animate-scale-up text-foreground"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-2.5 rounded-full bg-destructive-tint text-destructive shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3
              id="reset-modal-title"
              className="text-subheading font-display font-semibold text-foreground tracking-tight"
            >
              Reset account data?
            </h3>
            <p className="text-caption text-muted-foreground mt-0.5">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Warning Content */}
        <div id="reset-modal-description" className="text-small text-muted-foreground space-y-2 mb-5">
          <p>
            All of your logged <strong className="text-foreground">applications</strong>,{' '}
            <strong className="text-foreground">companies</strong>,{' '}
            <strong className="text-foreground">recruiter contacts</strong>,{' '}
            <strong className="text-foreground">interviews</strong>,{' '}
            <strong className="text-foreground">resumes</strong>, and custom pipeline stages will be permanently deleted.
          </p>
          <p>
            Your account credentials, settings preferences, and default pipeline stages will be retained so you can start fresh.
          </p>
        </div>

        {/* Type-to-confirm form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="confirm-keyword-input" className="block text-caption font-medium text-foreground mb-1.5">
              To confirm, type <span className="font-mono font-bold text-destructive">RESET</span> below:
            </label>
            <input
              ref={inputRef}
              id="confirm-keyword-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isPending}
              placeholder="RESET"
              autoComplete="off"
              spellCheck="false"
              className="w-full px-3 py-2 text-small rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-destructive font-mono"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-md text-caption bg-destructive-tint text-destructive border border-destructive/20"
            >
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-md border border-input/60 bg-card hover:bg-secondary text-foreground text-small font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isPending}
              className="px-4 py-1.5 rounded-md text-small font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:outline-destructive disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              <span>Reset all data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
