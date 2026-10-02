# Implementation Plan: Job Application Tracker (MVP)

## Overview
Build a personal Applicant Tracking System (ATS) as a full-stack TypeScript modular monolith (`apps/web` React + Vite, `apps/api` Express + Node.js, `packages/database` Prisma + PostgreSQL, `packages/validation` Zod, `packages/types`). The UI implements the **Marker** design system and exactly reproduces the layout and aesthetics of `app/Dashboard sample_ Job Application Tracker.html`.

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

### Phase 1: Foundation (`foundation`)
- [ ] Task 1.1: Monorepo Workspace & Shared Tooling Setup
- [ ] Task 1.2: Database Package with Prisma Schema & Seed Script
- [ ] Task 1.3: Shared Types & Validation Packages
- [ ] Task 1.4: Backend Express API Bootstrap & Health Endpoint
- [ ] Task 1.5: Frontend Vite + React + Marker Design System Bootstrap

#### Checkpoint: Foundation
- [ ] Monorepo builds cleanly (`pnpm build`)
- [ ] PostgreSQL container runs via Docker Compose
- [ ] Prisma migrations and seed script complete
- [ ] Express API responds to `/api/v1/health`
- [ ] Vite frontend renders Marker design system tokens & shell

---

### Phase 2: Authentication & User Session (`auth`)
- [ ] Task 2.1: Backend Auth Module (Register, Login, Logout, /me, Middleware)
- [ ] Task 2.2: Frontend Auth State, API Client & Login/Register Pages

#### Checkpoint: Authentication
- [ ] User can register, log in, persist session on reload, and log out
- [ ] Protected endpoints reject unauthenticated requests with 401

---

### Phase 3: Core Domain — Companies, Jobs & Applications (`companies-jobs`, `applications`)
- [ ] Task 3.1: Backend Companies & Jobs Services & Endpoints
- [ ] Task 3.2: Backend Applications CRUD & Filter Endpoints
- [ ] Task 3.3: Frontend Application Components & List View

---

### Phase 4: Lifecycle & Actionability — Timeline & Follow-ups (`timeline`, `follow-ups`)
- [ ] Task 4.1: Status Transitions & Activity Timeline
- [ ] Task 4.2: Follow-up Tasks & Reminders

#### Checkpoint: Core Applications & Actionability
- [ ] Application creation automatically creates Company, Job, and TimelineEvent
- [ ] Moving status records chronological timeline event
- [ ] Follow-ups can be created and completed

---

### Phase 5: Dashboard & Visual Experience (`dashboard-analytics`, `kanban-pipeline`)
- [ ] Task 5.1: Backend Dashboard Analytics Aggregator Endpoint
- [ ] Task 5.2: Frontend Dashboard Page (1:1 with `Dashboard sample_ Job Application Tracker.html`)
- [ ] Task 5.3: Kanban Status Pipeline Board with Optimistic Mutations

---

### Phase 6: Polish, Accessibility & Verification
- [ ] Task 6.1: Theme Audit (Paper & Night Pine) and Mobile Responsiveness (360px)
- [ ] Task 6.2: Automated Integration & End-to-End Test Suite Verification

#### Checkpoint: Production Readiness
- [ ] All automated tests pass with zero failures
- [ ] 100% of Definition of Done criteria met
