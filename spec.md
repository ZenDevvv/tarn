# Spec: Job Application Tracker (MVP)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** 1 — MVP Core Application Tracking  
> **Design System:** **Marker** (`app/DESIGN.md`, `app/index.css`, `app/stage-ring.tsx`)  
> **Status:** Draft / Updated with Marker Design System  
> **Source-of-Truth Hierarchy:**  
> 1. `app/job-application-tracker-brd-prd.md` (Product functionality)  
> 2. `app/job-application-tracker-project-architecture.md` (Architecture, monorepo, tooling)  
> 3. `app/DESIGN.md` (Visual design rules, copy, component conventions)  
> 4. `apps/web/src/index.css` (Token values & CSS bridge)  

---

## 1. Assumptions & Constraints

### 1.1 Assumptions Surfaced
1. **Target Deliverable:** We are building Phase 1 (MVP) as defined in the BRD/PRD. Advanced integrations (AI JD parsing, Gmail/Calendar sync, external S3/R2 file storage, and n8n) are deferred to subsequent phases.
2. **Monorepo Architecture:** A `pnpm` workspace containing `apps/web` (React/Vite), `apps/api` (Express/Node.js), `packages/database` (Prisma/PostgreSQL), `packages/validation` (Zod), and `packages/types`.
3. **Data Isolation:** The system is multi-user from day one. Every protected database record is strictly scoped by `userId`.
4. **Authentication:** Secure cookie-based authentication (`httpOnly`, `SameSite=lax`, secure in production) using signed JWT or session tokens. Passwords hashed using `bcrypt`. No tokens stored in `localStorage`.
5. **Design System (Marker):** Strict adherence to `app/DESIGN.md`:
   - Dual-font typography: Bricolage Grotesque (`@fontsource-variable/bricolage-grotesque`) for display/headings and Instrument Sans (`@fontsource-variable/instrument-sans`) for body/UI text.
   - Status as shape via the SVG **Stage Ring** (no colored pills or rainbow badges).
   - "Next action first" using the lime marker highlight swipe (`#D6F04F`) strictly for tasks due today or overdue.
   - Surfaces separated by tone and hairline borders (`border-border`), with elevation shadows reserved strictly for Level 2 floating layers (`--elevation-float`).
   - Sentence case copy, no ALL CAPS, no middle-dot (`·`) metadata chaining, no enterprise HR chrome.

---

## 2. Objective & Scope

### 2.1 Problem Statement
Job seekers apply across multiple platforms (LinkedIn, Indeed, JobStreet, referrals) and struggle to track statuses, remember original job descriptions once postings expire, track follow-ups, and visualize their job-search funnel without maintaining tedious spreadsheets.

### 2.2 Objective
Deliver a fast, responsive, personal ATS web application enabling users to:
- Securely register and log in.
- Create, view, edit, search, filter, and archive job applications.
- Preserve full original job descriptions, platform sources, and salary ranges.
- Manage status transitions across a 12-state lifecycle with Kanban and list views.
- Automatically record a chronological application activity timeline.
- Schedule, complete, and track follow-up tasks with overdue reminders.
- Monitor active funnel metrics and job search velocity on a consolidated dashboard.

---

## 3. Technology Stack & Key Dependencies

| Layer | Technology | Package / Version | Purpose |
|---|---|---|---|
| Monorepo | `pnpm` workspaces | v9+ | Monorepo package management & workspace linking |
| Frontend Framework | React + TypeScript | React 18 / 19, TS 5+ | Single Page Application UI |
| Frontend Bundler | Vite | v5+ / v6+ | Fast HMR dev server & production client bundler |
| Styling & Tokens | Tailwind CSS v4 + Vanilla CSS | `@tailwindcss/vite`, `index.css` | Design system tokens, utilities, and CSS variables |
| Typography | Fontsource | `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/instrument-sans` | Brand display and UI typography |
| Icons | Lucide React | `lucide-react` | UI icons (16px in controls/nav, 20px in mobile tab bar, stroke 1.5) |
| UI Primitives | Radix UI / custom | Primitives conforming to Marker | Accessible dialogs, popovers, dropdowns, tabs |
| Client Routing | React Router | v6+ | Client-side routing with layout wrappers |
| Server State | TanStack Query | v5+ | Remote data caching, invalidations, optimistic Kanban mutations |
| Forms & Validation | React Hook Form + Zod | Latest | Strongly typed form state & input validation |
| Charts | Recharts | Latest | Dashboard analytics with Marker token styling |
| Backend Runtime | Node.js + TypeScript | Node 20 LTS, TS 5+ | REST API runtime |
| Backend Framework | Express | v4 / v5 | HTTP routing and middleware pipeline |
| ORM & Database | Prisma + PostgreSQL | Prisma v5+, Postgres 16 | Relational data persistence & migrations |
| Security | `bcrypt` + `jsonwebtoken` / `cookie-parser` | Latest | Password hashing & httpOnly session cookies |
| Logging | `pino` | Latest | Structured JSON logging with request tracing |
| Testing | Vitest + RTL + Supertest | Latest | Unit, component, and API integration testing |

