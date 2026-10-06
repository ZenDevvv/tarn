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

---

## Phase 9: Job Posting URL Auto-Fill & Metadata Extraction (`job-url-autofill`)

### Task 9.1: Shared Types & Validation Schema [COMPLETED]
- **Description:** Export `parseJobUrlSchema` and `ParsedJobMetadataDTO` from `@tracker/validation` and `@tracker/types`.
- **Acceptance:**
  - TypeScript contracts and Zod schemas compile cleanly.
- **Verify:** `pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/validation/src/application.schema.ts`

### Task 9.2: Backend Metadata Extraction Service & SSRF Guard [COMPLETED]
- **Description:** Implement `JobParserService` in `apps/api` with SSRF protection, JSON-LD Schema.org parsing, OpenGraph meta tag extraction, and URL heuristics.
- **Acceptance:**
  - Blocks internal IPs and cloud metadata addresses.
  - Correctly extracts job role, company, location, salary, and description from HTML.
- **Verify:** `pnpm --filter @tracker/api test`
- **Files:**
  - `apps/api/src/modules/applications/job-parser.service.ts`

### Task 9.3: Backend Endpoint & Automated Integration Tests [COMPLETED]
- **Description:** Route `POST /api/v1/applications/parse-job-url` with Supertest integration tests verifying JSON-LD parsing, SSRF rejection, and URL fallback.
- **Acceptance:**
  - Protected endpoint returns 200 with extracted metadata.
  - 14 automated tests pass in `job-parser.test.ts`.
- **Verify:** `pnpm --filter @tracker/api test`
- **Files:**
  - `apps/api/src/modules/applications/application.controller.ts`
  - `apps/api/src/modules/applications/application.routes.ts`
  - `apps/api/tests/job-parser.test.ts`

### Task 9.4: Frontend First-Action UI in `QuickSaveModal` [COMPLETED]
- **Description:** Place Job URL input as the primary first action with auto-fetch on paste/change, loading spinner, auto-fill of all fields, visual confirmation badges, and graceful fallback.
- **Acceptance:**
  - URL is top hero field in `QuickSaveModal`.
  - Auto-fills company, position, source, setup, location, salary, and description.
- **Verify:** `pnpm --filter @tracker/web build`
- **Files:**
  - `apps/web/src/features/applications/api/application-api.ts`
  - `apps/web/src/features/saved-jobs/components/quick-save-modal.tsx`

### Task 9.5: Full Verification & Polish [COMPLETED]
- **Description:** Full test suite passes across workspace with 0 errors. Clean build.
- **Acceptance:**
  - `pnpm test` passes across all workspace packages.
  - `pnpm build` completes with zero errors.
- **Verify:** `pnpm test && pnpm build`

#### Checkpoint: Phase 9 Job URL Auto-Fill Complete [PASSED]
- [x] Job URL is the first action in the Quick Save modal
- [x] Pasting a URL auto-extracts company, role, platform, setup, salary, and location
- [x] SSRF security guards and fallback heuristics verified
- [x] Zero build or test failures

---

## Phase 10: Resume Version Management & Application Linking (`resumes`)

### Task 10.1: Database Model & Prisma Migration [COMPLETED]
- **Description:** Define `Resume` model in Prisma with relations to `User` and `Application.resumeId`. Run migration and generate Prisma Client.
- **Verify:** `pnpm --filter @tracker/database exec prisma migrate dev --name add_resumes`

### Task 10.2: Shared Types & Validation Schemas [COMPLETED]
- **Description:** Export `ResumeDTO` and `ResumeWithDetailsDTO` from `@tracker/types` and schemas from `@tracker/validation`.
- **Verify:** `pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`

### Task 10.3: Backend Module & File Upload Endpoint [COMPLETED]
- **Description:** Implement `resumeRepository`, `resumeService`, `resumeController`, and `resumeRouter` with 10 Supertest tests.
- **Verify:** `pnpm --filter @tracker/api test tests/resumes.test.ts` (10 passed)

### Task 10.4: Frontend UI Components, Hub Page & Routing [COMPLETED]
- **Description:** Implement `ResumeCard`, `ResumeFilters`, `ResumeFormModal`, `ResumeDetailModal`, `ResumesPage`, `/resumes` route in `AppRouter`, and dynamic sidebar counter in `AppLayout`.
- **Verify:** `pnpm build`

### Task 10.5: Application Detail Integration [COMPLETED]
- **Description:** Link resumes to applications with 1-click preview/download and attachment switcher in `ApplicationDetailPage`.
- **Verify:** Full test suite passes (88 tests passing).

#### Checkpoint: Phase 10 Resume Management Complete [PASSED]
- [x] Dedicated `/resumes` hub live and accessible from sidebar
- [x] Supports direct PDF/DOCX file upload and external document links
- [x] Tracks versions, target roles, highlighted skills, and notes
- [x] 100% tenant-isolated with default version toggle
- [x] Integrated into application detail view
- [x] All 88 tests passing and zero build errors

---

## Phase 11: Job-Search Analytics Hub (`analytics`)

