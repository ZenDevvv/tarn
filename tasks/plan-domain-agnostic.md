# Implementation Plan: Domain-Agnostic Tailoring Engine

> **Specification:** [spec-domain-agnostic.md](../spec-domain-agnostic.md)
> **Method:** Strict Red-Green-Refactor per AGENTS.md §3 (failing test → minimal fix → simplify)
> **Task size discipline:** ~50–100 changed lines per task; one concern per task
> **Verification per task:** `pnpm --filter @tracker/api test` (or package-scoped) + `pnpm lint` before marking done

---

## Dependency Graph

```
Task 1 (prisma rename) ─┬─▶ Task 2 (DTO) ──▶ Task 3 (validation+import/export)
                        │
                        └─▶ [rename sweeps consumers as each task touches them]
Task 4 (positioning seeds) ──▶ Task 10 (summary policy)
Task 6 (TECH_PATTERN removal) ──▶ Task 7 (verbs) ──▶ Task 8 (metrics) ──▶ Task 9 (exact phrases)
Task 5 (titleRegex) ──▶ Task 11 (cert order+keys)
Task 12 (corpora) ──▶ Task 13 (template kickers) ──▶ Task 14 (UI labels)
ALL ──▶ Task 15 (persona regression suite + grep gates)
```

---

## Phase A — Contracts (foundation; do first)

### Task 1: Prisma column rename + re-seed
- **Red:** Run `pnpm --filter @tracker/database prisma validate` after edit; `db push` fails until consumers compile.
- **Green:** `schema.prisma:362` rename `technicalSkills` → `skills`; `seed.ts:95` field rename; regenerate client (`pnpm --filter @tracker/database prisma generate`); `pnpm db:push` + `pnpm db:seed` with DB reset.
- **Files:** `packages/database/prisma/schema.prisma`, `packages/database/prisma/seed.ts`
- **Done when:** seed runs clean; `MasterProfile.skills` exists in client types.

### Task 2: DTO rename
- **Red:** `pnpm --filter @tracker/types build` (tsc) — consumers referencing `technicalSkills` on the DTO now error.
- **Green:** `packages/types/src/entities.ts:451` rename field.
- **Done when:** types package builds.

### Task 3: Validation schema + import/export compatibility
- **Red:** extend `tests/master-profile.test.ts`: assert exported JSON has `skills`; assert import accepts legacy `technical_skills` payload.
- **Green:** `tailoring.schema.ts:42` rename; `master-profile.service.ts:164` accept `skills ?? technicalSkills ?? technical_skills`; `:211` export `skills`.
- **Done when:** master-profile suite green.

---

## Phase B — Ingestion

### Task 4: Delete hardcoded positioning seeds
- **Red:** `tests/profile-extractor.test.ts`: parse a nursing resume text → expect `draft.profile.positioningRules` to equal `[]` and `factBank.core_positioning` to contain the parsed role, not "Full-stack engineer". Also `tests/master-profile.test.ts`: bootstrap default profile → factBank has no "developer" string.
- **Green:** `profile-extractor.service.ts:402-407`: derive `core_positioning` from most recent `workExperience[0].role` + first skills category; default `positioningRules: []`. `master-profile.service.ts:29-43`: neutral bootstrap (`core_positioning: []`, `priority_themes: []`, `skills: {}`), also rename field per Task 1.
- **Done when:** grep `full-stack` in `apps/api/src` = 0 hits; both suites green.

### Task 5: titleRegex rewrite with ambiguity warning
- **Red:** `tests/profile-extractor.test.ts` (new cases): `Registered Nurse, ICU | Mercy General Hospital, Chicago, IL | Jan 2020 – Present` → `role="Registered Nurse, ICU"`, `company="Mercy General Hospital"`; `Division Controller | Acme Manufacturing, Inc.` → correct split; `Software Engineer | Uzaro Solutions` (existing fixture) unchanged; ambiguous header `Nightingale Health` (no title signal) → role guessed first-segment **and** warning pushed.
- **Green:** `profile-extractor.service.ts:212`: replace `titleRegex` with `TITLE_SUFFIX` list + `COMPANY_SIGNAL` regex per spec §5; at the `|`-split branch (`:242-254`) apply two-signal disambiguation; push warning on ambiguity (warnings channel already in `MasterProfileDraftDTO`).
- **Done when:** extractor suite green incl. the 4 new cases.

---

## Phase C — Scoring engine

### Task 6: Remove TECH_PATTERN weighting
- **Red:** `tests/tailoring-analysis.test.ts`: assert `'Epic'` and `'React'` receive identical weight in `calculateMultiFactorAtsScore` (both length 4/5 → weight 1.0); assert profile-skill prior still boosts score.
- **Green:** delete `TECH_PATTERN` (`jd-analyzer.service.ts:26`) and its uses at `:115` and `:352`; weight rule becomes `kw.length > 6` only.
- **Done when:** analysis suite green; grep `TECH_PATTERN` in `apps/api/src` = 0.

### Task 7: Verb lexicon + POS-agnostic impact gate
- **Red:** `tests/tailoring-analysis.test.ts`: bullets `Triaged 30 ED patients…`, `Audited $4.2B revenue…`, `Differentiated instruction for 28 students…` each count toward `verbsCount`; `extractKeyVerbs` returns `triaged`, `audited`, `instructed`.
- **Green:** `jd-analyzer.service.ts:19-24` expand `COMMON_ACTION_VERBS` (+≥60 cross-domain verbs per spec §5); replace the hardcoded regex at `:406` with the POS-agnostic detector `/^[a-z]+(ed|ate|ize|ise|ify)$/i` ∪ expanded set.
- **Done when:** analysis suite green; verbsCount > 0 for all three personas' bullet fixtures.

