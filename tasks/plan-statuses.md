# Implementation Plan: Dynamic Application Statuses & Workflow Pipeline (`statuses`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 13 — Dynamic Application Statuses & Workflow Pipeline  
> **Module ID:** `statuses`  
> **Specification:** `spec-statuses.md`  
> **Design System:** **Marker** (`apps/web/src/index.css`, `StageRing`, `Bricolage Grotesque`, `Instrument Sans`)  
> **Directives Contract:** `AGENTS.md` (Ponytail 7-Rung Ladder, 6-Phase SDLC, Impeccable Design Suite, TDD)

---

## Architecture & Data Model Decisions

1. **Unified Status Model with `CloseType` Discriminator:**
   - Instead of rigid backend category enums, statuses are user-owned entities in `ApplicationStatus`.
   - `closeType: null` designates a **Pipeline Stage** with a sequential `order` (`0, 1, 2...`). Appears as a column in Kanban, in the active Pipeline strip, and in the conversion funnel.
   - `closeType: 'REJECTED' | 'WITHDRAWN' | 'NO_RESPONSE' | 'CANCELLED' | 'OTHER'` designates a **Closed Outcome** (terminal state outside the pipeline grid, with `order: null`). Users can customize names or add new custom outcomes.
2. **Dynamic StageRing Progress & Visual Glyphs:**
   - Active stages calculate progress fraction dynamically:
     $$\text{Progress} = \frac{\text{order}}{\text{totalPipelineStages} - 1}$$
   - Closed outcomes render dedicated SVG patterns:
     - `REJECTED`: Inner cross `✕` icon with `--stage-rejected` color
     - `WITHDRAWN`: Dashed circle (`strokeDasharray="3 2.4"`)
     - `NO_RESPONSE`: Dotted circle (`strokeDasharray="0.01 3.4"`)
     - `CANCELLED`: Diagonal slash `⊘` (`M4.25 11.75L11.75 4.25`)
     - `OTHER`: Centered horizontal minus `⊖` (`M4.5 8H11.5`)
3. **Multi-Tenant Isolation & Deletion Safeguards:**
   - All status queries are scoped strictly to `userId`.
   - Cannot delete a status if applications are currently assigned to it (blocks deletion with an actionable error to reassign applications first).
   - Automatic seeding of the 8 default statuses on new user registration (and lazy seeding on first load).

---

## Task Decomposition

### Task 1: Documentation & Capability Mapping (Phase 1: DEFINE)
- **Files:**
  - `spec-statuses.md`
  - `CAPABILITY_MAP.md`
- **Actions:**
  - Author comprehensive `spec-statuses.md` defining user stories, schema contracts, API endpoints, mathematical StageRing formulas, analytics specifications, Marker design guidelines, and acceptance criteria.
  - Update `CAPABILITY_MAP.md` registering `statuses` capability and updating the dependency order graph (`applications ──▶ statuses ──▶ settings`).
- **Verification:** Specs and capability map exist, link cleanly, and contain zero stubbed content.

### Task 2: Database Schema, Migration & Seed Script (`packages/database`)
- **Files:**
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/seed.ts`
- **Actions:**
  - In `schema.prisma`:
    - Add `enum CloseType { REJECTED, WITHDRAWN, NO_RESPONSE }`.
    - Add `model ApplicationStatus { id, userId, name, order, closeType, isDefault, createdAt, updatedAt, user, applications }` with `@@unique([userId, name])` and `@@index([userId, order])`.
    - In `model User`: add `statuses ApplicationStatus[]`.
    - In `model Application`: replace `status ApplicationStatus` with `statusId String` and `status ApplicationStatus @relation(fields: [statusId], references: [id], onDelete: Restrict)`.
    - Remove deprecated `enum ApplicationStatus`.
  - Run `pnpm --filter @tracker/database prisma db push` and `pnpm --filter @tracker/database prisma generate`.
  - In `seed.ts`:
    - Seed Mika's 8 default `ApplicationStatus` records first.
    - Link seed applications to their corresponding `statusId`.
- **Verification:**
  - `pnpm --filter @tracker/database exec prisma validate`
  - `pnpm --filter @tracker/database db:seed` runs cleanly.

### Task 3: Shared Contracts & Validation Schemas (`packages/types`, `packages/validation`)
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/types/src/index.ts`
  - `packages/validation/src/status.schema.ts`
  - `packages/validation/src/application.schema.ts`
  - `packages/validation/src/index.ts`
