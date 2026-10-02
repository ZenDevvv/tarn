# Job Application Tracker — Project Architecture

**Document Type:** Technical Architecture / Project Structure  
**Version:** 1.0  
**Status:** Baseline Architecture  
**Last Updated:** September 30, 2026

---

# 1. Architecture Overview

The Job Application Tracker will be built as a **full-stack TypeScript modular monolith** with a React frontend and Node.js backend.

The architecture is intentionally designed to:

- Keep the MVP simple and maintainable
- Support strong type safety across frontend and backend
- Separate UI concerns from business logic
- Use relational data modeling for job applications, companies, interviews, contacts, follow-ups, and offers
- Support server-state caching and invalidation through TanStack Query
- Allow future AI, email, calendar, browser-extension, and n8n integrations without redesigning the core application
- Support multi-user data ownership from the beginning

The recommended primary architecture is:

```text
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                                                             │
│ React + TypeScript                                          │
│ Vite                                                        │
│ Tailwind CSS                                                │
│ shadcn/ui                                                   │
│ React Router                                                │
│ TanStack Query                                              │
│ React Hook Form                                             │
│ Zod                                                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                            HTTPS
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Node.js API                          │
│                                                             │
│ Express + TypeScript                                        │
│ Authentication                                              │
│ Authorization                                               │
│ Validation                                                  │
│ Business Logic                                              │
│ REST API                                                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                            Prisma
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL                            │
│                                                             │
│ Users                                                       │
│ Applications                                                │
│ Jobs                                                        │
│ Companies                                                   │
│ Interviews                                                  │
│ Contacts                                                    │
│ Follow-ups                                                  │
│ Timeline Events                                             │
│ Resumes                                                     │
│ Cover Letters                                               │
│ Skills                                                      │
│ Offers                                                      │
│ Notifications                                               │
└─────────────────────────────────────────────────────────────┘

                         External Services

            ┌────────────────┬───────────────┬───────────────┐
            ▼                ▼               ▼               ▼
      Object Storage      AI Provider       n8n          Calendar
       S3 / R2            Future Phase   Automation      Integration
```

---

# 2. Core Technology Stack

## 2.1 Frontend

| Category | Technology | Purpose |
|---|---|---|
| Language | TypeScript | End-to-end type safety |
| UI Framework | React | Main frontend framework |
| Build Tool | Vite | Development/build tooling |
| Styling | Tailwind CSS | Utility-first styling |
| UI Components | shadcn/ui | Accessible UI primitives |
| Routing | React Router | Client-side routing |
| Server State | TanStack Query | Data fetching, caching, mutations, invalidation |
| Forms | React Hook Form | Form state management |
| Validation | Zod | Runtime validation |
| Charts | Recharts | Dashboard analytics |
| Local State | React state | Component/UI state |
| Optional Global State | Zustand | Only if global client state becomes necessary |

---

## 2.2 Backend

| Category | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | Backend runtime |
| Language | TypeScript | Backend type safety |
| Framework | Express | REST API |
| Validation | Zod | Request validation |
| ORM | Prisma | Database access |
| Database | PostgreSQL | Primary relational database |
| Authentication | JWT/session in httpOnly cookies | Secure authentication |
| File Upload | S3-compatible storage | Resume/cover-letter files |
| Logging | Pino or Winston | Structured application logging |

---

## 2.3 Testing

| Layer | Technology |
|---|---|
| Unit Tests | Vitest |
| React Component Tests | React Testing Library |
| API Tests | Vitest / Supertest |
| End-to-End | Playwright |

---

## 2.4 Development Tooling

Recommended:

```text
pnpm
TypeScript
ESLint
Prettier
Husky
lint-staged
Docker
Docker Compose
GitHub Actions
```

---

# 3. Database Decision

## 3.1 Recommended Database: PostgreSQL

PostgreSQL is recommended over MongoDB because the application contains many relational entities.

Core relationships include:

```text
User
 │
 ├── Applications
 │      │
 │      ├── Company
 │      ├── Job
 │      ├── Interviews
 │      ├── Contacts
 │      ├── FollowUps
 │      ├── TimelineEvents
 │      ├── Resume
 │      ├── CoverLetter
 │      └── Offer
 │
 ├── SavedJobs
 ├── Companies
 ├── Contacts
 ├── Resumes
 ├── CoverLetters
 └── Notifications
```

PostgreSQL provides:

- Foreign key constraints
- Transactions
- Unique constraints
- Relational joins
- Aggregations
- Strong indexing
- Filtering
- Sorting
- JSON support when needed
- Mature integration with Prisma

---

# 4. Architectural Style

The backend should use a **modular monolith**.

Do not begin with microservices.

This project does not initially need:

```text
Kafka
RabbitMQ
Kubernetes
Service Mesh
Multiple Databases
Independent Microservices
```

Instead:

```text
Single API
   │
   ├── Auth Module
   ├── Applications Module
   ├── Jobs Module
   ├── Companies Module
   ├── Interviews Module
   ├── Follow-ups Module
   ├── Contacts Module
   ├── Analytics Module
   └── AI Module
```

