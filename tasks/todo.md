# Task List: Job Application Tracker (MVP)

## Phase 1: Foundation (`foundation`)

- [x] **Task 1.1: Monorepo Workspace & Shared Tooling Setup**
  - **Acceptance:** Root `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, and `docker-compose.yml` (PostgreSQL 16) are configured. Workspace commands run without errors.
  - **Verify:** `pnpm -v && docker compose config`
  - **Files:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `docker-compose.yml`, `.gitignore`

- [x] **Task 1.2: Database Package with Prisma Schema & Seed Script**
  - **Acceptance:** `packages/database` configured with Prisma schema (`User`, `Company`, `Job`, `Application`, `TimelineEvent`, `FollowUp`), singleton client, migrations, and seed script creating test user (`mika@example.com` / `password123`) and initial sample applications matching dashboard mockup.
  - **Verify:** `pnpm --filter @tracker/database prisma migrate dev && pnpm --filter @tracker/database prisma db seed`
  - **Files:** `packages/database/package.json`, `packages/database/prisma/schema.prisma`, `packages/database/src/client.ts`, `packages/database/prisma/seed.ts`

- [x] **Task 1.3: Shared Types & Validation Packages**
  - **Acceptance:** `packages/types` defines standard API envelopes (`ApiResponse<T>`, `ApiListResponse<T>`, `ApiErrorResponse`) and domain types. `packages/validation` defines Zod schemas for auth, application creation, company, and follow-up.
  - **Verify:** `pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`
  - **Files:** `packages/types/package.json`, `packages/types/src/index.ts`, `packages/validation/package.json`, `packages/validation/src/index.ts`

- [x] **Task 1.4: Backend Express API Bootstrap & Health Endpoint**
  - **Acceptance:** `apps/api` configured with Express, Zod env validation, error handler, Pino logger, CORS, cookie-parser, and `GET /api/v1/health` endpoint with passing test.
  - **Verify:** `pnpm --filter @tracker/api test`
  - **Files:** `apps/api/package.json`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/src/config/env.ts`, `apps/api/src/middleware/error-handler.ts`

