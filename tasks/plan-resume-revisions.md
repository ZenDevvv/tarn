# Implementation Plan: Resume Revision Lineage & Submission Snapshot

> **Specification:** [spec-resume-revisions.md](../spec-resume-revisions.md)
> **Method:** Strict Red-Green-Refactor per AGENTS.md §3 (failing test → minimal fix → simplify)
> **Task size discipline:** ~50–100 changed lines per task; one concern per task
> **Verification per task:** `pnpm --filter @tracker/api test` (or package-scoped) before marking done
> **Branch:** `feat/resume-revision-lineage`
> **Execution:** Phases are ordered and independently shippable. Phase 1 makes existing history
> legible with no UI change. Phase 4 is the interview-prep payoff and is the largest.
>
> ⚠️ **Database reset is required.** Task 1 changes the schema and per spec §C6 there is no backfill —
> existing rows cannot have lineage reconstructed without fabricating it. Owner has confirmed local
> data is pre-final and resettable.

---

## Dependency Graph

```
Phase 1 — provenance (ship alone; makes existing rows legible)
  T1 schema + reset ──▶ T2 DTO/validation ──▶ T3 generation records revision
                                         ──▶ T4 repository ordering + filters

Phase 2 — selection
  T5 canonical endpoint ──▶ T6 group-by-application listing

Phase 3 — submission
  T7 submittedResumeId + endpoint ──▶ T8 immutability under regeneration

Phase 4 — UI
  T9 resume card shows revision + canonical ──▶ T10 revision group on Resumes page
                                        ──▶ T11 mark-as-submitted on application detail

Phase 5 — verification
  T12 drop `version` field everywhere + full gates
```

---

## Phase 1 — Provenance

### Task 1: Schema, `version` drop, DB reset
- **Red:** `pnpm --filter @tracker/database prisma validate` after editing; then
  `pnpm db:push && pnpm db:seed` must succeed against a reset database.
- **Green:** `packages/database/prisma/schema.prisma` — per spec C1:
  - `Resume`: add `applicationId String?`, `revision Int @default(1)`, `parentResumeId String?`,
    `isCanonical Boolean @default(false)`; self-relation `ResumeRevisions` on both sides;
    `application` relation; `@@index([userId, applicationId, revision])`
  - `Application`: add `submittedResumeId String?`, `submittedAt DateTime?`, `submittedResume`
    relation under the `"SubmittedResume"` name (named to avoid colliding with the existing
    unnamed `resume` relation)
  - **Drop** `Resume.version`
  - Regenerate client
- **Done when:** `prisma validate` clean, push + seed succeed, `ResumeRevisionFields` present in
  the client types.

> **Relation naming.** Prisma requires a relation name when two relations connect the same models.
> `Resume` and `Application` now link twice (existing `resume`, new `application`) plus the
> self-relation, so **every** affected relation needs an explicit name. Forgetting one produces a
> schema error that names the fix.

> **⚠️ Relation naming — verified against the current schema.** `Application.resume`
> (`schema.prisma:175`) and `Resume.applications` (`:346`) are currently an **unnamed** relation
> pair, which Prisma permits only while it is the sole relation between the two models. Adding
> `Resume.application` creates a second, so Prisma will require a relation name on **all** affected
> relations: the existing pair (`"PrimaryResume"`), the new pair (`"ResumeApplication"`), the
> self-relation (`"ResumeRevisions"`), and `submittedResume` (`"SubmittedResume"`). Miss one and
> `prisma validate` fails naming the fix.
>
> Alternative that avoids naming the existing pair: reuse `applicationId` for the *only* new
> `Resume → Application` link, and have `Application.applications` remain the inverse. That yields
> two relations still (`resumeId` and `applicationId`), so naming is required regardless. Prefer the
> explicit names.

### Task 2: DTO + validation contracts
- **Red:** `pnpm --filter @tracker/types build` and `@tracker/validation build` fail until the new
  fields exist. Add assertions that `version` no longer appears in `ResumeDTO`.
- **Green:**
  - `packages/types/src/entities.ts` — `ResumeDTO` gains `applicationId`, `revision`,
    `parentResumeId`, `isCanonical`; **remove** `version`. `ApplicationDTO` gains
    `submittedResumeId`, `submittedAt`, `submittedResume?: ResumeDTO | null`
  - `packages/validation/src/resume.schema.ts` — remove `version` from `createResumeSchema` and
    `updateResumeSchema`
  - `resumeFiltersSchema` gains `applicationId: z.string().optional()`,
    `groupByApplication: z.coerce.boolean().optional().default(false)`,
    and `sortBy` gains `'revision'`
- **Done when:** both packages build; `rg "\bversion\b" packages/types packages/validation` on the
  resume paths returns 0.

### Task 3: Generation records provenance
- **Red:** extend `tests/tailoring.test.ts` with a **three-generation** case against one application:
  assert `revision` 1, 2, 3; `parentResumeId` null → r1.id → r2.id; `applicationId` set; and
  `isCanonical === false` on all three. Control case: a second application for the same role starts
  at `revision` 1.
- **Green:** `tailoring.service.ts` inside the existing transaction (`:311`):
  ```ts
  const prev = await tx.resume.findFirst({
    where: { userId, applicationId: application.id },
    orderBy: { revision: 'desc' },
  });
  ```
  then set `applicationId: application.id`,
  `revision: (prev?.revision ?? 0) + 1`,
  `parentResumeId: prev?.id ?? null`,
  `isCanonical: false`.
  Computed inside the transaction so concurrent generations cannot collide (spec C2).