Each module owns its business logic while sharing a single application runtime and database.

---

# 5. Repository Strategy

Use a **monorepo**.

Recommended package manager:

```text
pnpm workspaces
```

---

# 6. Root Project Structure

```text
job-application-tracker/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── layouts/
│   │   │   ├── lib/
│   │   │   ├── routes/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── main.tsx
│   │   │
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── lib/
│       │   ├── middleware/
│       │   ├── modules/
│       │   ├── routes/
│       │   ├── types/
│       │   ├── utils/
│       │   ├── app.ts
│       │   └── server.ts
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   │
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── client.ts
│   │   └── package.json
│   │
│   ├── validation/
│   │   ├── src/
│   │   │   ├── application.schema.ts
│   │   │   ├── auth.schema.ts
│   │   │   ├── company.schema.ts
│   │   │   ├── interview.schema.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/
│   │   ├── src/
│   │   │   ├── application.ts
│   │   │   ├── api.ts
│   │   │   ├── pagination.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/
│       ├── src/
│       └── package.json
│
├── tests/
│   └── e2e/
│
├── .github/
│   └── workflows/
│
├── .env.example
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

# 7. Frontend Architecture

The frontend should be organized primarily by **feature/domain**, not only by technical folder type.

Recommended feature structure:

```text
apps/web/src/features/
├── applications/
├── auth/
├── companies/
├── contacts/
├── dashboard/
├── follow-ups/
├── interviews/
├── notifications/
├── offers/
├── resumes/
├── saved-jobs/
├── analytics/
└── settings/
```

---

# 8. Frontend Feature Example

Example for Applications:

```text
features/applications/
│
├── api/
│   ├── application-api.ts
│   ├── application-queries.ts
│   └── application-query-keys.ts
│
├── components/
│   ├── application-card.tsx
│   ├── application-form.tsx
│   ├── application-filters.tsx
│   ├── application-kanban.tsx
│   ├── application-list.tsx
│   ├── application-status-badge.tsx
│   └── application-timeline.tsx
│
├── hooks/
│   ├── use-application.ts
│   ├── use-applications.ts
│   └── use-application-mutations.ts
│
├── pages/
│   ├── application-details-page.tsx
│   ├── applications-page.tsx
│   ├── create-application-page.tsx
│   └── edit-application-page.tsx
│
├── schemas/
│   └── application.schema.ts
│
├── types/
│   └── application.types.ts
│
└── utils/
    └── application-status.ts
```

---

# 9. Shared Frontend Components

Generic UI primitives should live in:

```text
apps/web/src/components/ui/
```

Examples:

```text
button.tsx
card.tsx
dialog.tsx
drawer.tsx
dropdown-menu.tsx
input.tsx
label.tsx
select.tsx
table.tsx
tabs.tsx
textarea.tsx
badge.tsx
calendar.tsx
popover.tsx
tooltip.tsx
```

Domain-specific components must remain inside their feature.

Example:

```text
application-card.tsx
```

should remain in:

```text
features/applications/components/
```

not:

```text
components/ui/
```

---

# 10. Frontend App Structure

Recommended:

```text
apps/web/src/
│
├── app/
│   ├── providers.tsx
│   ├── query-client.ts
│   └── router.tsx
│
├── components/
│   └── ui/
│
├── features/
│
├── layouts/
│   ├── app-layout.tsx
│   ├── auth-layout.tsx
│   └── dashboard-layout.tsx
│
├── routes/
│   ├── protected-route.tsx
│   └── public-route.tsx
│
├── hooks/
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── lib/
│   ├── api-client.ts
│   ├── auth-client.ts
│   ├── cn.ts
│   └── env.ts
│
├── types/
├── utils/
├── main.tsx
└── index.css
```

---

# 11. Frontend Routing

Recommended initial routes:

```text
/
├── auth/
│   ├── login
│   ├── register
│   └── forgot-password
│
├── dashboard
│
├── applications
│   ├── /
│   ├── new
│   ├── :id
│   └── :id/edit
│
├── saved-jobs
│   ├── /
│   └── :id
│
├── companies
│   ├── /
│   └── :id
│
├── contacts
│   ├── /
│   └── :id
│
├── interviews
│   ├── /
│   └── :id
│
├── resumes
├── cover-letters
├── analytics
├── notifications
└── settings
```

---

# 12. Frontend State Strategy

## 12.1 Server State

Use **TanStack Query** for:

- Applications
- Companies
- Interviews
- Follow-ups
- Contacts
- Saved jobs
- Resumes
- Cover letters
- Offers
- Analytics
- Notifications
- Current user profile

---

## 12.2 Local UI State

Use normal React state for:

- Dialog open/closed
- Tabs
- Form steps
- Temporary selections
- Drawer state
- Dropdown state
- View mode

---

## 12.3 Global Client State

Only add Zustand if needed.

Possible uses:

- Sidebar preferences
- Global UI preferences
- Temporary multi-step workflow state

Do not store server entities such as Applications in Zustand.

---

# 13. TanStack Query Architecture

All remote data should use centralized query keys.

Example:

```ts
export const applicationKeys = {
  all: ["applications"] as const,

  lists: () =>
    [...applicationKeys.all, "list"] as const,

  list: (filters: ApplicationFilters) =>
    [...applicationKeys.lists(), filters] as const,

  details: () =>
    [...applicationKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...applicationKeys.details(), id] as const,
};
```

---

# 14. TanStack Query Usage

## Fetch List

```ts
useQuery({
  queryKey: applicationKeys.list(filters),
  queryFn: () => getApplications(filters),
});
```

## Fetch Detail

```ts
useQuery({
  queryKey: applicationKeys.detail(applicationId),
  queryFn: () => getApplication(applicationId),
});
```

## Mutation

```ts
useMutation({
  mutationFn: createApplication,

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: applicationKeys.lists(),
    });
  },
});
```

---

# 15. Query Invalidation Strategy

After creating an application:

```text
invalidate:
applications lists
dashboard analytics
company applications
```

After updating status:

```text
invalidate:
application detail
application lists
dashboard
analytics
timeline
```

After creating an interview:

```text
invalidate:
application detail
interviews
dashboard
calendar-related queries
```

Avoid blindly invalidating the entire cache.

---

# 16. Optimistic Updates

Optimistic updates are appropriate for interactions such as Kanban status changes.

Flow:

```text
User drags application
        ↓
