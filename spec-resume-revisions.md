# Specification: Resume Revision Lineage & Submission Snapshot

> **Initiative:** Make tailored-resume history legible, and record what was actually submitted
> **Source:** E2E observation (2026-10-10) — three re-tailors of one application
> **Status:** Approved for Planning
> **Detailed Task Plan:** [tasks/plan-resume-revisions.md](tasks/plan-resume-revisions.md)
> **Supersedes:** the `version: String?` field deprecated in `spec-resumes.md` Phase 2. See §6 R1.

---

## 1. Objective

Replace user-typed version labels with **system-recorded provenance**, and separate
*"what did I generate"* from *"what did I submit"*.

### 1.1 Evidence

Three consecutive generations against **one** application, live API:

```
cmv2f7wk  Resume - Mayo Clinic (Clinical Nurse Specialist)  score=83
cmv2f85e  Resume - Mayo Clinic (Clinical Nurse Specialist)  score=66
cmv2f8dq  Resume - Mayo Clinic (Clinical Nurse Specialist)  score=76

distinct names:  1
version field:   [null, null, null]
application.resumeId → cmv2f8dq   (most recent, score 76)
```

Three rows that are indistinguishable in any UI. The **best** attempt (83) is orphaned, and
`application.resumeId` silently repoints to the newest on every regeneration.

Two facts are unrecorded:

1. **Lineage** — that `r3` descended from `r2` which descended from `r1`.
2. **Attachment** — that the 83 was the one actually sent, while `resumeId` tracks the latest
   generated. These are different questions and the schema answers neither.

### 1.2 Why not overwrite in place

Generation is non-deterministic: the same profile and JD produced **83, then 66, then 76** across
three calls (Gemini `temperature: 0.2` plus genuine prompt sensitivity). Overwriting would destroy
the 83 a user saw five minutes earlier and cannot reproduce. Since the app surfaces an ATS score and
invites comparison between runs, silent overwrite is the wrong default: keep every attempt, let the
user choose.

---

## 2. Problem Statement

Three features are routinely conflated as "versioning". They answer different questions and only two
belong in this spec.

| | Question | Verdict |
|---|---|---|
| Manual version labels (`v1.0`) | "How do I organise my files?" | **Rejected** — §6 R1 |
| **Revision lineage** | "What changed between attempts?" | **In scope** — C2, C3 |
| **Submission snapshot** | "What did I actually send?" | **In scope** — C4, the highest-value item |

---

## 3. Behavioural Contracts

### C1 — Schema

```prisma
model Resume {
  // ... existing ...
  applicationId  String?   // which application's JD produced this; null for manual uploads
  revision       Int       @default(1)
  parentResumeId String?   // self-relation → previous attempt for the same application
  isCanonical    Boolean   @default(false)  // the attempt the user chose to keep

  application Application? @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  parentResume Resume?     @relation("ResumeRevisions", fields: [parentResumeId], references: [id], onDelete: SetNull)
  revisions    Resume[]    @relation("ResumeRevisions")

  @@index([userId, applicationId, revision])
}

model Application {
  // ... existing ...
  submittedResumeId String?   // frozen at submission; never moves on regeneration
  submittedAt       DateTime?

  submittedResume Resume? @relation("SubmittedResume", fields: [submittedResumeId], references: [id], onDelete: SetNull)
}
```

`Resume.version` is **dropped** in the same migration. Retaining a dead column alongside a live
`revision` invites a future reader to use the wrong one.

### C2 — Generation records provenance

Within the existing transaction (`tailoring.service.ts:311`), the created `Resume` additionally
records:

- `applicationId` — the application whose JD produced it
- `revision` — `max(existing revisions for this application) + 1`, defaulting to `1`
- `parentResumeId` — the highest existing revision for this application, or `null` for `r1`
- `isCanonical: false` — a new attempt never auto-promotes itself

Revision is computed **inside the transaction** so concurrent generations cannot collide on a number.

Existing `application.resumeId` update is unchanged and continues to point at the newest attempt.

### C3 — Canonical selection

`POST /resumes/:id/canonical` marks one attempt canonical and clears the flag on all siblings of the
same `applicationId`, in one transaction. At most one canonical attempt per application.

Manual (non-tailored) uploads have `applicationId === null` and are unaffected; their `revision`
stays `1` and `isCanonical` reflects the pre-existing `isDefault` intent, which remains the user-facing
"primary resume" concept and is **not** renamed.

