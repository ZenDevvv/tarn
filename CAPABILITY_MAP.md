# Capability Map: Job Application Tracker (MVP)

> **Initiative:** Job Application Tracker — Personal ATS Web Application (Phase 1 MVP)  
> **Design System:** **Marker** (`app/DESIGN.md`, `app/index.css`, `app/stage-ring.tsx`)  
> **Source Documents:** `app/job-application-tracker-brd-prd.md`, `app/job-application-tracker-project-architecture.md`, `app/DESIGN.md`  
> **Status:** Gated Specification Proposal  

---

## 1. Capability Map

| Module ID | Responsibility | Key Entities & UI Scope | Depends On |
|---|---|---|---|
| `foundation` | Monorepo infrastructure, database client, shared types, shared validation, API & Web skeletons with **Marker** design system tokens | `pnpm-workspace.yaml`, `docker-compose.yml`, `packages/database`, `packages/types`, `packages/validation`, `apps/web/src/index.css` (Marker tokens & fonts) | — |
| `auth` | User identity, registration, login, logout, session management via httpOnly cookies, auth middleware, ownership enforcement | `User`, `Session`/`JWT`, `req.user`, auth guards, login/register UI | `foundation` |
| `companies-jobs` | Company registry, job opportunity details, original job description storage, platform & salary tracking | `Company`, `Job`, company cards, job metadata | `auth` |
| `applications` | Core application tracking, status management via **Stage Ring**, priority glyph, next action with **Marker** highlight, filters, search, pagination, soft archive | `Application`, `StageRing`, `ApplicationStatusBadge`, `application-card.tsx` | `companies-jobs` |
| `timeline` | Chronological activity timeline, automatic status transition logging, custom event creation | `TimelineEvent` (append-only), timeline node rendering | `applications` |
| `follow-ups` | Follow-up action reminders, due date alerts, completion tracking | `FollowUp` (pending, due today, overdue, completed chips) | `applications` |
| `dashboard-analytics` | Aggregated dashboard stats, "Needs you today" widget, active funnel metrics, recent applications table | Server-side SQL aggregations, dashboard sections | `applications`, `follow-ups` |
| `kanban-pipeline` | Kanban board with status columns, stage transitions, keyboard controls, optimistic UI updates | Multi-column board (`rounded-xl`), stage rings, drag tilt & drop slot | `applications`, `timeline` |
| `interviews` | Multi-stage interview scheduling, rounds (HR, Tech, Behavioral, Final), preparation notes, meeting links, timeline events, and dynamic dashboard feed | `Interview` model, `apps/api/src/modules/interviews`, `apps/web/src/features/interviews` | `applications`, `timeline` |

---

## 2. Build & Verification Order

```text
foundation ──▶ auth ──▶ companies-jobs ──▶ applications ──┬──▶ timeline ─────────┬──▶ interviews
                                                          │                      │
                                                          ├──▶ follow-ups ──▶ dashboard-analytics
                                                          │                      ▲
                                                          └──────────────────────┴──▶ kanban-pipeline
```

1. **`foundation`**: Establish monorepo packages, PostgreSQL Docker Compose, Prisma client, shared Zod schemas, Express server bootstrap, and Vite React frontend with **Marker** CSS tokens (`app/index.css`) and typography (`Bricolage Grotesque`, `Instrument Sans`).
2. **`auth`**: Implement user registration, password hashing (bcrypt), login with httpOnly cookies, current user endpoint, frontend auth state, protected routes.
3. **`companies-jobs`**: Database schemas and repositories for Companies and Jobs, preserving full job descriptions and salary metadata.
4. **`applications`**: Application entity CRUD with strict user-ownership scoping, status updates, search/filter/pagination, and the Marker `ApplicationCard` with `StageRing` and next-action highlighting.
5. **`timeline`**: Append-only event history for status transitions and custom milestones.
6. **`follow-ups`**: Scheduled tasks with due dates, reminder statuses (due today, overdue, completed chips).
7. **`dashboard-analytics`**: Fast aggregated analytics queries and modern dashboard overview ("Needs you today", stats strip, pipeline strip, recent applications).
8. **`kanban-pipeline`**: Interactive Kanban board with status columns, keyboard path, and optimistic mutations.
9. **`interviews`** *(Phase 2)*: Multi-round interview tracking (HR, Technical, System Design, Final, etc.), meeting links, preparation notes, timeline logging, `/interviews` hub, application detail integration, and dynamic dashboard integration.

---

## 3. Scope Boundary (MVP vs Future Phases)

- **In Scope (Phase 1 MVP - Completed):** Full core tracking, companies, jobs, timeline, follow-ups, search/filter, dashboard analytics, Kanban board, Marker design system.
- **In Scope (Phase 2 - Current):** Multi-stage interview scheduler & preparation tracker (`interviews`).
- **Deferred in Phase 2:** Recruiter/contact book, resume/cover letter PDF file uploads (S3/R2), offer comparison.
- **Deferred to Phase 3:** AI JD analyzer, skill extraction, automated interview preparation.
- **Deferred to Phase 4:** Gmail / Google Calendar integrations, n8n webhooks, browser extension.