- **Done when:** the three-generation test passes; existing generation tests unchanged.

### Task 4: Repository ordering and filters
- **Red:** `tests/resumes.test.ts` — create r1/r2/r3 for one application plus one manual upload
  (`applicationId` null); assert default order is `createdAt desc`, and that
  `groupByApplication=true` returns attempts ordered `r1 → r2 → r3` with the manual upload in its
  own group. Assert `sortBy=revision` works.
- **Green:** `resume.repository.ts` — honour `filters.applicationId`; add `revision` to the
  `orderBy` switch (`:32-40`); when `groupByApplication`, order by
  `[{ applicationId: 'asc' }, { revision: 'asc' }]` so lineage reads in sequence.
- **Done when:** resumes suite green.

---

## Phase 2 — Selection

### Task 5: Canonical endpoint
- **Red:** `tests/resumes.test.ts` — mark `r2` canonical → assert `r2.isCanonical === true` and both
  `r1` and `r3` cleared, in a single call. Control: manual uploads (null `applicationId`) are
  untouched; `isDefault` behaviour unchanged.
- **Green:** new `POST /resumes/:id/canonical` in `resume.routes.ts` + service method; one
  `prisma.$transaction` doing `updateMany({ where: { applicationId, id: { not: id } }, data: { isCanonical: false } })`
  then the single-row update (spec C3).
- **Done when:** both cases green; no change to `isDefault` semantics (spec §6 R3).

### Task 6: Group-by-application listing
- **Red:** assert `GET /resumes?groupByApplication=true` returns a deterministic grouping shape with
  each application's attempts ordered by `revision`.
- **Green:** repository/DTO surface for grouped listing if Task 4 did not already produce a usable
  ordering. Keep it minimal — an ordered flat list is sufficient for the UI to group client-side;
  do not build a nested aggregate the API does not need.
- **Done when:** resumes suite green; response shape documented by test.

---

## Phase 3 — Submission

### Task 7: Submission endpoint
- **Red:** `tests/applications.test.ts` — `POST /applications/:id/submitted-resume` with
  `{ resumeId }` → assert `submittedResumeId` and `submittedAt` set. Case with `resumeId` omitted →
  falls back to `application.resumeId` (spec C4). Case with a `resumeId` from a **different
  application** → 400.
- **Green:** new route + service method; validate ownership of the referenced resume.
- **Done when:** applications suite green.

### Task 8: Submission immutability under regeneration
- **Red:** mark a submission, then generate again → assert `submittedResumeId` **unchanged** while
  `resumeId` advanced to the new attempt. This is the core guarantee of the feature.
- **Green:** no change should be required — `tailoring.service.ts` only writes `resumeId`
  (`:330`). The test exists to **prove** the separation holds and to fail loudly if a future edit
  couples them. Record it as such in the test comment.
- **Done when:** test green with zero or minimal production change; if production change is needed,
  that is a finding, not a routine step.

---

## Phase 4 — UI

### Task 9: Revision + canonical on the resume card
- **Red:** `apps/web` unit test on the card's data-mapping helper: a tailored resume exposes
  `revision` and `isCanonical` for display; a manual upload shows neither.
- **Green:** `resume-card.tsx` — `r{revision}` pill for tailored resumes; a "canonical" indicator.
  Reuse existing pill styling; add no new design tokens.
- **Done when:** web suite green; `pnpm --filter @tracker/web build` clean.

### Task 10: Revision grouping on the Resumes page
- **Red:** unit test on the grouping helper: attempts of one application group under a header
  ordered `r1 → r2 → r3`; manual uploads stay ungrouped.
- **Green:** `resumes-page` — group by `applicationId`, render `r1 r2 r3` rows with `matchScore` and
  the canonical marker.
- **Done when:** web suite green; build clean.

### Task 11: Mark-as-submitted on application detail
- **Red:** unit test on the action-visibility helper: shows when a resume exists and none is
  submitted; shows "submitted" (with the resume name) when `submittedResumeId` is set; does **not**
  let regeneration silently change the displayed submitted resume.
- **Green:** `application-detail-page.tsx` — submit the currently-generated resume as the snapshot;
  display `submittedResume` distinctly from the working `resume`.
- **Done when:** web suite green; build clean.

---

## Phase 5 — Verification

### Task 12: Drop `version` everywhere + full gates
- **Red:** grep gates fail while any reference remains.
- **Green:** remove `version` from any remaining UI field, DTO, or filter consumers surfaced by the
  grep. Fix at source.
- **Gates:**
  - `pnpm test` (all workspaces)
  - `pnpm build` (all packages)
  - `rg "\bversion\b" packages/types/src/entities.ts packages/validation/src/resume.schema.ts` = 0
  - `rg "version" apps/web/src/features/resumes` = 0 (excluding unrelated third-party usage)
  - Live E2E: three generations → `revision` 1,2,3 with a correct chain; mark submitted → regenerate
    → `submittedResumeId` unchanged
- **Done when:** all gates pass; spec §4 checklist fully satisfied.

---

## Definition of Done (per task)
1. Test written and failing **before** implementation (red)
2. Minimal implementation passes (green)
3. No linter suppressions; no assertions weakened; no test skipped to force green
4. `pnpm --filter @tracker/api test` (or package scope) green
5. Commit is an independent revert target

## Rollback
One commit per task on `feat/resume-revision-lineage`; `git revert <task-commit>` for any task
independently. Phases 1–2 ship alone and are useful without the UI. Task 1's schema change is
reverted by a later reset plus `db:push`; no data migration is involved because there is no backfill.
