import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { masterProfileApi } from '@/features/master-profile/api/master-profile-api';

interface ResumeUploadDropzoneProps {
  onSuccess: () => void;
}

export function ResumeUploadDropzone({ onSuccess }: ResumeUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setFeedback(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          await masterProfileApi.uploadResume({
            filename: file.name,
            mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
            fileData: base64Data,
          });
          setFeedback({
            type: 'success',
            message: `✨ Successfully parsed "${file.name}"! Your career profile has been updated.`,
          });
          onSuccess();
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
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
            Auto-extracts contact basics, verified experience bullets, projects, skills, and education.
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
