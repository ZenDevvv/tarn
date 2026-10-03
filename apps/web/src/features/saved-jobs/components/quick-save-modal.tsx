import { useState, useEffect } from 'react';
import { Bookmark, X } from 'lucide-react';
import { ApplicationStatus } from '@tracker/types';
import { CreateApplicationInput } from '@tracker/validation';
import { ApplicationForm } from '@/features/applications/components/application-form';

export interface QuickSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateApplicationInput) => Promise<any>;
  initialStatus?: ApplicationStatus;
}

export function QuickSaveModal({
  isOpen,
  onClose,
  onSubmit,
  initialStatus = 'SAVED',
}: QuickSaveModalProps) {
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(initialStatus);

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(initialStatus);
    }
  }, [isOpen, initialStatus]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-primary" />
            <h2 id="modal-title" className="font-display font-semibold text-subheading text-foreground">
              {currentStatus === 'SAVED' ? 'Save Job Opportunity' : 'Add Application'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <ApplicationForm
            initialStatus={initialStatus}
            isModal={true}
            onStatusChange={setCurrentStatus}
            onSubmit={onSubmit}
            onSuccess={() => onClose()}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
