# Implementation Plan: Recruiter & Hiring Contact Management (`contacts`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Recruiter & Contact Management  
> **Module ID:** `contacts`  
> **Specification:** `spec-contacts.md`  

---

## Task Decomposition

### Task 1: Database Model & Prisma Migration
- **Files:** `packages/database/prisma/schema.prisma`
- **Actions:**
  - Add `Contact` model with fields `id`, `userId`, `name`, `role`, `email`, `phone`, `linkedinUrl`, `companyId`, `applicationId`, `notes`, `createdAt`, `updatedAt`.
  - Add relations to `User`, `Company`, `Application`.
  - Add indexes on `[userId]`, `[companyId]`, `[applicationId]`.
  - Run `prisma migrate dev --name add_contacts` and `prisma generate`.
- **Verification:** `prisma migrate status` clean, Prisma client types generated.

### Task 2: Shared Types & Validation Schemas
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/validation/src/contact.schema.ts`
  - `packages/validation/src/index.ts`
- **Actions:**
  - Define `ContactDTO` and `ContactWithDetailsDTO` in `packages/types/src/entities.ts`.
  - Define `createContactSchema`, `updateContactSchema`, and `contactFiltersSchema` in `packages/validation/src/contact.schema.ts`.
  - Export schemas in `packages/validation/src/index.ts`.
- **Verification:** Workspace type check (`pnpm build`).

### Task 3: Backend Contacts Module (Red-Green-Refactor TDD)
- **Files:**
  - `apps/api/tests/contacts.test.ts`
  - `apps/api/src/modules/contacts/contact.repository.ts`
  - `apps/api/src/modules/contacts/contact.service.ts`
  - `apps/api/src/modules/contacts/contact.controller.ts`
  - `apps/api/src/modules/contacts/contact.routes.ts`
  - `apps/api/src/app.ts`
- **Actions:**
  - Write Supertest test cases in `apps/api/tests/contacts.test.ts` covering:
    - `GET /api/v1/contacts` (list contacts with company/application details and search/filters)
    - `GET /api/v1/contacts/:id` (single contact)
    - `POST /api/v1/contacts` (create contact)
    - `PATCH /api/v1/contacts/:id` (update contact)
    - `DELETE /api/v1/contacts/:id` (delete contact)
    - Tenant isolation guards (User B cannot access/modify User A's contacts)
  - Implement repository, service, controller, and routes.
  - Mount `/contacts` in `apps/api/src/app.ts`.
- **Verification:** Run `pnpm --filter @tracker/api test` (all tests pass).

### Task 4: Frontend API Client & Contact Components
- **Files:**
  - `apps/web/src/features/contacts/api/contact-api.ts`
  - `apps/web/src/features/contacts/components/contact-card.tsx`
  - `apps/web/src/features/contacts/components/contact-filters.tsx`
  - `apps/web/src/features/contacts/components/contact-form-modal.tsx`
  - `apps/web/src/features/contacts/components/contact-detail-modal.tsx`
- **Actions:**
  - Build `contactApi` wrapper using `apiClient`.
  - Build `ContactCard` using Marker tokens, initial avatar, direct action buttons (`mailto:`, `tel:`, `linkedin`), company badge, linked application chip with `StageRing`.
  - Build `ContactFilters` with search input and company dropdown.
  - Build `ContactFormModal` for creating/editing contacts with company and application selector.
  - Build `ContactDetailModal` showing full details, notes, company, and linked application.
- **Verification:** Frontend type check and build.

### Task 5: Contacts Page, Routing & Sidebar Count
- **Files:**
  - `apps/web/src/features/contacts/pages/contacts-page.tsx`
  - `apps/web/src/app/router.tsx`
  - `apps/web/src/layouts/app-layout.tsx`
  - `packages/database/prisma/seed.ts` (add sample contacts for Northbeam, Halcyon Labs)
- **Actions:**
  - Implement `ContactsPage` with stats strip, search/filter, cards grid, empty state, and modal management.
  - Register `/contacts` route in `apps/web/src/app/router.tsx`.
  - Wire real-time contacts count badge in `apps/web/src/layouts/app-layout.tsx`.
  - Add initial seed contacts to `prisma/seed.ts`.
- **Verification:** Run `pnpm test`, navigate to `/contacts` in browser.

### Task 6: Review, Polish & Ship
- **Actions:**
  - Run complete test suite across workspace (`pnpm test`).
  - Audit styling against Marker standards (WCAG contrast, deceleration curves, no generic fonts).
  - Verify all functionality in live browser.
