# Implementation Plan: Job Application Tracker

## Overview
Build a personal Applicant Tracking System (ATS) as a full-stack TypeScript modular monolith (`apps/web` React + Vite, `apps/api` Express + Node.js, `packages/database` Prisma + PostgreSQL, `packages/validation` Zod, `packages/types`). The UI implements the **Marker** design system and reproduces the layout and aesthetics of `app/Dashboard sample_ Job Application Tracker.html` and `app/DESIGN.md`.

## Architecture Decisions
- **Monorepo:** `pnpm` workspaces (`apps/web`, `apps/api`, `packages/database`, `packages/validation`, `packages/types`).
- **Database:** PostgreSQL 16 managed via Prisma ORM, running locally via Docker Compose.
- **Authentication:** `httpOnly` secure signed cookies (`token`) with bcrypt password hashing; strict multi-tenant scoping (`userId`) on all database queries.
- **Marker Design System:**
  - Typography: Bricolage Grotesque (display/headings) + Instrument Sans (body/UI).
  - Status as shape: SVG `StageRing` (12 distinct states; no colored pills).
  - The Marker: Lime highlight swipe (`--marker: #D6F04F`) strictly budgeted for next actions due today or overdue.
  - Surface separation by tone and hairlines; shadows only on Level 2 floating layers (`--elevation-float`).
  - Exact dashboard reference: `app/Dashboard sample_ Job Application Tracker.html`.

---

## Phased Tasks

### Phase 1: Foundation (`foundation`) [COMPLETED]
- [x] Task 1.1: Monorepo Workspace & Shared Tooling Setup
- [x] Task 1.2: Database Package with Prisma Schema & Seed Script
- [x] Task 1.3: Shared Types & Validation Packages
- [x] Task 1.4: Backend Express API Bootstrap & Health Endpoint
- [x] Task 1.5: Frontend Vite + React + Marker Design System Bootstrap

#### Checkpoint: Foundation [PASSED]
- [x] Monorepo builds cleanly (`pnpm build`)
- [x] PostgreSQL container runs via Docker Compose
- [x] Prisma migrations and seed script complete
- [x] Express API responds to `/api/v1/health`
- [x] Vite frontend renders Marker design system tokens & shell

---

### Phase 2: Authentication & User Session (`auth`) [COMPLETED]
- [x] Task 2.1: Backend Auth Module (Register, Login, Logout, /me, Middleware)
- [x] Task 2.2: Frontend Auth State, API Client & Login/Register Pages

#### Checkpoint: Authentication [PASSED]
- [x] User can register, log in, persist session on reload, and log out
- [x] Protected endpoints reject unauthenticated requests with 401

---

### Phase 3: Core Domain — Companies, Jobs & Applications (`companies-jobs`, `applications`) [COMPLETED]
- [x] Task 3.1: Backend Companies & Jobs Services & Endpoints
- [x] Task 3.2: Backend Applications CRUD & Filter Endpoints
- [x] Task 3.3: Frontend Application Components & List View

---

### Phase 4: Lifecycle & Actionability — Timeline & Follow-ups (`timeline`, `follow-ups`) [COMPLETED]
- [x] Task 4.1: Status Transitions & Activity Timeline
- [x] Task 4.2: Follow-up Tasks & Reminders

#### Checkpoint: Core Applications & Actionability [PASSED]
- [x] Application creation automatically creates Company, Job, and TimelineEvent
- [x] Moving status records chronological timeline event
- [x] Follow-ups can be created and completed

---

### Phase 5: Dashboard & Visual Experience (`dashboard-analytics`, `kanban-pipeline`) [COMPLETED]
- [x] Task 5.1: Backend Dashboard Analytics Aggregator Endpoint
- [x] Task 5.2: Frontend Dashboard Page (1:1 with `Dashboard sample_ Job Application Tracker.html`)
- [x] Task 5.3: Kanban Status Pipeline Board with Optimistic Mutations

---