- [x] **Task 1.5: Frontend Vite + React + Marker Design System Bootstrap**
  - **Acceptance:** `apps/web` configured with Vite, React, Tailwind CSS v4, Marker CSS tokens (`index.css`), font imports (`Bricolage Grotesque`, `Instrument Sans`), `StageRing` component, and router shell.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/index.css`, `apps/web/src/lib/cn.ts`, `apps/web/src/features/applications/components/application-status-badge.tsx`, `apps/web/src/app/providers.tsx`

---

### Checkpoint: Foundation Complete
- [x] Monorepo workspace links correctly
- [x] PostgreSQL runs in Docker container
- [x] Prisma migrations and seed script complete
- [x] Express responds with 200 to health check
- [x] Frontend builds cleanly with Marker tokens

---

## Phase 2: Authentication & User Session (`auth`)

- [x] **Task 2.1: Backend Auth Module (Register, Login, Logout, /me, Middleware)**
  - **Acceptance:** Registration hashes password with bcrypt. Login issues signed JWT/session inside `httpOnly` secure cookie. `GET /api/v1/auth/me` returns current user. `authenticate` middleware verifies session and sets `req.user`.
  - **Verify:** `pnpm --filter @tracker/api test`
  - **Files:** `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/middleware/authenticate.ts`, `apps/api/tests/auth.test.ts`

- [x] **Task 2.2: Frontend Auth State, API Client & Login/Register Pages**
  - **Acceptance:** `api-client.ts` configured with `credentials: 'include'`. `AuthContext` provides login, register, logout, and user state. `LoginPage` and `RegisterPage` render in Marker design style with validation.
  - **Verify:** `pnpm --filter @tracker/web test`
  - **Files:** `apps/web/src/lib/api-client.ts`, `apps/web/src/features/auth/context/auth-context.tsx`, `apps/web/src/features/auth/pages/login-page.tsx`, `apps/web/src/features/auth/pages/register-page.tsx`, `apps/web/src/routes/protected-route.tsx`

---

### Checkpoint: Authentication Complete
- [x] User can register and log in
- [x] Session persists across page reload via httpOnly cookie
- [x] Protected API and frontend routes reject unauthenticated access

---

## Phase 3: Core Domain — Companies, Jobs & Applications (`companies-jobs`, `applications`)

- [x] **Task 3.1: Backend Companies & Jobs Services & Endpoints**
  - **Acceptance:** Auto-find-or-create company per user. Job persistence preserving title, description, platform, salary, and workSetup. Strict `userId` scoping.
  - **Verify:** `pnpm --filter @tracker/api test`
  - **Files:** `apps/api/src/modules/companies/company.repository.ts`, `apps/api/src/modules/jobs/job.repository.ts`

- [x] **Task 3.2: Backend Applications CRUD & Filter Endpoints**
  - **Acceptance:** `POST /api/v1/applications` creates Company + Job + Application in one transaction. `GET /api/v1/applications` filters by status, search, and platform with pagination. `GET /api/v1/applications/:id` returns details. `PATCH` updates fields, `DELETE` soft-archives.
  - **Verify:** `pnpm --filter @tracker/api test`
  - **Files:** `apps/api/src/modules/applications/application.routes.ts`, `apps/api/src/modules/applications/application.controller.ts`, `apps/api/src/modules/applications/application.service.ts`, `apps/api/src/modules/applications/application.repository.ts`

- [x] **Task 3.3: Frontend Application Components & List View**
  - **Acceptance:** `ApplicationCard` rendered with Marker layout (StageRing + status top-left, 3-bar priority glyph top-right, company + role, whitespace-separated facts row, bottom next action with `.marker`). `ApplicationsPage` displays filterable, searchable grid/list with pagination.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/features/applications/components/application-card.tsx`, `apps/web/src/features/applications/components/application-filters.tsx`, `apps/web/src/features/applications/pages/applications-page.tsx`, `apps/web/src/features/applications/pages/create-application-page.tsx`

---

## Phase 4: Lifecycle & Actionability — Timeline & Follow-ups (`timeline`, `follow-ups`)

- [x] **Task 4.1: Status Transitions & Activity Timeline**
  - **Acceptance:** `PATCH /api/v1/applications/:id/status` transitions application stage and writes `STATUS_CHANGED` TimelineEvent. `GET /api/v1/applications/:id/timeline` returns chronological history. Frontend timeline renders StageRing nodes for status moves and dots for notes.
  - **Verify:** `pnpm --filter @tracker/api test && pnpm --filter @tracker/web build`
  - **Files:** `apps/api/src/modules/timeline/timeline.service.ts`, `apps/api/src/modules/timeline/timeline.routes.ts`, `apps/web/src/features/applications/components/application-timeline.tsx`

- [x] **Task 4.2: Follow-up Tasks & Reminders**
  - **Acceptance:** `POST /api/v1/follow-ups` creates follow-up. `GET /api/v1/follow-ups` supports `?due=today|overdue|all`. `PATCH /api/v1/follow-ups/:id/complete` marks complete. Frontend follow-up chips and quick-complete checkbox render correctly.
  - **Verify:** `pnpm --filter @tracker/api test && pnpm --filter @tracker/web build`
  - **Files:** `apps/api/src/modules/follow-ups/follow-up.routes.ts`, `apps/api/src/modules/follow-ups/follow-up.controller.ts`, `apps/api/src/modules/follow-ups/follow-up.service.ts`, `apps/web/src/features/follow-ups/components/follow-up-item.tsx`

---

### Checkpoint: Core Applications & Actionability Complete
- [x] Full application CRUD works end-to-end
- [x] Timeline tracks application history
- [x] Follow-ups can be scheduled and completed

---

## Phase 5: Dashboard & Visual Experience (`dashboard-analytics`, `kanban-pipeline`)