- **Actions:**
  - In `packages/types/src/entities.ts`:
    - Export `CloseType = 'REJECTED' | 'WITHDRAWN' | 'NO_RESPONSE'`.
    - Export `ApplicationStatusDTO`.
    - Update `ApplicationDTO`: `statusId: string`, `status: ApplicationStatusDTO`.
    - Export `CreateApplicationStatusInput`, `UpdateApplicationStatusInput`, `ReorderStatusesInput`.
    - Update `DashboardAnalyticsDTO.pipeline` shape to support dynamic active stages and closed outcomes.
  - In `packages/validation/src/status.schema.ts`:
    - Export `createStatusSchema`, `updateStatusSchema`, `reorderStatusesSchema`.
  - In `packages/validation/src/application.schema.ts`:
    - Update `createApplicationSchema`: `statusId: z.string().trim().optional()`.
    - Update `updateStatusSchema`: `statusId: z.string().trim().min(1)`.
    - Update `applicationFiltersSchema`: `statusId: z.string().trim().optional()`.
- **Verification:**
  - `pnpm --filter @tracker/types build`
  - `pnpm --filter @tracker/validation build`

### Task 4: Backend Statuses Module & Automated Tests (TDD) (`apps/api`)
- **Files:**
  - `apps/api/tests/statuses.test.ts`
  - `apps/api/src/modules/statuses/status.repository.ts`
  - `apps/api/src/modules/statuses/status.service.ts`
  - `apps/api/src/modules/statuses/status.controller.ts`
  - `apps/api/src/modules/statuses/status.routes.ts`
  - `apps/api/src/app.ts`
