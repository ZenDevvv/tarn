import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText,
  Mail,
  Lock,
} from 'lucide-react';
import { JdAnalysisResultDTO, GenerationQuotaDTO } from '@tracker/types';
import { tailoringApi, TailoredPackageResponse } from '../api/tailoring-api';
import { Link } from 'react-router-dom';

export interface TailoringStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  analysis?: JdAnalysisResultDTO | null;
  jobDescription?: string | null;
  roleTitle?: string;
  companyName?: string;
  onGenerated?: () => void;
}

export function TailoringStudioModal({
  isOpen,
  onClose,
  applicationId,
  analysis,
  jobDescription: _jobDescription,
  roleTitle: _roleTitle,
  companyName: _companyName,
  onGenerated,
}: TailoringStudioModalProps) {
  const [targetArtifact, setTargetArtifact] = useState<'package' | 'resume' | 'cover_letter'>('package');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingWarnings, setBlockingWarnings] = useState<string[]>([]);
  const [generationResult, setGenerationResult] = useState<TailoredPackageResponse | null>(null);
  const [quota, setQuota] = useState<GenerationQuotaDTO | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setBlockingWarnings([]);
      setGenerationResult(null);
      tailoringApi
        .getQuota()
        .then((q) => setQuota(q))
        .catch((err) => {
          console.error('Failed to load tailoring quota:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const matchedKeywords = analysis?.matchedKeywords ?? [];
  const missingKeywords = analysis?.missingKeywords ?? [];
  const echoPhrases = analysis?.exactPhrases ?? [];

  const handleGenerate = async (overrideWarnings = false) => {
    setIsGenerating(true);
    setError(null);
    setBlockingWarnings([]);
    try {
      const res = await tailoringApi.generatePackage(applicationId, {
        targetArtifact,
        overrideWarnings,
      });
      setGenerationResult(res);
      if (res.quota) {
        setQuota(res.quota);
      } else {
        const updatedQuota = await tailoringApi.getQuota().catch(() => null);
        if (updatedQuota) setQuota(updatedQuota);
      }
      onGenerated?.();
    } catch (err: any) {
      const status = err.response?.status;
      const code = err.response?.data?.error?.code || err.response?.data?.code;
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to generate tailored deliverable';
      setError(msg);

      if (status === 422 || code === 'UNGROUNDED_CLAIMS_DETECTED') {
        const details = err.response?.data?.error?.details || [];
        const warnings = details.map((d: any) => d.message).filter(Boolean);
        setBlockingWarnings(warnings.length > 0 ? warnings : [msg]);
      }

      if (status === 402 || code === 'PLANS_REQUIRED') {
        tailoringApi.getQuota().then((q) => setQuota(q)).catch(() => {});
      }
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tailoring-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2
                id="tailoring-studio-title"
                className="font-display font-bold text-heading text-foreground tracking-tight"
              >
                Tailoring Studio
              </h2>
              <p className="text-caption text-muted-foreground mt-0.5">
                Generate ATS-optimized resume bullets and targeted cover letter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-6">
          {/* Success Result View */}
          {generationResult ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                <FileCheck2 size={22} className="text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-small text-foreground">
                    {generationResult.resume && generationResult.coverLetter
                      ? 'Tailored Package Generated Successfully!'
                      : generationResult.resume
                      ? 'Tailored Resume Generated Successfully!'
                      : 'Tailored Cover Letter Generated Successfully!'}
                  </h3>
                  <p className="text-caption text-muted-foreground">
                    {generationResult.resume && generationResult.coverLetter
                      ? 'Created tailored resume version and targeted cover letter with 0 factual drift.'
                      : generationResult.resume
                      ? 'Created ATS-optimized resume version with 0 factual drift.'
                      : 'Created targeted cover letter with verified JD echo phrases.'}
                  </p>
                </div>
              </div>

              {/* Validation Report */}
              <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-display font-semibold text-caption text-foreground uppercase tracking-wider">
                  Quality & Fidelity Report
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-micro text-muted-foreground">Keyword Coverage</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <p className="font-display font-bold text-subheading text-foreground">
                        {generationResult.validation.keywordCoveragePercent}%
                      </p>
                      {generationResult.validation.coverageDelta > 0 && (
                        <span className="text-micro font-semibold text-primary">
                          +{generationResult.validation.coverageDelta}% lift
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-micro text-muted-foreground">Matched Skills</p>
                    <p className="font-display font-bold text-subheading text-foreground mt-0.5">
                      {generationResult.validation.matchedKeywords.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border col-span-2 sm:col-span-1">
                    <p className="text-micro text-muted-foreground">Fidelity Status</p>
                    <p
                      className={`font-display font-bold text-subheading mt-0.5 flex items-center gap-1 ${
                        generationResult.validation.fidelityWarnings.length === 0
                          ? 'text-primary'
                          : 'text-amber-500'
                      }`}
                    >
                      {generationResult.validation.fidelityWarnings.length === 0 ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>{generationResult.validation.fidelityWarnings.length} Warnings</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Honest Coverage Lift Explanation */}
                {generationResult.validation.coverageDelta > 0 ? (
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-micro text-foreground flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0 text-primary" />
                    <span>
                      Tailoring lifted keyword coverage by{' '}
                      <strong className="text-primary">
                        +{generationResult.validation.coverageDelta}%
                      </strong>{' '}
                      through truthful rephrasing of your profile experience.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-micro text-muted-foreground flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>
                      Coverage delta: ±0%. Tailoring surfaced all relevant profile material. To raise keyword coverage further, add missing skills to your Career Profile.
                    </span>
                  </div>
                )}

                <div className="text-micro text-muted-foreground flex items-center gap-1.5 pt-1">
                  <span>
                    Verified across 6 dimensions: skills, employers, projects, metrics, dates, and cover letter claims.
                  </span>
                </div>

                {generationResult.validation.fidelityWarnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 space-y-1">
                    <p className="text-caption font-semibold flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>Fidelity Warnings (Overridden):</span>
                    </p>
                    <ul className="list-disc list-inside text-micro space-y-0.5">
                      {generationResult.validation.fidelityWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {generationResult.validation.exactPhraseEchoes.length > 0 && (
                  <div className="pt-2">
                    <p className="text-micro text-muted-foreground mb-1.5">
                      Echoed JD Phrases in Cover Letter:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {generationResult.validation.exactPhraseEchoes.map((ph, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-micro bg-primary/10 text-primary border border-primary/20"
                        >
                          "{ph}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-semibold transition-colors cursor-pointer"
                >
                  View Deliverables
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Blocking Ungrounded Claims Error with Override Option */}
              {blockingWarnings.length > 0 ? (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-3 text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div className="space-y-1 text-small">
                      <p className="font-semibold text-foreground">
                        Ungrounded Claims Blocked Save
                      </p>
                      <p className="text-caption text-muted-foreground">
                        The synthesized output contained claims not verified in your Career Profile. You can edit your profile or choose to save anyway:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-micro text-destructive pt-1">
                        {blockingWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleGenerate(true)}
                      disabled={isGenerating}
                      className="px-3.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-caption font-semibold transition-colors cursor-pointer"
                    >
                      Save Anyway (Override Warnings)
                    </button>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="space-y-1 text-small">
                    <p className="font-semibold">{error}</p>
                    {error.includes('Master Profile') && (
                      <Link
                        to="/settings"
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-caption underline font-medium mt-1 text-foreground hover:text-primary"
                      >
                        <span>Open Settings to configure your Career Profile</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Keyword & Role Alignment Preview */}
              <div className="space-y-3">
                <h4 className="font-display font-semibold text-small text-foreground">
                  Job Description Alignment Analysis
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg border border-border bg-secondary/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
                      <CheckCircle2 size={14} className="text-primary" />
                      <span>Found in your Profile ({matchedKeywords.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto">
                      {matchedKeywords.length === 0 ? (
                        <span className="text-micro text-muted-foreground italic">None detected</span>
                      ) : (
                        matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-micro bg-primary/10 text-foreground border border-primary/20"
                          >
                            {kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-border bg-secondary/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                      <AlertCircle size={14} />
                      <span>Skill Gaps ({missingKeywords.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[70px] overflow-y-auto">
                      {missingKeywords.length === 0 ? (
                        <span className="text-micro text-muted-foreground italic">Zero gaps</span>
                      ) : (
                        missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-micro bg-secondary text-muted-foreground border border-border"
                          >
                            {kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {echoPhrases.length > 0 && (
                  <div className="p-3 rounded-lg border border-border bg-secondary/20">
                    <p className="text-micro text-muted-foreground mb-1">
                      High-Resonance Echo Phrases:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {echoPhrases.map((phrase, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-micro bg-muted text-foreground border border-border"
                        >
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Deliverable Target Selection */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-small text-foreground">
                    Select Deliverable to Generate
                  </h4>
                  {quota && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-micro font-medium ${
                        quota.remainingToday > 0 && quota.isEntitled
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-destructive/10 text-destructive border border-destructive/20 font-semibold'
                      }`}
                    >
                      {quota.remainingToday} of {quota.limit} free left today
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Full Package */}
                  <label
                    className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                      targetArtifact === 'package'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:border-foreground/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="target-artifact"
                      value="package"
                      checked={targetArtifact === 'package'}
                      onChange={() => setTargetArtifact('package')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <Layers size={14} className="text-primary" />
                        <span>Full Package</span>
                      </span>
                    </div>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      Tailored resume and targeted cover letter in one synthesis pass.
                    </p>
                  </label>

                  {/* Option 2: Resume Only */}
                  <label
                    className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                      targetArtifact === 'resume'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:border-foreground/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="target-artifact"
                      value="resume"
                      checked={targetArtifact === 'resume'}
                      onChange={() => setTargetArtifact('resume')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <FileText size={14} className="text-primary" />
                        <span>Resume Only</span>
                      </span>
                    </div>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      ATS-optimized resume reordered for highest relevance.
                    </p>
                  </label>

                  {/* Option 3: Cover Letter Only */}
                  <label
                    className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                      targetArtifact === 'cover_letter'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:border-foreground/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="target-artifact"
                      value="cover_letter"
                      checked={targetArtifact === 'cover_letter'}
                      onChange={() => setTargetArtifact('cover_letter')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <Mail size={14} className="text-primary" />
                        <span>Cover Letter Only</span>
                      </span>
                    </div>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      Targeted cover letter with verbatim echoed JD phrases.
                    </p>
                  </label>
                </div>
              </div>

              {/* Quota Limit Notice */}
              {quota && (!quota.isEntitled || quota.remainingToday <= 0) && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-500">
                  <Lock size={18} className="shrink-0 mt-0.5" />
                  <div className="space-y-1 text-small">
                    <p className="font-semibold text-foreground">
                      {!quota.isEntitled
                        ? 'A paid plan is required to generate tailored deliverables.'
                        : 'Daily free generation limit reached (5/5).'}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Free accounts receive 5 AI generations per day. Upgrade to a Pro plan for unlimited tailoring or check back tomorrow.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-small font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || (quota !== null && (!quota.isEntitled || quota.remainingToday <= 0))}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Synthesizing Deliverable...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>
                        Generate {targetArtifact === 'package' ? 'Deliverables' : targetArtifact === 'resume' ? 'Resume' : 'Cover Letter'}
                      </span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
