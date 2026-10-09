import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  Check,
  Zap,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { masterProfileApi } from '@/features/master-profile/api/master-profile-api';
import { tailoringApi } from '@/features/tailoring/api/tailoring-api';
import { toErrorMessage } from '@/lib/api-client';
import { MasterProfileDraftDTO } from '@tracker/types';

interface ResumeUploadDropzoneProps {
  onSuccess: () => void;
}

export function ResumeUploadDropzone({ onSuccess }: ResumeUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [chosenMode, setChosenMode] = useState<'ai' | 'standard'>('ai');
  const [draft, setDraft] = useState<MasterProfileDraftDTO['profile'] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    canRetryAi?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ['tailoring-quota'],
    queryFn: tailoringApi.getQuota,
  });

  const remainingQuota = quota?.remainingToday ?? 5;
  const totalLimit = quota?.limit ?? 5;
  const hasQuota = remainingQuota > 0;

  const handleFilePicked = (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setFeedback(null);
    setChosenMode(hasQuota ? 'ai' : 'standard');
    setShowChoiceModal(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File, mode: 'ai' | 'standard') => {
    setIsUploading(true);
    setFeedback(null);
    setDraft(null);
    setWarnings([]);

    try {
      const reader = new FileReader();
      reader.onerror = () => {
        setIsUploading(false);
        setFeedback({ type: 'error', message: 'Failed to read file from your device.' });
      };
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const result = await masterProfileApi.uploadResume({
            filename: file.name,
            mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
            fileData: base64Data,
            mode,
          });
          setDraft(result.profile);
          setWarnings(result.warnings || []);
          refetchQuota();
        } catch (err: any) {
          const errorMsg = toErrorMessage(err, 'Failed to parse resume file.');
          setFeedback({
            type: 'error',
            message: errorMsg,
            canRetryAi: mode === 'ai',
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error reading file.' });
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!draft) return;
    setIsConfirming(true);
    setFeedback(null);

    try {
      await masterProfileApi.confirmImport({
        basics: draft.basics,
        positioningRules: draft.positioningRules || [],
        factBank: draft.factBank || {},
        summaryCandidates: draft.summaryCandidates || [],
        workExperience: (draft.workExperience || []).map((w) => ({
          ...w,
          bullets: w.bullets || [],
        })),
        projectExperience: (draft.projectExperience || []).map((p) => ({
          ...p,
          stack: p.stack || [],
          bullets: p.bullets || [],
        })),
        skills: draft.skills || {},
        education: (draft.education || []).map((e) => ({
          ...e,
          bullets: e.bullets || [],
        })),
        customSections: draft.customSections || [],
      });
      setFeedback({
        type: 'success',
        message: '✨ Career profile successfully updated from resume!',
      });
      setDraft(null);
      setSelectedFile(null);
      setWarnings([]);
      onSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: toErrorMessage(err, 'Failed to save imported profile.'),
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDiscard = () => {
    setDraft(null);
    setSelectedFile(null);
    setWarnings([]);
    setFeedback(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Inactive Dropzone */}
      {!draft ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border bg-card/60 hover:bg-card hover:border-primary/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.json"
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilePicked(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary mb-1">
            {isUploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <Upload size={22} strokeWidth={1.8} />
            )}
          </div>

          <div>
            <span className="font-display font-medium text-body text-foreground">
              {isUploading ? 'Extracting & Parsing Sections...' : 'Drop your resume (PDF, TXT, or JSON) here'}
            </span>
            <p className="text-caption text-muted-foreground mt-0.5">
              PDF, TXT, or JSON. Word documents are not supported — export yours as PDF first.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3 py-1 rounded-md text-caption font-medium border border-border bg-background hover:bg-secondary text-foreground transition-colors cursor-pointer"
            >
              Browse Files
            </button>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Zap size={12} className="text-amber-500 fill-amber-500/20" />
              <span>{remainingQuota} of {totalLimit} AI credits left today</span>
            </span>
          </div>
        </div>
      ) : (
        /* 2. Review Extracted Resume Draft */
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h4 className="font-display font-semibold text-foreground text-body">
                Review Extracted Resume Draft
              </h4>
              <p className="text-caption text-muted-foreground">
                Verify the parsed details before saving to your profile. Your current profile remains untouched until confirmed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDiscard}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
              title="Discard draft"
            >
              <X size={18} />
            </button>
          </div>

          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-caption space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={15} className="shrink-0" />
                <span>Verification & Parser Notes</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[13px]">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">Full Name</label>
              <input
                type="text"
                value={draft.basics.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    basics: { ...draft.basics, name: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                value={draft.basics.email || ''}
                placeholder="Not extracted"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    basics: { ...draft.basics, email: e.target.value || null },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">Phone</label>
              <input
                type="text"
                value={draft.basics.phone || ''}
                placeholder="Not extracted"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    basics: { ...draft.basics, phone: e.target.value || null },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">Location</label>
              <input
                type="text"
                value={draft.basics.location || ''}
                placeholder="Not extracted"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    basics: { ...draft.basics, location: e.target.value || null },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-secondary/50 border border-border">
              <span className="text-[11px] text-muted-foreground block">Work Experience</span>
              <span className="font-semibold text-small text-foreground">
                {draft.workExperience.length} {draft.workExperience.length === 1 ? 'role' : 'roles'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50 border border-border">
              <span className="text-[11px] text-muted-foreground block">Projects</span>
              <span className="font-semibold text-small text-foreground">
                {draft.projectExperience.length} {draft.projectExperience.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50 border border-border">
              <span className="text-[11px] text-muted-foreground block">Skills</span>
              <span className="font-semibold text-small text-foreground">
                {Object.values(draft.skills || {}).flat().length} items
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50 border border-border">
              <span className="text-[11px] text-muted-foreground block">Education</span>
              <span className="font-semibold text-small text-foreground">
                {draft.education.length} {draft.education.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>

          {draft.customSections && draft.customSections.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-[11px] font-semibold text-primary block uppercase tracking-wider mb-1">
                Polymorphic Custom Sections Detected
              </span>
              <div className="flex flex-wrap gap-2">
                {draft.customSections.map((sec) => (
                  <span
                    key={sec.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[12px] bg-secondary border border-border text-foreground font-medium"
                  >
                    <span>{sec.title}</span>
                    <span className="text-muted-foreground text-[10px]">({sec.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isConfirming}
              className="px-3.5 py-2 rounded-lg border border-border text-small font-medium hover:bg-secondary text-foreground transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isConfirming || !draft.basics.name.trim()}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirm & Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Feedback Banner with Retry / Switch Options */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-small flex flex-col gap-2 border ${
            feedback.type === 'success'
              ? 'bg-primary/10 border-primary/20 text-foreground'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <div className="flex items-start gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>

          {feedback.canRetryAi && selectedFile && (
            <div className="flex items-center gap-2 pt-1 border-t border-destructive/20">
              <button
                type="button"
                onClick={() => processFile(selectedFile, 'ai')}
                disabled={isUploading || !hasQuota}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-caption font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Retry AI Extraction</span>
              </button>
              <button
                type="button"
                onClick={() => processFile(selectedFile, 'standard')}
                disabled={isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-caption font-medium border border-border bg-background text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Zap size={13} />
                <span>Switch to Standard (Free)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Extraction Method Choice Modal */}
      {showChoiceModal && selectedFile && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="choice-modal-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 id="choice-modal-title" className="font-display font-semibold text-subheading text-foreground">
                  Choose Extraction Method
                </h3>
                <p className="text-caption text-muted-foreground mt-0.5">
                  File: <strong className="text-foreground">{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChoiceModal(false);
                  setSelectedFile(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quota Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/60 border border-border text-caption">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500 fill-amber-500/20" />
                <span>Daily AI Generations Allowance</span>
              </span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  hasQuota
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {remainingQuota} of {totalLimit} credits remaining today
              </span>
            </div>

            {/* Options Grid */}
            <div className="space-y-3">
              {/* Option A: AI Deep Extraction */}
              <label
                className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                  chosenMode === 'ai'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/40'
                } ${!hasQuota ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="extractionMode"
                    value="ai"
                    checked={chosenMode === 'ai'}
                    disabled={!hasQuota}
                    onChange={() => setChosenMode('ai')}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500 fill-amber-500/20" />
                        AI-Powered Extraction
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        1 Credit
                      </span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Deep zero-shot schema induction. Discovers non-traditional sections (clinical rotations, clerkships, publications) and complex multi-column layouts across any profession.
                    </p>
                    {!hasQuota && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1">
                        Daily limit reached (5/5). Resets at midnight UTC, or use Standard Extraction.
                      </p>
                    )}
                  </div>
                </div>
              </label>

              {/* Option B: Standard Deterministic Extraction */}
              <label
                className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                  chosenMode === 'standard'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="extractionMode"
                    value="standard"
                    checked={chosenMode === 'standard'}
                    onChange={() => setChosenMode('standard')}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <FileText size={14} className="text-muted-foreground" />
                        Standard Extraction
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-secondary text-muted-foreground border border-border">
                        Free & Unlimited
                      </span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Local domain-agnostic parser with multi-degree and international date support. 100% free and consumes 0 AI credits.
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 pt-0.5 italic">
                      * Discretion note: Highly dense or multi-column layouts may produce minor inaccuracies that can be verified in the draft review.
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowChoiceModal(false);
                  setSelectedFile(null);
                }}
                className="px-3.5 py-2 rounded-lg border border-border text-small font-medium hover:bg-secondary text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChoiceModal(false);
                  processFile(selectedFile, chosenMode);
                }}
                disabled={chosenMode === 'ai' && !hasQuota}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span>Start Extraction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
