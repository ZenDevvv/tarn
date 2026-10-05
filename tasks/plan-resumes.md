# Implementation Plan: Resume Version Management & Application Linking (`resumes`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Resume Version Management  
> **Module ID:** `resumes`  
> **Specification:** `spec-resumes.md`  

---

## Task Decomposition

### Task 1: Database Model & Prisma Migration
- **Files:** `packages/database/prisma/schema.prisma`
- **Actions:**
  - Add `Resume` model with fields `id`, `userId`, `name`, `version`, `targetRole`, `fileUrl`, `filename`, `fileSize`, `mimeType`, `isDefault`, `skills`, `notes`, `createdAt`, `updatedAt`.
  - Add `resumeId` foreign key and relation to `Application` model (`resume Resume? @relation(fields: [resumeId], references: [id], onDelete: SetNull)`).
  - Add `resumes Resume[]` relation on `User`.
  - Add index on `[userId]`, `[userId, isDefault]`, and `[resumeId]` on `Application`.
  - Run Prisma migration (`pnpm --filter @tracker/database prisma migrate dev --name add_resumes`) and generate client.
- **Verification:** Prisma schema validates and compiles cleanly.

### Task 2: Shared Types & Validation Schemas
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/validation/src/resume.schema.ts`
  - `packages/validation/src/index.ts`
- **Actions:**
  - Export `ResumeDTO` and `ResumeWithDetailsDTO` from `packages/types/src/entities.ts`.
  - Create `resume.schema.ts` in `packages/validation` exporting `createResumeSchema`, `updateResumeSchema`, `resumeFiltersSchema`.
  - Export schemas from `packages/validation/src/index.ts`.
- **Verification:** Workspace type check (`pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`).

### Task 3: Backend Resumes Module (TDD: Red ➔ Green ➔ Refactor)
- **Files:**
  - `apps/api/tests/resumes.test.ts`
  - `apps/api/src/modules/resumes/resume.repository.ts`
  - `apps/api/src/modules/resumes/resume.service.ts`
  - `apps/api/src/modules/resumes/resume.controller.ts`
  - `apps/api/src/modules/resumes/resume.routes.ts`
  - `apps/api/src/app.ts` (mount `/api/v1/resumes` and static upload directory `/uploads`)
- **Actions:**
  - Write Supertest test cases in `apps/api/tests/resumes.test.ts` covering:
    - User-scoped `GET /api/v1/resumes` (list with filters, search, and application stats)
    - `GET /api/v1/resumes/:id` (single resume with application details)
    - `POST /api/v1/resumes` (create resume, unsetting previous default if isDefault is true)
    - `PATCH /api/v1/resumes/:id` (update resume)
    - `POST /api/v1/resumes/:id/default` (set as default)
    - `DELETE /api/v1/resumes/:id` (delete resume, setting application.resumeId to null)
    - `POST /api/v1/resumes/upload` (base64/data-url file upload with file type & size validation)
    - Cross-user tenant isolation guards (User B cannot read/modify User A's resumes)
  - Implement repository, service, controller, and routes.
- **Verification:** Run `pnpm --filter @tracker/api test` (all tests pass).

### Task 4: Frontend API Client
- **Files:**
  - `apps/web/src/features/resumes/api/resume-api.ts`
- **Actions:**
  - Implement `resumeApi`: `getResumes`, `getResume`, `createResume`, `updateResume`, `setDefaultResume`, `deleteResume`, `uploadResumeFile`.
- **Verification:** Workspace type check.

### Task 5: Frontend UI Components (Marker Design System)
- **Files:**
  - `apps/web/src/features/resumes/components/resume-card.tsx`
  - `apps/web/src/features/resumes/components/resume-filters.tsx`
  - `apps/web/src/features/resumes/components/resume-form-modal.tsx`
  - `apps/web/src/features/resumes/components/resume-detail-modal.tsx`
- **Actions:**
  - Build `ResumeCard` matching Marker aesthetic: title in `Bricolage Grotesque`, version tag, target role badge, preview/download action, default star/marker indicator, and linked applications pill list.
  - Build `ResumeFilters` with search and target role dropdown.
  - Build `ResumeFormModal` supporting drag-and-drop file upload or document link, title, version, target role, skill tags, tailoring notes, and default toggle.
  - Build `ResumeDetailModal` with full document details, file preview/download, and linked applications with StageRings.

### Task 6: Resumes Page & Navigation Integration
- **Files:**
  - `apps/web/src/features/resumes/pages/resumes-page.tsx`
  - `apps/web/src/app/router.tsx`
  - `apps/web/src/layouts/app-layout.tsx`
- **Actions:**
  - Assemble `ResumesPage` with stats ribbon (Total Resumes, Primary Resume, Linked Applications, Target Roles), filter bar, and empty state.
  - Register `/resumes` route in `AppRouter`.
  - Wire dynamic badge count for Resumes in `AppLayout`.

### Task 7: Application Detail Integration
- **Files:**
  - `apps/web/src/features/applications/pages/application-detail-page.tsx`
  - `apps/web/src/features/applications/components/application-card.tsx`
- **Actions:**
  - Display the linked resume version on the application detail page with direct link/download to the resume.
  - Allow selecting resume version when editing or creating an application.

### Task 8: Full Verification & Polish
- **Files:** All modified files
- **Actions:**
  - Run full automated test suite: `pnpm test`.
  - Run production build: `pnpm build`.
  - Verify visually and interactively in browser.