Update cached UI immediately
        ↓
PATCH /applications/:id/status
        ↓
        ├── Success → keep optimistic state
        │
        └── Error → rollback previous cache
```

Use optimistic updates only where rollback is safe.

---

# 17. API Client

Create one central API client.

Example location:

```text
apps/web/src/lib/api-client.ts
```

Responsibilities:

- Base URL
- Credentials
- JSON serialization
- Error parsing
- Authentication handling
- Abort signals
- Common headers

Example conceptual API:

```ts
api.get()
api.post()
api.patch()
api.delete()
```

---

# 18. Form Architecture

Use:

```text
React Hook Form
+
Zod
```

Flow:

```text
User Input
    ↓
React Hook Form
    ↓
Zod validation
    ↓
Mutation
    ↓
Node API
```

The backend must validate again.

Frontend validation is convenience.

Backend validation is authoritative.

---

# 19. Backend Structure

Recommended API structure:

```text
apps/api/src/
│
├── config/
│   ├── env.ts
│   └── constants.ts
│
├── lib/
│   ├── prisma.ts
│   ├── logger.ts
│   └── storage.ts
│
├── middleware/
│   ├── authenticate.ts
│   ├── authorize.ts
│   ├── error-handler.ts
│   ├── not-found.ts
│   ├── rate-limit.ts
│   └── validate.ts
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── applications/
│   ├── jobs/
│   ├── companies/
│   ├── saved-jobs/
│   ├── contacts/
│   ├── interviews/
│   ├── follow-ups/
│   ├── timeline/
│   ├── resumes/
│   ├── cover-letters/
│   ├── offers/
│   ├── analytics/
│   ├── notifications/
│   └── ai/
│
├── routes/
│   └── index.ts
│
├── types/
│
├── utils/
│
├── app.ts
└── server.ts
```

---

# 20. Backend Module Structure

Example Applications module:

```text
modules/applications/
│
├── application.controller.ts
├── application.service.ts
├── application.repository.ts
├── application.routes.ts
├── application.schema.ts
├── application.types.ts
└── application.errors.ts
```

---

# 21. Request Lifecycle

Recommended flow:

```text
HTTP Request
    ↓
Route
    ↓
Middleware
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

---

# 22. Backend Responsibilities

## Route

Responsible for:

- HTTP path
- HTTP method
- Middleware composition

Do not place business logic here.

---

## Middleware

Responsible for:

- Authentication
- Authorization
- Validation
- Rate limiting
- Request metadata

---

## Controller

Responsible for:

- Reading request data
- Calling service methods
- Returning API responses

Controllers should remain thin.

---

## Service

Responsible for:

- Business rules
- Transactions
- Coordinating multiple entities
- Timeline creation
- Follow-up logic
- Notification creation

---

## Repository

Responsible for:

- Database queries
- Prisma access
- Query-specific persistence logic

---

# 23. Example Backend Flow

```text
POST /api/v1/applications
        ↓
authenticate
        ↓
validate(createApplicationSchema)
        ↓
applicationController.create
        ↓
applicationService.create
        ↓
companyRepository.findOrCreate
        ↓
jobRepository.create
        ↓
applicationRepository.create
        ↓
timelineRepository.create
        ↓
PostgreSQL transaction
```

---

# 24. Transaction Boundaries

Operations that affect multiple entities should use a database transaction.

Example:

Creating an application may create:

```text
Company
Job
Application
TimelineEvent
FollowUp
```

These should either all succeed or all fail.

Use:

```ts
prisma.$transaction(...)
```

---

# 25. API Versioning

Use:

```text
/api/v1
```

Example:

```text
/api/v1/auth
/api/v1/applications
/api/v1/jobs
/api/v1/companies
/api/v1/interviews
/api/v1/follow-ups
/api/v1/analytics
```

---

# 26. REST Endpoint Structure

## Applications

```text
GET    /api/v1/applications
GET    /api/v1/applications/:id
POST   /api/v1/applications
PATCH  /api/v1/applications/:id
DELETE /api/v1/applications/:id
PATCH  /api/v1/applications/:id/status
```

## Companies

```text
GET    /api/v1/companies
GET    /api/v1/companies/:id
POST   /api/v1/companies
PATCH  /api/v1/companies/:id
DELETE /api/v1/companies/:id
```

## Interviews

```text
GET    /api/v1/interviews
POST   /api/v1/interviews
GET    /api/v1/interviews/:id
PATCH  /api/v1/interviews/:id
DELETE /api/v1/interviews/:id
```

## Follow-ups

```text
GET    /api/v1/follow-ups
POST   /api/v1/follow-ups
PATCH  /api/v1/follow-ups/:id
DELETE /api/v1/follow-ups/:id
PATCH  /api/v1/follow-ups/:id/complete
```

---

# 27. API Response Standard

## Successful Single Resource

```json
{
  "data": {
    "id": "abc123"
  }
}
```

## Successful List

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 84,
    "totalPages": 5
  }
}
```

## Error

```json
{
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application not found."
  }
}
```

---

# 28. Pagination

Use page-based pagination initially.

Example:

```text
GET /api/v1/applications?page=1&limit=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Cursor pagination can be added later if necessary.

---

# 29. Filtering

Example:

```text
GET /api/v1/applications
  ?status=APPLIED
  &platform=LINKEDIN
  &workSetup=HYBRID
  &search=react
  &page=1
  &limit=20
```

Filters should be parsed and validated using Zod.

---

# 30. Sorting

Support:

```text
sortBy=appliedAt
sortOrder=desc
```

Common sort fields:

```text
appliedAt
createdAt
updatedAt
company
position
status
salary
nextActionDueAt
```

---

# 31. Search

Initial search can use PostgreSQL text matching.

Search across:

```text
Position
Company
Job Description
Notes
Recruiter
Tags
Skills
```

If the dataset grows substantially, PostgreSQL full-text search may be introduced.

External search engines are unnecessary for MVP.

---

# 32. Core Data Model

Conceptual relationship structure:

```text
User
 │
 ├────< Application >──── Job >──── Company
 │             │
 │             ├────< Interview
 │             ├────< FollowUp
 │             ├────< TimelineEvent
 │             ├────< ApplicationContact >──── Contact
 │             ├────< ApplicationSkill >──── Skill
 │             ├──────── Resume
 │             ├──────── CoverLetter
 │             └──────── Offer
 │
 ├────< SavedJob
 ├────< Resume
 ├────< CoverLetter
 ├────< Contact
 ├────< Notification
 └────< Skill
```

---

# 33. Job vs Application

Keep these entities conceptually separate.

## Job

Represents the opportunity.

Example fields:

```text
id
userId
companyId
title
description
source
sourceUrl
location
workSetup
employmentType
salaryMin
salaryMax
currency
datePosted
createdAt
updatedAt
```

---

## Application

Represents the user's interaction with the opportunity.

Example fields:

```text
id
userId
jobId
status
priority
appliedAt
resumeId
coverLetterId
nextAction
nextActionDueAt
notes
createdAt
updatedAt
```

---

# 34. Main Database Tables

Recommended eventual tables:

```text
users
companies
jobs
applications
saved_jobs
contacts
application_contacts
interviews
follow_ups
timeline_events
resumes
cover_letters
skills
application_skills
offers
notifications
tags
application_tags
```

---

# 35. MVP Database Tables

Start with:

```text
users
companies
jobs
applications
timeline_events
follow_ups
```

Then add:

```text
interviews
contacts
resumes
cover_letters
offers
notifications
```

in later phases.

---

# 36. User Ownership

The application should be architected as multi-user from day one.

Every relevant record must belong to a user either directly or through an owned parent resource.

Example:

```text
Application.userId
Company.userId
Job.userId
Contact.userId
Resume.userId
Notification.userId
```

Every API request must enforce user ownership server-side.

Never trust IDs provided by the frontend without validating ownership.

---

# 37. Authentication Architecture

Recommended model:

```text
Browser
  ↓
Login Request
  ↓
Node API
  ↓
Credentials verified
  ↓
Secure auth token/session created
  ↓
httpOnly secure cookie
  ↓
Browser automatically sends cookie
```

Avoid storing authentication tokens in:

```text
localStorage
sessionStorage
```

for primary authentication.

---

# 38. Authentication Routes

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Some routes may be deferred for MVP.

---

# 39. Authorization

All protected routes must verify:

```text
Authenticated user
        ↓
Resource ownership
        ↓
Permission to perform requested action
```

Example:

```text
GET /applications/:id
```

must ensure:

```text
application.userId === req.user.id
```

or equivalent scoped database query.

---

# 40. Shared Validation

