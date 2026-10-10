# Implementation Plan: Resume Rendering Fidelity & Document Agnosticism

> **Specification:** [spec-resume-fidelity.md](../spec-resume-fidelity.md)
> **Method:** Strict Red-Green-Refactor per AGENTS.md §3 (failing test → minimal fix → simplify)
> **Task size discipline:** ~50–100 changed lines per task; one concern per task
> **Verification per task:** `pnpm --filter @tracker/api test` (or package-scoped) before marking done
> **Branch:** `fix/resume-rendering-fidelity` off `main`
> **Execution:** Phases are ordered and independently shippable. **Phase 1 alone is a complete,
> shippable fix** for the three reproduced defects. Phases 2–4 extend scope and are not required to
> close the reproduced bugs.

---

## Dependency Graph

```
Phase 1 (reproduced defects — ship as one PR)
  T1 break-inside CSS ─────────────────────────────▶ E2E replay gate
  T2 skills kicker generic list ───────────────────▶ E2E replay gate
  T3 customSections merge (C1) ─┬─▶ T4 coverage dimension (C2) ─┬─▶ T5 overrideWarnings gates (C4)
                                │                              │
                                └──────────────────────────────┴─▶ E2E replay gate

Phase 2 (cheap wins, independent of Phase 1)
  T6 justify → left (C7)

Phase 3 (document-type axis)
  T7 documentType contract ──▶ T8 attributes + credential rendering (C5)
                             ──▶ T9 sectionTitles data-driven kickers (C6)
                             ──▶ T10 web UI toggle

Phase 4 (verification gate)
  T11 full suite + grep gates + E2E fixture as regression test
```

---

## Phase 1 — Reproduced defects (do first, ship as one PR)

### Task 1: Pagination CSS
- **Red:** add to `tests/resume-template.test.ts`: build HTML for a payload with ≥6 experience entries
  each carrying 4 bullets; assert `RESUME_CSS` (via the built HTML string) contains
  `break-inside: avoid` and `page-break-inside: avoid`. Assert `.entry` carries `break-inside: avoid-page`.
- **Green:** `resume-template.ts` `RESUME_CSS` — add per C3, inside the existing block before
  `@media print` (`:175`).
- **Done when:** template suite green; the three declarations present in rendered HTML.
- **Note:** pure CSS, zero behavioural risk. Kept first because it is the cheapest fix for the most
  visible defect and validates that the replay harness (T3 note) works.

### Task 2: Skills kicker generic-category list
- **Red:** `tests/resume-template.test.ts`: skills `{ Leadership: [...], 'Clinical Competencies': [...] }`
  → assert kicker is `Skills & Competencies`, **not** `Leadership`. Assert the existing case
  `{ 'Clinical Competencies': [...] }` (single key, `:291`) still renders `Clinical Competencies`.
- **Green:** `resume-template.ts:313` — extend `GENERIC_SKILL_CATEGORIES` to cover bucket-style
  category names (`leadership|management|technical|tools|software|systems|professional|other|core|…`).
  Keep the single-self-describing-category behaviour that the persona suite relies on.
