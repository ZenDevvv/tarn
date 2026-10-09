import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Quote, ArrowRight, Loader2 } from 'lucide-react';
import { JdAnalysisResultDTO } from '@tracker/types';
import { cn } from '@/lib/cn';

interface TailoringScorecardProps {
  analysis?: JdAnalysisResultDTO | null;
  isLoading?: boolean;
  onOpenStudio: () => void;
  hasJobDescription: boolean;
  isTailored?: boolean;
  tailoredScore?: number | null;
  coverageDelta?: number;
  className?: string;
}

export function TailoringScorecard({
  analysis,
  isLoading,
  onOpenStudio,
  hasJobDescription,
  isTailored,
  tailoredScore,
  coverageDelta,
  className,
}: TailoringScorecardProps) {
  if (!hasJobDescription) {
    return (
      <div className={cn('space-y-3 pb-6 border-b border-border/70', className)}>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-secondary text-muted-foreground">
            <Sparkles size={15} />
          </div>
          <h3 className="font-display font-semibold text-small text-foreground">
            Role Alignment
          </h3>
        </div>
        <p className="text-caption text-muted-foreground leading-relaxed">
          Add the job description to unlock automated skill matching, gap analysis, and 1-click tailored deliverables.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-4 pb-6 border-b border-border/70', className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin text-primary" size={16} />
          <h3 className="font-display font-semibold text-small text-foreground">
            Analyzing Role Alignment...
          </h3>
        </div>
        <p className="text-caption text-muted-foreground">
          Extracting keywords and calculating candidate alignment.
        </p>
      </div>
    );
  }

  const baselineScore = analysis?.matchScore ?? 0;
  const displayScore =
    isTailored && typeof tailoredScore === 'number' && tailoredScore > 0
      ? tailoredScore
      : baselineScore;
  const matched = analysis?.matchedKeywords ?? [];
  const missing = analysis?.missingKeywords ?? [];
  const echoPhrases = analysis?.exactPhrases ?? [];

  return (
    <div className={cn('space-y-5 pb-6 border-b border-border/70', className)}>
      {/* Top Header & Score Gauge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Radial score gauge */}
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary/30 bg-primary/5 shrink-0">
            <span className="font-display font-bold text-body text-foreground">
              {displayScore}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-small text-foreground">
                Role Alignment
              </h3>
              {isTailored && (
                <span className="px-2 py-0.5 rounded-full text-micro font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <span>Tailored</span>
                  {typeof coverageDelta === 'number' && coverageDelta > 0 && (
                    <span className="font-semibold text-primary">+{coverageDelta}%</span>
                  )}
                </span>
              )}
            </div>
            <p className="text-micro text-muted-foreground mt-0.5">
              {isTailored && typeof coverageDelta === 'number' && coverageDelta > 0
                ? `Improved from baseline ${baselineScore}%`
                : 'Matched against your Career Fact Bank'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        type="button"
        onClick={onOpenStudio}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors cursor-pointer shadow-xs"
      >
        <Sparkles size={15} />
        <span>{isTailored ? 'Re-Tailor Deliverables' : 'Tailor Application'}</span>
        <ArrowRight size={14} />
      </button>

      {/* Multi-Factor ATS Score Breakdown */}
      {analysis?.scoreBreakdown && (
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/80 space-y-2">
          <div className="flex items-center justify-between text-micro font-semibold text-foreground uppercase tracking-wider">
            <span>ATS Alignment Breakdown</span>
            {typeof coverageDelta === 'number' && coverageDelta > 0 && (
              <span className="text-primary font-bold">+{coverageDelta}% Lift</span>
            )}
          </div>
          <div className="space-y-1.5 text-micro">
            <div>
              <div className="flex items-center justify-between text-muted-foreground mb-0.5">
                <span>Skills Match (60%)</span>
                <span className="font-medium text-foreground">{analysis.scoreBreakdown.skillsScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${analysis.scoreBreakdown.skillsScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-muted-foreground mb-0.5">
                <span>Role & Title Fit (25%)</span>
                <span className="font-medium text-foreground">{analysis.scoreBreakdown.roleScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/80 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.scoreBreakdown.roleScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-muted-foreground mb-0.5">
                <span>Impact & Action Verbs (15%)</span>
                <span className="font-medium text-foreground">{analysis.scoreBreakdown.impactScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.scoreBreakdown.impactScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matched Qualifications */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-micro font-medium text-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-primary" />
            <span>Matched Qualifications</span>
          </span>
          <span className="text-muted-foreground font-mono">{matched.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
          {matched.length === 0 ? (
            <span className="text-caption text-muted-foreground italic">None detected</span>
          ) : (
            matched.slice(0, 14).map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-micro font-medium bg-primary/10 text-foreground border border-primary/20"
              >
                {kw}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Missing / Gap Keywords */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-micro font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <AlertCircle size={13} />
            <span>Potential Gaps</span>
          </span>
          <span className="font-mono">{missing.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
          {missing.length === 0 ? (
            <span className="text-caption text-muted-foreground italic">Zero gaps detected!</span>
          ) : (
            missing.slice(0, 8).map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-micro bg-secondary text-muted-foreground border border-border"
              >
                {kw}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Exact Phrases to Echo */}
      {echoPhrases.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-micro font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Quote size={13} className="text-primary" />
              <span>Phrases to Echo</span>
            </span>
            <span className="text-muted-foreground font-mono">{echoPhrases.length}</span>
          </div>
          <p className="text-micro text-muted-foreground leading-relaxed">
            {echoPhrases.slice(0, 2).map((p) => `"${p}"`).join(', ')}
            {echoPhrases.length > 2 ? ` and ${echoPhrases.length - 2} more.` : '.'}
          </p>
        </div>
      )}
    </div>
  );
}