### Task 8: Generalized metric noun list
- **Red:** analysis test: `Managed a 12-bed ICU with 1:1 acuity` and `Taught 28 students` → `metricsCount` increases (was 0); existing tech fixture metrics still counted.
- **Green:** `jd-analyzer.service.ts:396` noun-list swap per spec §5 (keep users/records/transactions/clients; add patients/students/cases/… ).
- **Done when:** analysis suite green.

### Task 9: extractExactPhrases generalization
- **Red:** analysis test: nursing JD (`provide direct patient care, triage emergencies, administer medications`) → `exactPhrases.length >= 3`; tech JD unchanged.
- **Green:** `jd-analyzer.service.ts:151-167`: keep verb-stem regex; if result < 3, backfill from `extractKeywordsFromText` (topN, score ≥ 2) filtered to ≥ 2-word phrases.
- **Done when:** analysis suite green; validator echo test for nursing JD shows echoes > 0.

---

## Phase D — Synthesis policy

### Task 10: Summary policy inversion
- **Red:** `tests/tailoring.test.ts`: generate for a senior (multi-role) profile → capture Gemini prompt (`global.fetch` spy exists in suite) → assert it contains the summary directive and does **not** contain "Do NOT include a summary". Update `tailoring.test.ts:429` (`not.toContain('Professional Summary')`) to `toContain` with a justification comment.
- **Green:** `tailoring.service.ts:362, 384-388`: remove the `isSparse`-gated No-Summary branch; always request a 2–4 sentence summary grounded in `factBank.core_positioning`; keep `isSparse` only to strengthen grounding language; ensure `resume.summary` flows into PDF payload.
- **Done when:** tailoring suite green; preview-html test shows `Professional Summary` for the senior fixture.

### Task 11: Certifications float order + key widening
- **Red:** unit test for `determineOptimalSectionOrder`: profile with 3 licenses (RN, BLS, ACLS) + 2 roles → order = `['summary','certifications','experience',…]`; profile with 0 certs unchanged. Service test: certs stored under `skills['Nursing Licenses']` reach the prompt's `verifiedCerts`.
- **Green:** `tailoring.service.ts:18-35` float rule; `:155-161` and `:364-372` replace exact-key lookups with `/cert|licen|credential/i` key filter.
- **Done when:** new unit tests green; ordering test for tech profile (no certs) unchanged.

---

## Phase E — Scoring corpora (validator + lift)

### Task 12: Certifications + summary in both corpora
- **Red:** validator test: resume containing `BLS` only in certifications + JD keyword `BLS` → `matchedKeywords` includes `BLS`. Analyzer test: `evaluateResumePayload` on a payload with certs-only keyword → `skillsScore` counts it.
- **Green:** `tailoring-validator.service.ts:50-59` push `certifications` (stringified) + `summary` into `resumeTextParts`; `jd-analyzer.service.ts:457-491` tokenize `resumePayload.certifications` + `resumePayload.summary` in `addToken` phase.
- **Done when:** validator + analysis suites green; score-lift for nurse fixture now reflects cert matches.

---

## Phase F — Presentation

### Task 13: Template kickers + Shared Stack guard
- **Red:** `tests/resume-template.test.ts`: skills `{ 'Clinical Competencies': [...] }` → HTML contains `Clinical Competencies` kicker; skills `{ General: [...] }` → `Skills & Competencies`; no projects → HTML does not contain `Shared Stack`.
- **Green:** `resume-template.ts:324` data-driven kicker per spec §5; `:278-282` guard `sharedStack` render on `projects.length > 0`.
- **Done when:** template suite green.

### Task 14: Web UI relabels + field rename sweep
- **Red:** `apps/web` suite (settings tests reference tabs) — update labels first to see failures.
- **Green:** `career-profile-section.tsx:175-176` tabs → `Projects`, `Skills & Competencies`; all `formData.technicalSkills` → `formData.skills`; `resume-upload-dropzone.tsx:74, 280` same rename. Remove `Code2` icon import if unused.
- **Done when:** web suite green; grep `technicalSkills` in `apps/web/src` = 0.

---

## Phase G — Verification gate

### Task 15: Persona regression suite + repo gates
- **Red:** new `tests/persona-domain.test.ts` with Personas A/B/C full fixtures (profile + JD) asserting A1–A10 from spec §1: ingestion role/company, non-empty keyVerbs/exactPhrases, verbsCount > 0, metricsCount > 0, cert keywords in coverage, no tech-contaminated strings, summary present for senior profiles, score parity ≤ 5 pts vs equivalent tech fixture, kicker text neutral.
- **Green:** any residual fixes from Tasks 1–14 surface here; fix at source, never weaken assertions.
- **Gates:** run full `pnpm test`, `pnpm lint`, `tsc` build; grep gates: `TECH_PATTERN|full-stack|Full-stack engineer|production systems` = 0 in `apps/*/src`, `packages/*/src`; `technicalSkills` = 0 in same.
- **Done when:** all gates pass; audit report acceptance table fully satisfied.

---

## Definition of Done (per task)
1. Test written and failing **before** implementation (red)
2. Minimal implementation passes (green)
3. No linter suppressions added; no assertions weakened
4. `pnpm --filter @tracker/api test` (or package scope) green
5. Task's files match spec §5 contract exactly

## Rollback
Each task is an independent commit; revert = `git revert <task-commit>`. DB reset is acceptable at any point (no official data).