---

## 4. Commands

Full executable CLI commands for development and CI:

```bash
# Repository Setup
pnpm install

# Local PostgreSQL Infrastructure
docker compose up -d

# Database Operations
pnpm --filter @tracker/database prisma migrate dev
pnpm --filter @tracker/database prisma db seed
pnpm --filter @tracker/database prisma studio

# Development
pnpm dev                  # Starts both apps/web (port 5173) and apps/api (port 4000)
pnpm --filter @tracker/web dev
pnpm --filter @tracker/api dev

# Testing
pnpm test                 # Run all unit and integration tests across workspace
pnpm test:coverage        # Run tests with coverage threshold verification
pnpm --filter @tracker/api test
pnpm --filter @tracker/web test

# Linting & Formatting
pnpm lint
pnpm format:check

# Production Build
pnpm build
```

---

## 5. Monorepo Project Structure

```text
job-application-tracker/
├── apps/
│   ├── web/                              # Vite + React Frontend
│   │   ├── src/
│   │   │   ├── app/                      # Providers, Router, QueryClient
│   │   │   ├── components/               # Generic UI primitives ONLY
│   │   │   │   └── ui/                   # button.tsx, input.tsx, dialog.tsx, tabs.tsx
│   │   │   ├── features/                 # Domain-driven features
│   │   │   │   ├── auth/                 # Login, Register, AuthContext
│   │   │   │   ├── applications/         # Domain components
│   │   │   │   │   ├── components/       # application-card.tsx, application-status-badge.tsx, application-kanban.tsx, application-timeline.tsx
│   │   │   │   │   ├── hooks/            # use-application.ts, use-applications.ts
│   │   │   │   │   └── pages/            # applications-page.tsx, application-details-page.tsx
│   │   │   │   ├── companies/            # Company cards, history
│   │   │   │   ├── follow-ups/           # Follow-up chips, quick complete, reminders
│   │   │   │   └── dashboard/            # Needs you today, stats strip, pipeline strip
│   │   │   ├── layouts/                  # AppLayout (sidebar/rail/mobile tab bar), AuthLayout
│   │   │   ├── lib/                      # api-client.ts, cn.ts, query-keys.ts
│   │   │   ├── main.tsx
│   │   │   └── index.css                 # Marker design system tokens & utilities
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                              # Express + Node.js REST API
│       ├── src/
│       │   ├── config/                   # env.ts (validated via Zod)
│       │   ├── middleware/               # authenticate.ts, error-handler.ts, validate.ts
│       │   ├── modules/                  # Modular monolith backend
│       │   │   ├── auth/                 # Controller, service, routes
│       │   │   ├── applications/         # Controller, service, repository, routes
│       │   │   ├── companies/            # Controller, service, repository, routes
│       │   │   ├── follow-ups/           # Controller, service, repository, routes
│       │   │   ├── timeline/             # Service, repository
│       │   │   └── analytics/            # Controller, service, routes
│       │   ├── app.ts                    # Express application configuration
│       │   └── server.ts                 # HTTP listener & shutdown hooks
│       ├── tests/                        # Supertest API integration tests
│       └── package.json
│
├── packages/
│   ├── database/                         # Prisma persistence layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── client.ts                 # Singleton Prisma client instance
│   │   └── package.json
│   │
│   ├── validation/                       # Shared Zod validation schemas
│   │   ├── src/
│   │   │   ├── auth.schema.ts
│   │   │   ├── application.schema.ts
│   │   │   ├── company.schema.ts
│   │   │   ├── follow-up.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── types/                            # Shared TypeScript interfaces & DTOs
│       ├── src/
│       │   ├── api.ts                    # Standard API response envelopes
│       │   ├── entities.ts               # Domain entity types
│       │   └── index.ts
│       └── package.json
│
├── docker-compose.yml                    # Local PostgreSQL database
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

---

## 6. Marker Design System Specifications

### 6.1 The Five Pillars
1. **Next action first:** Every active application answers *"what do I do now?"* The lime marker swipe (`--marker: #D6F04F`) highlights actions due today or overdue.
2. **Progress is shape, not color:** Status is conveyed through the **Stage Ring** SVG progression, never through colored pills, status badges, or rainbow tags.
3. **Quiet until it matters:** Surfaces are separated by subtle tones (`bg-background` paper vs `bg-card` raised vs `bg-secondary` sunken) and hairline dividers (`border-border`). Shadows are strictly reserved for Level 2 floating layers (`--elevation-float`).
4. **Numbers big, labels small:** Display face (Bricolage Grotesque) for headings, dialog titles, and metric values. Labels stay small, plain, and sentence case in Instrument Sans.
5. **Personal, not corporate:** Plain second-person copy ("you", "your applications"), no corporate enterprise jargon, no celebratory confetti or gradient washes.

