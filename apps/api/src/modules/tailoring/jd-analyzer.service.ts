import {
  MasterProfileDTO,
  JdAnalysisResultDTO,
  AtsScoreBreakdownDTO,
  ScoreLiftReportDTO,
} from '@tracker/types';

export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'with', 'as', 'by',
  'is', 'are', 'be', 'will', 'should', 'must', 'can', 'may', 'from', 'that', 'this',
  'we', 'you', 'your', 'our', 'their', 'company', 'role', 'position', 'team', 'work',
  'experience', 'job', 'candidate', 'applicant', 'requirements', 'responsibilities',
  'including', 'etc', 'etc.', 'plus', 'preferred', 'required', 'qualification',
  'qualifications', 'skills', 'ability', 'abilities', 'strong', 'excellent', 'highly',
  'minimum', 'years', 'year', 'degree', 'bachelor', "bachelor's", 'remote', 'full-time',
  'about', 'have', 'has', 'had', 'been', 'would', 'could', 'what', 'who', 'when',
]);

export const COMMON_ACTION_VERBS = new Set([
  'build', 'develop', 'design', 'implement', 'create', 'manage', 'lead', 'analyze',
  'research', 'synthesize', 'organize', 'maintain', 'track', 'collaborate', 'support',
  'iterate', 'prototype', 'automate', 'optimize', 'deliver', 'coordinate', 'improve',
  'integrate', 'test', 'deploy', 'review', 'architect', 'drive', 'ensure', 'identify',
]);

export const TECH_PATTERN = /\b(React|TypeScript|Node\.?js|MongoDB|Prisma|Next\.?js|Tailwind|Jest|Playwright|GitHub|Docker|Firebase|Python|JavaScript|REST|API|JWT|Zod|Express|Agile|Scrum|CI\/CD|GraphQL|PostgreSQL|AWS|Kubernetes|Vue|Angular|Redux|Zustand|CSS|HTML)\b/i;

