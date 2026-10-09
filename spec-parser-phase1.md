# Specification: Resume Ingestion Phase 1 (Deterministic Hardening)

> **Initiative:** Deterministic Hardening & Multi-Domain Expansion of Resume Ingestion  
> **Target:** `apps/api/src/modules/master-profile/profile-extractor.service.ts`  
> **Status:** Approved for Implementation  
> **Parent Architecture:** [roadmap-parser-evolution.md](file:///home/machenike/.gemini/antigravity-cli/brain/82b03a4a-3f53-4e1c-8003-b119ac0843b2/roadmap-parser-evolution.md)  
> **Task Plan:** [tasks/plan-parser-phase1.md](tasks/plan-parser-phase1.md)  

---

## 1. Objective

Guarantee that `ProfileExtractorService` parses resumes from diverse non-tech professions (nursing, education, law, trades, academia) and international candidates without silent data loss.

Specifically, resolve 4 critical defects in `ProfileExtractorService`:
1. **D1 (Section Aliases):** Clinical rotations, teaching experience, bar admissions, and multi-lingual headings are currently ignored and dropped from extraction.
2. **D2 (Multi-Degree Education):** The education parser currently collapses all education lines into a single entry, discarding multiple degrees (e.g. BS + MS, MD + Residency).
3. **D3 (International Dates):** Date parsing rejects non-English present-day markers (`Actualidad`, `Présent`, `Presente`, `Heute`, `至今`).
4. **D4 (Global Regions):** `REGION_ALLOWLIST` rejects candidates located outside the US, Canada, Australia, Singapore, and the Philippines.

---

## 2. Requirements & Acceptance Criteria

### 2.1 Section Heading Expansion
Section index detection must recognize domain-specific and international aliases:
- **`EXPERIENCE`:** Recognize `CLINICAL EXPERIENCE`, `CLINICAL ROTATIONS`, `TEACHING EXPERIENCE`, `RESEARCH EXPERIENCE`, `RESIDENCIES`, `FELLOWSHIPS`, `CLERKSHIPS`, `APPRENTICESHIPS`, `MILITARY SERVICE`, `MILITARY EXPERIENCE`, `VOLUNTEER EXPERIENCE`, `PROFESSIONAL PRACTICE`, `PRACTICUM`, `INTERNSHIPS`, `EXPERIENCIA LABORAL`, `EXPÉRIENCE PROFESSIONNELLE`, `BERUFSERFAHRUNG`.
- **`CERTIFICATIONS`:** Recognize `LICENSES & CERTIFICATIONS`, `LICENSES AND CERTIFICATIONS`, `BOARD CERTIFICATIONS`, `STATE LICENSES`, `LICENSURE`, `BAR ADMISSIONS`, `CREDENTIALS & LICENSES`, `ACCREDITATIONS`, `CERTIFICACIONES`.
- **`EDUCATION`:** Recognize `EDUCATION & TRAINING`, `DEGREES`, `HIGHER EDUCATION`, `ACADEMIC BACKGROUND`, `ACADEMIC HISTORY`, `ACADEMIC TRAINING`, `FORMACIÓN ACADÉMICA`, `FORMATION`.
- **`PROJECTS`:** Recognize `KEY PROJECTS`, `REPRESENTATIVE MATTERS`, `SELECTED CASES`, `PUBLICATIONS`, `RESEARCH`.
- **`SKILLS`:** Recognize `TECHNICAL SKILLS`, `CORE COMPETENCIES`, `AREAS OF EXPERTISE`, `COMPETENCIES`, `SKILLS & COMPETENCIES`, `COMPÉTENCES`.

*Acceptance Criteria:* Resumes using these headings must extract into their proper respective fields rather than being ignored or returning empty section warnings.

### 2.2 Multi-Entry Education Parsing
The education parser must handle multiple degrees or institutions:
- When a candidate has multiple qualifications (e.g. `Master of Science` and `Bachelor of Science`, or multiple schools), `education` must contain an array entry for each distinct qualification.
- Consecutive education blocks separated by empty lines, distinct institution names, or distinct qualification tokens (`BS`, `MS`, `MBA`, `PhD`, `Doctor`, `Bachelor`, `Master`, `Diploma`) must be emitted as distinct entries.

*Acceptance Criteria:* A candidate with a Master's and a Bachelor's degree gets `education.length === 2`, preserving school, degree, and graduation dates for both.

### 2.3 International Date Markers & Abbreviations
The date regex in `parseResumeText` must match:
- Present-day markers: `(Present|Current|Now|Ongoing|Actualidad|Présent|Presente|Heute|至今)`.
- Multi-lingual month abbreviations: `Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Abr|Ago|Dic|Fév|Avr|Mai|Aoû|Okt|Dez`.

*Acceptance Criteria:* Experience blocks dated `Nov 2021 – Presente` or `Ene 2020 – Actualidad` must correctly match and not drop company or role fields.

### 2.4 Expanded Global Region Allowlist
Expand `REGION_ALLOWLIST` to include:
- Major EU nations and codes: `DE|Germany|FR|France|ES|Spain|IT|Italy|NL|Netherlands|SE|Sweden|CH|Switzerland|IE|Ireland`.
- Key Asia-Pacific / Latin America / African hubs: `IN|India|BR|Brazil|MX|Mexico|CO|Colombia|ZA|South Africa|AE|UAE|United Arab Emirates|NZ|New Zealand`.
- Indian States & UTs (`MH|KA|DL|TN|TS|UP|WB|GJ`), Australian states (`NSW|VIC|QLD|WA|SA|TAS`).

*Acceptance Criteria:* Header lines like `Bangalore, India` or `Paris, France` or `São Paulo, Brazil` must parse cleanly as location without triggering missing location warnings.

---

## 3. Constraints & Ponytail Ladder

1. **Zero New Dependencies:** All parsing logic uses standard TypeScript RegExp and string operations.
2. **Preserve Existing Invariants:**
   - D1 invariant: never emit an empty company or role (coalesce fallback remains intact).
   - Acronym guard: IoT, LMS, AWS, etc. remain guarded against false-positive locations.
   - Non-destruction: Existing tests in `profile-extractor.test.ts` must pass without regressions.
