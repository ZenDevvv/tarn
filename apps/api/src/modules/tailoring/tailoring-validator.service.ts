import { MasterProfileDTO, ValidationReportDTO } from '@tracker/types';

export type ValidationReport = ValidationReportDTO;

export class TailoringValidatorService {
  /**
   * Validate generated resume & cover letter against JD keywords and MasterProfile
   */
  public static validate(
    resumePayload: {
      experience?: Array<{ company: string; role: string; date_range?: string; bullets: string[] }>;
      projects?: Array<{ name: string; subtitle?: string; bullets: string[] }>;
      skills?: Record<string, string[]>;
      education?: Array<{ school?: string; graduation?: string }>;
    },
    coverLetterMarkdown: string,
    jdKeywords: string[],
    jdExactPhrases: string[],
    profile: MasterProfileDTO,
    targetCompany?: string
  ): ValidationReport {
    // 1. Build profile text corpus for grounding checks
    const profileTextParts: string[] = [];
    (profile.workExperience || []).forEach((w) => {
      profileTextParts.push(w.company || '', w.role || '', w.date_range || '', ...(w.bullets || []));
    });
    (profile.projectExperience || []).forEach((p) => {
      profileTextParts.push(p.name || '', p.subtitle || '', ...(p.bullets || []));
    });
    (profile.education || []).forEach((ed) => {
      profileTextParts.push(ed.school || '', ed.degree || '', ed.honors || '', ed.graduation || '');
    });
    if (profile.factBank) {
      Object.values(profile.factBank).forEach((val) => {
        if (Array.isArray(val)) {
          profileTextParts.push(...val.map(String));
        } else if (typeof val === 'string') {
          profileTextParts.push(val);
        }
      });
    }
    const profileCorpusLower = profileTextParts.join(' ').toLowerCase();

    // 2. Combine all resume text for keyword coverage
    const resumeTextParts: string[] = [];
    (resumePayload.experience || []).forEach((e) => {
      resumeTextParts.push(e.company, e.role, ...(e.bullets || []));
    });
    (resumePayload.projects || []).forEach((p) => {
      resumeTextParts.push(p.name, p.subtitle || '', ...(p.bullets || []));
    });
    Object.entries(resumePayload.skills || {}).forEach(([cat, vals]) => {
      resumeTextParts.push(cat, ...(vals || []));
    });
    const resumeCorpus = resumeTextParts.join(' ').toLowerCase();

    // 3. Keyword Coverage Calculation
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

    // 4. Exact Phrase Echoes in Cover Letter
    const clLower = (coverLetterMarkdown || '').toLowerCase();
    const exactPhraseEchoes: string[] = [];
    jdExactPhrases.forEach((phrase) => {
      const pLower = phrase.toLowerCase().trim();
      if (pLower.length > 5 && clLower.includes(pLower)) {
        exactPhraseEchoes.push(phrase);
      }
    });

    // 5. Fidelity Checks vs Master Profile
    const fidelityWarnings: string[] = [];

    // 5a. Skills Grounding
    const masterSkills = new Set(
      Object.values(profile.technicalSkills || {})
        .flat()
        .map((s) => s.toLowerCase().trim())
    );

    Object.entries(resumePayload.skills || {}).forEach(([cat, skills]) => {
      (skills || []).forEach((s) => {
        const sLower = s.toLowerCase().trim();
        if (!masterSkills.has(sLower)) {
          fidelityWarnings.push(`Ungrounded skill detected in ${cat}: "${s}" (not in Master Profile)`);
        }
      });
    });

    // 5b. Employers Grounding (Resume Experience)
    const masterCompanies = new Set(
      (profile.workExperience || []).map((w) => w.company.toLowerCase().trim())
    );
    (resumePayload.experience || []).forEach((e) => {
      const cLower = e.company.toLowerCase().trim();
      if (!masterCompanies.has(cLower)) {
        fidelityWarnings.push(`Ungrounded employer claim: "${e.company}"`);
      }
    });

    // 5c. Projects Grounding
    const masterProjects = new Set(
      (profile.projectExperience || []).map((p) => p.name.toLowerCase().trim())
    );
    (resumePayload.projects || []).forEach((p) => {
      const pLower = p.name.toLowerCase().trim();
      if (!masterProjects.has(pLower)) {
        fidelityWarnings.push(`Ungrounded project claim: "${p.name}" (not found in Master Profile)`);
      }
    });

    // 5d. Metrics / Quantified Claims Grounding (Resume & Cover Letter)
    const extractMetrics = (text: string): string[] => {
      const metrics: string[] = [];
      const pcts = text.match(/(?:\+|-)?\b\d+(?:\.\d+)?%/g) || [];
      const mults = text.match(/\b\d+(?:\.\d+)?x\b/gi) || [];
      const curr = text.match(/\$\d+(?:,\d+)*(?:\.\d+)?[kKmMbB]?/g) || [];
      const quants = text.match(/\b\d{1,3}(?:,\d{3})+\+?\b|\b\d+\+\b/g) || [];

      metrics.push(...pcts, ...mults, ...curr, ...quants);
      return Array.from(new Set(metrics));
    };

    const normalizeMetric = (m: string) => m.toLowerCase().replace(/[,+\s]/g, '');

    const outputMetrics = [
      ...extractMetrics(resumeCorpus),
      ...extractMetrics(clLower),
    ];

    outputMetrics.forEach((metric) => {
      const normMetric = normalizeMetric(metric);
      if (
        !profileCorpusLower.includes(metric.toLowerCase()) &&
        !profileCorpusLower.replace(/[,+\s]/g, '').includes(normMetric)
      ) {
        fidelityWarnings.push(`Ungrounded metric claim: "${metric}" (not found in candidate profile)`);
      }
    });

    // 5e. Dates / Year Ranges Grounding
    const profileYears = new Set(profileCorpusLower.match(/\b(19\d\d|20\d\d)\b/g) || []);
    profileYears.add(new Date().getFullYear().toString());

    (resumePayload.experience || []).forEach((e) => {
      if (e.date_range) {
        const years = e.date_range.match(/\b(19\d\d|20\d\d)\b/g) || [];
        years.forEach((yr) => {
          if (!profileYears.has(yr)) {
            fidelityWarnings.push(
              `Ungrounded year "${yr}" in experience "${e.company}" (not found in Master Profile)`
            );
          }
        });
      }
    });

    (resumePayload.education || []).forEach((ed) => {
      if (ed.graduation) {
        const years = ed.graduation.match(/\b(19\d\d|20\d\d)\b/g) || [];
        years.forEach((yr) => {
          if (!profileYears.has(yr)) {
            fidelityWarnings.push(`Ungrounded graduation year "${yr}" (not found in Master Profile)`);
          }
        });
      }
    });

    // 5f. Cover Letter Entities Grounding (Employers)
    if (coverLetterMarkdown) {
      const employerClaimRegex =
        /(?:role|position|developer|engineer|lead|time|tenure|work(?:ed)?)\s+(?:at|with|for)\s+([A-Z][A-Za-z0-9&.,\s]{2,35}?)(?=[.,\n]|(?:\s+(?:as|where|I|handling|leading)))/gi;
      let match: RegExpExecArray | null;
      while ((match = employerClaimRegex.exec(coverLetterMarkdown)) !== null) {
        const claimed = match[1].replace(/[.,;:]+$/, '').trim();
        const claimedLower = claimed.toLowerCase();
        const targetClean = (targetCompany || '').toLowerCase().trim();
        const isTarget =
          targetClean &&
          (claimedLower.includes(targetClean) || targetClean.includes(claimedLower));
        const isMaster =
          masterCompanies.has(claimedLower) ||
          Array.from(masterCompanies).some(
            (mc) => mc.includes(claimedLower) || claimedLower.includes(mc)
          );
        const isGeneric = [
          'the team',
          'the company',
          'this team',
          'your company',
          'your team',
          'the firm',
        ].includes(claimedLower);
        if (!isTarget && !isMaster && !isGeneric) {
          fidelityWarnings.push(
            `Ungrounded cover letter employer claim: "${claimed}" (not in candidate work history)`
          );
        }
      }
    }

    return {
      keywordCoveragePercent,
      matchedKeywords,
      missingKeywords,
      exactPhraseEchoes,
      fidelityWarnings,
      isValid: fidelityWarnings.length === 0,
      blocking: fidelityWarnings.length > 0,
      checkedDimensions: ['skills', 'employers', 'projects', 'metrics', 'dates', 'cover_letter'],
    };
  }
}
