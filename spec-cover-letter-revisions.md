# Specification: Cover Letter Revision Parity

> **Initiative:** Give cover letters the same lineage, canonical selection, and submission snapshot resumes received
> **Specification:** [spec-resume-revisions.md](spec-resume-revisions.md) (the resume equivalent, already shipped on `feat/resume-revision-lineage`)
> **Status:** Approved for Planning
> **Detailed Task Plan:** [tasks/plan-cover-letter-revisions.md](tasks/plan-cover-letter-revisions.md)
> **Extends:** spec-resume-revisions.md §5, which deferred cover letters. That deferral is now reversed.

---

## 1. Objective

Cover letters become a first-class versioned artifact rather than an orphan-generating side effect.

### 1.1 Evidence

Cover letters have **two** compounding defects, not one.

**a. Re-generation orphans the previous letter.** Identical to resumes before that fix: three
generations for one application produced three rows, and nothing distinguished r1 from r3.

**b. Editing destroys the generated original.** This is the worse one, and it has no resume
equivalent:

```ts
// cover-letter.service.ts:131 — the current update path
const updated = await prisma.coverLetter.update({
  where: { id },
  data: { content: input.content, htmlContent: render.html, fileUrl: render.pdfUrl },
});
```

`updateCoverLetterSchema` (`tailoring.schema.ts:135`) **requires** `content`, so every save
overwrites in place. The AI's generated letter — including its `echoedPhrases` provenance — is gone
after the first edit.

This asymmetry has a concrete consequence for the resume work just shipped:

| | Body mutable after creation? | Submission snapshot safe? |
|---|---|---|
| `Resume` | **No** — `createResumeSchema` has no `content` field | Yes, pointer to an immutable row |
| `CoverLetter` | **Yes** — `update` requires `content` | **No** — an edit would silently change what "submitted" means |

A `submittedCoverLetterId` pointer built on today's model would be a false record. That is the
defect this spec exists to close.

---

## 2. Behavioural Contracts

### C1 — Schema

```prisma
model CoverLetter {
  // ... existing ...
  applicationId    String?
  revision         Int       @default(1)
  parentCoverLetterId String?
  isCanonical      Boolean   @default(false)

  parentCoverLetter CoverLetter?  @relation("CoverLetterRevisions", fields: [parentCoverLetterId], references: [id], onDelete: SetNull)
  revisions         CoverLetter[] @relation("CoverLetterRevisions")

  @@index([userId, applicationId, revision])
}

model Application {
  submittedResumeId     String?
  submittedCoverLetterId String?
  submittedAt           DateTime?   // shared: one submission event carries both documents
  submittedCoverLetter  CoverLetter? @relation("SubmittedCoverLetter", fields: [submittedCoverLetterId], references: [id], onDelete: SetNull)
}
```

`applicationId` already exists, so lineage needs no new key. `submittedAt` is **shared** rather than
per-document: a submission is one event that carries a package, and two timestamps would invite
the question of which one was sent.

`CoverLetter.application` and `Application.coverLetters` are an existing unnamed relation; naming
both sides is required once `submittedCoverLetter` is added.

### C2 — Generation records lineage

Identical contract to resumes (`spec-resume-revisions.md` C2): inside the existing transaction at
`tailoring.service.ts:349`, record `applicationId`, `revision = prev + 1`, `parentCoverLetterId`,
and `isCanonical: false`. Read the predecessor inside the transaction so concurrent generations
cannot claim the same number.

### C3 — Editing forks a revision

`PATCH /cover-letters/:id` **creates a new row** rather than mutating:

- `revision = parent.revision + 1`, `parentCoverLetterId = parent.id`
- `content`, `htmlContent`, `fileUrl` carry the edited values
- `matchScore` and `echoedPhrases` are **inherited from the parent**, not recomputed

Inheriting provenance matters: an edited letter is still the letter built from those echoed JD
phrases, and losing that on edit would discard the audit trail the validator produces.

The previous row is left untouched. This is what makes an edit after submission safe: the submitted
row can no longer be modified, so `submittedCoverLetterId` remains a truthful record.