### Phase 6: Polish, Accessibility & Verification [COMPLETED]
- [x] Task 6.1: Theme Audit (Paper & Night Pine) and Mobile Responsiveness (360px)
- [x] Task 6.2: Automated Integration & End-to-End Test Suite Verification

---

## Phase 7: Multi-Stage Interview Management (`interviews`) [COMPLETED]

### Task 7.1: Prisma Schema & Migration + Shared Types & Validation [COMPLETED]
- **Description:** Define the `Interview` model, `InterviewType`, `InterviewStatus`, and `InterviewResult` enums in Prisma. Run migration. Define TypeScript interfaces in `packages/types` and Zod validation schemas in `packages/validation`.
- **Acceptance:**
  - `Interview` table exists in PostgreSQL with foreign keys to `User` and `Application`.
  - `packages/types` exports `Interview`, `InterviewType`, `InterviewStatus`, `InterviewResult`.
  - `packages/validation` exports `createInterviewSchema` and `updateInterviewSchema`.
- **Verify:** `pnpm --filter @tracker/database prisma migrate dev && pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`
- **Files:**
  - `packages/database/prisma/schema.prisma`
  - `packages/types/src/entities.ts`
  - `packages/validation/src/interview.schema.ts`
  - `packages/validation/src/index.ts`

### Task 7.2: Backend API Endpoints, Service & Timeline Integration [COMPLETED]
- **Description:** Implement repository, service, controller, and routes for interviews (`/api/v1/interviews` and `/api/v1/applications/:id/interviews`). Automatically log `TimelineEvent` on scheduling and completion. Update dashboard analytics service to include live upcoming interviews.
- **Acceptance:**
  - `POST /api/v1/interviews` creates interview and writes a timeline event.
  - `GET /api/v1/interviews` supports filtering by `upcoming`, `applicationId`, and `status`.
  - `PATCH /api/v1/interviews/:id` and `PATCH /api/v1/interviews/:id/status` update interview and record milestones.
  - `DELETE /api/v1/interviews/:id` deletes interview.
  - `GET /api/v1/analytics/dashboard` returns real upcoming interviews.
  - Integration tests in `apps/api/tests/interviews.test.ts` pass with 100% tenant isolation.
- **Verify:** `pnpm --filter @tracker/api test`
- **Files:**
  - `apps/api/src/modules/interviews/interview.repository.ts`
  - `apps/api/src/modules/interviews/interview.service.ts`
  - `apps/api/src/modules/interviews/interview.controller.ts`
  - `apps/api/src/modules/interviews/interview.routes.ts`
  - `apps/api/src/modules/analytics/analytics.service.ts`
  - `apps/api/src/app.ts`
  - `apps/api/tests/interviews.test.ts`

### Task 7.3: Frontend Interviews Hub (`/interviews`) [COMPLETED]
- **Description:** Build the dedicated `/interviews` page with Marker design aesthetics: view toggle (Upcoming vs Past), date grouping, StageRing indicators, meeting URL links, and an accessible schedule/edit dialog.
- **Acceptance:**
  - Route `/interviews` is registered and functional in desktop sidebar and mobile tab bar.
  - Interviews render cleanly with company, role, round, scheduled time, duration, and platform link.
  - "Schedule interview" modal permits selecting an application and entering interview details.
  - Quick action to mark an interview as completed or cancelled.
- **Verify:** `pnpm --filter @tracker/web build`
- **Files:**
  - `apps/web/src/features/interviews/api/interview-api.ts`
  - `apps/web/src/features/interviews/components/interview-card.tsx`
  - `apps/web/src/features/interviews/components/schedule-interview-modal.tsx`
  - `apps/web/src/features/interviews/pages/interviews-page.tsx`
  - `apps/web/src/app/router.tsx`

