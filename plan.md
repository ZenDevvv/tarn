# Implementation Plan: Consolidate Application Statuses to Single INTERVIEWING Stage

> **Objective:** Streamline the application lifecycle from 12 statuses (with 4 interview sub-stages) down to 8 statuses (5 active pipeline stages), improving Kanban board density and Stage Ring visual legibility, while letting the dedicated `Interview` entity handle detailed interview rounds.

---

## Task Breakdown

### Task 1: Database Schema & Migration (`packages/database`)
- [x] Update `ApplicationStatus` enum in `packages/database/prisma/schema.prisma` (`SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `NO_RESPONSE`).
- [x] Run Prisma migration / reset and generate updated `@prisma/client`.
- [x] Update seed script `packages/database/prisma/seed.ts` with `ApplicationStatus.INTERVIEWING`.

### Task 2: Shared Types & Validation Packages
- [x] Update `ApplicationStatus` union in `packages/types/src/entities.ts`.
- [x] Update `applicationStatusEnum` in `packages/validation/src/application.schema.ts`.

### Task 3: Backend API Services & Tests (`apps/api`)
- [x] Update `apps/api/src/modules/applications/application.repository.ts` to include `interviews` in `findAll`.
- [x] Update `apps/api/src/modules/settings/settings.service.ts` (`ACTIVE_STATUSES`).
- [x] Update `apps/api/src/modules/analytics/analytics.service.ts` (pipeline map, interview statuses, and funnel stages).
- [x] Update API test suites:
  - `apps/api/tests/timeline-and-follow-ups.test.ts`
  - `apps/api/tests/interviews.test.ts`
  - `apps/api/tests/contacts.test.ts`
  - `apps/api/tests/companies.test.ts`
  - `apps/api/tests/analytics.test.ts`

### Task 4: Frontend Components & Tests (`apps/web`)
- [x] Update `apps/web/src/features/applications/components/application-status-badge.tsx` (StageRing with 4 quarters: 0, 1/4, 2/4, 3/4, 1).
- [x] Update `apps/web/src/features/applications/components/application-kanban.tsx`:
  - 5 active columns: Saved, Applied, Interviewing, Offer, Accepted.
  - Display latest/upcoming interview pill on cards in Interviewing stage.
- [x] Update `apps/web/src/features/dashboard/components/pipeline-strip.tsx` (5 active columns).
- [x] Update `apps/web/src/features/analytics/components/status-distribution.tsx`.
- [x] Update `apps/web/src/features/interviews/components/interview-card.tsx` (`stageRingStatus`).
- [x] Update frontend test suites:
  - `apps/web/src/features/applications/components/application-status-badge.test.ts`
  - `apps/web/src/features/analytics/components/analytics.test.ts`
  - `apps/web/src/features/contacts/components/contact-card.test.ts`
  - `apps/web/src/features/resumes/components/resume-card.test.ts`

### Task 5: End-to-End Verification
- [x] Run `pnpm test` across all packages and apps (114 tests passing).
- [x] Run `pnpm build` across all packages and apps (Clean compile).