### 6.2 Token Reference & Color Architecture

| Role | Class | Light ("Paper") | Dark ("Night Pine") |
|---|---|---|---|
| Page Canvas | `bg-background` | `#F4F5F2` | `#0E1714` |
| Raised Surface (Cards, Tables, Dialogs) | `bg-card` | `#FFFFFF` | `#15201C` |
| Sunken Wells (Kanban columns, code blocks) | `bg-secondary` / `bg-muted` | `#E9ECE6` | `#1B2A24` |
| Hover Fill (Rows, menu items) | `bg-accent` | `#DDE3D6` | `#22332C` |
| Hairline Borders | `border-border` | `#DADFD6` | `#263630` |
| Form Control Edges (3:1 contrast) | `border-input` | `#7C867F` | `#6C7C72` |
| Primary Ink | `text-foreground` | `#16251F` | `#E8EDE6` |
| Secondary Ink (5.5:1 on paper) | `text-muted-foreground` | `#5A665F` | `#93A197` |
| Brand Primary (Pine) | `bg-primary text-primary-foreground` | `#1F4A3B` | `#C6E0D0` |
| Primary Hover | `hover:bg-primary-hover` | `#173B2F` | `#DDEEE4` |
| The Marker | `bg-marker text-marker-foreground` | `#D6F04F` | `#D6F04F` |
| Destructive / Overdue / Rejected | `text-destructive`, `bg-destructive-tint` | `#B0342D` / `#F6DEDB` | `#E5786F` / `#3A1F1D` |
| Warning | `text-warning`, `bg-warning-tint` | `#8A5300` / `#F3E4C4` | `#E3B25B` / `#3A2E14` |
| Success | `text-success`, `bg-success-tint` | `#1F4A3B` / `#DCE8E1` | `#C6E0D0` / `#1D3329` |

### 6.3 Stage Ring Geometry & Status Mapping

Status is rendered via `ApplicationStatusBadge` (ring + label) or `StageRing` (ring only). Order defines the Kanban column order:

```typescript
export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  SAVED:               { label: "Saved",               kind: "progress",    progress: 0 },
  APPLIED:             { label: "Applied",             kind: "progress",    progress: 1 / 8 },
  APPLICATION_VIEWED:  { label: "Application viewed",  kind: "progress",    progress: 2 / 8 },
  RECRUITER_CONTACTED: { label: "Recruiter contacted", kind: "progress",    progress: 3 / 8 },
  HR_INTERVIEW:        { label: "HR interview",        kind: "progress",    progress: 4 / 8 },
  TECHNICAL_INTERVIEW: { label: "Technical interview", kind: "progress",    progress: 5 / 8 },
  FINAL_INTERVIEW:     { label: "Final interview",     kind: "progress",    progress: 6 / 8 },
  OFFER:               { label: "Offer",               kind: "progress",    progress: 7 / 8 },
  ACCEPTED:            { label: "Accepted",            kind: "done",        progress: 1 },
  REJECTED:            { label: "Rejected",            kind: "rejected",    progress: 0 },
  WITHDRAWN:           { label: "Withdrawn",           kind: "withdrawn",   progress: 0 },
  NO_RESPONSE:         { label: "No response",         kind: "no-response", progress: 0 },
};
```
- Ring sizes: 16px inline, 20px in pipeline strips, 22-24px in status selector lists, 44px for empty states.
- The ring SVG is always `aria-hidden="true"`; the descriptive text label sits beside it.