- **Done when:** both new assertions green; `tests/persona-domain.test.ts` A10/B10/C10 still pass
  (those personas' first categories are self-describing and must survive).

### Task 3: Deterministic customSections merge
- **Red:** `tests/tailoring.test.ts`: profile fixture with `customSections: [clinical_rotations, licensure]`,
  stubbed Gemini returning `resume` with `customSections: null` → assert the persisted
  `Resume.content.customSections` has both entries with items intact, and `sectionOrder` contains
  both ids.
- **Green:** `tailoring.service.ts` after the cert-merge block (`:163-167`) — per C1:
  ```ts
  const profileCustom = profile.customSections || [];
  if (profileCustom.length > 0) {
    resumePayload.customSections = profileCustom;
    resumePayload.sectionOrder = appendMissingCustomIds(
      resumePayload.sectionOrder || [], profileCustom
    );
  }
  ```
  Add `appendMissingCustomIds` as a local pure helper (matches after last existing key, case-insensitive
  id-then-title, per C1). Optionally pass `customSections` into the prompt profile block
  (`:405-412`) as **context only** — never as an output field.
- **Done when:** tailoring suite green; E2E replay (below) shows all four missing tokens present.

### Task 4: Completeness validation dimension
- **Red:** `tests/tailoring-validator.test.ts`: `resumePayload.customSections = []` with profile
  carrying 2 → assert `fidelityWarnings` contains a `dropped` message naming `Clinical Rotations`,
  `isValid === false`, `blocking === true`, and `checkedDimensions` includes
  `custom_section_coverage`. Control case: payload containing both sections → no warning.
- **Green:** `tailoring-validator.service.ts` — add the coverage check as a 7th dimension; extend
  the `resumePayload` param type with `customSections`; append to `checkedDimensions` (`:324`).
- **Done when:** validator suite green; per C2 the healthy path (T3 merge applied) emits no warning —
  assert this explicitly so the check is proven non-fatal.

### Task 5: `overrideWarnings` actually gates
- **Red:** `tests/tailoring.test.ts`: force a blocking warning (profile with an ungrounded employer,
  `overrideWarnings: false`) → expect `BadRequestError`/400 with the warning list; same fixture with
  `overrideWarnings: true` → 200 and warnings present on the stored resume notes.
- **Green:** `tailoring.service.ts` — after `TailoringValidatorService.validate(...)` (`:177-185`),
  gate on `validation.blocking && !input.overrideWarnings`. Wire C4.
- **Done when:** both cases green; no other test regresses into a new 400.

### Phase 1 Exit Gate — E2E replay
Re-run the recorded nurse pipeline (register → PUT profile with 2 customSections → CNS application →
analyze → generate → `pdftotext`). Assert:

| Assertion | Target |
|---|---|
| `Clinical Rotations` in PDF text | present |
| `Licensure & Board Certifications` in PDF text | present |
| `RN-441782` in PDF text | present |
| `800 hours` in PDF text | present |
| `content.customSections.length` | 2 |
| `fidelityWarnings` | `[]` (C2 non-fatal proof) |
| Skills kicker | `SKILLS & COMPETENCIES` |
| Pages | 1, or page 2 containing ≥1 full entry |

---

## Phase 2 — Cheap wins (independent; any order)

### Task 6: Justification removed (C7)
- **Red:** `tests/resume-template.test.ts`: assert rendered CSS contains no
  `text-align: justify` and that `.entry-list li` / `.summary-text` resolve to `left`.
- **Green:** `resume-template.ts:112` and `:150` — `justify` → `left`.
- **Done when:** suite green; grep gate `text-align: justify` = 0 in `apps/*/src`.

---

## Phase 3 — Document-type axis

### Task 7: `documentType` contract
- **Red:** `tests/tailoring.test.ts`: `generateTailoringSchema` accepts `documentType: 'federal'`;
  assert the prompt carries the federal content directive and, for `resume`, does not.
- **Green:** `packages/validation/src/tailoring.schema.ts` — add the enum with default `'resume'`;
  `tailoring.service.ts` — branch the prompt directive per C5. Pass `documentType` into
  `buildResumeHtml` via the payload.
- **Done when:** types + api build clean; tailoring suite green.

### Task 8: `attributes` + credential detail rendering (C5)
- **Red:** `tests/resume-template.test.ts`: timeline item with
  `attributes: { salary: '$85,000', hoursPerWeek: '40', supervisor: 'Dr. A. Osei', supervisorPhone: '…', securityClearance: 'Secret' }`
  → assert all four render in the entry; omit `attributes` → assert nothing extra renders.
  Credential with `licenseNumber`/`jurisdiction` → assert both render.
- **Green:** `resume-template.ts` — add an `.entry-meta` row rendered only for non-empty attributes
  (`:246-265` experience entries and `:396-416` timeline items, so both paths are covered).
  Extend the cert row (`:417-433`) to append license/jurisdiction. All values through `escapeHtml`.
- **Done when:** suite green; no XSS path — an attribute containing `<script>` is escaped.

### Task 9: Data-driven section titles (C6)
- **Red:** `tests/resume-template.test.ts`: payload with `sectionTitles: { experience: 'Clinical Experience' }`
  → assert that kicker replaces `Work Experience`; absent → default preserved for all five sections.
- **Green:** `resume-template.ts` — add `resolveKicker(key, defaultTitle)` and apply at `:198,230,269,302,379`.
  Extend `aiResumePayloadSchema` (`tailoring.schema.ts:180`) with optional `sectionTitles`.
  Task 7's prompt asks the model to populate titles **from the profile's own section naming** — no
  profession classifier (spec §6 R1).
- **Done when:** suite green; persona suite A10/B10/C10 unaffected.

### Task 10: Web UI document-type toggle
- **Red:** `apps/web` component test: Tailoring Studio renders the selector; selected value is sent
  in the generate payload alongside `targetArtifact`.
- **Green:** `tailoring-studio-modal.tsx` — add a 3-option selector matching the existing
  `targetArtifact` radio-card pattern (`:521-602`); include `documentType` in the request body (`:74-77`).
- **Done when:** web suite green + `pnpm build` clean.

---

## Phase 4 — Verification gate

### Task 11: Regression fixture + repo gates
- **Red:** promote the Phase 1 E2E replay into `tests/persona-domain.test.ts` as **Persona D
  (ICU RN with customSections)** asserting C1/C2/C3 end-to-end at the service layer (Gemini stubbed,
  template invoked for real). Assert the four previously-missing tokens appear in `buildResumeHtml` output.
- **Green:** fix whatever surfaces; at source, never by weakening assertions.
- **Gates:** `pnpm test`; `pnpm build`; `tsc` clean; grep gates —
  `text-align: justify` = 0; `overrideWarnings` present in `tailoring.service.ts`; no new
  `professionalSkills`-style hardcoded lexicon introduced.
- **Done when:** all gates pass; `spec-resume-fidelity.md` §5 checklist fully satisfied.

---

## Definition of Done (per task)
1. Test written and failing **before** implementation (red)
2. Minimal implementation passes (green)
3. No linter suppressions; no assertions weakened; no test skipped to force green
4. `pnpm --filter @tracker/api test` (or package scope) green
5. Commit is an independent revert target

## Rollback
One commit per task on `fix/resume-rendering-fidelity`; `git revert <task-commit>` for any task
independently. Phase 1 can ship alone without Phases 2–4. No DB migration in Phase 1 or 2
(`customSections` already persists inside `MasterProfile.factBank`).