Use Zod schemas in:

```text
packages/validation
```

Example:

```text
createApplicationSchema
updateApplicationSchema
applicationFiltersSchema
loginSchema
registerSchema
createInterviewSchema
```

Frontend can import schemas for form validation.

Backend imports the same validation rules for API request validation.

The backend remains authoritative.

---

# 41. Prisma Architecture

Centralize the Prisma client:

```text
packages/database/src/client.ts
```

Avoid creating a new Prisma client per request.

Example conceptual Prisma structure:

```text
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    └── client.ts
```

---

# 42. Example Prisma Model

```prisma
model Application {
  id       String @id @default(cuid())
  userId   String
  jobId    String

  status   ApplicationStatus
  priority ApplicationPriority?

  appliedAt DateTime?

  nextAction      String?
  nextActionDueAt DateTime?

  resumeId      String?
  coverLetterId String?

  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
  job  Job  @relation(fields: [jobId], references: [id])

  interviews     Interview[]
  followUps      FollowUp[]
  timelineEvents TimelineEvent[]

  @@index([userId])
  @@index([jobId])
  @@index([status])
  @@index([appliedAt])
  @@index([nextActionDueAt])
}
```

The final Prisma schema should be created in a dedicated database-design phase.

---

# 43. Status Enums

Recommended application status:

```text
SAVED
APPLIED
APPLICATION_VIEWED
RECRUITER_CONTACTED
HR_INTERVIEW
TECHNICAL_INTERVIEW
FINAL_INTERVIEW
OFFER
ACCEPTED
REJECTED
WITHDRAWN
NO_RESPONSE
```

Recommended priority:

```text
LOW
MEDIUM
HIGH
```

Recommended work setup:

```text
REMOTE
HYBRID
ONSITE
```

---

# 44. Timeline Architecture

Application activity should be preserved through timeline events.

Example:

```text
APPLICATION_CREATED
STATUS_CHANGED
FOLLOW_UP_CREATED
FOLLOW_UP_COMPLETED
INTERVIEW_SCHEDULED
INTERVIEW_COMPLETED
RECRUITER_CONTACTED
OFFER_RECEIVED
APPLICATION_WITHDRAWN
CUSTOM_EVENT
```

Timeline events should be append-oriented.

Avoid rewriting past historical events.

---

# 45. Next Action Architecture

Next Action is a first-class concept.

Each application may have:

```text
nextAction
nextActionDueAt
```

Examples:

```text
Follow up with recruiter
Prepare for interview
Submit assessment
Send portfolio
Respond to recruiter
```

Longer task history belongs in FollowUps.

---

# 46. File Storage Architecture

Do not store resume or cover-letter binary files directly in PostgreSQL.

Store file metadata in PostgreSQL:

```text
id
userId
filename
storageKey
mimeType
size
createdAt
```

Store actual files in S3-compatible object storage.

Recommended providers:

```text
Cloudflare R2
AWS S3
Supabase Storage
```

---

# 47. File Upload Flow

```text
Browser
   ↓
Upload request
   ↓
Node API
   ↓
Authorization
   ↓
Validate file
   ↓
Object Storage
   ↓
Save metadata in PostgreSQL
```

Alternative future optimization:

```text
Presigned upload URLs
```

---

# 48. Allowed File Types

For initial resume/document support:

```text
PDF
DOCX
```

Optional later:

```text
TXT
Image files for supporting documents
```

File size limits must be enforced server-side.

---

# 49. Analytics Architecture

Analytics should be calculated on the backend/database.

Do not fetch all application rows and calculate all dashboard metrics in React.

Example:

```text
GET /api/v1/analytics/dashboard
```

Response:

```json
{
  "data": {
    "totalApplications": 47,
    "activeApplications": 29,
    "interviews": 6,
    "offers": 1,
    "followUpsDue": 3
  }
}
```

---

# 50. Analytics Queries

Potential metrics:

```text
Total applications
Applications by status
Applications by platform
Applications by month
Response rate
Interview rate
Offer count
Average response time
Average application-to-interview time
Follow-ups due
Upcoming interviews
```

Use PostgreSQL aggregation functions.

---

# 51. Dashboard Architecture

The dashboard may call a small number of optimized endpoints:

```text
GET /analytics/dashboard
GET /follow-ups?status=due
GET /interviews?upcoming=true
GET /applications?limit=5&sortBy=updatedAt
```

Avoid dozens of small network requests where aggregated endpoints are more appropriate.

---

# 52. Error Handling

Centralize backend error handling.

