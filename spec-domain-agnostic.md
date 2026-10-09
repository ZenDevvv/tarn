# Specification: Domain-Agnostic Tailoring Engine Remediation

> **Initiative:** Remove software-engineering bias from the ATS tailoring pipeline
> **Source:** Cross-Domain Audit Report (2026-10-09) — `apps/api/src/modules/tailoring`, `apps/api/src/modules/master-profile`
> **Status:** Approved for Planning
> **Detailed Task Plan:** [tasks/plan-domain-agnostic.md](tasks/plan-domain-agnostic.md)
> **Scope Lock:** Roadmap items 1–12 + persona verification (item 15). Items 13 (industry enum) and 14 (custom domain sections) are explicitly **Phase 2**.

---

## 1. Objective

Make the tailoring engine produce equivalent-quality output for Healthcare, Finance, Education, Legal, Trades, Hospitality, and Sales applicants as it does for software engineers — without regressing the tech path.

**Quantified acceptance targets** (measured by the persona regression suite, Task 15):

| # | Metric | Tech baseline | Non-tech target |
|---|---|---|---|
| A1 | Role/company ingestion accuracy (RN, Controller, Teacher) | 100% | 100%, ambiguity → warning, never silent swap |
| A2 | `keyVerbs` extracted from a domain JD | non-empty | non-empty for nursing/finance/education JDs |
| A3 | `exactPhrases` extracted from a domain JD | non-empty | non-empty (fallback to keyword phrases) |
| A4 | Impact-score verb credit for domain bullets | credited | credited (`Triaged`, `Audited`, `Instructed` …) |
| A5 | Metric detection (`28 students`, `12-bed`, `1:1`) | credited | credited via generalized noun list |
| A6 | Certification keywords counted in coverage + score | counted | counted (`BLS`, `ACLS`, `RN`, `CPA`) |
| A7 | Tech-contaminated positioning in prompts/output | none | zero occurrences of `full-stack`, `production systems`, `Full-stack engineer` in any domain's draft or prompt |
| A8 | Professional summary for senior non-technical profiles | n/a (suppressed today) | present by default (VP Finance, CNS, veteran teacher) |
| A9 | Score parity | — | ATS score delta between tech persona and non-tech persona with equivalent profile richness ≤ 5 points |
| A10 | Skills section label reads naturally | `Technical Skills` | `Skills & Competencies` or first self-describing category |

## 2. Scope

**IN SCOPE** (audit roadmap items):

1. Delete hardcoded positioning seeds (`profile-extractor.service.ts:402-407`, `master-profile.service.ts:29-43`)
2. Invert summary policy to default-on (`tailoring.service.ts:362, 384-388`)
3. Generalize `extractExactPhrases` (`jd-analyzer.service.ts:151-167`)
4. Float certifications early when ≥ 2 (`tailoring.service.ts:18-35`)
5. Add certifications + summary to both scoring corpora (`tailoring-validator.service.ts:50-59`, `jd-analyzer.service.ts:457-491`)
6. Widen verified-cert key matching (`tailoring.service.ts:155-161, 364-372`)
7. Expand verb lexicon + POS-agnostic impact verb gate (`jd-analyzer.service.ts:19-24, 399-406`)
8. Generalize `metricRegex` noun list (`jd-analyzer.service.ts:396`)
9. Remove `TECH_PATTERN` weighting (`jd-analyzer.service.ts:26, 115, 352`)
10. Rewrite `titleRegex` role/company disambiguation + warning channel (`profile-extractor.service.ts:212, 242-264`)
11. Data-driven section kickers (`resume-template.ts:279, 324`)
12. Full rename `technicalSkills` → `skills` (Prisma + DTO + validation + all consumers) + DB reset
13. Persona regression suite (roadmap item 15, pulled in as the verification gate)

**OUT OF SCOPE (Phase 2, documented for later):**
- `industry`/domain enum field on MasterProfile
- Custom domain sections in `aiResumePayloadSchema` (`clinical_rotations`, `publications`, `licenses`, `awards`)
- Section-preset packs per industry (nursing template, finance template)

## 3. Boundary Constraints

- **No new dependencies.** All lexicons are in-file `Set`/`RegExp` constants (Ponytail rung 5).
- **No API route or response-shape changes** except the field rename `technicalSkills` → `skills` in Master Profile payloads and the export JSON.
- **Import compatibility:** `importJson` must still accept legacy keys `technicalSkills` and `technical_skills`; canonical key becomes `skills`.
- **DB reset acceptable:** no production/official data exists. Rename is a column rename (`Json` → `Json`), applied via `prisma db push` (dev) with re-seed.
- **Existing tests:** must pass, or be consciously updated with the reason recorded in the task. No assertions may be weakened to force green.
- **AI prompt fidelity rules stay untouched** (no-invent rules, verified metrics, echo mandate) — this change is about register and coverage, not about loosening hallucination guards.

## 4. Schema & Contract Changes

### 4.1 Database (`packages/database/prisma/schema.prisma:362`)
```prisma
- technicalSkills   Json
+ skills            Json
```

### 4.2 DTO (`packages/types/src/entities.ts:451`)
```ts
- technicalSkills: Record<string, string[]>;
+ skills: Record<string, string[]>;
```

### 4.3 Validation (`packages/validation/src/tailoring.schema.ts:42`)
```ts
- technicalSkills: z.record(z.array(z.string().trim())).default({}),
+ skills: z.record(z.array(z.string().trim())).default({}),
```