`name`, `role`, `company` are carried forward from the parent unless the caller overrides them.

### C4 — Canonical selection

`POST /cover-letters/:id/canonical`, same semantics as resumes: one canonical letter per
application, cleared in a single transaction. A letter with `applicationId === null` is rejected —
canonical is defined relative to an application.

### C5 — Single submission event

The existing `POST /applications/:id/submitted-resume` becomes **`POST /applications/:id/submitted`**,
accepting optional `resumeId` and `coverLetterId`:

```ts
{ resumeId?: string, coverLetterId?: string }
```

At least one must be present. Each id, when supplied, is validated to belong to the user **and** to
have been generated for that application, exactly as the resume path already does. Omitting a field
leaves that pointer untouched, so marking only the resume does not clear a previously submitted
letter.

The endpoint is unreleased on this branch, so renaming it carries no compatibility cost; keeping two
near-identical endpoints would.

### C6 — Listing and DTO

`CoverLetterDTO` gains `revision`, `parentCoverLetterId`, `isCanonical` (and `applicationId`, which
the DTO already exposes). `ApplicationDTO` gains `submittedCoverLetterId` and `submittedCoverLetter`.

Ordering: letters for an application read `r1 → r2 → r3`, matching resumes.

### C7 — UI parity

Cover letter cards show `r{n}` and a `KEPT` marker. The application detail deliverables panel gains
a mark-as-submitted action for the letter alongside the resume, and renders the frozen submission
line for both documents from a single `submittedAt`.

---

## 3. Acceptance Criteria

- [ ] `pnpm test` green across all workspaces; no assertion weakened
- [ ] `pnpm build` clean (api, web, packages)
- [ ] Two generations for one application yield `revision` 1, 2 with a correct parent chain
- [ ] **Editing a letter creates r2 and leaves r1's `content` byte-identical**
- [ ] An edited letter inherits `matchScore` and `echoedPhrases` from its parent
- [ ] Marking a letter submitted, then editing it, leaves `submittedCoverLetterId` pointing at a row whose `content` never changes
- [ ] Canonical selection keeps exactly one letter per application
- [ ] `POST /submitted` with only `resumeId` leaves an existing `submittedCoverLetterId` intact
- [ ] Letters and resumes share one `submittedAt`
- [ ] Manual letters (`applicationId` null) stay revision 1 and cannot be canonical

## 4. Out of Scope

- Content diffing between letter revisions. Same exclusion as resumes; `content` is already stored
  per revision, so this needs no schema work when wanted.
- Revision pruning.
- Restoring the in-place edit path behind a flag.
- Per-document `submittedAt`.

## 5. Rejected Alternatives

| # | Rejected | Reason |
|---|---|---|
| R1 | Keep in-place edit, add lineage only | Leaves the core defect: an edit after submission silently rewrites the record of what was sent. |
| R2 | Freeze submitted content onto `Application` (denormalized copy) | Duplicates document bodies into a second table and creates two sources of truth for the same text. The revision model fixes the root cause instead. |
| R3 | Separate `submitted-cover-letter` endpoint alongside the resume one | Two near-identical endpoints writing a shared timestamp invites drift. One submission is one request. |
| R4 | Separate `submittedAtCoverLetter` | Implies two submission events where there is one. |
| R5 | Recompute `matchScore` on edit | The score describes the tailoring that produced the letter; recomputing would overwrite provenance rather than inherit it. |

## 6. Risks & Rollback

| Risk | Mitigation |
|---|---|
| Every save creates a revision, producing noise | Accepted trade-off for immutability. Lineage ordering makes trivial revisions visible but harmless, and the canonical marker identifies the one that matters. A future heuristic could collapse consecutive revisions that are not submitted or canonical. |
| Callers holding a letter `id` across an edit | `update` returns the **new** row. The web editor must adopt the returned id; covered by test. |
| Two `submittedAt` writers | Single endpoint owns the field (C5). |
| Rollback | One commit per task; no migration beyond additive columns and one relation name. |