Expected error categories:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
RateLimitError
StorageError
IntegrationError
InternalServerError
```

All errors should return standardized API responses.

---

# 53. Logging

Use structured logging.

Recommended:

```text
Pino
```

Log:

```text
requestId
method
path
status
duration
userId where appropriate
error details
```

Never log:

```text
Passwords
Raw authentication tokens
Sensitive file contents
Secrets
```

---

# 54. Request IDs

Each API request should have a request identifier.

Example:

```text
x-request-id
```

This helps correlate frontend errors with server logs.

---

# 55. Security Requirements

Implement:

- Secure cookies
- HTTPS in production
- Input validation
- Server-side authorization
- Password hashing
- CORS configuration
- CSRF protection where applicable
- Rate limiting
- Secure file upload validation
- Request size limits
- Dependency updates
- Environment variable validation
- No secrets in frontend bundles

---

# 56. Environment Variables

## Frontend

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Only public configuration should use `VITE_`.

---

## Backend

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=

JWT_SECRET=
COOKIE_SECRET=

WEB_ORIGIN=http://localhost:5173

STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=

AI_API_KEY=
```

---

# 57. Environment Validation

Backend environment variables should be validated at startup.

Example:

```text
Zod environment schema
      ↓
Server startup
      ↓
Fail immediately if required config is missing
```

---

# 58. Local Development

Recommended workflow:

```text
pnpm install
docker compose up -d
pnpm dev
```

Expected services:

```text
Frontend
http://localhost:5173

API
http://localhost:4000

PostgreSQL
localhost:5432
```

---

# 59. Docker Compose

For local development:

```text
services:
  postgres
```

Optional later:

```text
mailpit
redis
minio
```

Do not add services before they are required.

---

# 60. Database Migrations

Use Prisma migrations.

Development:

```text
prisma migrate dev
```

Production:

```text
prisma migrate deploy
```

Never use ad-hoc production schema changes.

---

# 61. Seed Data

Provide development seed data for:

```text
Test user
Companies
Jobs
Applications
Timeline events
Follow-ups
Interviews
```

This helps frontend development and demos.

---

# 62. Testing Strategy

## Unit Tests

Test:

- Utility functions
- Status transitions
- Analytics calculations
- Validation schemas
- Business-rule helpers

---

## API Tests

Test:

- Authentication
- Ownership validation
- Application CRUD
- Filters
- Status updates
- Timeline creation
- Follow-ups

---

## React Tests

Test:

- Application form
- Filters
- Status display
- Loading/error states
- Important interactive components

---

## End-to-End Tests

Playwright scenarios:

```text
Register
Login
Create application
Update application
Move status
Create follow-up
Search/filter application
Logout
```

Later:

```text
Schedule interview
Upload resume
Receive offer
```

---

# 63. CI/CD

GitHub Actions should eventually run:

```text
Install dependencies
Type check
Lint
Unit tests
Build frontend
Build backend
API tests
```

Optional later:

```text
Playwright E2E
```

---

# 64. Branching Strategy

A simple Git strategy is sufficient.

Example:

```text
main
develop
feature/*
fix/*
```

or trunk-based development:

```text
main
feature/*
```

For a solo project, keep the workflow lightweight.

---

# 65. Deployment Architecture

Recommended simple production deployment:

```text
GitHub
  │
  ├── Frontend → Vercel
  │
  └── API → Railway / Render
                  │
                  ▼
             PostgreSQL
             Neon / Supabase
                  │
                  ▼
            Object Storage
            Cloudflare R2
```

---

# 66. Suggested Managed Services

## Frontend

```text
Vercel
```

## Backend

```text
Railway
Render
Fly.io
```

## PostgreSQL

```text
Neon
Supabase
Railway PostgreSQL
```

## Storage

```text
Cloudflare R2
AWS S3
Supabase Storage
```

A simple setup could be:

```text
Vercel
Railway
Neon
Cloudflare R2
```

---

# 67. Future n8n Architecture

n8n should remain an external integration layer.

Do not place it between the frontend and main backend.

Recommended:

```text
External Service
      ↓
     n8n
      ↓
Authenticated Integration API
      ↓
 Node.js Backend
      ↓
 PostgreSQL
```

Examples:

```text
Gmail
  ↓
n8n
  ↓
Parse application confirmation
  ↓
API
  ↓
Create suggested application
```

---

# 68. Integration API

Future automation may use dedicated endpoints.

Example:

```text
POST /api/v1/integrations/email/application-confirmation
POST /api/v1/integrations/calendar/interview
```

These endpoints should:

- Authenticate integration requests
- Validate payloads
- Enforce idempotency
- Avoid duplicate data

---

# 69. Idempotency

Important for automation.

If Gmail/n8n sends the same event twice, the system should not create duplicate applications.

Potential identifiers:

```text
emailMessageId
externalEventId
jobUrl
sourceId
```

Use unique constraints where appropriate.

---

# 70. AI Architecture

AI should be an optional module.

Recommended:

```text
Node API
   ↓
AI Service Adapter
   ↓
Provider
```

Avoid calling AI providers directly from the browser.

Benefits:

- Protect API keys
- Centralize prompts
- Add logging
- Add rate limits
- Change providers later

---

# 71. AI Module Structure

```text
modules/ai/
│
├── ai.controller.ts
├── ai.service.ts
├── ai.routes.ts
├── providers/
│   ├── provider.interface.ts
│   └── provider.ts
├── prompts/
│   ├── job-analysis.prompt.ts
│   └── interview-prep.prompt.ts
└── schemas/
```

---

# 72. AI Job Description Flow

