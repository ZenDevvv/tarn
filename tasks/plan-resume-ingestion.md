# Implementation Plan: Resume Ingestion Robustness

> **Specification:** [spec-resume-ingestion.md](../spec-resume-ingestion.md)
> **Method:** Strict Red-Green-Refactor per AGENTS.md §3
> **Task size discipline:** ~50–100 changed lines per task; one concern per task
> **Verification per task:** `pnpm --filter @tracker/api test` + `pnpm -r build` before marking done
> **Baseline:** `7f59dc0` (clean tree)

---

## Dependency Graph

```
Task 1 (D1 coalesce) ──▶ Task 2 (D2 stacked headers) ─┐
Task 1 (D1 coalesce) ──▶ Task 3 (D3 education order) ─┼─▶ Task 6 (real-PDF integration)
Task 5 (D5 error surfacing) ───────────────────────────┘
Task 4 (D4 docx decision) ──────────────────────────▶ Task 6
```

Task 5 is independent of the parser work and can run in parallel.

---

## Phase A — Stop the 400 (blocker)

### Task 1: Never emit an empty company/role (D1)
- **Red:** `tests/profile-extractor.test.ts` — add the five layout fixtures from spec §2.3 (A–E). Assert **no** returned `workExperience` entry has an empty `company` or `role`. Confirm **B and D fail** today with `role: ""`. Confirm the Zen stacked layout reproduces the swapped entry.
- **Green:** `profile-extractor.service.ts:236` and `:311` — the two `workExperience.push(...)` sites (opening lines 236 and 310-311). Add a shared private helper that coalesces: if one of `company`/`role` is empty, fill from the other; if both empty, **drop the entry** and `warnings.push(\`Dropped unparseable experience segment — verify manually\`)`. Apply at both push sites. Keep the existing `date_range` handling untouched.
- **Done when:** layouts A–E return no empty `company`/`role`; extractor suite green; the Zen PDF's `workExperience.1.company` is no longer `""`.

**Do not** relax `updateMasterProfileSchema` in this task. Schema defence-in-depth is deferred to Task 6 so the parse-time fix is provably doing the work.

### Task 2: Stacked-header company/role disambiguation (D2)
- **Red:** `tests/profile-extractor.test.ts` — layout A asserts `company === "Acme Corp Ltd"` and `role === "Software Engineer"` (currently swapped). Add an ambiguous case (`Nightingale Health` + date, no title signal) asserting a `Verify role/employer` warning is present **and** that no silent swap occurred.
- **Green:** `profile-extractor.service.ts:270-279` — when the date sits on a second header line, classify the paired segments with the **existing** `TITLE_SUFFIX_REGEX` / `COMPANY_SIGNAL_REGEX` defined at `:214-217`. Reuse the branch logic at `:250-269`; extract it to a shared helper only if both call sites genuinely need it (Ponytail rung 2 — reuse before duplicating). On ambiguity: first segment is the role, push the warning.
- **Done when:** layout A no longer swaps; the ambiguous case emits exactly one warning; existing `Software Engineer | Uzaro Solutions` fixture from `spec-domain-agnostic.md` Task 5 still passes unchanged.

---

## Phase B — Remaining parser correctness

### Task 3: Education degree-first ordering (D3)
- **Red:** `tests/profile-extractor.test.ts` — layout E: `EDUCATION` with `BS Computer Science` on line 1 and `Some University, 2020` on line 2 → assert `school === "Some University"` and `degree` carries the qualification. **Currently inverted — this test fails.**
- **Green:** `profile-extractor.service.ts:375-376` — detect which of `eduLines[0]`/`eduLines[1]` is the institution using `COMPANY_SIGNAL_REGEX` (add School, University, College, Institute, Academy, Polytechnic to the existing regex at `:217` if absent). Institution → `school`, other → `degree`. Neither matches → keep current positional behaviour.
- **Done when:** layout E assigns correctly; the existing education fixture is unchanged.

---

## Phase C — Contract honesty

### Task 4: Resolve the DOCX lie (D4) — decision required
- **Red:** grep gate — `accept=".pdf,.txt,.json,.docx"` present in `resume-upload-dropzone.tsx:133` **and** no DOCX branch in `extractTextFromBuffer`. This *is* the failing gate.
- **Green (option a, recommended):** remove `.docx` from `accept=`; add a caption line stating PDF and TXT are supported and DOCX should be exported as PDF. Update the dropzone copy at `:152` which currently reads "Drop your resume (PDF, TXT, or JSON) here".
- **Green (option b, needs Zen's explicit approval):** add `mammoth`, extract DOCX before the UTF-8 fallback in `extractTextFromBuffer`, amend the no-new-dependency constraint in `spec-resume-ingestion.md` §4 in writing, and add a real `.docx` fixture test.
- **Done when:** the dropzone advertises exactly what the backend can parse, verified by the grep gate in both directions.

### Task 5: Surface validation details to the user (D5)
- **Red:** component test asserting a failing `confirmImport` renders the field-level reason (`workExperience.1.company: too_small`), not the generic string.
- **Green:** `resume-upload-dropzone.tsx:41,90` — `api-client.ts:45` throws `ApiError`, which has **no** `.response` property, so `err?.response?.data?.message` always yields `undefined` and falls through to `err.message`. Read `err.details` (already on `ApiError`) and render `field: message` lines. Sweep the identical pattern at `application-form.tsx:331`.
- **Done when:** grep `err?.response?.data?.message` returns 0 hits in `apps/web/src`; error UI shows the specific reason.

---

## Phase D — Verification gate

### Task 6: Real-file integration + full regression
- **Red:** `tests/master-profile.test.ts` — end-to-end against the real file `/home/machenike/Projects/Resume-Builder/Zen Obrero RESUME.pdf`: register → upload-resume → confirm-import → expect **200** on both. Confirm this fails at baseline and passes after Tasks 1–3. Add schema defence-in-depth here: relax `updateMasterProfileSchema`'s `company`/`role` from `min(1)` to accept `""`, so one ambiguous header can never 400 the whole profile — record the reason inline per `spec-domain-agnostic.md` §2.
- **Green:** only whatever Tasks 1–3 left incomplete.
- **Gates:**
  - `pnpm --filter @tracker/api test` — must not regress below the 246 baseline
  - `pnpm -r build` — `tsc` clean
  - grep: `err?.response?.data?.message` = 0 in `apps/web/src`
  - grep: no silent-swap path remains in the stacked-header branch
- **Done when:** all spec §5 acceptance criteria checked.

---

## Definition of Done (per task)
1. Failing test written and observed failing **before** implementation (red)
2. Minimal implementation passes (green)
3. No linter suppressions; no existing assertions weakened
4. `pnpm --filter @tracker/api test` green (non-reducing)
5. Task's files match `spec-resume-ingestion.md` §3 contracts exactly

## Rollback
Each task is an independent commit; revert = `git revert <task-commit>`. Baseline `7f59dc0` is a clean rollback target. No schema migration, no data loss.