### 6.4 The Marker Highlight Rule
- Applied via `.marker` utility class.
- **Budget:** At most 2 to 3 markers per screen region.
- **Used exclusively on:**
  - The text of a next action or follow-up due **today** or **overdue**.
  - The "Due today" chip.
  - The "Undo" text in action toasts (`text-marker`).
  - The center dot of the Accepted stage ring.
- **Never used on:** Headings, buttons, navigation, selected rows, or decorative banners.
- When an action is newly set, `.marker-sweep` animates the highlight wipe once over 500ms.

### 6.5 Radius & Elevation Hierarchy

```text
Radius Hierarchy (A child is never rounder than its parent):
  rounded-xs  (4px)  ──▶ Tags, checkboxes
  rounded-md  (8px)  ──▶ Buttons, form inputs, selects, menu items
  rounded-lg  (12px) ──▶ Application cards, dialogs, popovers, toasts
  rounded-xl  (20px) ──▶ Panels, Kanban columns, dashboard shells
  rounded-full       ──▶ Circular status chips, avatars
```

Elevation:
- **Level 0 (Canvas):** `bg-background`
- **Level 1 (Surface):** `bg-card` + 1px `border-border`. **No shadow.**
- **Level 2 (Float):** `bg-card` + 1px border + `shadow-float` (`--elevation-float`). Dialogs, popovers, dropdowns, toasts, and Kanban cards while actively dragging.

### 6.6 Component Conventions
- **Application Card (`application-card.tsx`):**
  1. Top: Stage ring + status label (left), 3-bar priority glyph (right).
  2. Heading: Company in Bricolage Grotesque 16px 600; position below in `text-muted-foreground`.
  3. Facts row: Work setup, salary range (`₱50k–₱70k` with en dash), date applied, platform. Separated with 14px whitespace gaps (**never** middle dots `·`).
  4. Footer: Divider, then next action text with marker if today/overdue.
- **Buttons:** Single primary button per view (`Add application`, pine). Labels describe the concrete outcome ("Save application", "Delete application", "Create anyway"). Never "Submit", "OK", or "Yes".
- **Navigation:**
  - Desktop (1024px+): Left sidebar (232px) with Add application button and navigation items.
  - Tablet (640-1023px): Collapsed 64px icon rail.
  - Mobile (<720px): Bottom tab bar (Home, Applications, centered circular Add button, Interviews, More) respecting `env(safe-area-inset-bottom)`.

### 6.7 Exact Dashboard Specification (Reference: `Dashboard sample_ Job Application Tracker.html`)

