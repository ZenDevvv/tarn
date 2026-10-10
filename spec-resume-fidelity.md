# Specification: Resume Rendering Fidelity & Document Agnosticism

> **Initiative:** Close empirically-confirmed rendering defects and open the document-type axis
> **Source:** E2E run (2026-10-10) — ICU nurse profile → CNS application → generated PDF
> **Status:** Approved for Planning
> **Detailed Task Plan:** [tasks/plan-resume-fidelity.md](tasks/plan-resume-fidelity.md)
> **Supersedes nothing.** Follows `spec-domain-agnostic.md` (2026-10-09), which remains the active
> statement on *scoring and lexicons*. This spec covers *rendering and document shape*.

---

## 1. Objective

Make the tailoring pipeline **lossless** for the content it already accepts, **correct** in its
pagination, and **capable of emitting more than one kind of document**.

Three defects were reproduced in a single end-to-end run against a live API, live Postgres, and a
real Gemini key. They are not speculative and not domain-specific:

| # | Defect | Evidence |
|---|---|---|
| D1 | `profile.customSections` is silently destroyed | 2 sections stored → `resume.content.customSections === null`; `isValid: true`, `fidelityWarnings: []` |
| D2 | Content orphans onto a second page | Page 2 contained only the Education entry; template declares no `break-inside`/`orphans`/`widows` |
| D3 | Skills kicker mislabels the section | Heading rendered as `LEADERSHIP` above content containing *Clinical Competencies* |

Beyond the defects, one structural gap blocks genuine agnosticism: **the system emits exactly one
kind of document.** Federal resumes, academic CVs, and EU/UK CVs are different *documents*, not
different templates, and `timelineItemSchema.attributes` (`tailoring.schema.ts:30`) already models
the federal fields (`licenseNumber`, `jurisdiction`, salary, hours) while the template never renders them.

---

## 2. Evidence

Full pipeline executed via HTTP against `localhost:4000` (tsx watch, live DB, live Chromium):

```
POST /auth/register                         → 201
PUT  /master-profile                        → 200  customSections: 2
POST /applications (CNS JD, Mayo Clinic)    → 201
GET  /tailoring/applications/:id/analysis   → 200  matchScore 72
POST /tailoring/applications/:id/generate   → 200  10.5s
                                                 coverage 72 → 80
                                                 fidelityWarnings: []
                                                 isValid: true
```

Text-extracted PDF:

| Token | Result |
|---|---|
| `Clinical Rotations` | **MISSING** |
| `Licensure` | **MISSING** |
| `RN-441782` | **MISSING** |
| `800 hours` | **MISSING** |

Stored profile `customSections` = **2**. Generated `content.customSections` = **null**.

Page 2 of a 2-page PDF:

```
EDUCATION
University of Minnesota
Bachelor of Science in Nursing | Magna Cum Laude   2016
```

---

## 3. Root causes

### D1 — customSections dropped, and the validator cannot see it

Two independent causes, both required for the bug:

1. **Not requested.** The synthesis prompt (`tailoring.service.ts:405-412`) serialises only
   `basics, workExperience, projectExperience, skills, education, factBank`. The output contract
   (`:419-427`) does not list `customSections`. The model has no instruction and no shape to fill.
2. **Not merged.** After `callGeminiSynthesis`, the service attaches verified certifications
   (`:163-167`) and sets `sectionOrder` (`:169-174`), but never copies `profile.customSections`.

Compounding this, the template already renders all five polymorphic types
(`resume-template.ts:386-487`) and honours `sectionOrder` placement by id or title (`:525-552`) —
**the entire rendering capability exists and is unreachable.**

The validator reads `profile.customSections` (`tailoring-validator.service.ts:39,132,176`) but only
checks that *produced* content is **grounded**. It has no **completeness** check, so loss is
invisible by construction.

### D2 — no pagination CSS

`RESUME_CSS` (`resume-template.ts:11-179`) declares no `break-inside`, `page-break-inside`,
`orphans`, or `widows`. Entries and sections split freely across page boundaries, including
mid-bullet. `.entry` (`:72-77`) has no protection.

### D3 — kicker heuristic assumes the first category describes the section

