# Spec: Multi-Stage Interview Management (`interviews`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Multi-Stage Interview Management  
> **Module ID:** `interviews`  
> **Design System:** **Marker** (`app/DESIGN.md`, `app/index.css`, `app/stage-ring.tsx`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `app/job-application-tracker-brd-prd.md` (Sections 7.11 & 7.12)  
> 2. `app/DESIGN.md` (Marker design rules, typography, and tab conventions)  
> 3. `CAPABILITY_MAP.md` (Module dependencies: `applications`, `timeline`)  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
When active job seekers reach interview stages, applications often involve multiple rounds (recruiter screen, technical deep dive, system design, hiring manager, final presentation). Without a dedicated interview tracker, users lose track of interview dates, meeting links (Zoom/Google Meet/Teams), interviewer names, preparation notes, and interview outcomes. The MVP dashboard previously displayed static/seeded upcoming interviews instead of live user interviews.

### 1.2 User Stories
- **Schedule Interview:** As a job seeker, I want to record an upcoming interview for an application with its date, time, duration, round type, interviewer info, and meeting URL so I never miss an interview.
- **Track Preparation & Notes:** As a job seeker, I want to save preparation notes, questions to ask, and technical topics to review for each interview round.
- **Update Status & Outcomes:** As a job seeker, I want to mark an interview as completed, passed, or cancelled, and have that milestone automatically logged to the application's activity timeline.
- **Interviews Hub (`/interviews`):** As a job seeker, I want a dedicated page grouping interviews by upcoming vs. past, with one-click access to meeting links.
- **Application Context:** As a job seeker, I want to view all interview rounds for a specific opportunity directly from its application details page (`/applications/:id`).
- **Dynamic Dashboard Feed:** As a job seeker, I want my next upcoming interviews automatically surfaced on the dashboard's "Upcoming interviews" card.

---

## 2. Tech Stack & Commands

| Layer | Technology | Purpose |
|---|---|---|
| Monorepo | `pnpm` workspaces | Multi-package linking (`apps/web`, `apps/api`, `packages/database`, `packages/validation`, `packages/types`) |
| Database | PostgreSQL 16 + Prisma ORM | Relational persistence, migrations, and tenant isolation |
| Backend | Express + TypeScript + Zod | REST API endpoints, validation middleware, and auth guards |
| Frontend | React + Vite + TanStack Query | Marker UI, client routing, server state & caching |
| Styling | Tailwind CSS v4 + Vanilla CSS tokens | Hairlines, Bricolage Grotesque, Instrument Sans, StageRing |

### Executable Commands
```bash
# Build all packages
pnpm build

# Run unit and integration test suite
pnpm test

# Run backend API tests only
pnpm --filter @tracker/api test

# Run frontend tests only
pnpm --filter @tracker/web test

# Database migration for interview model
pnpm --filter @tracker/database prisma migrate dev --name add_interviews

# Run dev environment
pnpm dev
```

---

## 3. Project Structure & File Locations

```text
packages/
├── database/
│   └── prisma/
│       └── schema.prisma                      # Interview model & relations to User + Application
├── types/
│   └── src/
│       ├── entities.ts                        # Interview, InterviewType, InterviewStatus, InterviewResult
│       └── api.ts                             # Api responses
└── validation/
    └── src/
        └── interview.schema.ts                # Zod schemas for create & update interview

apps/api/
└── src/
    └── modules/
        ├── interviews/
        │   ├── interview.repository.ts        # Prisma queries strictly scoped by userId
        │   ├── interview.service.ts           # Business logic & timeline event creation
        │   ├── interview.controller.ts        # HTTP handlers
        │   └── interview.routes.ts            # Route definitions mounted at /api/v1/interviews
        └── analytics/
            └── analytics.service.ts           # Dynamic upcoming interviews query for dashboard

apps/web/
└── src/
    ├── app/
    │   └── router.tsx                         # Register /interviews route
    ├── features/
    │   ├── interviews/
    │   │   ├── api/
    │   │   │   └── interview-api.ts           # TanStack Query hooks & fetch calls
    │   │   ├── components/
    │   │   │   ├── interview-card.tsx         # Marker card layout for scheduled interviews
    │   │   │   ├── schedule-interview-modal.tsx # Create/edit interview modal dialog
    │   │   │   └── prep-notes-drawer.tsx      # Slide-out / modal for interview prep
    │   │   └── pages/
    │   │       └── interviews-page.tsx        # Main /interviews hub (Upcoming & Past tabs)
    │   ├── applications/
    │   │   ├── components/
    │   │   │   └── application-interviews-tab.tsx # Tab on ApplicationDetailPage
    │   │   └── pages/
    │   │       └── application-detail-page.tsx # Integrate interviews tab
    │   └── dashboard/
    │       └── components/
    │           └── upcoming-interviews.tsx    # Connect to dynamic upcoming interviews query
```

---

## 4. Data Models & API Contracts

### 4.1 Prisma Schema Additions
```prisma
enum InterviewType {
  HR
  RECRUITER
  TECHNICAL
  CODING_ASSESSMENT
  SYSTEM_DESIGN
  HIRING_MANAGER
  FINAL
  CLIENT
  OTHER
}

enum InterviewStatus {
  SCHEDULED
  COMPLETED
  RESCHEDULED
  CANCELLED
  NO_SHOW
}

enum InterviewResult {
  PENDING
  PASSED
  FAILED
  DID_NOT_HEAR_BACK
}

model Interview {
  id              String          @id @default(cuid())
  userId          String
  applicationId   String
  round           Int             @default(1)
  type            InterviewType   @default(TECHNICAL)
  title           String?
  scheduledAt     DateTime
  durationMinutes Int             @default(45)
  timezone        String?         @default("UTC")
  interviewerName String?
  interviewerRole String?
  meetingUrl      String?
  location        String?
  status          InterviewStatus @default(SCHEDULED)
  result          InterviewResult @default(PENDING)
  notes           String?         @db.Text
  prepNotes       String?         @db.Text
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([userId, scheduledAt])
  @@index([userId, status])
  @@index([applicationId])
  @@map("interviews")
}
```

### 4.2 REST API Contracts
All endpoints require authentication (`authenticate` middleware) and operate under `/api/v1`:

1. `GET /api/v1/interviews`
   - Query: `?upcoming=true|false&status=SCHEDULED&applicationId=cuid`
   - Returns: `ApiResponse<InterviewWithDetails[]>` (includes application, company, and job title)
2. `POST /api/v1/interviews`
   - Body: `CreateInterviewInput`
   - Action: Inserts interview, creates `TimelineEvent` with `occurredAt = scheduledAt` or `now()`.
   - Returns: `ApiResponse<Interview>` (201 Created)
3. `GET /api/v1/interviews/:id`
   - Returns: `ApiResponse<InterviewWithDetails>`
4. `PATCH /api/v1/interviews/:id`
   - Body: `UpdateInterviewInput`
   - Action: Updates interview details, updates timeline event if scheduled time changes.
   - Returns: `ApiResponse<Interview>`
5. `PATCH /api/v1/interviews/:id/status`
   - Body: `{ status: InterviewStatus, result?: InterviewResult }`
   - Action: Updates status. If marked `COMPLETED`, logs timeline event "Interview completed: [Type]".
   - Returns: `ApiResponse<Interview>`
6. `DELETE /api/v1/interviews/:id`
   - Action: Removes interview record.
   - Returns: `ApiResponse<{ message: string }>`
7. `GET /api/v1/applications/:id/interviews`
   - Returns: `ApiResponse<Interview[]>` ordered by `scheduledAt ASC` or `round ASC`.

---

## 5. Code Style & Conventions

- **Strict Multi-Tenant Scoping:** Every Prisma query must include `where: { userId: req.user.id }` or check that the target `application.userId === req.user.id`.
- **Marker Design Aesthetics:**
  - Font pairing: Bricolage Grotesque for page headers; Instrument Sans for UI and metadata.
  - Surface separation: Hairline borders (`border border-border`), clean subtle tone contrast, no nested heavy shadow cards.
  - Upcoming interview badge: If interview is scheduled for today, highlight with subtle lime marker indicator (`--marker: #D6F04F`).
  - Meeting links: External link glyph, sanitize URLs to prevent `javascript:` XSS.
- **Fail-Fast Error Handling:** Catch domain and database errors with standard `ApiErrorResponse` envelope.

---

## 6. Testing Strategy

1. **Unit & Validation Tests:**
   - Zod schemas in `packages/validation/src/interview.schema.ts` tested for invalid dates, URLs, and out-of-range rounds.
2. **Backend Integration Tests:**
   - Vitest suite in `apps/api/tests/interviews.test.ts`:
     - Test interview creation with automatic `TimelineEvent` insertion.
     - Test multi-user isolation (User B cannot see or mutate User A's interviews).
     - Test status transition (Scheduled -> Completed) and result tracking.
     - Test `/api/v1/analytics/dashboard` incorporates live upcoming interviews.
3. **Frontend Verification:**
   - Component rendering test for `InterviewCard` and `application-interviews-tab`.
   - Build verification with `pnpm build` across all workspace projects.

---

## 7. Boundaries

- **Always:**
  - Enforce `userId` isolation on every database query.
  - Return ISO 8601 UTC strings from API and format in user's browser local time.
  - Automatically append timeline events when interviews are scheduled or completed.
- **Ask First:**
  - Dropping any database column or altering existing foreign key constraints.
  - Introducing any third-party external calendar syncing SDKs (Google Calendar/Outlook deferred to Phase 4).
- **Never:**
  - Never allow an unauthenticated user to access or mutate interviews.
  - Never use generic system fonts or un-themed pill badges.
  - Never write manual mock data when live API data can be retrieved.

---

## 8. Success Criteria

- [ ] Prisma migration `add_interviews` applies cleanly with `Interview` model and relations.
- [ ] Zod validation schemas in `packages/validation` enforce valid dates, rounds, and types.
- [ ] Express endpoints (`/api/v1/interviews`) pass all integration tests with multi-user isolation.
- [ ] Scheduling an interview creates a chronological `TimelineEvent` on the target application.
- [ ] `/interviews` route renders Marker-styled Upcoming and Past views with meeting links and quick complete action.
- [ ] Application detail page (`/applications/:id`) features an active "Interviews" section/tab with add/view functionality.
- [ ] Dashboard "Upcoming interviews" card dynamically renders real upcoming interviews from database.
- [ ] Full workspace build (`pnpm build`) and tests (`pnpm test`) pass with 0 errors.