The dashboard page (`/dashboard`) must strictly match the DOM structure, visual rhythm, component tokens, and interactions defined in `app/Dashboard sample_ Job Application Tracker.html`:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ App Shell (232px sidebar desktop, 64px icon rail tablet, bottom tab bar mobile)                       │
│                                                                                                        │
│ Page Container (max-width: 1040px, gap: 40px)                                                         │
│                                                                                                        │
│ 1. Header (.head)                                                                                      │
│    ├── Date label (.date: "Thursday, October 1", 13px text-muted-foreground)                          │
│    ├── Greeting (h1: "Good morning, [User Name]", 40px/44px Bricolage Grotesque, tracking -0.025em)   │
│    └── Tools cluster (.tools): Search box (with '/' kbd shortcut hint), theme toggle, "+ Add app"      │
│                                                                                                        │
│ 2. "Needs you today" (.today)                                                                          │
│    ├── Section header: "Needs you today" + item count badge (e.g. "4 items")                           │
│    └── Card container: bg-card, border-border, rounded-[20px], padding 6px 22px                        │
│        └── List items: 3-col grid (20px circular checkbox .cb, action title + .who, right due badge)  │
│            - Action title: highlighted with .marker if due today or overdue                            │
│            - Due text: e.g. "Today", "Oct 3", or .due.late ("Overdue 2 days" in text-destructive)     │
│            - Checkbox: on checked, line-through text, opacity-60, decrements count                     │
│            - Empty state: "Nothing due today. Nice and quiet."                                         │
│                                                                                                        │
│ 3. Stats Strip (.strip)                                                                                │
│    └── One continuous bordered band (border-block: 1px solid var(--line)), 4 equal cells:              │
│        [1] Active applications (v: 40px display face, l: "Active applications", d: delta note)         │
│        [2] Interviews          (v: 40px display face, l: "Interviews", d: delta note)                  │
│        [3] Follow-ups due      (v: 40px display face, l: "Follow-ups due", d: delta note)              │
│        [4] Applied this week   (v: 40px display face, l: "Applied this week", d: delta note)          │
│                                                                                                        │
│ 4. Two-Column Grid (.two, gap: 48px)                                                                   │
│    ├── Column A: Upcoming interviews (.iv)                                                             │
│    │   ├── Date block: day (28px display) + month/day label ("Fri, Oct")                              │
│    │   ├── Role & metadata: e.g. "Technical interview" (bold), time, company, meeting link            │
│    │   └── Prep progress bar: track width 72px, height 4px, "2 of 5 prep items done"                  │
│    └── Column B: Applications per week chart (.week)                                                   │
│        ├── 8-week bar chart (132px height, baseline border-input)                                      │
│        ├── Historical week bars: pine (var(--brand)) with rounded-t-[4px]                              │
│        ├── Current in-progress week bar: lime (var(--marker)) with 1px border outline                  │
│        └── Summary footnote: "You averaged X applications a week. The week of ... is in progress."     │
│                                                                                                        │
│ 5. Pipeline Strip (.pipe)                                                                              │
│    ├── 9-column grid of active stages (Saved ➔ Applied ➔ Viewed ➔ Recruiter ➔ HR ➔ Tech ➔ Final ➔     │
│    │   Offer ➔ Accepted): each with 22px StageRing, 24px count, and stage label                        │
│    └── Outcome strip (.pipeline-closed): Rejected (X ring in brick red), Withdrawn (dashed ring),     │
│        No response (dotted ring)                                                                       │
│                                                                                                        │
│ 6. Recent Applications Table (.tbl)                                                                    │
│    └── Table columns: Company (15px display face) + role, Status (ApplicationStatusBadge with 16px    │
│        StageRing), Next action (with .marker if today/overdue), Platform, Applied date, Priority glyph │
│        - Row hover: bg-sunken / bg-accent                                                              │
│        - Mobile: hides Platform, Applied, and Priority columns (.hide-s)                               │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```


---

## 7. Data Model & Database Schema (Prisma)

### Enums
- **`ApplicationStatus`**: `SAVED`, `APPLIED`, `APPLICATION_VIEWED`, `RECRUITER_CONTACTED`, `HR_INTERVIEW`, `TECHNICAL_INTERVIEW`, `FINAL_INTERVIEW`, `OFFER`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `NO_RESPONSE`
- **`Priority`**: `LOW`, `MEDIUM`, `HIGH`
- **`WorkSetup`**: `REMOTE`, `HYBRID`, `ONSITE`
- **`EmploymentType`**: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `FREELANCE`
- **`FollowUpStatus`**: `PENDING`, `COMPLETED`, `CANCELLED`
- **`TimelineEventType`**: `APPLICATION_CREATED`, `STATUS_CHANGED`, `FOLLOW_UP_CREATED`, `FOLLOW_UP_COMPLETED`, `NOTE_ADDED`, `CUSTOM_EVENT`

### Core Entities

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  name         String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  applications Application[]
  companies    Company[]
  jobs         Job[]
  followUps    FollowUp[]
}

model Company {
  id          String        @id @default(cuid())
  userId      String
  name        String
  website     String?
  industry    String?
  location    String?
  description String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobs         Job[]
  applications Application[]

  @@unique([userId, name])
  @@index([userId])
}

model Job {
  id             String          @id @default(cuid())
  userId         String
  companyId      String
  title          String
  description    String?         @db.Text
  source         String?         // e.g. "LinkedIn", "Indeed", "JobStreet", "Referral"
  sourceUrl      String?
  location       String?
  workSetup      WorkSetup?
  employmentType EmploymentType?
  salaryMin      Int?
  salaryMax      Int?
  currency       String?         @default("USD")
  datePosted     DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  company      Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  applications Application[]

  @@index([userId])
  @@index([companyId])
}

model Application {
  id              String            @id @default(cuid())
  userId          String
  companyId       String
  jobId           String
  status          ApplicationStatus @default(SAVED)
  priority        Priority          @default(MEDIUM)
  appliedAt       DateTime?
  nextAction      String?
  nextActionDueAt DateTime?
  notes           String?           @db.Text
  archivedAt      DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  company        Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  job            Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  timelineEvents TimelineEvent[]
  followUps      FollowUp[]

  @@index([userId])
  @@index([userId, status])
  @@index([userId, archivedAt])
  @@index([userId, nextActionDueAt])
}

model TimelineEvent {
  id            String            @id @default(cuid())
  applicationId String
  type          TimelineEventType
  title         String
  description   String?
  metadata      Json?
  occurredAt    DateTime          @default(now())
  createdAt     DateTime          @default(now())

  application   Application       @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId, occurredAt])
}

model FollowUp {
  id            String         @id @default(cuid())
  userId        String
  applicationId String
  action        String
  dueAt         DateTime
  priority      Priority       @default(MEDIUM)
  status        FollowUpStatus @default(PENDING)
  notes         String?
  completedAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  application Application    @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([userId, status, dueAt])
  @@index([applicationId])
}
```