```ts
// resume-template.ts:313-318
const GENERIC_SKILL_CATEGORIES = /^(general|core|skills|other|misc|key)/i;
const skillsKicker =
  firstSkillCategory && !GENERIC_SKILL_CATEGORIES.test(firstSkillCategory)
    ? firstSkillCategory
    : 'Skills & Competencies';
```

"Leadership" is not matched by the generic list, so it becomes the section heading — while the
section also contains *Clinical Competencies*. The heuristic is correct for a first category that
names the whole section ("Clinical Competencies") and wrong for one that names a *bucket*
("Leadership", "Management", "Tools").

### D4 — declared-but-unconsumed surfaces

Same defect class as D1: present in schema, unreachable in behaviour.

| Surface | Declared | Consumed |
|---|---|---|
| `overrideWarnings` | `tailoring.schema.ts:9` | never read by service; UI shows "Save Anyway" |
| `preset` | `tailoring.schema.ts:11` | never read |
| `additionalInstructions` | `tailoring.schema.ts:8` | never read |
| `sectionOrder` (caller) | `tailoring.schema.ts:10` | service reads it; web UI never sends it |
| `timelineItemSchema.attributes` | `tailoring.schema.ts:30` | never rendered |
| `credentialItemSchema.licenseNumber` / `jurisdiction` | `:39-40` | never rendered |
| `Resume.version` | `schema.prisma:330` (`@deprecated`) | still accepted by Zod |

---

## 4. Behavioural Contracts

### C1 — customSections are merged deterministically, never hallucinated

The AI may **reorder** but may never **rewrite** `customSections`. Rationale: these hold clinical
rotations, bar admissions, and license numbers — precisely the content the fidelity validator exists
to protect. Routing them through a rewriting prompt re-opens the hallucination hole for the
highest-stakes fields.

```
if profile.customSections is non-empty:
    resumePayload.customSections = profile.customSections   // authoritative
    sectionOrder ∪= custom section ids not already present  // appended, order preserved
```

`sectionOrder` merging appends missing custom ids **after** the last known key, preserving the
heuristic's decisions about the six fixed sections. Placement by explicit `input.sectionOrder`
(C5) still wins.

### C2 — completeness is a validation dimension

Add a 7th checked dimension `custom_section_coverage`. For every `profile.customSections[]` entry,
assert a matching entry exists in `resumePayload.customSections` by `id`, falling back to
case-insensitive `title`. Each unmatched section produces a fidelity warning of the form:

```
Custom section "Clinical Rotations" was dropped from the tailored resume.
```

`isValid` then correctly reports `false` and `blocking: true`, which makes the existing
`overrideWarnings` affordance meaningful (C4) instead of decorative.

**Deliberate non-goal:** the warning is *remediated in the same request* by C1's merge, so a healthy
run produces no warning. The check exists to catch regressions and future code paths that bypass the
merge — not to fail normal operation.

### C3 — pagination CSS

```css
.entry, .section, .cert-row { break-inside: avoid; page-break-inside: avoid; }
.entry                         { break-inside: avoid-page; }
.section                       { break-after: auto; }
.entry-list li                 { orphans: 2; widows: 2; }
```

`break-inside: avoid-page` on `.entry` is stronger than `avoid` and is honoured by Chromium's
paged media: an entry that cannot fit on the remainder of a page moves whole to the next rather than
splitting. **No dynamic re-measure/re-render loop.** See §6 R3.

### C4 — `overrideWarnings` actually gates

When `overrideWarnings === false` and validation returns `blocking: true`, the service throws
`BadRequestError` listing the warnings. When `true`, generation proceeds and the warnings are stored
on the `Resume.notes` payload. This makes the existing UI button truthful.

### C5 — `documentType` (Phase 3)

`generateTailoringSchema` gains `documentType: 'resume' | 'cv' | 'federal'` (default `resume`).

| Type | Length target | Content policy |
|---|---|---|
| `resume` | 1–2 pages | current behaviour (default) |
| `cv` | no cap | never truncate; `publications` and `honors` promoted ahead of `projects` |
| `federal` | no cap | render `timelineItemSchema.attributes` (salary, hours/week, supervisor, clearance); include full street address from `basics`; float `certifications` first |

`attributes` rendering in `.entry`:
- `attributes.salary` / `hourlyRate` → inline after the date range
- `attributes.hoursPerWeek` → same line
- `attributes.supervisor` (+ `supervisorPhone`) → a `.entry-meta` line
- `attributes.securityClearance` → appended to the entry subtitle