- **Actions:**
  - Write Supertest test suite `apps/api/tests/statuses.test.ts` covering:
    - `GET /api/v1/statuses` (retrieves user statuses in `order asc`, auto-seeds if empty)
    - `POST /api/v1/statuses` (creates custom status with next auto-incremented order)
    - `PATCH /api/v1/statuses/:id` (updates name or isDefault)
    - `PUT /api/v1/statuses/reorder` (persists new sequential orders)
    - `DELETE /api/v1/statuses/:id` (rejects with 409 Conflict if applications use the status; succeeds if unused)
    - Strict multi-tenant isolation (User B cannot read, update, reorder, or delete User A's statuses)
  - Implement repository, service (with `seedDefaultStatuses`), controller, and router.
  - Register `/api/v1/statuses` in `apps/api/src/app.ts`.
- **Verification:** `pnpm --filter @tracker/api test tests/statuses.test.ts` (all test cases green).

### Task 5: Backend Auth & Applications Integration (`apps/api`)
- **Files:**
  - `apps/api/src/modules/auth/auth.service.ts`
  - `apps/api/src/modules/applications/application.repository.ts`
  - `apps/api/src/modules/settings/settings.service.ts`
- **Actions:**
  - In `auth.service.ts`: Automatically seed default statuses when a new user registers.
  - In `application.repository.ts`:
    - Include `status: true` in queries (`findMany`, `findById`, `create`, `update`).
    - Auto-fallback to the user's default status if `statusId` is omitted on application creation.
    - Update timeline event descriptions with `status.name` on status change.
  - In `settings.service.ts`: Include status details in user data JSON export.
- **Verification:** `pnpm --filter @tracker/api test tests/applications.test.ts tests/settings.test.ts`.

### Task 6: Dynamic Analytics Engine Refactor (`apps/api`)
- **Files:**
  - `apps/api/src/modules/analytics/analytics.service.ts`
  - `apps/api/tests/analytics.test.ts`
- **Actions:**
  - Refactor `analytics.service.ts`:
    - Fetch user's `ApplicationStatus` records.
    - Active applications: `applications.filter(a => a.status.closeType === null)`.
    - Closed applications: `applications.filter(a => a.status.closeType !== null)`.
    - Rejection rate: `applications.filter(a => a.status.closeType === 'REJECTED')`.
    - Dynamic pipeline distribution: counts keyed by status.
    - Funnel stages: dynamically generated from active pipeline stages sorted by `order`.
  - Update analytics test assertions to match dynamic pipeline response.
- **Verification:** `pnpm --filter @tracker/api test tests/analytics.test.ts`.

### Task 7: Frontend Status API, Hook & Dynamic StageRing (`apps/web`)
- **Files:**
  - `apps/web/src/features/settings/api/status-api.ts`
  - `apps/web/src/features/settings/hooks/use-application-statuses.ts`
  - `apps/web/src/features/applications/components/application-status-badge.tsx`
  - `apps/web/src/features/applications/components/application-status-badge.test.ts`
- **Actions:**
  - Create `status-api.ts` (`getStatuses`, `createStatus`, `updateStatus`, `reorderStatuses`, `deleteStatus`).
  - Create `useApplicationStatuses()` query hook.
  - Refactor `StageRing` & `ApplicationStatusBadge`:
    - Accept `status: ApplicationStatusDTO | string` and optional `totalStages`.
    - For `closeType: null`, compute progress: $\frac{\text{order}}{\text{totalStages} - 1}$.
    - For `closeType: 'REJECTED'`, render cross `x`.
    - For `closeType: 'WITHDRAWN'`, render dashed ring.
    - For `closeType: 'NO_RESPONSE'`, render dotted ring.
  - Update `application-status-badge.test.ts` with test cases for dynamic progress and closed types.
- **Verification:** `pnpm --filter @tracker/web test src/features/applications/components/application-status-badge.test.ts`.

### Task 8: Dynamic Kanban & Dashboard Pipeline Components (`apps/web`)
- **Files:**
  - `apps/web/src/features/applications/components/application-kanban.tsx`
  - `apps/web/src/features/dashboard/components/pipeline-strip.tsx`
  - `apps/web/src/features/applications/components/application-form.tsx`
  - `apps/web/src/features/applications/components/application-filters.tsx`
  - `apps/web/src/features/applications/pages/application-detail-page.tsx`
  - `apps/web/src/features/saved-jobs/components/quick-save-modal.tsx`
- **Actions:**
  - In `application-kanban.tsx`:
    - Load stages dynamically via `useApplicationStatuses()`.
    - Render Kanban columns exclusively for active stages (`closeType: null`) sorted by `order`.
    - Moving card across columns calls `useApplicationStatusMutation` with `statusId`.
  - In `pipeline-strip.tsx`:
    - Render dynamic active columns from `pipeline.activeStages`.
    - Render closed outcomes strip from `pipeline.closedOutcomes`.
  - In `application-form.tsx`, `application-detail-page.tsx`, and `application-filters.tsx`:
    - Populate status dropdown options dynamically from `useApplicationStatuses()`.
- **Verification:** Manual check and automated unit tests.

### Task 9: Settings "Pipeline & Stages" Management UI (`apps/web`)
- **Files:**
  - `apps/web/src/features/settings/components/settings-nav.tsx`
  - `apps/web/src/features/settings/pages/settings-page.tsx`
  - `apps/web/src/features/settings/components/pipeline-stages-section.tsx`
- **Actions:**
  - Add `'stages'` tab to `SettingsNav` with an intuitive workflow icon (`GitBranch` or `Columns`).
  - Implement `PipelineStagesSection`:
    - Section header and description explaining the customizable job pipeline.
    - Ordered list of active pipeline stages with live `StageRing` preview showing computed fill fraction.
    - Reorder controls (Move Up / Move Down buttons) calling `reorderStatuses`.
    - Add New Stage inline form/modal (name input with auto-order).
    - Edit stage name inline.
    - Delete stage button with confirmation dialog and alert if applications currently use that stage.
    - Separate section for Closed Outcomes with ability to customize display labels.
    - Strict Marker design system compliance: Bricolage Grotesque titles, Instrument Sans body, hairline borders, no nested cards, mobile-responsive layout, 150–200ms `cubic-bezier(0.16, 1, 0.3, 1)` transitions.
- **Verification:** Navigate to `/settings?tab=stages`, test creating, reordering, editing, and deleting stages.

### Task 10: Multi-Module Verification & Knowledge Graph Maintenance (Phases 4–6)
- **Actions:**
  - Run comprehensive test suite: `pnpm test` across all workspaces.
  - Run typecheck and production build: `pnpm build`.
- **Verification:** All tests green (135/135 tests passing), build succeeds with zero errors across all workspaces.

---

## Execution Status Summary

| Task | Module | Status | Verification Result |
|---|---|---|---|
| Task 1: Documentation & Capability Mapping | `spec-statuses.md`, `CAPABILITY_MAP.md` | **Completed** | Spec drafted; capability registered |
| Task 2: Database Schema & Migration | `packages/database` | **Completed** | `ApplicationStatus` model created; seed verified |
| Task 3: Shared Contracts & Validation | `packages/types`, `packages/validation` | **Completed** | Types & Zod schemas built & validated |
| Task 4: Backend Statuses Module | `apps/api` | **Completed** | Full CRUD, reorder & guards tested (9/9 tests green) |
| Task 5: Auth & Applications Integration | `apps/api` | **Completed** | Seed on register & status relation active |
| Task 6: Dynamic Analytics Engine | `apps/api` | **Completed** | Pipeline breakdown & funnel order dynamic (5/5 tests green) |
| Task 7: Frontend Status API & StageRing | `apps/web` | **Completed** | Dynamic fill fraction & outcome icons tested (4/4 tests green) |
| Task 8: Dynamic Kanban & Pipeline Strip | `apps/web` | **Completed** | Columns & strip dynamic with statusId mutation |
| Task 9: Settings "Pipeline & Stages" UI | `apps/web` | **Completed** | Section built with reordering, inline edit & deletion guards |
| Task 10: Multi-Module Verification & Build | All workspaces | **Completed** | `pnpm test` (135/135 green), `pnpm build` (zero errors) |

