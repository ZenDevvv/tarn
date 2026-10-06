# Implementation Plan: Dynamic Application Statuses & Workflow Pipeline (`statuses`)

> **Objective:** Shift application status management from a rigid, hardcoded enum to a dynamic, user-configurable database model (`ApplicationStatus`), enabling users to add, rename, and reorder stages in Settings while preserving deterministic StageRing visuals, Kanban column layouts, and analytics funnels.
> **Detailed Task Plan:** [tasks/plan-statuses.md](file:///c:/Users/Zen/Desktop/MY%20PROJECTS/test/test-project2/tasks/plan-statuses.md)
> **Specification:** [spec-statuses.md](file:///c:/Users/Zen/Desktop/MY%20PROJECTS/test/test-project2/spec-statuses.md)

---

## Phased Execution Overview

- [x] **Task 1: Documentation & Capability Mapping (DEFINE)**
  - Author `spec-statuses.md`
  - Update `CAPABILITY_MAP.md`
- [x] **Task 2: Database Schema & Seed Script (`packages/database`)**
  - Add `CloseType` enum and `ApplicationStatus` model to `schema.prisma`
  - Update `Application.statusId` foreign key relation
  - Apply Prisma push and re-generate client
  - Update seed script in `seed.ts`
- [x] **Task 3: Shared Contracts & Validation (`packages/types`, `packages/validation`)**
  - Export `CloseType`, `ApplicationStatusDTO`, updated `ApplicationDTO`
  - Create `status.schema.ts` and update `application.schema.ts`
- [x] **Task 4: Backend Statuses Module & Integration Tests (TDD) (`apps/api`)**
  - Write Supertest test suite `apps/api/tests/statuses.test.ts`
  - Implement repository, service, controller, and routes at `/api/v1/statuses`
- [x] **Task 5: Auth & Applications Integration (`apps/api`)**
  - Seed default statuses on user registration in `auth.service.ts`
  - Include status relation and default fallback in `application.repository.ts`
  - Update user data export in `settings.service.ts`
- [x] **Task 6: Dynamic Analytics Engine Refactor (`apps/api`)**
  - Calculate active vs closed applications and order-driven funnel in `analytics.service.ts`
  - Update analytics test suite
- [x] **Task 7: Frontend Status API, Hook & Dynamic StageRing (`apps/web`)**
  - Implement `status-api.ts` and `useApplicationStatuses()` hook
  - Refactor `StageRing` & `ApplicationStatusBadge` for dynamic order fractions and closeType icons
  - Update status badge tests
- [x] **Task 8: Dynamic Kanban & Dashboard Pipeline (`apps/web`)**
  - Render dynamic Kanban columns in `application-kanban.tsx`
  - Render dynamic active grid and closed outcomes in `pipeline-strip.tsx`
  - Update form and modal select dropdowns
- [x] **Task 9: Settings "Pipeline & Stages" Management UI (`apps/web`)**
  - Add "Stages" tab to `settings-nav.tsx` and `settings-page.tsx`
  - Implement `PipelineStagesSection` with live previews, reordering, and deletion safety guards
- [x] **Task 10: Multi-Module Verification & Knowledge Graph Maintenance (SHIP)**
  - Run full test suite across monorepo (`pnpm test` - 135/135 tests passing)
  - Run build verification (`pnpm build` - all packages & apps cleanly built)