- [x] **Task 5.1: Backend Dashboard Analytics Aggregator Endpoint**
  - **Acceptance:** `GET /api/v1/analytics/dashboard` returns `{ summary, weeklyVelocity, pipeline }` matching section 8.1.1 of spec.
  - **Verify:** `pnpm --filter @tracker/api test`
  - **Files:** `apps/api/src/modules/analytics/analytics.routes.ts`, `apps/api/src/modules/analytics/analytics.controller.ts`, `apps/api/src/modules/analytics/analytics.service.ts`

- [x] **Task 5.2: Frontend Dashboard Page (1:1 with Reference Mockup)**
  - **Acceptance:** App shell (232px sidebar, tablet rail, mobile tab bar with circular `+` button, `/` key search shortcut). Dashboard renders exact sections from `Dashboard sample_ Job Application Tracker.html`:
    1. Header with date, greeting, search, theme toggle, Add button.
    2. "Needs you today" widget with interactive circular checkboxes, `.marker` text, and empty state.
    3. Stats strip (4 columns, border-block, no icons).
    4. Two-column grid (Upcoming interviews + 8-week velocity bar chart with current week in lime).
    5. Pipeline strip (9 stage rings + counts, plus closed outcomes).
    6. Recent applications table with StageRing status badges and row hover.
  - **Verify:** Visual and interactive verification against `app/Dashboard sample_ Job Application Tracker.html`.
  - **Files:** `apps/web/src/layouts/app-layout.tsx`, `apps/web/src/features/dashboard/pages/dashboard-page.tsx`, `apps/web/src/features/dashboard/components/`

- [x] **Task 5.3: Kanban Status Pipeline Board with Optimistic Mutations**
  - **Acceptance:** Kanban board with 9 active stage columns, StageRing in headers, drag-and-drop support, accessible keyboard move menu, and optimistic TanStack Query mutations.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/features/applications/components/application-kanban.tsx`, `apps/web/src/features/applications/hooks/use-application-mutations.ts`

---

## Phase 6: Polish, Accessibility & Verification

- [x] **Task 6.1: Theme Audit & Mobile Responsiveness**
  - **Acceptance:** Verify all screens in light ("paper") and dark ("night pine") modes. Verify mobile layout at 360px width with bottom tab bar safe areas.
  - **Verify:** Browser inspection across desktop, tablet, and mobile viewports.
  - **Files:** `apps/web/src/index.css`, `apps/web/src/layouts/app-layout.tsx`

- [x] **Task 6.2: Automated Integration & End-to-End Test Suite Verification**
  - **Acceptance:** Full test suite passes across all workspace packages with 80%+ coverage on services and validation.
  - **Verify:** `pnpm test && pnpm build`
  - **Files:** Workspace test files

---

## Phase 7: Multi-Stage Interview Management (`interviews`)

- [x] **Task 7.1: Prisma Schema & Migration + Shared Types & Validation**
  - **Acceptance:** `Interview` model, `InterviewType`, `InterviewStatus`, and `InterviewResult` enums defined in Prisma. Migration generated and applied. Types and Zod schemas exported from `@tracker/types` and `@tracker/validation`.
  - **Verify:** `pnpm --filter @tracker/database prisma migrate dev && pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`
  - **Files:** `packages/database/prisma/schema.prisma`, `packages/types/src/entities.ts`, `packages/validation/src/interview.schema.ts`, `packages/validation/src/index.ts`

- [x] **Task 7.2: Backend API Endpoints, Service & Timeline Integration**
  - **Acceptance:** Full interview CRUD endpoints (`/api/v1/interviews` and `/api/v1/applications/:id/interviews`) with multi-tenant `userId` isolation. Timeline events recorded when interviews are scheduled or completed. Dashboard analytics service returning real upcoming interviews. Comprehensive integration tests in Vitest.
  - **Verify:** `pnpm --filter @tracker/api test`
  - **Files:** `apps/api/src/modules/interviews/interview.repository.ts`, `apps/api/src/modules/interviews/interview.service.ts`, `apps/api/src/modules/interviews/interview.controller.ts`, `apps/api/src/modules/interviews/interview.routes.ts`, `apps/api/src/modules/analytics/analytics.service.ts`, `apps/api/src/app.ts`, `apps/api/tests/interviews.test.ts`

- [x] **Task 7.3: Frontend Interviews Hub (`/interviews`)**
  - **Acceptance:** Dedicated `/interviews` page matching Marker design system. Filters for Upcoming vs. Past, StageRing stage badges, one-click meeting join links, accessible modal to schedule or edit interviews, and quick-action completion.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/features/interviews/api/interview-api.ts`, `apps/web/src/features/interviews/components/interview-card.tsx`, `apps/web/src/features/interviews/components/schedule-interview-modal.tsx`, `apps/web/src/features/interviews/pages/interviews-page.tsx`, `apps/web/src/app/router.tsx`

