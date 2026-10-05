# Spec: Companies Hub & Registry (`companies`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Companies Hub & Management  
> **Module ID:** `companies`  
> **Design System:** **Marker** (`app/DESIGN.md`, `apps/web/src/index.css`, `StageRing`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `CAPABILITY_MAP.md` (Module ID: `companies-jobs`)  
> 2. `spec.md` (Lines 125, 142: Company cards, history, controller, service, repository, routes)  
> 3. `app/DESIGN.md` (Marker design rules, typography hierarchy, and card conventions)  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
In job hunting, candidates often apply to multiple roles at the same company over time (e.g. different engineering teams, internships followed by full-time roles, or reapplying after a skill upgrade). They also research target dream companies before specific roles open. Currently, companies are only auto-created as implicit side effects of creating applications, with no dedicated `/companies` hub. The sidebar navigation already displays a **Companies** link (`Building2` icon), but navigating to `/companies` falls back to the dashboard because no route, UI, or backend API module exists for companies.

### 1.2 User Stories
- **Companies Hub (`/companies`):** As a job seeker, I want a dedicated page listing all companies I have interacted with or saved, showing summary metrics (total applications, active pipelines, locations, websites).
- **Search & Filter:** As a job seeker, I want to quickly search companies by name or keyword, and filter by industry or active status.
- **Add / Edit Company:** As a job seeker, I want to manually create target companies or edit existing company profiles (website, industry, location, notes).
- **Company Card:** As a job seeker, I want to see a card for each company featuring its name, website link, location/industry badges, active application count, and recent roles with their current stage rings.
- **Company Detail & History Modal:** As a job seeker, I want to inspect a company to see all past and present applications for that company, their statuses, dates, compensation, and a one-click button to start a new application for that company.
- **Delete Company:** As a job seeker, I want to delete a company with a safe confirmation dialog.
- **Seamless Navigation:** As a job seeker, I want the sidebar `/companies` nav item to highlight correctly and show the total company count.

---

## 2. Technical Contracts & Architecture

### 2.1 Backend Scope (`apps/api`)

#### Modules Structure:
```text
apps/api/src/modules/companies/
├── company.repository.ts     # Prisma database queries strictly scoped to userId
├── company.service.ts        # Business logic, statistics computation, validation
├── company.controller.ts     # Express request/response handlers
└── company.routes.ts         # Router with auth & validation middleware
```

#### API Endpoints Contract:
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/companies` | List all companies with application stats, search, & filter | Yes |
| `GET` | `/api/v1/companies/:id` | Get single company with all associated applications and jobs | Yes |
| `POST` | `/api/v1/companies` | Create a new company manually | Yes |
| `PATCH` | `/api/v1/companies/:id` | Update company metadata (website, industry, location, description) | Yes |
| `DELETE` | `/api/v1/companies/:id` | Delete company (cascade deletes or soft check) | Yes |

#### Query Parameters for `GET /api/v1/companies`:
- `search` (optional string): Case-insensitive match on `name`, `industry`, or `location`
- `industry` (optional string): Filter by industry
- `hasActive` (optional boolean string 'true' | 'false'): Filter companies with active applications (`status` not in `REJECTED`, `WITHDRAWN`)
- `sortBy` (optional 'name' | 'applicationsCount' | 'updatedAt' | 'createdAt', default 'name')
- `sortOrder` (optional 'asc' | 'desc', default 'asc')

### 2.2 Shared Types & Schemas (`packages/types`, `packages/validation`)

#### Types (`packages/types/src/entities.ts`):
```typescript
export interface CompanyWithDetailsDTO extends CompanyDTO {
  createdAt: string;
  updatedAt: string;
  applicationsCount: number;
  activeApplicationsCount: number;
  applications: Array<{
    id: string;
    status: ApplicationStatus;
    priority: Priority;
    appliedAt: string;
    job: {
      id: string;
      title: string;
      location?: string | null;
      workSetup?: WorkSetup | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      currency?: string | null;
    };
  }>;
}
```

#### Validation (`packages/validation/src/company.schema.ts`):
- Extend `createCompanySchema` to allow optional empty string for `website` (or valid URL).
- Add `companyFiltersSchema` for query params validation.

### 2.3 Frontend Scope (`apps/web`)

```text
apps/web/src/
├── features/
│   └── companies/
│       ├── api/
│       │   └── company-api.ts           # apiClient wrapper for /companies endpoints
│       ├── components/
│       │   ├── company-card.tsx         # Marker card with company stats, badges, recent roles
│       │   ├── company-detail-modal.tsx # Company profile & all applications timeline
│       │   └── company-form-modal.tsx   # Add/Edit company modal with Zod validation
│       └── pages/
│           └── companies-page.tsx       # Grid of companies, search/filter bar, stats strip, empty state
├── app/
│   └── router.tsx                       # Route /companies -> CompaniesPage
└── layouts/
    └── app-layout.tsx                   # Add live companies count to sidebar
```

---

## 3. UI/UX Design System Guidelines (Marker)

1. **Typography:**
   - Page Title & Card Titles: `font-display font-semibold tracking-tight` (`Bricolage Grotesque`)
   - Metadata & Counts: `font-sans text-small text-muted-foreground` (`Instrument Sans`)
2. **Surfaces & Borders:**
   - Light: `bg-card` on `bg-background` (`#f4f5f2` paper surface), hairline `border-border` (`#dadfd6`)
   - Dark: `bg-card` (`#15201c`) on `bg-background` (`#0e1714`), hairline `border-border` (`#263630`)
   - No nested cards inside cards; separate sections with hairlines and typography scale.
3. **Color & Highlights:**
   - Active count badge with brand pine (`bg-primary/10 text-primary`)
   - Primary action buttons: `bg-primary hover:bg-primary-hover text-primary-foreground`
   - Stage rings on applications using existing `StageRing` component.
4. **Motion & Interaction:**
   - Deceleration curve `cubic-bezier(0.16, 1, 0.3, 1)` on modal enter (150-250ms).
   - `@media (hover: hover)` for card interactions.
   - Smooth dialog backdrop transitions.
5. **Mobile Ergonomics:**
   - Full viewport `100dvh`
   - Touch tap targets minimum 44px
   - Responsive grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop.

---

## 4. Acceptance Criteria

- [ ] `GET /api/v1/companies` returns user-scoped companies with total and active application counts.
- [ ] `POST /api/v1/companies` allows manual creation of a company with name, website, industry, location, notes.
- [ ] `PATCH /api/v1/companies/:id` updates company metadata and enforces user ownership.
- [ ] `DELETE /api/v1/companies/:id` deletes company and associated jobs/applications if confirmed.
- [ ] Integration tests in `apps/api/tests/companies.test.ts` pass with 100% green status.
- [ ] Navigating to `/companies` renders the `CompaniesPage` inside `AppLayout`.
- [ ] Users can search companies by name, filter by industry, and sort by name or application count.
- [ ] Users can click a company card to open the detail modal and view all applications submitted to that company.
- [ ] Users can edit company details from the UI.
- [ ] Users can click "Add application" from a company to jump to `/applications/new?company=...` with the company pre-filled.
- [ ] `pnpm --filter @tracker/web build` passes with zero TypeScript errors.