---

## 8. API Contracts & Envelope

### 8.1 Standard Envelope
- **Success Single:** `{ "data": { ... } }`
- **Success List:** `{ "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 } }`
- **Error:** `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ ... ] } }`

#### 8.1.1 Dashboard Analytics DTO (`GET /api/v1/analytics/dashboard`)
```json
{
  "data": {
    "summary": {
      "activeApplications": 14,
      "activeDeltaNote": "2 more than last week",
      "interviewCount": 3,
      "interviewDeltaNote": "Next one is tomorrow",
      "followUpsDue": 3,
      "followUpsOverdueCount": 1,
      "appliedThisWeek": 6,
      "appliedThisMonth": 24
    },
    "weeklyVelocity": {
      "averagePerWeek": 6,
      "currentWeekLabel": "Sep 28",
      "weeks": [
        { "weekLabel": "Aug 10", "count": 4, "inProgress": false },
        { "weekLabel": "Aug 17", "count": 7, "inProgress": false },
        { "weekLabel": "Aug 24", "count": 5, "inProgress": false },
        { "weekLabel": "Aug 31", "count": 9, "inProgress": false },
        { "weekLabel": "Sep 7", "count": 6, "inProgress": false },
        { "weekLabel": "Sep 14", "count": 8, "inProgress": false },
        { "weekLabel": "Sep 21", "count": 3, "inProgress": false },
        { "weekLabel": "Sep 28", "count": 6, "inProgress": true }
      ]
    },
    "pipeline": {
      "SAVED": 5,
      "APPLIED": 6,
      "APPLICATION_VIEWED": 2,
      "RECRUITER_CONTACTED": 1,
      "HR_INTERVIEW": 2,
      "TECHNICAL_INTERVIEW": 1,
      "FINAL_INTERVIEW": 0,
      "OFFER": 0,
      "ACCEPTED": 0,
      "REJECTED": 5,
      "WITHDRAWN": 1,
      "NO_RESPONSE": 7
    }
  }
}
```

### 8.2 Endpoints (v1)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Authenticate user & set httpOnly auth cookie |
| `POST` | `/api/v1/auth/logout` | Clear auth cookie |
| `GET` | `/api/v1/auth/me` | Return current authenticated user profile |
| `GET` | `/api/v1/applications` | Query applications with filters (`status`, `search`, `platform`, `page`, `limit`) |
| `POST` | `/api/v1/applications` | Create application (atomic transaction creating/linking Company, Job, App, Timeline) |
| `GET` | `/api/v1/applications/:id` | Get application details (with company, job, recent timeline, follow-ups) |
| `PATCH` | `/api/v1/applications/:id` | Update application details |
| `PATCH` | `/api/v1/applications/:id/status` | Move stage (records `STATUS_CHANGED` timeline event) |
| `DELETE` | `/api/v1/applications/:id` | Soft-archive application |
| `GET` | `/api/v1/applications/:id/timeline` | Get chronological activity events |
| `POST` | `/api/v1/applications/:id/timeline` | Add manual timeline event |
| `GET` | `/api/v1/follow-ups` | List follow-ups for user (supports filter `?due=today|overdue|all`) |
| `POST` | `/api/v1/follow-ups` | Create follow-up task |
| `PATCH` | `/api/v1/follow-ups/:id/complete` | Mark follow-up as completed |
| `GET` | `/api/v1/analytics/dashboard` | Aggregated metrics, 8-week velocity, and pipeline stage counts |


