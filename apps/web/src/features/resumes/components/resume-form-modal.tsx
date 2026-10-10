import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  Trash2,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { ResumeWithDetailsDTO } from '@tracker/types';
import { CreateResumeInput } from '@tracker/validation';
import { resumeApi } from '../api/resume-api';

export interface ResumeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateResumeInput) => Promise<any>;
  resume?: ResumeWithDetailsDTO | null; // If provided, edit mode
}

export function ResumeFormModal({
  isOpen,
  onClose,
  onSubmit,
  resume,
}: ResumeFormModalProps) {
  const [sourceType, setSourceType] = useState<'upload' | 'link'>('upload');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [mimeType, setMimeType] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [skillsString, setSkillsString] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(resume);

  useEffect(() => {
    if (isOpen) {
      if (resume) {
        setName(resume.name || '');
        setTargetRole(resume.targetRole || '');
        setFileUrl(resume.fileUrl || '');
        setFilename(resume.filename || '');
        setFileSize(resume.fileSize ?? undefined);
        setMimeType(resume.mimeType || '');
        setIsDefault(resume.isDefault);
        setSkillsString(resume.skills?.join(', ') || '');
        setNotes(resume.notes || '');
        setSourceType(resume.fileUrl?.startsWith('http') && !resume.fileUrl.includes('/uploads/') ? 'link' : 'upload');
      } else {
        setName('');
        setTargetRole('');
        setFileUrl('');
        setFilename('');
        setFileSize(undefined);
        setMimeType('');
        setIsDefault(false);
        setSkillsString('');
        setNotes('');
        setSourceType('upload');
      }
      setSelectedFile(null);
      setError(null);
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resume]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setSelectedFile(file);
    setFilename(file.name);
    setFileSize(file.size);
    setMimeType(file.type || 'application/pdf');

    // Auto-fill resume name if currently empty
    if (!name.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setName(cleanName);
    }

    setError(null);
  };

  const handleUploadFile = async (file: File): Promise<{ fileUrl: string; filename: string; fileSize: number; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const uploaded = await resumeApi.uploadFile({
            filename: file.name,
            mimeType: file.type || 'application/pdf',
            fileData: base64Data,
          });
          resolve(uploaded);
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Resume name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalFileUrl = fileUrl.trim() || undefined;
      let finalFilename = filename.trim() || undefined;
      let finalFileSize = fileSize;
      let finalMimeType = mimeType.trim() || undefined;

      // If user selected a new file to upload
      if (sourceType === 'upload' && selectedFile) {
        setIsUploading(true);
        const uploaded = await handleUploadFile(selectedFile);
        finalFileUrl = uploaded.fileUrl;
        finalFilename = uploaded.filename;
        finalFileSize = uploaded.fileSize;
        finalMimeType = uploaded.mimeType;
        setIsUploading(false);
      }

      const skills = skillsString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateResumeInput = {
        name: name.trim(),
        targetRole: targetRole.trim() || null,
        fileUrl: finalFileUrl || null,
        filename: finalFilename || null,
        fileSize: finalFileSize || null,
        mimeType: finalMimeType || null,
        isDefault,
        skills,
        notes: notes.trim() || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save resume. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileText size={18} />
            </div>
            <div>
              <h2 id="resume-modal-title" className="font-display font-semibold text-subheading text-foreground">
                {isEdit ? 'Edit Resume' : 'Add Resume Document'}
              </h2>
              <p className="text-micro text-muted-foreground mt-0.5">
                {isEdit ? 'Update resume details, target role, or document link' : 'Upload or link a resume document for your applications'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {error && (
            <div className="p-3 text-small rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              {error}
            </div>
          )}

          {/* Document Source Selection */}
          <div className="space-y-2">
            <label className="text-small font-semibold text-foreground">
              Document Attachment
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceType('upload')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-small font-medium transition-colors ${
                  sourceType === 'upload'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload size={14} />
                <span>Upload PDF / DOCX</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('link')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-small font-medium transition-colors ${
                  sourceType === 'link'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon size={14} />
                <span>External Link (URL)</span>
              </button>
            </div>

            {sourceType === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 border-2 border-dashed border-border hover:border-foreground/30 rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile || filename ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={28} className="text-primary shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-small font-semibold text-foreground truncate max-w-[260px]">
                        {selectedFile ? selectedFile.name : filename}
                      </p>
                      <p className="text-micro text-muted-foreground">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : fileSize ? `${(fileSize / 1024).toFixed(0)} KB` : 'Attached file'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFilename('');
                        setFileUrl('');
                        setFileSize(undefined);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload size={24} className="mx-auto text-muted-foreground" />
                    <p className="text-small font-medium text-foreground">
                      Click to choose or drop resume file
                    </p>
                    <p className="text-micro text-muted-foreground">
                      Supports PDF, DOCX, DOC, TXT (up to 10MB)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://dropbox.com/..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                />
              </div>
            )}
          </div>

          {/* Document Name */}
          <div className="space-y-1.5">
            <label htmlFor="resume-name" className="text-small font-semibold text-foreground">
              Document / Resume Name <span className="text-destructive">*</span>
            </label>
            <input
              id="resume-name"
              ref={initialFocusRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior Frontend Specialist or Resume - Linear"
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>

          {/* Target Role */}
          <div className="space-y-1.5">
            <label htmlFor="target-role" className="text-small font-semibold text-foreground">
              Target Role / Archetype
            </label>
            <div className="relative">
              <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, Staff Platform Architect"
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>

          {/* Highlighted Skills */}
          <div className="space-y-1.5">
            <label htmlFor="skills" className="text-small font-semibold text-foreground flex items-center justify-between">
              <span>Highlighted Skills / Keywords</span>
              <span className="text-micro font-normal text-muted-foreground">Comma-separated</span>
            </label>
            <div className="relative">
              <Sparkles size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="skills"
                type="text"
                value={skillsString}
                onChange={(e) => setSkillsString(e.target.value)}
                placeholder="React, TypeScript, Next.js, Web Performance, GraphQL"
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>

          {/* Tailoring Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-small font-semibold text-foreground">
              Tailoring Notes & Strategy
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What makes this resume distinct? (e.g. Highlights leadership & architecture experience for Series B+ companies)"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none"
            />
          </div>

          {/* Set as Default Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-secondary/40 cursor-pointer hover:bg-secondary/70 transition-colors">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring w-4 h-4 cursor-pointer"
            />
            <div className="text-left">
              <span className="text-small font-semibold text-foreground block">
                Set as Primary / Default Resume
              </span>
              <span className="text-micro text-muted-foreground block">
                Automatically selected when tracking new job applications.
              </span>
            </div>
          </label>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 text-small font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 text-small font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {(isSubmitting || isUploading) && <Loader2 size={15} className="animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Create Resume Version'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
