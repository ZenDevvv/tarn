import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, AlertTriangle, Loader2, X, Check } from 'lucide-react';
import { masterProfileApi } from '@/features/master-profile/api/master-profile-api';
import { MasterProfileDraftDTO } from '@tracker/types';

interface ResumeUploadDropzoneProps {
  onSuccess: () => void;
}

export function ResumeUploadDropzone({ onSuccess }: ResumeUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [draft, setDraft] = useState<MasterProfileDraftDTO['profile'] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setFeedback(null);
    setDraft(null);
    setWarnings([]);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const result = await masterProfileApi.uploadResume({
            filename: file.name,
            mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
            fileData: base64Data,
          });
          setDraft(result.profile);
          setWarnings(result.warnings || []);
        } catch (err: any) {
          setFeedback({
            type: 'error',
            message: err?.response?.data?.message || err.message || 'Failed to parse resume file.',
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
        technicalSkills: draft.technicalSkills || {},
        education: (draft.education || []).map((e) => ({
          ...e,
          bullets: e.bullets || [],
        })),
      });
      setFeedback({
        type: 'success',
        message: '✨ Career profile successfully updated from resume!',
      });
      setDraft(null);
      setWarnings([]);
      onSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Failed to save imported profile.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDiscard = () => {
    setDraft(null);
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
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
            accept=".pdf,.txt,.json,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFile(e.target.files[0]);
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
              Review-before-commit: parse generates a preview draft without modifying your profile until confirmed.
            </p>
          </div>

          <button
            type="button"
            disabled={isUploading}
            className="mt-1 px-3 py-1 rounded-md text-caption font-medium border border-border bg-background hover:bg-secondary text-foreground transition-colors cursor-pointer"
          >
            Browse Files
          </button>
        </div>
      ) : (
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
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              title="Discard draft"
            >
              <X size={18} />
            </button>
          </div>

          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-caption space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={15} className="shrink-0" />
                <span>Verification Warnings</span>
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
                {Object.values(draft.technicalSkills).flat().length} items
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50 border border-border">
              <span className="text-[11px] text-muted-foreground block">Education</span>
              <span className="font-semibold text-small text-foreground">
                {draft.education.length} {draft.education.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>

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

      {feedback && (
        <div
          className={`p-3 rounded-lg text-small flex items-start gap-2 border ${
            feedback.type === 'success'
              ? 'bg-primary/10 border-primary/20 text-foreground'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
