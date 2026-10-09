import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Edit3,
  Eye,
  Save,
  Loader2,
  FileText,
  Check,
} from 'lucide-react';
import { CoverLetterDTO } from '@tracker/types';
import { coverLetterApi } from '@/features/cover-letters/api/cover-letter-api';
import { resolveDocumentUrl } from '@/features/resumes/api/resume-api';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  previewHtmlUrl?: string | null;
  fileUrl?: string | null;
  coverLetter?: CoverLetterDTO | null;
  onCoverLetterUpdated?: (updated: CoverLetterDTO) => void;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  previewHtmlUrl,
  fileUrl,
  coverLetter,
  onCoverLetterUpdated,
}: DocumentPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Live HTML state for robust in-browser rendering
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [htmlError, setHtmlError] = useState<string | null>(null);

  // Edit field for cover letter markdown content
  const [contentText, setContentText] = useState('');

  useEffect(() => {
    if (coverLetter?.content) {
      setContentText(coverLetter.content);
    }
  }, [coverLetter]);

  useEffect(() => {
    if (!isOpen) return;

    if (previewHtmlUrl) {
      setIsLoadingHtml(true);
      setHtmlError(null);

      fetch(previewHtmlUrl, { credentials: 'include' })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Failed to load document preview (HTTP ${res.status})`);
          }
          return res.text();
        })
        .then((html) => {
          setHtmlContent(html);
          setIsLoadingHtml(false);
        })
        .catch((err) => {
          console.error('Error fetching preview HTML:', err);
          setHtmlError(err.message || 'Could not load preview HTML');
          setIsLoadingHtml(false);
        });
    } else {
      setHtmlContent(null);
      setIsLoadingHtml(false);
      setHtmlError(null);
    }
  }, [isOpen, previewHtmlUrl, iframeKey]);

  if (!isOpen) return null;

  const downloadUrl = fileUrl ? resolveDocumentUrl(fileUrl) : null;

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!coverLetter) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await coverLetterApi.updateCoverLetter(coverLetter.id, {
        name: coverLetter.name,
        role: coverLetter.role || undefined,
        company: coverLetter.company || undefined,
        content: contentText,
      });

      onCoverLetterUpdated?.(updated);
      setSaveSuccess(true);
      setIframeKey((k) => k + 1);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('preview');
      }, 1000);
    } catch (err) {
      console.error('Failed to update cover letter:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-4xl h-[92dvh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h2
                id="document-preview-title"
                className="font-display font-bold text-subheading text-foreground tracking-tight"
              >
                {title}
              </h2>
              {coverLetter && (
                <p className="text-micro text-muted-foreground">
                  {coverLetter.role} {coverLetter.company ? `• ${coverLetter.company}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Center Tabs (if editable cover letter) */}
          {coverLetter && (
            <div className="flex items-center p-1 rounded-lg bg-secondary border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye size={13} />
                <span>Document View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption font-medium transition-colors cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit3 size={13} />
                <span>Edit Content</span>
              </button>
            </div>
          )}

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            {activeTab === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Print or Save via System Dialog"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-caption font-medium transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download rendered PDF"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-caption font-medium transition-colors"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download PDF</span>
                  </a>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer ml-1"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-secondary/40 overflow-hidden relative flex flex-col">
          {activeTab === 'preview' ? (
            isLoadingHtml ? (
              <div className="flex flex-col items-center justify-center h-full gap-2.5 text-muted-foreground text-small">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span>Loading document preview...</span>
              </div>
            ) : htmlContent ? (
              <div className="flex-1 w-full h-full p-2 sm:p-4 overflow-y-auto flex justify-center">
                <div className="w-full max-w-3xl h-full shadow-lg rounded-md overflow-hidden border border-border bg-white">
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    srcDoc={htmlContent}
                    title={title}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            ) : downloadUrl && (downloadUrl.toLowerCase().includes('.pdf') || fileUrl?.toLowerCase().includes('.pdf')) ? (
              <div className="flex-1 w-full h-full p-2 sm:p-4 overflow-y-auto flex justify-center">
                <div className="w-full max-w-3xl h-full shadow-lg rounded-md overflow-hidden border border-border bg-white">
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    src={`${downloadUrl}#toolbar=0&navpanes=0`}
                    title={title}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-small gap-3 p-6 text-center">
                <FileText size={32} className="text-muted-foreground/60" />
                <div>
                  <p className="font-semibold text-foreground">No preview document available</p>
                  <p className="text-caption text-muted-foreground mt-1">
                    {htmlError || 'The document preview could not be loaded.'}
                  </p>
                </div>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-caption font-semibold hover:opacity-95 transition-opacity"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </a>
                )}
              </div>
            )
          ) : (
            /* Edit Cover Letter Form */
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 max-w-3xl mx-auto w-full">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-caption font-semibold text-foreground">Cover Letter Text (Markdown)</label>
                  <span className="text-micro text-muted-foreground">
                    Edit greeting, body paragraphs, and sign-off directly
                  </span>
                </div>
                <textarea
                  rows={16}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                  placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my strong interest in..."
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-micro text-muted-foreground">
                  Saving will immediately re-render the printable PDF and HTML preview.
                </span>

                <button
                  type="button"
                  onClick={handleSaveCoverLetter}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving & Re-rendering...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check size={15} />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save & Re-render</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
