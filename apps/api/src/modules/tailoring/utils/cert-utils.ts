import { MasterProfileDTO } from '@tracker/types';

const CERT_KEY_REGEX = /cert|licen|credential/i;

/**
 * Collect verified certifications/licenses from a Master Profile.
 * Sources: factBank.certifications and any skills category whose key mentions
 * certifications, licenses, or credentials (e.g. "Nursing Licenses", "State Credentials").
 */
export function collectVerifiedCerts(profile: MasterProfileDTO): string[] {
  const fromFactBank = Array.isArray(profile.factBank?.certifications)
    ? (profile.factBank.certifications as unknown[]).map((c) => (typeof c === 'string' ? c : (c as any)?.name || '')).filter(Boolean)
    : [];

  const fromSkills = Object.entries(profile.skills || {})
    .filter(([category]) => CERT_KEY_REGEX.test(category))
    .flatMap(([, values]) => (Array.isArray(values) ? values : []))
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  return [...fromFactBank, ...fromSkills];
}

/**
 * Regulated professions (RN, CPA, state licensure, teaching credentials) are screened on
 * licenses first, so sections float certifications near the top when 2+ are verified.
 */
export function shouldFloatCertifications(profile: MasterProfileDTO): boolean {
  return collectVerifiedCerts(profile).length >= 2;
}