### Task 11.1: Shared Types & Validation Schemas [COMPLETED]
- **Description:** Define `AnalyticsOverviewDTO` and sub-interfaces (`AnalyticsKpiDTO`, `FunnelStageDTO`, `PlatformMetricDTO`, `WorkSetupMetricDTO`, `VelocityMetricDTO`, `TimingMetricsDTO`, `SalaryInsightsDTO`, `StatusDistributionDTO`) in `@tracker/types`. Define `analyticsQuerySchema` in `@tracker/validation`.
- **Verify:** `pnpm --filter @tracker/types build; pnpm --filter @tracker/validation build`

### Task 11.2: Backend Analytics Overview Endpoint & Automated Tests [COMPLETED]
- **Description:** Implement `analyticsService.getAnalyticsOverview(userId, range)` in `apps/api/src/modules/analytics/` supporting date range filtering (`all`, `30d`, `90d`, `ytd`), funnel conversion progression, platform performance, work setup and salary aggregations, 12-week velocity, and full 12-stage distribution. Route `GET /api/v1/analytics/overview`.
- **Verify:** `pnpm --filter @tracker/api test tests/analytics.test.ts` (5 tests passing)

### Task 11.3: Frontend UI Components & Markers [COMPLETED]
- **Description:** Build `AnalyticsHeader`, `AnalyticsKpiStrip`, `AnalyticsFunnel`, `PlatformBreakdown`, `VelocityTrend`, `TimingMetrics`, `WorkSetupAndSalary`, and `StatusDistribution` with Marker design aesthetics (Bricolage Grotesque display numbers, StageRing status shapes, subtle border surfaces, and `.marker` highlight accents).
- **Verify:** `pnpm --filter @tracker/web test` (10 tests passing)

### Task 11.4: Analytics Page & App Router Integration [COMPLETED]
- **Description:** Implement `AnalyticsPage` coordinating time range filtering, loading/error states, and empty state CTA. Register `/analytics` route in `apps/web/src/app/router.tsx`. Connect with desktop sidebar and mobile navigation.
- **Verify:** `pnpm build` across workspace (0 errors)

#### Checkpoint: Phase 11 Analytics Hub Complete [PASSED]
- [x] Dedicated `/analytics` page live and integrated with AppLayout navigation
- [x] Multi-tenant server-side aggregations for KPIs, funnel, platforms, velocity, and timing
- [x] Time-range filtering (`all`, `30d`, `90d`, `ytd`) with smooth reactivity
- [x] 97 total workspace automated tests passing (100% green)
- [x] Clean production build with zero errors

---

## Phase 12: Account Settings, Profile & Preferences (`settings`)

### Task 12.1: Prisma Schema Migration for User Profile & Settings [COMPLETED]
- **Description:** Add profile and preference fields to `User` model: `headline`, `location`, `timezone`, `phone`, `website`, `linkedinUrl`, `bio`, `defaultCurrency`, `defaultWorkSetup`, `defaultResumeId`, `emailNotifications`, `interviewReminders`, `followUpAlerts`, `weeklyDigest`, `themePreference`. Run migration and generate Prisma Client.
- **Verify:** `pnpm --filter @tracker/database exec prisma migrate dev --name add_settings`

### Task 12.2: Shared Types & Validation Schemas [COMPLETED]
- **Description:** Export `UserSettingsDTO`, `UpdateProfileInput`, `UpdatePreferencesInput`, `ChangePasswordInput`, `UserDataExportDTO` from `@tracker/types` and validation schemas from `@tracker/validation`.
- **Verify:** `pnpm --filter @tracker/types build; pnpm --filter @tracker/validation build`

### Task 12.3: Backend Settings Module & Automated Tests [COMPLETED]
- **Description:** Implement `settingsService`, `settingsController`, and `settingsRouter` with Supertest integration tests in `apps/api/tests/settings.test.ts`.
- **Verify:** `pnpm --filter @tracker/api test tests/settings.test.ts` (9 tests passing)

### Task 12.4: Frontend UI Components, Settings Page & Router Integration [COMPLETED]
- **Description:** Implement `SettingsPage`, `SettingsNav`, `ProfileSection`, `PreferencesSection`, `SecuritySection`, `DataSection`, register `/settings` in `AppRouter`, and link profile update to `AuthContext`.
- **Verify:** `pnpm --filter @tracker/web test && pnpm --filter @tracker/web build`

### Task 12.5: Full Verification & Polish [COMPLETED]
- **Description:** Full test suite passes across workspace with 0 errors. Clean build.
- **Verify:** `pnpm test && pnpm build` (111 tests passing, 0 build errors)

#### Checkpoint: Phase 12 Account Settings & Preferences Complete [PASSED]
- [x] Dedicated `/settings` route live and integrated with AppLayout navigation
- [x] Profile management (name, headline, location, timezone, phone, links, bio)
- [x] Application defaults (currency, work setup, default resume version)
- [x] Notification preferences (follow-up alerts, interview reminders, weekly digest)
- [x] Security credentials (current password verification with bcrypt, new password hash)
- [x] 1-click JSON data export and account footprint statistics
- [x] Marker design system compliance across paper light and night pine dark themes
- [x] 111 total workspace automated tests passing (100% green)
- [x] Clean production build across monorepo packages with zero errors
