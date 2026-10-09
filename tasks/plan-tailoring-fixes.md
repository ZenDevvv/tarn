# Implementation Plan: Tailoring Hardening & Multi-User Fixes (`tailoring-fixes`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application
> **Module ID:** `tailoring-fixes`
> **Supersedes/Extends:** `plan-tailoring.md` (all tasks there are done; this fixes what shipped)
> **Design System:** Marker (`apps/web/src/index.css`)
> **Objective:** Make the tailoring engine safe, honest, and usable for *any* user — not just the seeded profile. Fixes the 8 gaps from review: shared AI billing, PH-scoped fabrication in the extractor, silent PDF failure, template-only "tailoring", overclaiming validator, non-atomic generate, unprotected Gemini calls, thin keyword extraction.
> **Payments:** NOT in scope. The deliverable gate ships as a one-line entitlement stub (`402 PLANS_REQUIRED`); real subscription/payment design happens later, behind that same check.

## Locked Decisions (from Zen — do not re-litigate)

1. **AI is the only selectable engine.** `mode: 'deterministic'` is removed from the user-facing schema; deterministic assembly stays in the code as the silent fallback when Gemini is unconfigured, errors, or times out.
2. **No BYOK.** One platform `GEMINI_API_KEY` (env, all environments). Per-user quota + rate limiting is the gate.
3. **Paid deliverables, built free.** Gate is an entitlement check on `POST /generate` returning `402 PLANS_REQUIRED` until a user is entitled. Stub now (always entitled for everyone), flip on payment day. No payment architecture in this plan.
4. **Upload flow is review-before-commit.** Parse returns a draft + warnings; nothing is written until the user confirms.
5. **PDF failure is a hard error.** No silent HTML fallback, ever.

## Priority Ladder

- **P0 — Blockers:** shared billing without quota, extractor fabricates data, PDF fails silently. Ship-blocking for multi-user.
- **P1 — Honesty:** product claims "tailoring" and "zero ungrounded" it doesn't deliver. Cheap, high trust impact.
- **P2 — Quality debt:** transactions, timeouts, stemming.

---

## P0 — Blockers

### Task 1: Platform-key AI, per-user quota, entitlement stub
- **Files:** `packages/database/prisma/schema.prisma`, `apps/api/src/modules/tailoring/tailoring.service.ts`, `apps/api/src/modules/tailoring/tailoring.routes.ts`, `apps/api/src/middleware/rate-limit.ts`, `packages/validation/src/tailoring.schema.ts`, `apps/web/src/features/tailoring/api/tailoring-api.ts`, `apps/web/src/features/tailoring/components/tailoring-studio-modal.tsx`
- **Actions:**
  - New `GenerationUsage` model: `{ id, userId, date (YYYY-MM-DD), count Int @default(0) }` with `@@unique([userId, date])` — survives resume/cover-letter deletion, unlike counting rows.
  - New `entitlement` middleware/helper: `assertCanGenerate(userId)` — checks quota (free tier: **5/day**, env-tunable via `FREE_DAILY_GENERATIONS`) and entitlement. Not entitled → `402 { error: { code: 'PLANS_REQUIRED' } }`. Entitlement logic is a stub returning `true` for everyone; the `402` path is real and tested so payments flip one flag later.
  - Increment usage **inside the generate transaction** (Task 8), never before success — a failed generate doesn't burn quota.
  - `tailoringLimiter` in `rate-limit.ts`: `windowMs: 15*60*1000, limit: 10, keyGenerator: req.user!.id` (per-user, not per-IP), skipped in test env. Applied to `POST /applications/:id/generate`.
  - `generateTailoringSchema`: drop `mode` entirely (AI is the only engine) or keep as `z.literal('ai')` for wire compatibility. Keep `role`, `company`, `additionalInstructions`.
  - Service: key = `process.env.GEMINI_API_KEY` only. Missing key or Gemini failure/timeout → deterministic fallback with `engine: 'deterministic', fallbackReason` in the response (UI shows a subtle badge, not an error).
  - UI: mode selector removed; show remaining quota ("3 of 5 AI generations left today") on the scorecard/studio.