Every attribute is optional; absence renders nothing. `credentialItemSchema.licenseNumber` and
`.jurisdiction` render in the same line as `.cert-issuer` when present — this alone recovers the
`RN-441782` value lost in D1's evidence.

Length is a **content-selection** directive to the model, never a typography-shrinking directive.

### C6 — data-driven kickers for every fixed section

`Professional Summary`, `Education`, `Work Experience`, `Project Experience`,
`Certifications & Licenses` are hardcoded strings (`resume-template.ts:198,230,269,302,379`). Each
resolves from `payload.sectionTitles[sectionKey]` when present, else the default. The AI populates
`sectionTitles` from the profile's own naming, so a nurse's experience section can read
"Clinical Experience" **without any profession classifier**.

### C7 — justification removed

`text-align: justify` → `left` on `.entry-list li` (`:112`) and `.summary-text` (`:150`). Justified
text in a ~6in measure produces uneven word spacing ("rivers"), measurably hurting skim-readability
with no ATS benefit.

---

## 5. Acceptance Criteria

- [ ] `pnpm test` green across all workspaces; no assertion weakened, no lint suppression added
- [ ] `tsc` build clean (api, web, packages)
- [ ] **Replay of the E2E nurse fixture**: generated PDF text contains `Clinical Rotations`,
      `Licensure & Board Certifications`, `RN-441782`, `800 hours`
- [ ] Generated `resume.content.customSections.length === profile.customSections.length === 2`
- [ ] Single-page PDF for the nurse fixture, or page 2 with ≥1 full entry (no orphan)
- [ ] Skills kicker for `{ Leadership, Clinical Competencies }` is `Skills & Competencies`
- [ ] Skills kicker for `{ 'Clinical Competencies': [...] }` alone still renders `Clinical Competencies`
- [ ] `checkedDimensions` includes `custom_section_coverage`
- [ ] `federal` documentType renders salary / hours / supervisor / clearance when `attributes` present
- [ ] `overrideWarnings: false` + blocking warning → HTTP 400 with warning list
- [ ] Repo grep gates: no new `text-align: justify`; `overrideWarnings` read in the service

## 6. Non-Goals & Rejected Alternatives

| # | Rejected | Reason |
|---|---|---|
| R1 | Domain/profession classifier driving layout | Regresses `spec-domain-agnostic.md`. C6 achieves "Clinical Experience" via the user's own naming, with no lexicon to maintain and no misclassification risk. Empirically, `shouldFloatCertifications` already floats licensure to slot 2 with **zero** domain detection. |
| R2 | Second visual template (serif vs sans) | Adds a UI decision to a 1-click flow for negligible ATS delta; the current document is already maximally conservative. |
| R3 | Dynamic line-height auto-fit loop | `--print-to-pdf` (`pdf-renderer.service.ts:40-96`) returns a path, not a page count — requires render→measure→re-render iteration inside a 30s-bounded request. C3 solves the observed defect in CSS; shrinking fights the ≥10pt ATS floor. |
| R4 | Passing `customSections` to Gemini for rewriting | C1 is authoritative-by-merge instead. Rewriting risks hallucination in license numbers and clinical history, and would make the validator flag correct content as ungrounded. |
| R5 | `.docx` export | Real gap (ATS guidance prefers DOCX), but a new dependency against the `spec-domain-agnostic.md:55` no-new-deps constraint. Deferred to a separate spec. |

## 7. Risks & Rollback

| Risk | Mitigation |
|---|---|
| Merging profile custom sections reintroduces low-relevance sections the model would have dropped | By design (C1) — omission is the user's decision, not the model's. Users can delete the section in Master Profile. |
| `break-inside: avoid` creates larger gaps / more pages | Correct tradeoff vs mid-bullet splits. `avoid-page` bounds it to one page per entry. Verified in Phase 1 replay. |
| `overrideWarnings` gating turns previously-succeeding calls into 400s | Intended. Blocking only fires on a real fidelity failure, which C1's merge makes unreachable in the happy path. |
| `federal`/`cv` inflate prompt length | JD + profile already dominate; added section is ~40 tokens. |
| Rollback | One branch, one commit per task; `git revert` any task independently. |