### C4 — Submission snapshot

`POST /applications/:id/submitted-resume` with `{ resumeId }` sets `submittedResumeId` +
`submittedAt`. Once set, a later regeneration **does not move it** — that is the entire point.

`application.resumeId` keeps its current meaning: *latest generated*, for the working view.
`submittedResumeId` means *what went out the door*, for interview preparation. The two are
independent and both are needed.

Behaviour when `submittedResumeId` is unset and `resumeId` is set: the submission endpoint accepts
`resumeId` omitted and falls back to `application.resumeId`.

### C5 — Listing & DTO

`ResumeDTO` gains `applicationId`, `revision`, `parentResumeId`, `isCanonical`. `version` is removed.
`ApplicationDTO` gains `submittedResumeId`, `submittedAt`, and a `submittedResume` object for the
interview view.

`resumeFiltersSchema` gains `applicationId` and `groupByApplication` (boolean, default `false`).
Repository `orderBy` supports `{ revision: 'asc' }`, and grouping orders by
`(applicationId, revision)` so `r1 → r2 → r3` reads in sequence.

### C6 — Backfill policy

Existing rows cannot be reconstructed — lineage was never recorded, so any assignment would be
fabricated. Given the owner's confirmation that data is pre-final, **reset the database**. No
backfill, no heuristic inference. This is the only honest option: guessing a parent would put
invented data into the exact model whose purpose is recording what actually happened.

---

## 4. Acceptance Criteria

- [ ] `pnpm test` green across all workspaces; no assertion weakened
- [ ] `pnpm build` clean (api, web, packages)
- [ ] Three generations for one application yield `revision` 1, 2, 3 with a correct `parentResumeId` chain
- [ ] A second application for the same role starts again at `revision` 1 (per-application, not per-role)
- [ ] Setting canonical on `r2` clears canonical on `r1` and `r3`
- [ ] Marking a submission, then regenerating, leaves `submittedResumeId` unchanged while `resumeId` advances
- [ ] `GET /resumes?groupByApplication=true` returns attempts ordered `r1 → r2 → r3`
- [ ] `version` absent from Prisma schema, DTO, Zod schemas, and UI
- [ ] Manual uploads unaffected: `applicationId` null, `isDefault` still works

## 5. Out of Scope

- Content diffing between revisions (a "what changed" view). The payload snapshot is already stored
  in `Resume.content`; rendering a diff is a separate feature.
- Revision pruning or automatic cleanup. Every attempt is retained by design (§1.2).
- Cover letter revisions. `CoverLetter` has the same orphaning problem, but it is one-per-application
  by construction and carries no comparison workflow. Tracked separately.
- Grouping cover letters under an application revision tree.

## 6. Rejected Alternatives

| # | Rejected | Reason |
|---|---|---|
| R1 | Restore the user-typed `version: String?` label | A string a user must maintain rots immediately, cannot be ordered meaningfully, and duplicates what the database records. Deprecated in `spec-resumes.md` Phase 2 for good reason. |
| R2 | Overwrite the existing `Resume` row on regeneration | Destroys a better prior attempt that cannot be reproduced (§1.2). |
| R3 | Reuse `isDefault` as the canonical flag | `isDefault` is a *user-level* "my primary resume" concept surfaced across the app; canonical is a *within-application* "which attempt did I keep" concept. Reusing one for both couples two unrelated UI meanings. |
| R4 | Infer lineage by `createdAt` proximity at backfill | Fabricates a history that was never recorded. Directly at odds with the fidelity principles in `spec-resume-fidelity.md`. |
| R5 | Auto-promote the highest-scoring attempt to canonical | The ATS score is a keyword-match heuristic, not a judgement of document quality. Silently choosing for the user removes agency; ranking is not the same as recommendation. |

## 7. Risks & Rollback

| Risk | Mitigation |
|---|---|
| Concurrent generations collide on `revision` | Compute inside the existing transaction; `@@index([userId, applicationId, revision])` aids lookup. |
| Deleting a parent resume orphans `parentResumeId` | `onDelete: SetNull`; the chain degrades to a flat ordered list rather than breaking. |
| `submittedResumeId` set to the wrong resume | User-initiated and explicit; the endpoint never infers from `resumeId` unless the caller omits it. |
| DB reset loses local data | Owner-confirmed acceptable (§C6); no production data exists. |
| Rollback | One branch, one commit per task. Schema migration reverts with the code; a subsequent reset restores the prior shape. |
