import { MasterProfileDTO, JdAnalysisResultDTO } from '@tracker/types';

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
   * Frequency-based n-gram extraction for high-impact keywords/phrases
   */
  public static extractKeywordsFromText(text: string, topN: number = 30): string[] {
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
      if (TECH_PATTERN.test(phrase)) {
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

    const keywords = this.extractKeywordsFromText(jdText, 30);
    const keyVerbs = this.extractKeyVerbs(jdText);
    const exactPhrases = this.extractExactPhrases(jdText, 8);

    // Build user's factual corpus
    const profileTokens = new Set<string>();

    // Technical skills
    Object.values(profile.technicalSkills || {}).flat().forEach((s) => {
      profileTokens.add(s.toLowerCase().trim());
    });

    // Work bullets
    (profile.workExperience || []).forEach((w) => {
      w.bullets.forEach((b) => {
        b.toLowerCase().split(/\W+/).filter((t) => t.length > 2).forEach((token) => profileTokens.add(token));
      });
    });

    // Project tech stacks and bullets
    (profile.projectExperience || []).forEach((p) => {
      (p.stack || []).forEach((s) => profileTokens.add(s.toLowerCase().trim()));
      p.bullets.forEach((b) => {
        b.toLowerCase().split(/\W+/).filter((t) => t.length > 2).forEach((token) => profileTokens.add(token));
      });
    });

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    keywords.forEach((kw) => {
      const lower = kw.toLowerCase().trim();
      const contentWords = lower.split(/\W+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      const isMatched =
        profileTokens.has(lower) ||
        (contentWords.length > 0 && contentWords.every((w) => profileTokens.has(w))) ||
        contentWords.some((w) => profileTokens.has(w) && TECH_PATTERN.test(w));

      if (isMatched) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    // Calculate match score %
    const totalKeywords = keywords.length || 1;
    const matchScore = Math.min(100, Math.round((matchedKeywords.length / totalKeywords) * 100));

    return {
      matchScore,
      highPriorityKeywords: keywords.slice(0, 15),
      matchedKeywords,
      missingKeywords,
      keyVerbs,
      exactPhrases,
      role: role || '',
      company: company || '',
    };
  }
}