export class JdAnalyzerService {
  public static cleanPhrase(phrase: string): string {
    return phrase
      .replace(/\s+/g, ' ')
      .replace(/^[ ,.;:()[\]"']+|[ ,.;:()[\]"']+$/g, '')
      .trim();
  }

  /**
   * Light stemmer stripping common English inflectional suffixes:
   * ings?, ments?, tions?, sions?, ers?, ed, es, s.
   * Unifies manage/management/managing/managed -> manag.
   */
  public static stemWord(word: string): string {
    const lower = word.toLowerCase().trim();
    if (lower.length <= 3) return lower;
    if (!/^[a-z]+$/i.test(lower)) return lower;

    let stem = lower;
    const suffixRegex = /(?:ments?|tions?|sions?|ings?|ers?|ed|es|s)$/i;
    const match = stem.match(suffixRegex);
    if (match && stem.length - match[0].length >= 3) {
      stem = stem.slice(0, -match[0].length);
    }

    if (stem.endsWith('e') && stem.length > 3) {
      stem = stem.slice(0, -1);
    }

    return stem;
  }

  /**
   * Frequency-based n-gram extraction for high-impact keywords/phrases
   */
  public static extractKeywordsFromText(
    text: string,
    topN: number = 30,
    profileTechPrior?: Set<string>
  ): string[] {
    const lowered = text.toLowerCase();
    const words = lowered.match(/[a-zA-Z][a-zA-Z0-9.\-+#/]*/g) || [];
    const ngrams: string[] = [];

    // 1. Unigrams
    for (const w of words) {
      if (!STOP_WORDS.has(w) && w.length > 2) {
        ngrams.push(w);
      }
    }

    // 2. Bigrams & Trigrams
    for (let i = 0; i < words.length - 1; i++) {
      if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
        ngrams.push(`${words[i]} ${words[i + 1]}`);
      }
    }
    for (let i = 0; i < words.length - 2; i++) {
      if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1]) && !STOP_WORDS.has(words[i + 2])) {
        ngrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }

    // 3. 4-grams around action phrases
    for (let i = 0; i < words.length - 3; i++) {
      const four = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`;
      if (four.includes('using') || four.includes('with') || four.includes('and')) {
        ngrams.push(four);
      }
    }

    // Count and score
    const counts = new Map<string, number>();
    for (const phrase of ngrams) {
      counts.set(phrase, (counts.get(phrase) || 0) + 1);
    }

    const scored: Array<{ score: number; phrase: string }> = [];
    for (const [phrase, count] of counts.entries()) {
      let score = count;
      if ([...COMMON_ACTION_VERBS].some((v) => phrase.includes(v))) {
        score += 1.5;
      }

      const phraseLower = phrase.toLowerCase();
      const phraseTokens = phraseLower.split(/\W+/).filter((t) => t.length > 1);
      const matchesTechPrior =
        TECH_PATTERN.test(phrase) ||
        Boolean(
          profileTechPrior &&
            phraseTokens.some(
              (t) => profileTechPrior.has(t) || profileTechPrior.has(this.stemWord(t))
            )
        );

      if (matchesTechPrior) {
        score += 2.0;
      }
      if (count >= 2) {
        score += 1.0;
      }
      scored.push({ score, phrase });
    }

    scored.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const results: string[] = [];
    for (const item of scored) {
      const cleaned = this.cleanPhrase(item.phrase);
      if (cleaned && !seen.has(cleaned) && cleaned.length > 2) {
        seen.add(cleaned);
        results.push(cleaned);
        if (results.length >= topN) break;
      }
    }

    return results;
  }

  /**
   * Extract high-value exact phrases worth echoing in cover letter
   */
  public static extractExactPhrases(text: string, count: number = 8): string[] {
    const rawMatches = text.match(/(?:(?:build|develop|design|collaborate|lead|manage|deliver|maintain|create)\s+[^,.;:()]{10,60})/gi) || [];
    const phrases: string[] = [];
    const seen = new Set<string>();

    for (const match of rawMatches) {
      const clean = this.cleanPhrase(match);
      const lower = clean.toLowerCase();
      if (clean.length >= 12 && !seen.has(lower)) {
        seen.add(lower);
        phrases.push(clean);
        if (phrases.length >= count) break;
      }
    }

    return phrases;
  }

  /**
   * Extract key action verbs from text
   */
  public static extractKeyVerbs(text: string): string[] {
    const words = (text.toLowerCase().match(/[a-z]+/g) || []);
    const found = new Set<string>();
    for (const w of words) {
      if (COMMON_ACTION_VERBS.has(w)) {
        found.add(w);
      }
    }
    return Array.from(found);
  }

  /**
   * Full analysis comparing JD against user's MasterProfile
   */
  public static analyze(jdText: string, profile: MasterProfileDTO, role?: string, company?: string): JdAnalysisResultDTO {
    if (!jdText || jdText.trim().length === 0) {
      return {
        matchScore: 0,
        highPriorityKeywords: [],
        matchedKeywords: [],
        missingKeywords: [],
        keyVerbs: [],
        exactPhrases: [],
        role: role || '',
        company: company || '',
      };
    }

    const profileTechPrior = new Set<string>();
    const profileSkillList: string[] = [
      ...Object.values(profile.technicalSkills || {}).flat(),
      ...(profile.projectExperience || []).flatMap((p) => p.stack || []),
    ];
    profileSkillList.forEach((s) => {
      const norm = s.toLowerCase().trim();
      if (norm.length > 1) {
        profileTechPrior.add(norm);
        profileTechPrior.add(this.stemWord(norm));
        norm.split(/\W+/).filter((t) => t.length > 1).forEach((token) => {
          profileTechPrior.add(token);
          profileTechPrior.add(this.stemWord(token));
        });
      }
    });

    const keywords = this.extractKeywordsFromText(jdText, 30, profileTechPrior);
    const keyVerbs = this.extractKeyVerbs(jdText);
    const exactPhrases = this.extractExactPhrases(jdText, 8);

    // Build user's factual corpus
    const profileTokens = new Set<string>();
    const profileStemmedTokens = new Set<string>();

    const addProfileToken = (token: string) => {
      const clean = token.toLowerCase().trim();
      if (clean.length > 1) {
        profileTokens.add(clean);
        profileStemmedTokens.add(this.stemWord(clean));
      }
    };

    // Technical skills
    profileSkillList.forEach((s) => {
      addProfileToken(s);
      s.split(/\W+/).filter((t) => t.length > 1).forEach(addProfileToken);
    });

    // Work roles and bullets
    (profile.workExperience || []).forEach((w) => {
      if (w.role) w.role.split(/\W+/).forEach(addProfileToken);
      w.bullets.forEach((b) => {
        b.split(/\W+/).filter((t) => t.length > 2).forEach(addProfileToken);
      });
    });

    // Project names, stacks, and bullets
    (profile.projectExperience || []).forEach((p) => {
      if (p.name) p.name.split(/\W+/).forEach(addProfileToken);
      (p.stack || []).forEach(addProfileToken);
      p.bullets.forEach((b) => {
        b.split(/\W+/).filter((t) => t.length > 2).forEach(addProfileToken);
      });
    });

    // FactBank highlights
    if (profile.factBank) {
      [
        ...(profile.factBank.core_positioning || []),
        ...(profile.factBank.priority_themes || []),
        ...(profile.factBank.quantified_highlights || []),
      ].forEach((text) => {
        text.split(/\W+/).filter((t) => t.length > 2).forEach(addProfileToken);
      });
    }

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    keywords.forEach((kw) => {
      const lower = kw.toLowerCase().trim();
      const contentWords = lower.split(/\W+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      const exactMatch =
        profileTokens.has(lower) || profileStemmedTokens.has(this.stemWord(lower));

      // Multi-word keyword match: require any content word (word-boundary/stem), not every
      const contentMatch =
        contentWords.length > 0 &&
        contentWords.some((w) => {
          const stemmed = this.stemWord(w);
          return (
            profileTokens.has(w) ||
            profileStemmedTokens.has(stemmed) ||
            profileTechPrior.has(w) ||
            profileTechPrior.has(stemmed)
          );
        });

      if (exactMatch || contentMatch) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const candidateCorpusLower = Array.from(profileTokens).join(' ');
    const allBullets = [
      ...(profile.workExperience || []).flatMap((w) => w.bullets || []),
      ...(profile.projectExperience || []).flatMap((p) => p.bullets || []),
    ];
    const titles = (profile.workExperience || []).map((w) => w.role || '');

    const scoreBreakdown = this.calculateMultiFactorAtsScore({
      matchedKeywords,
      totalKeywords: keywords,
      bullets: allBullets,
      titles,
      targetRole: role || '',
      targetCompany: company || '',
      candidateCorpusLower,
    });

    return {
      matchScore: scoreBreakdown.totalScore,
      highPriorityKeywords: keywords.slice(0, 15),
      matchedKeywords,
      missingKeywords,
      keyVerbs,
      exactPhrases,
      role: role || '',
      company: company || '',
      scoreBreakdown,
    };
  }

  public static calculateMultiFactorAtsScore(params: {
    matchedKeywords: string[];
    totalKeywords: string[];
    bullets: string[];
    titles: string[];
    targetRole?: string;
    targetCompany?: string;
    candidateCorpusLower?: string;
  }): AtsScoreBreakdownDTO {
    const {
      matchedKeywords,
      totalKeywords,
      bullets,
      titles,
      targetRole = '',
      targetCompany = '',
      candidateCorpusLower = '',
    } = params;

    // 1. Skills Score (60% weight)
    let totalKwWeight = 0;
    let matchedKwWeight = 0;
    const matchedSet = new Set(matchedKeywords.map((k) => k.toLowerCase()));

    totalKeywords.forEach((kw) => {
      const weight = TECH_PATTERN.test(kw) || kw.length > 6 ? 2.0 : 1.0;
      totalKwWeight += weight;
      if (matchedSet.has(kw.toLowerCase())) {
        matchedKwWeight += weight;
      }
    });

    const skillsScore =
      totalKwWeight > 0
        ? Math.min(100, Math.round((matchedKwWeight / totalKwWeight) * 100))
        : 100;

    // 2. Role Fit Score (25% weight: title up to 60, domain/company up to 40)
    let roleScore = 0;
    const targetRoleTokens = targetRole
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    if (targetRoleTokens.length > 0) {
      const candidateTitlesLower = titles.map((t) => t.toLowerCase()).join(' ');
      const matchedRoleTokens = targetRoleTokens.filter(
        (t) => candidateTitlesLower.includes(t) || candidateCorpusLower.includes(t)
      );
      const titleRatio = matchedRoleTokens.length / targetRoleTokens.length;
      roleScore += Math.round(titleRatio * 60);
    } else {
      roleScore += 45;
    }

    if (targetCompany && targetCompany.trim()) {
      const companyClean = targetCompany.toLowerCase().trim();
      if (candidateCorpusLower.includes(companyClean)) {
        roleScore += 40;
      } else {
        roleScore += 25;
      }
    } else {
      roleScore += 30;
    }
    roleScore = Math.min(100, roleScore);

    // 3. Impact & Action Verbs Score (15% weight)
    let verbBullets = 0;
    const metricRegex = /\b\d+%\b|\b\d+[\+kKmMbB]?\s*(?:users|records|endpoints|requests|devices|transactions|clients|builds|tenants)\b|\b\$\d+|\b(?:sub-\d+ms|\d+\s*(?:ms|seconds|minutes|days|weeks|months))\b/i;
    let metricsCount = 0;

    bullets.forEach((bullet) => {
      const clean = bullet.trim();
      const firstWord = (clean.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
      const stemmedFirst = JdAnalyzerService.stemWord(firstWord);
      const isAction =
        COMMON_ACTION_VERBS.has(firstWord) ||
        COMMON_ACTION_VERBS.has(stemmedFirst) ||
        /^(?:built|designed|developed|implemented|managed|led|delivered|engineered|architected|spearheaded|automated|optimized|orchestrated|authored|created|integrated|shipped|scaled|reduced)/i.test(firstWord);

      if (isAction) verbBullets++;

      const metricMatches = clean.match(metricRegex);
      if (metricMatches) {
        metricsCount += metricMatches.length;
      }
    });

    const totalBullets = Math.max(1, bullets.length);
    const verbRatio = verbBullets / totalBullets;
    const verbsPoints = Math.min(50, Math.round(verbRatio * 50 * 1.25));
    const metricPoints = Math.min(50, Math.round(metricsCount * 12.5));
    const impactScore = Math.min(100, verbsPoints + metricPoints);

    // Composite ATS Score
    const totalScore = Math.min(
      100,
      Math.round(0.60 * skillsScore + 0.25 * roleScore + 0.15 * impactScore)
    );

    return {
      totalScore,
      skillsScore,
      roleScore,
      impactScore,
      metricsCount,
      verbsCount: verbBullets,
      matchedSkillsCount: matchedKeywords.length,
      totalSkillsCount: totalKeywords.length,
    };
  }

  public static evaluateResumePayload(
    resumePayload: any,
    targetRole: string = '',
    targetCompany: string = '',
    keywords: string[] = []
  ): AtsScoreBreakdownDTO & { matchedKeywords: string[]; missingKeywords: string[] } {
    const resumeTokens = new Set<string>();
    const resumeStemmedTokens = new Set<string>();

    const addToken = (token: string) => {
      const clean = token.toLowerCase().trim();
      if (clean.length > 1) {
        resumeTokens.add(clean);
        resumeStemmedTokens.add(this.stemWord(clean));
      }
    };

    const exp = resumePayload.experience || [];
    const projs = resumePayload.projects || [];
    const skills = resumePayload.skills || {};

    // Skills
    Object.values(skills).flat().forEach((s: any) => {
      if (typeof s === 'string') {
        addToken(s);
        s.split(/\W+/).filter((t) => t.length > 1).forEach(addToken);
      }
    });

    // Bullets & titles
    const bullets: string[] = [];
    const titles: string[] = [];

    exp.forEach((e: any) => {
      if (e.role) {
        titles.push(e.role);
        e.role.split(/\W+/).forEach(addToken);
      }
      if (e.company) e.company.split(/\W+/).forEach(addToken);
      (e.bullets || []).forEach((b: string) => {
        bullets.push(b);
        b.split(/\W+/).filter((t) => t.length > 2).forEach(addToken);
      });
    });

    projs.forEach((p: any) => {
      if (p.name) p.name.split(/\W+/).forEach(addToken);
      (p.bullets || []).forEach((b: string) => {
        bullets.push(b);
        b.split(/\W+/).filter((t) => t.length > 2).forEach(addToken);
      });
    });

    const candidateCorpusLower = Array.from(resumeTokens).join(' ');

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    keywords.forEach((kw) => {
      const lower = kw.toLowerCase().trim();
      const contentWords = lower.split(/\W+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      const exactMatch =
        resumeTokens.has(lower) || resumeStemmedTokens.has(this.stemWord(lower));
      const contentMatch =
        contentWords.length > 0 &&
        contentWords.some((w) => {
          const stemmed = this.stemWord(w);
          return resumeTokens.has(w) || resumeStemmedTokens.has(stemmed);
        });

      if (exactMatch || contentMatch) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const breakdown = this.calculateMultiFactorAtsScore({
      matchedKeywords,
      totalKeywords: keywords,
      bullets,
      titles,
      targetRole,
      targetCompany,
      candidateCorpusLower,
    });

    return {
      ...breakdown,
      matchedKeywords,
      missingKeywords,
    };
  }

  public static computeScoreLift(
    baseline: AtsScoreBreakdownDTO,
    tailored: AtsScoreBreakdownDTO,
    baselineMatched: string[] = [],
    tailoredMatched: string[] = []
  ): ScoreLiftReportDTO {
    const baseSet = new Set(baselineMatched.map((k) => k.toLowerCase()));
    const bridgedKeywords = tailoredMatched.filter((k) => !baseSet.has(k.toLowerCase()));

    return {
      baseline,
      tailored,
      lift: {
        totalLift: Math.max(0, tailored.totalScore - baseline.totalScore),
        skillsLift: Math.max(0, tailored.skillsScore - baseline.skillsScore),
        roleLift: Math.max(0, tailored.roleScore - baseline.roleScore),
        impactLift: Math.max(0, tailored.impactScore - baseline.impactScore),
      },
      bridgedKeywords,
    };
  }
}