- **Verification:** 6th generate in a day → `402`/`429` with correct code, no Gemini call; failed generate (Gemini mocked down) → falls back deterministically, quota **not** incremented; no `mode` field in request validation errors.

### Task 2: Extractor — remove fabrication, remove PH-centrism, review-before-commit
- **Files:** `apps/api/src/modules/master-profile/profile-extractor.service.ts`, `apps/api/src/modules/master-profile/master-profile.service.ts`, `apps/api/src/modules/master-profile/master-profile.controller.ts`, `apps/api/src/modules/master-profile/master-profile.routes.ts`, `apps/web/src/features/settings/components/resume-upload-dropzone.tsx`, `packages/types/src/entities.ts`, `packages/validation/src/tailoring.schema.ts`
- **Actions:**
  - **Never invent facts.** Delete all fabricated fallbacks: placeholder bullets ("Engineered scalable web applications"), `graduation: '2024'`, fake `https://github.com/` / `https://linkedin.com/` / `https://portfolio.dev` links, `'Engineer / Developer'` role, `'Company'` employer, default skills array. Unparsed → `null`/empty, always.
  - **Generic location parsing:** `Remote` detection; capitalized `City, Region` two-token pattern; country allowlist (PH, US, UK, CA, AU, SG, JP, IN, DE, NL, IE…). Unknown → `null` (keep the acronym guard).
  - **Links:** extract only literal `https?://\S+` URLs in the text; label from hostname.
  - **Parse confidence:** `parseResumeText` returns `{ profile, warnings: string[] }`; every empty-but-expected field pushes a warning ("Location not found — please verify"). Warnings flow through the DTO.
  - **Review-before-commit:** `POST /upload-resume` and `/import-json` return the draft + warnings **without writing**. New `POST /master-profile/confirm-import` (validated body, single `updateProfile` write). Dropzone shows a review panel: draft fields + warning list; user edits or confirms. Existing profile untouched until confirm.
- **Verification:** US-format + bare-bones resumes → zero fabricated strings (assert against a placeholder list); warnings surfaced; profile unchanged until confirm; JSON import same flow.

### Task 3: PDF rendering must fail loudly
- **Files:** `apps/api/src/modules/tailoring/pdf-renderer.service.ts`, `apps/api/src/modules/tailoring/tailoring.service.ts`
- **Actions:**
  - No Chromium binary → `ServiceUnavailableError('PDF generation is temporarily unavailable')`. Delete the silent `.html`-return path.
  - Chromium exec failure (non-zero/timeout) → throw; never return a missing-file path as `pdfUrl`.
  - Service: render failure → DB writes roll back (Task 8 transaction) and error propagates. No PDF → no generate response.
  - Startup: loud log when Chromium absent (devs know deliverables are degraded).
- **Verification:** Chromium hidden → generate returns 503, zero Resume/CoverLetter rows, zero orphan files in `uploads/`.

---

## P1 — Honesty of the "tailoring" claim

### Task 4: Real adaptation, not template swap
- **Files:** `apps/api/src/modules/tailoring/tailoring.service.ts`, `apps/api/src/modules/tailoring/templates/cover-letter-template.ts`, `apps/web/src/features/tailoring/components/tailoring-scorecard.tsx`, `apps/web/src/features/tailoring/components/tailoring-studio-modal.tsx`
- **Actions:**
  - **Cover letter:** kill the single hardcoded skeleton. Compose from the user's own data — opener/middle/close variants selected from `factBank.core_positioning` + `summaryCandidates` keyed by `positioningRules`, echoing JD phrases into sentences built around the user's quantified highlights. Two users with different profiles → structurally different letters.
  - **Resume (deterministic fallback):** reordering stays; post-tailoring `missingKeywords` surfaced as "gaps you must address in your Career Profile" — no keyword stuffing, no fabrication.
  - **AI prompt:** instruct bullet *rewriting* using only profile facts to close gaps; validator (Task 5) enforces.
  - **Scorecard:** add post-generation "coverage delta" (JD keyword coverage before vs after). Delta 0 → UI states tailoring surfaced existing material and profile edits are needed to raise coverage.