### Task 7.4: Application Detail Interviews Tab & Dynamic Dashboard Feed [COMPLETED]
- **Description:** Embed the multi-round interview tracker directly inside `ApplicationDetailPage` (`/applications/:id`) and connect the dashboard's "Upcoming interviews" card to real API data.
- **Acceptance:**
  - Users can view and schedule rounds directly from the application details view.
  - Dashboard's "Upcoming interviews" widget displays live interviews, formatted with date/time, company name, and meeting platform.
- **Verify:** `pnpm --filter @tracker/web build`
- **Files:**
  - `apps/web/src/features/applications/components/application-interviews-tab.tsx`
  - `apps/web/src/features/applications/pages/application-detail-page.tsx`
  - `apps/web/src/features/dashboard/components/upcoming-interviews.tsx`

### Task 7.5: Full Verification & Polish [COMPLETED]
- **Description:** Run full test suite, verify WCAG AA accessibility, inspect UI in light and dark mode, and verify zero build warnings or regressions.
- **Acceptance:**
  - `pnpm test` passes across all workspace packages.
  - `pnpm build` completes with zero errors.
- **Verify:** `pnpm test && pnpm build`

#### Checkpoint: Phase 2 Interviews Complete [PASSED]
- [x] Database schema migrated
- [x] Endpoints tested with Supertest
- [x] Interviews hub live and accessible
- [x] Application detail tab integrated
- [x] Dashboard upcoming interviews live

---

## Phase 8: Saved Jobs & Opportunity Wishlist (`saved-jobs`)

### Task 8.1: Saved Jobs Components (`SavedJobCard`, `QuickSaveModal`) [COMPLETED]
- **Description:** Build `SavedJobCard` to render saved positions with company, role, platform, work setup, salary, date saved, 1-click "Mark as applied" button, and external link. Build `QuickSaveModal` to easily bookmark opportunities with `status: 'SAVED'`.
- **Acceptance:**
  - `SavedJobCard` matches Marker design aesthetic with StageRing `SAVED` indicator and action triggers.
  - `QuickSaveModal` saves positions directly into the native ATS pipeline with default `USD` currency.
- **Verify:** `pnpm --filter @tracker/web build`
- **Files:**
  - `apps/web/src/features/saved-jobs/components/saved-job-card.tsx`
  - `apps/web/src/features/saved-jobs/components/quick-save-modal.tsx`

### Task 8.2: Saved Jobs Hub Page & Router Registration (`/saved-jobs`) [COMPLETED]
- **Description:** Implement `SavedJobsPage` with search, work setup filter, stats ribbon, and quick-save modal trigger. Register route in router.
- **Acceptance:**
  - Navigating to `/saved-jobs` displays the wishlist hub.
  - Users can search, filter, and 1-click convert saved jobs to `APPLIED`.
- **Verify:** `pnpm --filter @tracker/web build`
- **Files:**
  - `apps/web/src/features/saved-jobs/pages/saved-jobs-page.tsx`
  - `apps/web/src/app/router.tsx`

### Task 8.3: Live Dynamic Count Badge in App Shell Navigation [COMPLETED]
- **Description:** Wire dynamic count badge for Saved jobs, Applications, and Interviews in primary navigation.
- **Acceptance:**
  - Sidebar reflects live saved count from analytics endpoint.
- **Verify:** `pnpm --filter @tracker/web build`
- **Files:**
  - `apps/web/src/layouts/app-layout.tsx`

### Task 8.4: Full Verification & Polish [COMPLETED]
- **Description:** Run full test suite, verify WCAG AA accessibility, inspect UI in light and dark mode, and verify zero build warnings or regressions.
- **Acceptance:**
  - `pnpm test` passes across all workspace packages.
  - `pnpm build` completes with zero errors.
- **Verify:** `pnpm test && pnpm build`

#### Checkpoint: Phase 8 Saved Jobs Complete [PASSED]
- [x] /saved-jobs page live and accessible from sidebar
- [x] Users can bookmark jobs and convert to applied with one click
- [x] Sidebar displays live count of saved jobs
- [x] Full build and test suite passing cleanly

