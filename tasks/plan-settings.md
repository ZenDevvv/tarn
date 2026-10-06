# Implementation Plan: Account Settings, Profile & Preferences (`settings`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 12 — Account Settings & User Preferences  
> **Module ID:** `settings`  
> **Specification:** `spec-settings.md`  

---

## Task Decomposition

### Task 12.1: Prisma Schema Migration for User Profile & Settings [COMPLETED]
- **Files:**
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/migrations/`
- **Actions:**
  - Add profile and preference fields to `User` model: `headline`, `location`, `timezone`, `phone`, `website`, `linkedinUrl`, `bio`, `defaultCurrency`, `defaultWorkSetup`, `defaultResumeId`, `emailNotifications`, `interviewReminders`, `followUpAlerts`, `weeklyDigest`, `themePreference`.
  - Run `prisma migrate dev --name add_settings` to generate and apply migration.
  - Re-generate Prisma Client.
- **Verification:** `pnpm --filter @tracker/database exec prisma migrate status` [PASSED]

### Task 12.2: Shared Types & Validation Schemas [COMPLETED]
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/types/src/index.ts`
  - `packages/validation/src/settings.schema.ts`
  - `packages/validation/src/index.ts`
- **Actions:**
  - Define `UserSettingsDTO`, `UpdateProfileInput`, `UpdatePreferencesInput`, `ChangePasswordInput`, `UserDataExportDTO` in `packages/types/src/entities.ts`.
  - Create `packages/validation/src/settings.schema.ts` with `updateProfileSchema`, `updatePreferencesSchema`, `changePasswordSchema`.
  - Export all schemas and types in package index files.
- **Verification:** `pnpm --filter @tracker/types build; pnpm --filter @tracker/validation build` [PASSED]

### Task 12.3: Backend Settings Module & Automated Integration Tests (TDD) [COMPLETED]
- **Files:**
  - `apps/api/src/modules/settings/settings.service.ts`
  - `apps/api/src/modules/settings/settings.controller.ts`
  - `apps/api/src/modules/settings/settings.routes.ts`
  - `apps/api/src/app.ts`
  - `apps/api/tests/settings.test.ts`
- **Actions:**
  - Implement `settingsService`:
    - `getSettings(userId)`: retrieves user profile, preferences, default resume name, and total counts.
    - `updateProfile(userId, input)`: updates profile fields.
    - `updatePreferences(userId, input)`: updates preferences fields.
    - `changePassword(userId, input)`: verifies current password with bcrypt, updates password hash.
    - `exportUserData(userId)`: extracts all applications, jobs, companies, contacts, interviews, follow-ups, resumes for the user.
  - Implement `settingsController` and `settingsRouter`.
  - Register `/api/v1/settings` in `apps/api/src/app.ts`.
  - Write Supertest test suite `apps/api/tests/settings.test.ts` covering:
    - `GET /api/v1/settings` returns current profile, preferences, and counts
    - `PATCH /api/v1/settings/profile` updates profile fields
    - `PATCH /api/v1/settings/preferences` updates preference toggles
    - `POST /api/v1/settings/password` rejects incorrect current password
    - `POST /api/v1/settings/password` succeeds with valid password and allows subsequent login
    - `GET /api/v1/settings/export` outputs complete user data JSON archive
    - Strict authentication and multi-tenant isolation
- **Verification:** `pnpm --filter @tracker/api test tests/settings.test.ts` [9 PASSED]

### Task 12.4: Frontend UI Components, Settings Page & Router Integration [COMPLETED]
- **Files:**
  - `apps/web/src/features/settings/api/settings-api.ts`
  - `apps/web/src/features/settings/components/settings-nav.tsx`
  - `apps/web/src/features/settings/components/profile-section.tsx`
  - `apps/web/src/features/settings/components/preferences-section.tsx`
  - `apps/web/src/features/settings/components/security-section.tsx`
  - `apps/web/src/features/settings/components/data-section.tsx`
  - `apps/web/src/features/settings/pages/settings-page.tsx`
  - `apps/web/src/features/settings/settings.test.ts`
  - `apps/web/src/app/router.tsx`
  - `apps/web/src/features/auth/context/auth-context.tsx` (refresh user on profile update)
- **Actions:**
  - Implement `settingsApi` with TanStack Query hooks.
  - Build UI components adhering strictly to the **Marker** design system (Bricolage Grotesque titles, sentence case, hairline borders, responsive desktop & mobile tabs).
  - Register `/settings` route in `apps/web/src/app/router.tsx`.
  - Connect user profile refresh so sidebar name updates instantly on profile save.
- **Verification:** `pnpm --filter @tracker/web test && pnpm --filter @tracker/web build` [15 PASSED]

### Task 12.5: Full Verification, Accessibility & End-to-End Polish [COMPLETED]
- **Files:**
  - Workspace test suites
- **Actions:**
  - Run full test suite across monorepo packages.
  - Verify clean production build.
  - Verify light and dark mode appearance and mobile responsive layout.
- **Verification:** `pnpm test && pnpm build` [111 tests passing, 0 build errors]

