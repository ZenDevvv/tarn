import { MasterProfileDTO } from '@tracker/types';

export interface ValidationReport {
  keywordCoveragePercent: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  exactPhraseEchoes: string[];
  fidelityWarnings: string[];
  isValid: boolean;
}

export class TailoringValidatorService {
  /**
   * Validate generated resume & cover letter against JD keywords and MasterProfile
   */
  public static validate(
    resumePayload: {
      experience?: Array<{ company: string; role: string; bullets: string[] }>;
      projects?: Array<{ name: string; subtitle?: string; bullets: string[] }>;
      skills?: Record<string, string[]>;
    },
    coverLetterMarkdown: string,
    jdKeywords: string[],
    jdExactPhrases: string[],
    profile: MasterProfileDTO
  ): ValidationReport {
    // 1. Combine all resume text
    const resumeTextParts: string[] = [];
    (resumePayload.experience || []).forEach((e) => {
      resumeTextParts.push(e.company, e.role, ...e.bullets);
    });
    (resumePayload.projects || []).forEach((p) => {
      resumeTextParts.push(p.name, p.subtitle || '', ...p.bullets);
    });
    Object.entries(resumePayload.skills || {}).forEach(([cat, vals]) => {
      resumeTextParts.push(cat, ...vals);
    });
    const resumeCorpus = resumeTextParts.join(' ').toLowerCase();

    // 2. Compute keyword coverage
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    jdKeywords.forEach((kw) => {
      const lower = kw.toLowerCase().trim();
      if (!lower || lower.length < 2) return;
      if (resumeCorpus.includes(lower)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const totalKw = jdKeywords.length || 1;
    const keywordCoveragePercent = Math.min(100, Math.round((matchedKeywords.length / totalKw) * 100));

    // 3. Check exact phrase echoes in cover letter
    const clLower = (coverLetterMarkdown || '').toLowerCase();
    const exactPhraseEchoes: string[] = [];
    jdExactPhrases.forEach((phrase) => {
      const pLower = phrase.toLowerCase().trim();
      if (pLower.length > 5 && clLower.includes(pLower)) {
        exactPhraseEchoes.push(phrase);
      }
    });

    // 4. Fidelity Checks vs MasterProfile
    const fidelityWarnings: string[] = [];

    // Master skills set
    const masterSkills = new Set(
      Object.values(profile.technicalSkills || {})
        .flat()
        .map((s) => s.toLowerCase().trim())
    );

    // Check if generated resume skills contain tools outside master
    Object.entries(resumePayload.skills || {}).forEach(([cat, skills]) => {
      skills.forEach((s) => {
        const sLower = s.toLowerCase().trim();
        if (!masterSkills.has(sLower)) {
          fidelityWarnings.push(`Ungrounded skill detected in ${cat}: "${s}" (not in Master Profile)`);
        }
      });
    });

    // Master companies set
    const masterCompanies = new Set(
      (profile.workExperience || []).map((w) => w.company.toLowerCase().trim())
    );
    (resumePayload.experience || []).forEach((e) => {
      const cLower = e.company.toLowerCase().trim();
      if (!masterCompanies.has(cLower)) {
        fidelityWarnings.push(`Ungrounded employer claim: "${e.company}"`);
      }
    });

    return {
      keywordCoveragePercent,
      matchedKeywords,
      missingKeywords,
      exactPhraseEchoes,
      fidelityWarnings,
      isValid: fidelityWarnings.length === 0,
    };
  }
}