```text
User pastes JD
    ↓
Frontend
    ↓
POST /api/v1/ai/job-description/analyze
    ↓
AI service
    ↓
Structured response
    ↓
Zod validation
    ↓
Return extracted fields
    ↓
User reviews
    ↓
User saves
```

Never automatically save AI output without user confirmation.

---

# 73. Browser Extension Architecture

Future:

```text
Browser Extension
       ↓
Job listing metadata
       ↓
API
       ↓
Saved Job
```

The extension should primarily assist with user-triggered saving, not unauthorized platform scraping.

---

# 74. Notification Architecture

Initial notification type:

```text
In-app notifications
```

Later:

```text
Email
Browser push
Telegram
Discord
```

Notification entity:

```text
id
userId
type
title
message
readAt
createdAt
```

---

# 75. Scheduled Jobs

The MVP can avoid background workers if possible.

Later scheduled tasks may include:

```text
Follow-up reminders
Interview reminders
Digest notifications
Email synchronization
```

Options:

```text
Platform cron
n8n
Dedicated worker
```

Start with the simplest reliable solution.

---

# 76. Cache Strategy

TanStack Query is the main application-level cache.

Backend caching such as Redis is not required for MVP.

Add Redis only if a real need appears, such as:

```text
Heavy analytics caching
High traffic
Rate limiting
Queues
Distributed sessions
```

---

# 77. Performance Strategy

Initial performance techniques:

- Database indexes
- Pagination
- Select only required fields
- Avoid N+1 queries
- Lazy-load large frontend routes
- TanStack Query caching
- Debounced search
- Memoize only where useful
- Avoid unnecessary global state

---

# 78. Important Database Indexes

Likely indexes:

```text
applications.userId
applications.status
applications.appliedAt
applications.nextActionDueAt

jobs.companyId
jobs.source
jobs.createdAt

timelineEvents.applicationId
timelineEvents.createdAt

followUps.userId
followUps.dueAt
followUps.status

interviews.userId
interviews.scheduledAt

companies.userId
companies.name
```

Exact indexing should be adjusted based on real query patterns.

---

# 79. Duplicate Detection

Potential application duplicate checks:

```text
same user
same company
same position
same job URL
similar application date
```

Do not automatically block every possible duplicate.

Recommended UX:

```text
Potential duplicate detected

[View Existing]
[Create Anyway]
```

---

# 80. Soft Delete vs Hard Delete

For important historical entities such as Applications, consider soft deletion.

Possible fields:

```text
archivedAt
deletedAt
```

Recommended MVP behavior:

```text
Archive application
```

rather than immediately hard-delete.

Hard delete can remain available in settings or confirmation flows.

---

# 81. Date and Time Strategy

Store all timestamps in UTC.

Frontend displays in the user's configured timezone.

Examples:

```text
createdAt
updatedAt
appliedAt
scheduledAt
dueAt
```

Never store display-formatted date strings in the database.

---

# 82. Currency Strategy

Store salary as:

```text
salaryMin
salaryMax
currency
```

Example:

```text
50000
70000
PHP
```

Do not store:

```text
"₱50,000 - ₱70,000"
```

as the canonical database representation.

---

# 83. API DTO Strategy

Do not expose raw Prisma models blindly.

Use service/controller-level response DTOs.

Example:

```text
ApplicationDTO
ApplicationListItemDTO
ApplicationDetailsDTO
DashboardAnalyticsDTO
```

This allows backend models to change without tightly coupling the frontend to Prisma.

---

# 84. Naming Conventions

## Files

```text
kebab-case.ts
application-card.tsx
application.service.ts
```

## Components

```text
PascalCase
ApplicationCard
ApplicationForm
```

## Functions

```text
camelCase
createApplication
getApplicationById
```

## Database Models

```text
PascalCase
Application
TimelineEvent
```

## Enum Values

```text
UPPER_SNAKE_CASE
TECHNICAL_INTERVIEW
NO_RESPONSE
```

---

# 85. Import Boundaries

Frontend features should avoid tightly coupling to one another.

Preferred:

```text
applications
   ↓
shared API/types
```

Avoid:

```text
applications/components
 importing deep internal files from
 interviews/components
```

Expose a public module interface if cross-feature reuse becomes necessary.

---

# 86. MVP Architecture Scope

The MVP should include only what is needed for:

```text
Authentication
Applications
Companies
Jobs
Timeline
Follow-ups
Dashboard
Analytics
Search
Filters
```

Do not block MVP on:

```text
AI
Gmail
n8n
Calendar
Browser Extension
Redis
Queues
WebSockets
```

---

# 87. Phase 2 Architecture Additions

Add:

```text
Interviews
Contacts
Resumes
Cover Letters
Saved Jobs
Offers
Notifications
```

Object storage becomes required here if file uploads are introduced.

---

# 88. Phase 3 Architecture Additions

Add:

```text
AI module
Job description parser
Skill extraction
Skill matching
Interview preparation
```

Potential new tables:

```text
skills
job_skills
user_skills
application_skills
```

---

