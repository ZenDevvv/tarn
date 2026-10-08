# Walkthrough: Admin Role, RBAC & System Management Console

We have implemented an end-to-end administrative management tier in **Tarn** with Role-Based Access Control (RBAC), real-time session revocation, telemetry diagnostics, and a Marker-styled Admin Console.

---

## 1. Summary of Changes

### Database & Seed Layer ([`packages/database`](file:///home/machenike/Projects/tarn/packages/database))
- Added `Role` enum (`USER`, `ADMIN`) and `isActive` boolean to `User` model with index `@@index([role])` in [`schema.prisma`](file:///home/machenike/Projects/tarn/packages/database/prisma/schema.prisma).
- Generated and executed migration [`20261008114452_add_user_roles_and_status`](file:///home/machenike/Projects/tarn/packages/database/prisma/migrations/20261008114452_add_user_roles_and_status/migration.sql).
- Updated seed script in [`seed.ts`](file:///home/machenike/Projects/tarn/packages/database/prisma/seed.ts) to seed dedicated admin `admin@example.com` (`password123`) alongside standard applicant `mika@example.com` (`password123`).
- Added standalone CLI tool [`promote-admin.ts`](file:///home/machenike/Projects/tarn/packages/database/scripts/promote-admin.ts) runnable via `pnpm admin:promote <email>`.

### Shared Contracts & Validation ([`packages/types`](file:///home/machenike/Projects/tarn/packages/types), [`packages/validation`](file:///home/machenike/Projects/tarn/packages/validation))
- Exported `Role`, updated [`UserDTO`](file:///home/machenike/Projects/tarn/packages/types/src/entities.ts), and added [`SystemStatusDTO`](file:///home/machenike/Projects/tarn/packages/types/src/entities.ts), `SystemMemoryInfo`, `AdminUserListItemDTO`, and `AdminUserDetailDTO`.
- Defined Zod validation schemas for query filters and role/status mutations in [`admin.schema.ts`](file:///home/machenike/Projects/tarn/packages/validation/src/admin.schema.ts).

### Backend API & Security Layer ([`apps/api`](file:///home/machenike/Projects/tarn/apps/api))
- **Immediate Session Revocation:** Updated [`authenticate.ts`](file:///home/machenike/Projects/tarn/apps/api/src/middleware/authenticate.ts) to query `role` and `isActive` dynamically and reject suspended users with `401 AUTHENTICATION_ERROR`.
- **RBAC Guard:** Implemented [`requireAdmin`](file:///home/machenike/Projects/tarn/apps/api/src/middleware/authorize.ts) middleware rejecting unauthorized roles with `403 AUTHORIZATION_ERROR`.
- **Anti-Lockout Guards:** Added service-level logic in [`admin.service.ts`](file:///home/machenike/Projects/tarn/apps/api/src/modules/admin/admin.service.ts) preventing self-demotion, self-suspension, and eliminating the last remaining active admin.
- **Diagnostics & User Management:** Built repository, service, and controller under [`apps/api/src/modules/admin/`](file:///home/machenike/Projects/tarn/apps/api/src/modules/admin/) and mounted routes on `/api/v1/admin`.

### Frontend Web Client ([`apps/web`](file:///home/machenike/Projects/tarn/apps/web))
- Built typed client [`admin-api.ts`](file:///home/machenike/Projects/tarn/apps/web/src/features/admin/api/admin-api.ts).
- Created route guard [`AdminRoute`](file:///home/machenike/Projects/tarn/apps/web/src/routes/admin-route.tsx) that redirects non-admin users to `/dashboard`.
- Built [`AdminConsolePage`](file:///home/machenike/Projects/tarn/apps/web/src/features/admin/pages/admin-console-page.tsx) featuring:
  - **System Diagnostics Tab:** Live telemetry for platform health, Node runtime, memory consumption, DB ping latency, and aggregate entity counts.
  - **User Directory Tab:** Filterable high-density data table with search, role filters, status filters, and role/status confirmation modals.
- Updated [`AppLayout`](file:///home/machenike/Projects/tarn/apps/web/src/layouts/app-layout.tsx) to conditionally render the "Admin Console" link and an `ADMIN` badge in the user profile area.

---

## 2. Verification Results

### Automated Tests
- **Admin API Test Suite:**
  ```bash
  pnpm --filter @tracker/api test tests/admin.test.ts
  ```
  Result: **14/14 tests passing** (RBAC 401/403, telemetry 200, user directory, role promotion/demotion, self-demotion guard, account suspension, and login blocking).
- **Full Monorepo Test Suite:**
  ```bash
  pnpm test
  ```
  Result: **173/173 tests passing** (121 in `apps/api` across 13 test files, 52 in `apps/web` across 13 test files).
- **Full Monorepo Build:**
  ```bash
  pnpm build
  ```
  Result: **Clean build across all 5 workspace projects** (`@tracker/types`, `@tracker/validation`, `@tracker/database`, `@tracker/api`, `@tracker/web`).

---

## 3. Manual Verification Steps

1. **Verify Regular User Restriction:**
   - Log in with `mika@example.com` / `password123`.
   - Verify that **Admin Console** is not visible in the sidebar.
   - Manually navigate to `/admin` in the URL bar — verify you are redirected to `/dashboard`.
2. **Verify Admin Access & Diagnostics:**
   - Log in with `admin@example.com` / `password123`.
   - Verify that **Admin Console** is visible in the sidebar with an administrative shield icon and the user avatar has an `ADMIN` badge.
   - Click **Admin Console** and inspect the **Diagnostics** tab (verify real-time DB latency, uptime, memory, and database volume counters).
3. **Verify User Management & Anti-Lockout:**
   - Switch to the **Users** tab.
   - Try to change your own role (notice the self-demotion protection warning and disabled button).
   - Change `Mika Santos` role to `ADMIN` and verify the badge updates.
   - Suspend a user, and attempt logging in with that user in an incognito window (verify the account suspension error message).
