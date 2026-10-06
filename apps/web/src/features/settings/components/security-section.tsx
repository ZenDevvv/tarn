import React, { useState } from 'react';
import { ChangePasswordInput } from '@tracker/types';
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface SecuritySectionProps {
  onSavePassword: (data: ChangePasswordInput) => Promise<void>;
  isSaving: boolean;
}

export function SecuritySection({ onSavePassword, isSaving }: SecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'Current password is required.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'New passwords do not match. Please verify.',
      });
      return;
    }

    try {
      await onSavePassword({ currentPassword, newPassword });
      setStatusMessage({
        type: 'success',
        text: 'Password updated successfully. You can now use your new password.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not update password. Please check your current password.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-[560px]">
      <div>
        <h2 className="text-heading font-display font-semibold text-foreground tracking-tight">
          Security and credentials
        </h2>
        <p className="text-small text-muted-foreground mt-1">
          Update your account password to keep your job search data secure.
        </p>
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 p-3 rounded-lg text-small ${
            statusMessage.type === 'success'
              ? 'bg-success-tint text-success border border-success/20'
              : 'bg-destructive-tint text-destructive border border-destructive/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Current Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentPassword" className="text-small font-medium text-foreground">
            Current password
          </label>
          <div className="relative flex items-center">
            <input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full h-9 pl-3 pr-10 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-small font-medium text-foreground">
            New password
          </label>
          <div className="relative flex items-center">
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full h-9 pl-3 pr-10 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className="text-caption text-muted-foreground">
            Must contain at least 8 characters. We recommend a passphrase with numbers or symbols.
          </span>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-small font-medium text-foreground">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="w-full h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border bg-secondary/30 flex items-start gap-3">
        <ShieldCheck size={20} className="text-primary mt-0.5 shrink-0" />
        <div className="text-small text-muted-foreground">
          <strong className="text-foreground font-medium block">
            End-to-end tenant security
          </strong>
          Passwords are salted and securely hashed using bcrypt. Your sessions use httpOnly cookies with strict multi-tenant isolation.
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center justify-start">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium text-body hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <span>Update password</span>
          )}
        </button>
      </div>
    </form>
  );
}