# 89. Phase 4 Architecture Additions

Add:

```text
n8n
Email integration
Calendar integration
Browser extension
Messaging integrations
External event tracking
Idempotency keys
Integration credentials
```

---

# 90. Suggested Build Order

## Step 1 — Repository Foundation

```text
pnpm workspace
web app
api app
database package
validation package
shared types
```

## Step 2 — Database

```text
User
Company
Job
Application
TimelineEvent
FollowUp
```

## Step 3 — Authentication

```text
Register
Login
Logout
Current user
Protected API
Protected frontend routes
```

## Step 4 — Applications

```text
CRUD
Search
Filter
Pagination
Status
```

## Step 5 — Timeline

```text
Application created
Status changed
Manual events
```

## Step 6 — Follow-ups

```text
Create
Complete
Overdue
Dashboard integration
```

## Step 7 — Dashboard

```text
Analytics
Recent applications
Due follow-ups
```

## Step 8 — Kanban

```text
Status columns
Drag/drop
Optimistic mutation
```

## Step 9 — Testing / Polish

```text
Validation
Error handling
Responsive design
E2E tests
```

---

# 91. Architecture Decisions Summary

## Frontend

```text
React
TypeScript
Vite
Tailwind
shadcn/ui
React Router
TanStack Query
React Hook Form
Zod
```

## Backend

```text
Node.js
TypeScript
Express
Zod
Prisma
```

## Database

```text
PostgreSQL
```

## Storage

```text
S3-compatible object storage
```

## Architecture Pattern

```text
Monorepo
+
Modular Monolith
+
Feature-based Frontend
+
REST API
```

## Future Automation

```text
n8n as external integration layer
```

## Future AI

```text
Backend AI adapter/service
```

---

# 92. Architecture Rules

The project should follow these rules:

1. Do not place Prisma calls directly in React.
2. Do not place core business logic in Express route files.
3. Do not use TanStack Query for local UI state.
4. Do not duplicate server state in Zustand.
5. Validate all external input server-side.
6. Enforce user ownership on every protected resource.
7. Use database transactions for multi-entity operations.
8. Keep generic UI components separate from domain components.
9. Keep AI optional and isolated from core workflows.
10. Keep external automation outside the primary request path.
11. Do not introduce infrastructure until a real requirement exists.
12. Prefer simple, testable modules over abstraction-heavy architecture.

---

# 93. Final Recommended Architecture

```text
                         USER
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│ React + TypeScript                                           │
│ Vite                                                         │
│ Tailwind CSS                                                 │
│ shadcn/ui                                                    │
│ React Router                                                 │
│ TanStack Query                                               │
│ React Hook Form                                              │
│ Zod                                                         │
│                                                              │
│ Feature Modules                                              │
│ ├── Applications                                             │
│ ├── Companies                                                │
│ ├── Dashboard                                                │
│ ├── Follow-ups                                               │
│ ├── Interviews                                               │
│ ├── Contacts                                                 │
│ └── Analytics                                                │
└──────────────────────────────┬───────────────────────────────┘
                               │
                           REST / JSON
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                                                              │
│ Node.js + TypeScript                                         │
│ Express                                                      │
│ Zod                                                         │
│                                                              │
│ Modules                                                      │
│ ├── Auth                                                     │
│ ├── Applications                                             │
│ ├── Jobs                                                     │
│ ├── Companies                                                │
│ ├── Timeline                                                 │
│ ├── Follow-ups                                               │
│ ├── Interviews                                               │
│ ├── Contacts                                                 │
│ ├── Resumes                                                  │
│ ├── Offers                                                   │
│ ├── Analytics                                                │
│ ├── Notifications                                            │
│ └── AI                                                       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                             Prisma
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
│                                                              │
│ PostgreSQL                                                   │
│                                                              │
│ Users                                                        │
│ Companies                                                    │
│ Jobs                                                         │
│ Applications                                                 │
│ Timeline Events                                              │
│ Follow-ups                                                   │
│ Interviews                                                   │
│ Contacts                                                     │
│ Resumes                                                      │
│ Cover Letters                                                │
│ Skills                                                       │
│ Offers                                                       │
│ Notifications                                                │
└──────────────────────────────────────────────────────────────┘

                         │             │
                         │             │
                         ▼             ▼

                ┌──────────────┐  ┌──────────────┐
                │ Object Store │  │ AI Provider  │
                │ S3 / R2      │  │ Future       │
                └──────────────┘  └──────────────┘

                         ▲
                         │
                 ┌──────────────┐
                 │     n8n      │
                 │ Future       │
                 │ Automation   │
                 └──────┬───────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
         Gmail       Calendar      Other
```

---

# 94. Final Architecture Principle

The core product should remain a normal, reliable web application even if every optional integration is unavailable.

The architectural priority is:

```text
Reliable Core
    ↓
Good Data Model
    ↓
Clear API
    ↓
Strong UX
    ↓
Automation
    ↓
AI
```

The project should not depend on AI, email integrations, n8n, or browser extensions to function correctly.

Those systems should enhance the application rather than define it.
