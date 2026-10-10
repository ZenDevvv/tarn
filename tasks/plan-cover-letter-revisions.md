# Implementation Plan: Cover Letter Revision Parity

> **Specification:** [spec-cover-letter-revisions.md](../spec-cover-letter-revisions.md)
> **Method:** Strict Red-Green-Refactor per AGENTS.md §3 (failing test → minimal fix → simplify)
> **Verification per task:** `pnpm --filter @tracker/api test` before marking done
> **Branch:** `feat/resume-revision-lineage` (continues the existing branch)
> **No database reset needed.** All changes are additive columns plus one relation name; existing
> rows default to `revision = 1`, `isCanonical = false`, `parentCoverLetterId = null`.

---

## Dependency Graph

```
T1 schema ──▶ T2 DTO ──▶ T3 generation lineage
                       ──▶ T4 edit forks a revision
                       ──▶ T5 canonical endpoint
                       ──▶ T6 submission covers both documents
                       ──▶ T7 UI parity
                       ──▶ T8 full gates + live E2E
```

---

## Task 1: Schema
- **Red:** `prisma validate` fails until relation names are consistent.
- **Green:** `schema.prisma` — per spec C1.
  - `CoverLetter`: `revision Int @default(1)`, `parentCoverLetterId String?`,
    `isCanonical Boolean @default(false)`; self-relation `"CoverLetterRevisions"` on both sides;
    `@@index([userId, applicationId, revision])`
  - `Application`: `submittedCoverLetterId String?` + `submittedCoverLetter` relation
    `"SubmittedCoverLetter"`
  - **Name the existing pair** `CoverLetter.application` / `Application.coverLetters` — Prisma rejects
    an unnamed relation once a second one connects the same models.
- **Done when:** `prisma validate` clean, `db:push` succeeds, client regenerated.

> Resume revisions proved this: `Application.submittedAt` already exists, so it is shared rather than
> duplicated. Check for that before adding a second timestamp.

---

## Task 2: DTO and validation
- **Red:** `@tracker/types build` fails until fields exist.
- **Green:** `CoverLetterDTO` gains `revision`, `parentCoverLetterId`, `isCanonical`.
  `ApplicationDTO` gains `submittedCoverLetterId`, `submittedCoverLetter`.
  `submitResumeSchema` → rename to `submitPackageSchema`, accept optional `coverLetterId`, refine so
  at least one of the two is present.
- **Done when:** packages build.

---

## Task 3: Generation records lineage
- **Red:** two generations for one application → assert `revision` 1, 2, correct parent chain,
  `isCanonical` false on both. A second application restarts at 1.
- **Green:** `tailoring.service.ts:349` — read the predecessor **inside** the transaction, then set
  the lineage fields.
- **Done when:** new test green; existing generation tests unchanged.

---

## Task 4: Editing forks a revision
- **Red:** the load-bearing test — generate a letter, `PATCH` its content, then assert:
  - a new row exists at `revision = 2` with `parentCoverLetterId` = the original
  - the **original's `content` is byte-identical** to before the edit
  - the new row inherits `matchScore` and `echoedPhrases`
  - the response carries the **new** id, not the old one
- **Green:** `cover-letter.service.ts:131` — replace `prisma.coverLetter.update` with a `create`
  that copies lineage forward and inherits provenance.
- **Done when:** test green. **This is the task that makes the submission snapshot truthful**; if it
  is skipped the feature is cosmetic.

---

## Task 5: Canonical endpoint
- **Red:** mark `r2` canonical → exactly one canonical among siblings; switching clears the previous;
  a letter with null `applicationId` is rejected 400.
- **Green:** `POST /cover-letters/:id/canonical`, mirroring the resume repository pattern including
  the `CANONICAL_REQUIRES_APPLICATION` sentinel.
- **Done when:** cover letter suite green.

---

## Task 6: Submission covers both documents
- **Red:**
  - `{ resumeId }` only → `submittedCoverLetterId` unchanged when one was already set
  - `{ coverLetterId }` only → resume pointer unchanged
  - `{ resumeId, coverLetterId }` → both set, **one** `submittedAt`
  - either id from a different application → 400
  - empty body → 400
- **Green:** rename the route to `POST /applications/:id/submitted`; validate each supplied id by
  ownership **and** `applicationId`; write `submittedAt` once.
- **Done when:** applications + tailoring suites green. Update existing tests for the rename — this
  endpoint has never shipped, so there is no external caller.

---

## Task 7: UI parity
- **Red:** extend `attempt-display` unit tests to cover letters (shared shape where possible).
- **Green:**
  - `cover-letter-card.tsx` — `r{n}` pill and `KEPT` marker
  - `application-deliverables.tsx` — mark-as-submitted for the letter; render one submission line
    from the shared `submittedAt`
  - `application-api.ts` — `submitResume` → `submitPackage(id, { resumeId?, coverLetterId? })`
  - `submission-display.ts` — extend `describeSubmission` to report both documents
- **Done when:** web suite green, `pnpm build` clean.

> **Editor must adopt the new id.** `PATCH /cover-letters/:id` returns a *new* row (Task 4). The web
> cover letter editor must store the returned id, or a second save would fork from a stale parent.
> Verify this while wiring; it is the one place Task 4 changes an existing caller.

---

## Task 8: Verification gate
- **Red:** live E2E against a running API.
- **Gates:**
  - `pnpm test`; `pnpm build`
  - Live: two generations → `r1`, `r2` with correct parent
  - Live: edit `r1` → `r2` created, `r1.content` unchanged
  - Live: mark `r2` submitted, then edit `r2` again → `submittedCoverLetterId` content unchanged
  - Live: canonical selection keeps exactly one
- **Done when:** all pass; spec §3 checklist satisfied.

---

## Definition of Done (per task)
1. Test failing before implementation (red)
2. Minimal implementation passes (green)
3. No lint suppressions, no weakened assertions
4. `pnpm --filter @tracker/api test` green
5. Commit is an independent revert target

## Rollback
One commit per task. Additive schema only, so rollback is a code revert plus `db:push`; no data
migration and no reset.