- **Verification:** Two seeded users, different profiles → letters differ structurally; scorecard shows delta; gap keywords never inserted.

### Task 5: Validator — check what it claims
- **Files:** `apps/api/src/modules/tailoring/tailoring-validator.service.ts`, `apps/api/src/modules/tailoring/tailoring.service.ts`, `apps/web/src/features/tailoring/components/tailoring-studio-modal.tsx`
- **Actions:**
  - Add fidelity checks: **metrics** (numbers in output must exist in profile corpus), **dates/year ranges**, **project names** (must be in `projectExperience`), and **cover-letter entities** (employers, metrics, schools vs profile — currently unchecked).
  - `ValidationReport.blocking: boolean` — ungrounded entities block save unless `overrideWarnings: true` (UI: "Save anyway" listing warnings).
  - UI copy states exactly what is checked (skills, employers, metrics, dates, projects, cover-letter entities) — no "0 warnings = faithful" overclaim.
- **Verification:** Mocked AI output with ungrounded "cut latency 40%" → blocking warning; unknown cover-letter employer flagged; `isValid` semantics tested.

---

## P2 — Quality debt

### Task 6: Gemini call hardening
- **Files:** `apps/api/src/modules/tailoring/tailoring.service.ts`, `packages/validation/src/tailoring.schema.ts`
- **Actions:**
  - `AbortSignal.timeout(30_000)` on fetch; timeout → deterministic fallback, reason returned.
  - Zod schema for AI output (resume payload shape; basics/education/experience/projects/skills required). Invalid → deterministic fallback, no crash, no partial data into templates.
  - Never return the API key anywhere.
- **Verification:** Slow/invalid/malformed mocked responses → all fall back deterministically with reason; key absent from responses.

### Task 7: Keyword extraction improvements
- **Files:** `apps/api/src/modules/tailoring/jd-analyzer.service.ts`, `apps/api/tests/tailoring-analysis.test.ts`
- **Actions:**
  - Light stemmer (suffix strip: `ing|ed|s|es|ment|tion…`) on JD and profile tokens — `manage|management|managing` unify.
  - Multi-word keyword match: require **any** content word (word-boundary), not every — fewer false "missing".
  - `TECH_PATTERN` stays as a prior; any JD token matching a profile skill (post-stemming) also counts as tech-priority — fixed allowlist stops being the only path.
- **Verification:** "managing deployments" vs profile "management" matches; "microservices architecture" partial-matches; existing analysis tests pass.

### Task 8: Atomic generate
- **Files:** `apps/api/src/modules/tailoring/tailoring.service.ts`
- **Actions:**
  - `prisma.$transaction` around Resume + CoverLetter + application update + timeline + `GenerationUsage` increment.
  - PDFs rendered before the transaction (file I/O can't roll back); on failure, delete rendered files in `catch`.
  - IDs generated up front (`crypto.randomUUID()`) so rows are self-contained in the transaction.
- **Verification:** Forced mid-transaction failure → zero orphan rows, zero orphan PDFs, quota unchanged, application unchanged.

---

## Execution Order

1. Task 3 (P0, isolated) + Task 2 (P0)
2. Task 1 (P0 — batch its schema change with Task 2's migration: one `prisma db push` after both)
3. Task 4 + Task 5 (P1, paired)
4. Task 6 + Task 7 (P2, independent)
5. Task 8 (P2, last — touches the generate flow Tasks 1/4 depend on)

## Cross-cutting

- **Tests:** each task ships/extends tests in `apps/api/tests/` (`master-profile.test.ts`, `tailoring.test.ts`, `tailoring-analysis.test.ts`; new `pdf-renderer.test.ts`; `bullet-utils.test.ts` exists). No test weakened.
- **Migration:** Tasks 1+2 touch schema once — `pnpm --filter @tracker/database prisma db push` after both, then `pnpm --filter @tracker/database build`.
- **AGENTS.md compliance:** strict TDD per task; `pnpm test && pnpm build` green before any task is declared done; approval-gated per repo directives.
