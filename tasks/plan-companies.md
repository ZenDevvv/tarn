# Implementation Plan: Companies Hub & Management (`companies`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Companies Hub  
> **Module ID:** `companies`  
> **Specification:** `spec-companies.md`  

---

## Task Decomposition

### Task 1: Shared Types & Validation Schemas
- **Files:** `packages/types/src/entities.ts`, `packages/validation/src/company.schema.ts`
- **Actions:**
  - Define `CompanyWithDetailsDTO` in `packages/types/src/entities.ts`.
  - Update `createCompanySchema` in `packages/validation/src/company.schema.ts` to allow empty string URL or URL for `website`.
  - Add `companyFiltersSchema` for query params (`search`, `industry`, `hasActive`, `sortBy`, `sortOrder`).
- **Verification:** Run type check across workspace.

### Task 2: Backend Companies Module (TDD: Red ➔ Green ➔ Refactor)
- **Files:**
  - `apps/api/tests/companies.test.ts`
  - `apps/api/src/modules/companies/company.repository.ts`
  - `apps/api/src/modules/companies/company.service.ts`
  - `apps/api/src/modules/companies/company.controller.ts`
  - `apps/api/src/modules/companies/company.routes.ts`
  - `apps/api/src/app.ts` (mount `/api/v1/companies`)
- **Actions:**
  - Write Supertest test cases in `apps/api/tests/companies.test.ts` testing:
    - User-scoped `GET /api/v1/companies` (list with application stats and search)
    - `GET /api/v1/companies/:id` (with details and applications)
    - `POST /api/v1/companies` (create company)
    - `PATCH /api/v1/companies/:id` (update company)
    - `DELETE /api/v1/companies/:id` (delete company)
    - Cross-user tenant isolation guards (User B cannot access or modify User A's company).
  - Implement repository, service, controller, routes.
  - Mount router on `/companies` in `apps/api/src/app.ts`.
- **Verification:** `pnpm --filter @tracker/api test`

### Task 3: Frontend API Client & Company State
- **Files:**
  - `apps/web/src/features/companies/api/company-api.ts`
- **Actions:**
  - Implement `companyApi` methods: `getCompanies`, `getCompany`, `createCompany`, `updateCompany`, `deleteCompany`.
- **Verification:** Unit verification.

### Task 4: Frontend UI Components (Marker Design System)
- **Files:**
  - `apps/web/src/features/companies/components/company-card.tsx`
  - `apps/web/src/features/companies/components/company-filters.tsx`
  - `apps/web/src/features/companies/components/company-detail-modal.tsx`
  - `apps/web/src/features/companies/components/company-form-modal.tsx`
- **Actions:**
  - Build `CompanyCard` with Bricolage Grotesque typography, website link, location/industry badges, active application counter, and recent application pills.
  - Build `CompanyFilters` with search input and industry/active dropdowns.
  - Build `CompanyDetailModal` showing full company profile and chronological list of applications with `StageRing` and links.
  - Build `CompanyFormModal` for creating and editing company records.
- **Verification:** Component build checks.

### Task 5: Companies Page & Routing
- **Files:**
  - `apps/web/src/features/companies/pages/companies-page.tsx`
  - `apps/web/src/app/router.tsx`
  - `apps/web/src/layouts/app-layout.tsx`
- **Actions:**
  - Implement `CompaniesPage` with stats strip, search & filter, responsive cards grid, empty state, and action buttons.
  - Register `/companies` route in `router.tsx` under `AppLayout`.
  - Add live company count badge to sidebar in `app-layout.tsx`.
- **Verification:** `pnpm --filter @tracker/web build && pnpm --filter @tracker/web test`

### Task 6: End-to-End Verification & Review
- **Actions:**
  - Test browser navigation to `/companies`.
  - Verify creating, editing, filtering, and opening details of companies.
  - Run full test suite across the monorepo (`pnpm test`).
