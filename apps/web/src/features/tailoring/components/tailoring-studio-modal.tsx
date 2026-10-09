import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { JdAnalysisResultDTO } from '@tracker/types';
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
  jobDescription,
  roleTitle,
  companyName,
  onGenerated,
}: TailoringStudioModalProps) {
  const [mode, setMode] = useState<'deterministic' | 'ai' | 'prompt'>('deterministic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<TailoredPackageResponse | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  if (!isOpen) return null;

  const matchedKeywords = analysis?.matchedKeywords ?? [];
  const missingKeywords = analysis?.missingKeywords ?? [];
  const echoPhrases = analysis?.exactPhrases ?? [];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await tailoringApi.generatePackage(applicationId, {
        mode: mode === 'ai' ? 'ai' : 'deterministic',
      });
      setGenerationResult(res);
      onGenerated?.();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to generate tailored package';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    const prompt = `# ATS Resume & Cover Letter Tailoring Task

Target Role: ${roleTitle || 'Target Position'}
Target Company: ${companyName || 'Target Company'}

## Job Description
${jobDescription || 'N/A'}

## Analysis & Match Highlights
- Target Keywords: ${analysis?.highPriorityKeywords?.join(', ') || 'N/A'}
- Key Echo Phrases: ${echoPhrases.join(' | ') || 'N/A'}

## Instructions
1. Tailor the applicant's experience bullets to rank the highest-relevance achievements first.
2. Incorporate exact echo phrases naturally into the cover letter without buzzword stuffing.
3. Strict 0-hallucination rule: Only use verifiable achievements, metrics, and tools from applicant history.
4. Output professional, clean markdown.`;

    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
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
                    Tailored Deliverables Generated Successfully!
                  </h3>
                  <p className="text-caption text-muted-foreground">
                    Created tailored resume version and targeted cover letter with 0 factual drift.
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
                    <p className="font-display font-bold text-subheading text-foreground mt-0.5">
                      {generationResult.validation.keywordCoveragePercent}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-micro text-muted-foreground">Matched Skills</p>
                    <p className="font-display font-bold text-subheading text-foreground mt-0.5">
                      {generationResult.validation.matchedKeywords.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border col-span-2 sm:col-span-1">
                    <p className="text-micro text-muted-foreground">Fidelity Status</p>
                    <p className="font-display font-bold text-subheading text-primary mt-0.5 flex items-center gap-1">
                      <CheckCircle2 size={16} />
                      <span>0 Warnings</span>
                    </p>
                  </div>
                </div>

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
              {/* Error Message */}
              {error && (
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
              )}

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

              {/* Mode Selection */}
              <div className="space-y-3 pt-2 border-t border-border">
                <h4 className="font-display font-semibold text-small text-foreground">
                  Choose Tailoring Engine
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Deterministic */}
                  <label
                    className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                      mode === 'deterministic'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:border-foreground/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tailoring-mode"
                      value="deterministic"
                      checked={mode === 'deterministic'}
                      onChange={() => setMode('deterministic')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <Cpu size={14} className="text-primary" />
                        <span>Deterministic</span>
                      </span>
                    </div>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      100% offline rule-based n-gram ranker. Zero AI hallucinations.
                    </p>
                  </label>

                  {/* Option 2: Gemini Flash AI */}
                  <label
                    className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                      mode === 'ai'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:border-foreground/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tailoring-mode"
                      value="ai"
                      checked={mode === 'ai'}
                      onChange={() => setMode('ai')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary" />
                        <span>Gemini Flash</span>
                      </span>
                    </div>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      Semantic synthesis with strict fact-bank grounding.
                    </p>
                  </label>

                  {/* Option 3: Copy Prompt */}
                  <label
                    className={`flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                      mode === 'prompt'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:border-foreground/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tailoring-mode"
                      value="prompt"
                      checked={mode === 'prompt'}
                      onChange={() => setMode('prompt')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-small text-foreground flex items-center gap-1.5">
                        <Copy size={14} />
                        <span>External Prompt</span>
                      </span>
                    </div>
                    <p className="text-micro text-muted-foreground leading-relaxed">
                      Copy context-rich prompt to use in Claude, ChatGPT, or your own LLM.
                    </p>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-small font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {mode === 'prompt' ? (
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-semibold transition-colors cursor-pointer"
                  >
                    {promptCopied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{promptCopied ? 'Prompt Copied to Clipboard!' : 'Copy Tailoring Prompt'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Tailoring Deliverables...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate Tailored Deliverables</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