- [x] **Task 7.4: Application Detail Interviews Tab & Dynamic Dashboard Feed**
  - **Acceptance:** Application details page has an active "Interviews" tab allowing users to see and schedule interviews directly for that application. Dashboard "Upcoming interviews" card connects to real API data.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/features/applications/components/application-interviews-tab.tsx`, `apps/web/src/features/applications/pages/application-detail-page.tsx`, `apps/web/src/features/dashboard/components/upcoming-interviews.tsx`

- [x] **Task 7.5: Full Verification & Polish**
  - **Acceptance:** Full test suite passes across all workspace packages with 0 errors. Build succeeds cleanly. UI looks sharp in light ("paper") and dark ("night pine") modes.
  - **Verify:** `pnpm test && pnpm build`
  - **Files:** Workspace test and UI files

---

### Checkpoint: Multi-Stage Interview Management Complete
- [x] Database schema migrated & seeded
- [x] Backend API tests pass with 100% tenant isolation
- [x] /interviews page functional and accessible
- [x] Application detail interviews tab integrated
- [x] Dashboard displays live upcoming interviews

---

## Phase 8: Saved Jobs & Opportunity Wishlist (`saved-jobs`)

- [x] **Task 8.1: Saved Jobs Components (`SavedJobCard`, `QuickSaveModal`)**
  - **Acceptance:** `SavedJobCard` renders saved job opportunity with company, role, platform, work setup, salary, date saved, 1-click "Mark as applied" button, and external link. `QuickSaveModal` provides a fast form to save positions with `status: 'SAVED'`.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/features/saved-jobs/components/saved-job-card.tsx`, `apps/web/src/features/saved-jobs/components/quick-save-modal.tsx`

- [x] **Task 8.2: Saved Jobs Hub Page & Router Registration (`/saved-jobs`)**
  - **Acceptance:** `/saved-jobs` route renders `SavedJobsPage` with search, platform filter, stats, empty state, and 1-click conversion to applied status.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/features/saved-jobs/pages/saved-jobs-page.tsx`, `apps/web/src/app/router.tsx`

- [x] **Task 8.3: Live Dynamic Count Badge in App Shell Navigation**
  - **Acceptance:** App layout navigation queries live pipeline counts and displays active saved jobs count on the `Saved jobs` item.
  - **Verify:** `pnpm --filter @tracker/web build`
  - **Files:** `apps/web/src/layouts/app-layout.tsx`

- [x] **Task 8.4: Full Verification & Polish**
  - **Acceptance:** Full test suite and build pass with 0 errors.
  - **Verify:** `pnpm test && pnpm build`
  - **Files:** Workspace test and UI files

---

### Checkpoint: Saved Jobs Complete
- [x] /saved-jobs page live and accessible from sidebar
- [x] Users can bookmark jobs and convert to applied with one click
- [x] Sidebar displays live count of saved jobs
- [x] Full build and test suite passing cleanly