### 4.4 Import/export compatibility (`master-profile.service.ts:164, 211`)
- Import accepts `skills` → `technicalSkills` → `technical_skills` (first match wins).
- Export writes `skills`.

### 4.5 Rename blast radius (16 files)
`schema.prisma`, `seed.ts`, `entities.ts`, `tailoring.schema.ts`, `master-profile.service.ts`, `profile-extractor.service.ts`, `jd-analyzer.service.ts`, `tailoring.service.ts`, `tailoring-validator.service.ts`, tests ×5, `career-profile-section.tsx`, `resume-upload-dropzone.tsx`.

## 5. Behavioral Contracts (exact rules to implement)

| Item | Rule |
|---|---|
| Positioning seed | `core_positioning` = `["{MostRecentRole} with expertise in {top skill category}"]` derived from parsed data; empty when no data. `positioningRules` defaults to `[]`. |
| Summary policy | Summary is **always requested** in the synthesis prompt, grounded in `factBank.core_positioning`. The sparse variant adds extra grounding language; there is no "No Summary" branch. |
| Exact phrases | Source = top-scored multi-word keywords from `extractKeywordsFromText` (already domain-neutral) when the verb-stem regex yields < 3 results. |
| Cert ordering | In `determineOptimalSectionOrder`, if `certifications.length >= 2`, return order with `certifications` second: `['summary','certifications','experience',…]`. |
| Cert key match | A skill-map category counts as certifications if its key matches `/cert\|licen\|credential/i`. |
| Verb gate | `isAction` = first word in expanded `COMMON_ACTION_VERBS` **or** matches `/^[a-z]+(ed\|ate\|ize\|ise\|ify)$/i` (POS-agnostic past-tense detector). Expanded lexicon adds ≥ 60 verbs across healthcare (triaged, assessed, administered, monitored, instructed), finance (audited, reconciled, forecasted, consolidated, modeled, closed), education (differentiated, facilitated, mentored, assessed), trades (fabricated, installed, calibrated, repaired, serviced), sales (negotiated, closed, prospected, exceeded). |
| Metric nouns | Replace the closed tech noun list with: `patients\|students\|cases\|claims\|beds\|units\|accounts\|reports\|employees\|members\|clients\|customers\|orders\|tickets\|procedures\|sessions\|classes\|lessons\|units\|audits\|policies\|projects\|deals\|proposals\|calls\|visits\|admissions\|discharges`. Percent, `$`, `x`, comma-numbers, `+`, and time units already work. |
| TECH_PATTERN | Deleted. Keyword weight = `phrase.length > 6 \|\| profileTechPrior match`. Profile-derived priors remain the only boost (already domain-neutral). |
| titleRegex | Two-signal disambiguation: (a) broadened TITLE_SUFFIX list (Nurse, Teacher, Accountant, Controller, Auditor, Therapist, Technician, Paramedic, Counselor, Attorney, Coordinator, Administrator, Director, Manager, Engineer, Developer, …); (b) `COMPANY_SIGNAL` = /(Inc\|LLC\|Ltd\|Corp\|Hospital\|University\|College\|School\|District\|Bank\|Group\|Systems\|Technologies\|Labs\|Center\|Clinic\|Department\|Agency\|Association\|GmbH\|Co\.)/i. If exactly one segment matches title → that's the role. If both/neither → first segment is role but **push a warning** (`Verify role/employer for "{segment}"`). Never silently swap. |
| Skills kicker | `"Skills & Competencies"` unless `Object.keys(skills)[0]` is self-describing (not matching /^(general\|core\|skills\|other\|misc\|key)/i), in which case use the first category name verbatim. `Shared Stack:` line renders only when the projects section has ≥ 1 entry with a stack. |

## 6. Acceptance Criteria (global)

- [x] `pnpm test` green across all workspaces (including updated existing tests) — 246 API + 58 web
- [x] `tsc` build clean (api, web, packages); repo has no lint script configured
- [x] Persona suite: Personas A (ICU RN → CNS), B (Controller → VP Finance), C (Teacher → Curriculum Coordinator) pass all assertions A1–A10
- [x] Repo grep gate: `TECH_PATTERN`, `full-stack`, `Full-stack engineer`, `production systems` return zero hits in `apps/*/src`
- [x] Tech regression: the existing Zen Obrero developer fixtures produce sensible match scores (analysis fixture > 50, integration > 40) and identical rendered section order semantics
- [x] DB re-seed succeeds after column rename; export JSON contains `skills`, not `technicalSkills` (legacy `technicalSkills`/`technical_skills` keys still accepted on import per §4.4)

## 7. Risks & Rollback

| Risk | Mitigation |
|---|---|
| Summary always-on changes existing PDFs' look | Template already gates on `payload.summary` presence; update the one asserting test with justification |
| Verb-gate liberalization inflates impact scores | POS-agnostic detector still requires sentence-initial past-tense verb; cap unchanged at 50 pts |
| Lexicon breadth → false keyword boosts | Weight applies to extraction order only, not scoring multiplier; profile-prior boost unchanged in mechanism |
| Rename misses a consumer | TypeScript compile + full test suite + grep gate on `technicalSkills` in `apps/*/src` and `packages/*/src` before merge |
| Rollback | Single revert PR; DB reset acceptable (no official data) |