---

## 9. Boundaries & Invariants

### Always Do
- **Use Token Classes Only:** Use Tailwind token classes (`bg-card`, `text-muted-foreground`, `border-border`) or `var(--token)`. Never hard-code hex values in components.
- **Stage Ring for Status:** Use `ApplicationStatusBadge` / `StageRing` with visible text labels.
- **Budget the Marker:** Apply the `.marker` highlight strictly to next actions due today or overdue (max 2-3 per region).
- **Validate at Boundaries:** Validate all client payloads using Zod before calling services.
- **Enforce Tenant Scoping:** Every database query must scope by `userId: req.user.id`.
- **Transactional Consistency:** Wrap multi-entity mutations in `prisma.$transaction`.
- **Accessible & Responsive:** Maintain 4.5:1 text contrast, visible focus outlines, 44px touch targets, and full usability at 360px width.

### Ask First
- Modifying or extending Prisma database schemas after initial migration.
- Adding third-party runtime dependencies outside the specified stack.
- Modifying the 12-state application status enum or transitions.

### Never Do
- Never use colored status pills, rainbow badges, or per-status color schemes.
- Never use the marker for general styling, buttons, navigation, or decoration.
- Never add drop shadows to cards, form inputs, or buttons.
- Never use pure `#000000` or dead neutral gray backgrounds outside tokens.
- Never use ALL CAPS labels, spaced eyebrows, or chained middle dots (`·`) for metadata.
- Never nest cards inside cards.
- Never store authentication tokens in `localStorage` or `sessionStorage`.
- Never trust client-supplied `userId` from request parameters.
- Never silence linters (`@ts-ignore`, `eslint-disable`) or skip tests.

---

## 10. Testing Strategy

1. **Unit Tests (Vitest):**
   - Business helpers, status transitions, salary parsing, and analytics aggregators.
   - Shared Zod validation schemas against valid and edge-case inputs.
2. **API Integration Tests (Supertest + Vitest):**
   - Authentication flow (register, login, session validation, logout).
   - Multi-tenant boundary verification: User B attempting to read or update User A's application must return `404 Not Found`.
   - Application creation and atomic status transition with timeline creation.
3. **Frontend Component Tests (React Testing Library):**
   - Application form validation, error state rendering, and filter controls.
   - Stage ring rendering for all 12 status states.
4. **Coverage Baseline:**
   - 80%+ line and branch coverage on business services and validation packages.

---

## 11. Success Criteria & Definition of Done (MVP)

- [ ] Complete monorepo builds cleanly (`pnpm build`) with zero TypeScript or lint errors.
- [ ] Marker design tokens, fonts (`Bricolage Grotesque`, `Instrument Sans`), and utilities are configured in `apps/web/src/index.css`.
- [ ] User can securely register, log in, maintain session via httpOnly cookies, and log out.
- [ ] User can create an application with company name, position, URL, job description, salary range, and platform.
- [ ] Original job description is safely preserved and viewable even if external posting is removed.
- [ ] User can move applications across statuses in both List and Kanban views with `StageRing` visualization and timeline event generation.
- [ ] Next actions due today or overdue are highlighted with the Marker swipe (`.marker`).
- [ ] User can filter applications by status, platform, and free-text search.
- [ ] User can create, view, and complete follow-up tasks; overdue follow-ups display prominently in "Needs you today".
- [ ] Consolidated dashboard displays accurate counts for total applications, active funnel stages, and pending follow-ups without card-in-card nesting.
- [ ] All automated tests pass (`pnpm test`) with zero skipped assertions.
