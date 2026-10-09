# Specification: Resume Ingestion Robustness

> **Initiative:** Make career-profile resume import survive real-world resume layouts
> **Source:** Field report (2026-10-10) — uploading `Zen Obrero RESUME.pdf` via Settings → Career → Resume upload returns `Invalid request data`
> **Status:** Approved for Planning
> **Baseline commit:** `7f59dc0` (domain-agnostic tailoring; tree clean)
> **Detailed Task Plan:** [tasks/plan-resume-ingestion.md](tasks/plan-resume-ingestion.md)
> **Relationship to [spec-domain-agnostic.md](spec-domain-agnostic.md):** *separate effort, not an amendment.* That spec's acceptance criteria (246 API + 58 web tests, grep gates) were met and shipped at `7f59dc0`. This spec addresses a defect class that shipped *through* it and was invisible to its gates.

---

## 1. Objective

Guarantee that a parseable resume **never produces a payload that fails schema validation**, and that common non-software resume layouts (nursing, teaching, finance, trades) import correctly.

The system currently guarantees the opposite: a valid, well-formed PDF deterministically fails import.

---

## 2. Defect Report

### 2.1 Reproduction (verified at `7f59dc0`)

| Step | Call | Result |
|---|---|---|
| 1 | `POST /api/v1/master-profile/upload-resume` (111,556-byte PDF) | **200 OK** — parse succeeds |
| 2 | `POST /api/v1/master-profile/confirm-import` (draft → payload) | **400** `VALIDATION_ERROR` / `Invalid request data` |

Failing field, from the actual response:

```json
{ "code": "too_small", "path": ["workExperience", 1, "company"], "minimum": 1 }
```

`updateMasterProfileSchema` requires `workExperience[].company` and `workExperience[].role` to be non-empty strings (`packages/validation/src/tailoring.schema.ts:30,32`). The extractor emits entries with either field empty, and the frontend passes them through untouched (`apps/web/src/features/settings/components/resume-upload-dropzone.tsx:65-68`).

### 2.2 Root cause

`profile-extractor.service.ts:236-243` and `:310-318` push every accumulated job segment into `workExperience` **without validating that `company` or `role` ended up non-empty**.

For the Zen PDF, `pdftotext -layout` emits stacked headers — company on one line, role+date on the next:

```
WORK EXPERIENCE
Uzaro Solutions Technology Inc.                          Quezon City
Technology Developer                                      Nov 2024 – Present
```

The parser's `pendingTitle` logic mis-assigns the pair, producing a **swapped** entry (`company: "Technology Developer"`, `role: "Uzaro Solutions Technology Inc. …"`). The next segment, `IT Intern / IPSolutions Inc.`, yields **`company: ""`** — the date line's employer was consumed by the prior segment's `pendingTitle` path and never re-entered.

### 2.3 Measured behaviour across resume layouts

Each case run through `ProfileExtractorService.parseResumeText` then validated against `updateMasterProfileSchema`. **"Valid" = passes schema validation.**

| # | Layout | Result | Schema | Defect |
|---|---|---|---|---|
| A | Stacked: company line, then role+date line | `company`/`role` **swapped** | valid | Silent data corruption — worse than a hard error |
| B | `role \| dates` line, then company line | `role: ""` | **400** | Blocks import |
| C | Single pipe line: `company \| role \| dates` | correct | valid | — |
| D | Nursing: `Registered Nurse \| dates`, employer below | `role: ""` | **400** | Blocks import — blocks the domain-agnostic thesis |
| E | Education, degree listed before school | `school: "BS Computer Science"`, `degree: "Some University, 2020"` | valid | Silent inversion |

Layouts **B and D** are the dominant formats for nurses, teachers, accountants, and tradespeople — precisely the personas `spec-domain-agnostic.md` targets. The domain-agnostic work made the *tailoring* engine domain-neutral while leaving the *ingestion* front door unable to admit non-software resumes.

---

## 3. Defects to Fix

| ID | Defect | Location | Severity |
|---|---|---|---|
| **D1** | Emits work entries with empty `company` or `role` → hard 400 on confirm-import | `profile-extractor.service.ts:236,310` | **Blocker** |
| **D2** | Stacked headers swap company/role silently | `profile-extractor.service.ts:270-279` | High (corruption) |
| **D3** | Education degree-first ordering inverts `school`/`degree` | `profile-extractor.service.ts:375-376` | Medium |
| **D4** | `.docx` advertised in dropzone but unsupported — binary garbage | `resume-upload-dropzone.tsx:133`; no handler in `extractTextFromBuffer` | High |
| **D5** | Error details never surfaced — UI shows bare "Invalid request data" | `resume-upload-dropzone.tsx:41,90` reads `err.response.data.message`; the client throws `ApiError` (no `.response`) | Medium |

### D1 — Emptiness is unrepresentable (the invariant)

`parseResumeText` must never return an entry whose `company` or `role` is empty. Two layers:

1. **Parse-time coalescing** — if one signal is missing, use the other (`company ||= role`, `role ||= company`); if both are missing, drop the entry and push a warning naming the dropped segment.
2. **Schema defence-in-depth** — relax `updateMasterProfileSchema` to accept an empty string with a **warning**, or drop the field, rather than 400-ing the whole profile.

**Rationale for parse-time first:** a 400 discards the *entire* profile because of one ambiguous header. Coalescing degrades one field; the user corrects it in the review UI. This is the "review-before-commit" contract the dropzone already advertises.

### D2 — Stacked-header disambiguation

For a two-line header where the date is on the second line, classify each of the two segments with the existing `TITLE_SUFFIX_REGEX` / `COMPANY_SIGNAL_REGEX` pair from `spec-domain-agnostic.md` §5. Exactly one title → that's the role. Both or neither → **first segment is the role, and push `Verify role/employer for "…"`** (never a silent swap). Reuse the existing disambiguation logic at `:250-269`; do not add a parallel implementation.

### D3 — Education ordering

Detect which of `eduLines[0]` / `eduLines[1]` is the institution via `COMPANY_SIGNAL_REGEX` (School, University, College, Institute, Academy, Polytechnic). Assign institution → `school`, the other → `degree`. Both lines fall through to the existing positional behaviour. **Do not** introduce an industry enum.

### D4 — DOCX support (decision required)

`resume-upload-dropzone.tsx:133` accepts `.docx`, but `extractTextFromBuffer` (`profile-extractor.service.ts:16-39`) branches only on PDF and otherwise does `buffer.toString('utf-8')` — binary noise for a ZIP-based OOXML file. Currently it produces a garbage parse rather than an error.

**Constraint conflict:** `spec-domain-agnostic.md` §2 forbids new dependencies ("Ponytail rung 5"). Correct DOCX extraction requires `mammoth` or `jszip` + XML parsing. Options, in the implementer's preference order:

- **(a)** Remove `.docx` from `accept=` and surface a clear "convert to PDF or TXT" message. No dependency. **Recommended** — honest and immediate.
- **(b)** Add `mammoth` under explicit Zen approval (spec boundary exception, recorded in Risks).

**If (b) is chosen**, extraction must be added before the UTF-8 fallback, and the no-new-dependency constraint amended in writing.

### D5 — Surface validation details

`api-client.ts:45` throws `ApiError(message, code, details)` — it has no `.response` property, so `resume-upload-dropzone.tsx:41,90` always fall through to `err.message`. The user sees the generic server string and never the field-level reason.

Read `err.details` and render field + message. Affects every API error in this component; the same `err?.response?.data?.message` pattern exists at `application-form.tsx:331` and warrants the same sweep.

---

## 4. Boundary Constraints

- **No weakening of existing assertions.** `spec-domain-agnostic.md` §2 requires tests pass or be consciously updated with a recorded reason. No assertion may be relaxed to force green.
- **No API route or response-shape changes.** Payload shapes stay as-is.
- **No new dependencies** unless Zen explicitly approves (affects D4 option (b) only).
- **Reuse the existing disambiguation logic.** D2 must extend `:250-269`, not fork it.
- **TDD:** failing test before implementation, per AGENTS.md §3.
- **DB reset acceptable** if needed; no production data exists.

---

## 5. Acceptance Criteria

- [ ] Zen PDF (`~/Projects/Resume-Builder/Zen Obrero RESUME.pdf`) round-trips: upload 200 **and** confirm-import 200, verified by integration test against the real file
- [ ] Layouts A–E above each parse with no empty `company`/`role`; no case 400s on confirm-import
- [ ] Layout D (nursing title-first) yields `role: "Registered Nurse"`, `company: "St Mary Hospital"`
- [ ] Layout B yields a populated `role`
- [ ] Layout A no longer silently swaps company/role
- [ ] Layout E assigns `school` to the institution line, `degree` to the qualification
- [ ] Ambiguous headers push a `Verify role/employer` warning; zero silent swaps (grep-gate the swap path)
- [ ] A malformed segment is dropped with a named warning, never 400-ing the profile
- [ ] `.docx` either removed from `accept=` or genuinely parsed (decision recorded)
- [ ] Validation failure shows the specific field-level reason in the UI, not a generic string
- [ ] Full suite green: `pnpm test` (246 API baseline, non-reducing) + `pnpm -r build` clean
- [ ] `grep` gate: no `err?.response?.data?.message` remaining in `apps/web/src`

---

## 6. Risks & Rollback

| Risk | Mitigation |
|---|---|
| Relaxing `company`/`role` to `""` masks future real bugs | Parse-time coalescing stays the primary fix; schema relaxation is defence-in-depth, and dropped segments are warned |
| Coalescing sets `company = role` and users miss the duplication | Review UI shows the draft before commit — the existing contract. Add a warning when both fields were coalesced |
| DOCX added late expands scope and adds a dependency | D4 option (a) is the default; (b) requires explicit approval |
| Re-touching `profile-extractor.service.ts` conflicts with future domain work | Baseline commit `7f59dc0` is a clean rollback target |
| Rollback | Single revert; no schema migration, no data loss |
