# Implementation Plan: Admin Role, RBAC & System Management Console

> **Objective:** Introduce an `ADMIN` role with Role-Based Access Control (RBAC) across Tarn, enabling authorized administrators to inspect real-time system status (diagnostics, memory, DB latency, global metrics) and manage user accounts (roles, activation/suspension) via secure endpoints and a dedicated Marker-styled Admin Console.

---

## 1. Verified Architecture & Security Matrix

```
                              ┌──────────────────────────────────────────────┐
                              │                 Web Client                   │
                              └──────────────────────┬───────────────────────┘
                                                     │
                                       Cookie: token (HTTP-Only)
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │             authenticate Middleware          │
                              │  - Validates JWT session                     │
                              │  - Queries DB: id, email, name, role, isActive│
                              │  - If !isActive: 401 Account Suspended       │
                              └──────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │             requireAdmin Middleware          │
                              │  - Checks req.user.role === 'ADMIN'          │
                              │  - If false: 403 AUTHORIZATION_ERROR         │
                              └──────────────────────┬───────────────────────┘
                                                     │
                         ┌───────────────────────────┴───────────────────────────┐
                         ▼                                                       ▼
       ┌───────────────────────────────────┐                   ┌───────────────────────────────────┐
       │     System Diagnostics API        │                   │       User Management API         │
       │  - GET /api/v1/admin/system/status│                   │  - GET /api/v1/admin/users        │
       │  (Health, DB Latency, Memory,     │                   │  - GET /api/v1/admin/users/:id    │
       │   Global Platform Counts)         │                   │  - PATCH .../users/:id/role       │
       │                                   │                   │  - PATCH .../users/:id/status     │
       └───────────────────────────────────┘                   └───────────────────────────────────┘
```

### Security & Integrity Non-Negotiables
1. **Privilege Escalation Prevention:**
   - Registration (`POST /api/v1/auth/register`) strictly sets `role: Role.USER` and `isActive: true`. Incoming payloads are validated via Zod and extra fields are discarded.
   - Profile update (`PATCH /api/v1/settings/profile`) and preferences update (`PATCH /api/v1/settings/preferences`) cannot mutate `role` or `isActive`.
   - Role updates are exclusively reachable through `PATCH /api/v1/admin/users/:id/role`.
2. **Immediate Session Revocation (No Stale JWTs):**
   - Because `authenticate` checks `prisma.user.findUnique` on every incoming request, account deactivations or role changes take effect **instantly on the next request**.
3. **Anti-Lockout Safeguards:**
   - **Self-Demotion Block:** An admin cannot demote their own account.
   - **Self-Suspension Block:** An admin cannot deactivate/suspend their own account.
   - **Last-Admin Guard:** The system enforces that the count of active administrators cannot drop below 1.
4. **Tenant Data Isolation:**
   - ATS applications, jobs, interviews, and contacts remain strictly isolated per `userId`. The admin role does not blend regular ATS pipeline records.

---

## 2. Phased Execution Tasks

### Phase 1: Database & Seed (`packages/database`)
- [x] Add `Role` enum (`USER`, `ADMIN`) to [`schema.prisma`](file:///home/machenike/Projects/tarn/packages/database/prisma/schema.prisma).
- [x] Add `role Role @default(USER)` and `isActive Boolean @default(true)` to `User` model with index `@@index([role])`.
- [x] Run migration: `20261008114452_add_user_roles_and_status`.
- [x] Update [`seed.ts`](file:///home/machenike/Projects/tarn/packages/database/prisma/seed.ts) to seed `admin@example.com` (`password123`) with `role = Role.ADMIN` and keep `mika@example.com` as `role = Role.USER`.
- [x] Add standalone CLI utility `packages/database/scripts/promote-admin.ts` (executable via `pnpm admin:promote <email>`).

### Phase 2: Shared Types & Validation (`packages/types`, `packages/validation`)
- [x] Export `Role` (`'USER' | 'ADMIN'`) in [`packages/types/src/entities.ts`](file:///home/machenike/Projects/tarn/packages/types/src/entities.ts).
- [x] Update `UserDTO` to include `role: Role` and `isActive: boolean`.
- [x] Define `SystemStatusDTO`, `SystemMemoryInfo`, `AdminUserListItemDTO`, and `AdminUserDetailDTO` in [`packages/types/src/entities.ts`](file:///home/machenike/Projects/tarn/packages/types/src/entities.ts).
- [x] Create [`packages/validation/src/admin.schema.ts`](file:///home/machenike/Projects/tarn/packages/validation/src/admin.schema.ts) with `adminUsersQuerySchema`, `updateUserRoleSchema`, and `updateUserStatusSchema`.
- [x] Re-export schemas in [`packages/validation/src/index.ts`](file:///home/machenike/Projects/tarn/packages/validation/src/index.ts).

### Phase 3: Backend Auth, Middleware & Admin Module (`apps/api`)
- [x] Update `AuthUser` in [`apps/api/src/middleware/authenticate.ts`](file:///home/machenike/Projects/tarn/apps/api/src/middleware/authenticate.ts) to include `role` and `isActive`. Enforce `if (!user.isActive) throw new AuthenticationError('Account has been suspended')`.
- [x] Create [`apps/api/src/middleware/authorize.ts`](file:///home/machenike/Projects/tarn/apps/api/src/middleware/authorize.ts) with `requireRole` and `requireAdmin`.
- [x] Update [`apps/api/src/modules/auth/auth.service.ts`](file:///home/machenike/Projects/tarn/apps/api/src/modules/auth/auth.service.ts) to check `isActive` on login and return `role` & `isActive` in `user` responses.
- [x] Implement `admin.repository.ts`, `admin.service.ts`, and `admin.controller.ts` under [`apps/api/src/modules/admin/`](file:///home/machenike/Projects/tarn/apps/api/src/modules/admin/):
  - `GET /api/v1/admin/system/status` (Health, uptime, memory, DB latency, platform counts)
  - `GET /api/v1/admin/users` (Search, role/active filters, pagination, user counts)
  - `GET /api/v1/admin/users/:id` (User detail & statistics)
  - `PATCH /api/v1/admin/users/:id/role` (Role update with self-demotion and last-admin guards)
  - `PATCH /api/v1/admin/users/:id/status` (Account suspension with self-suspension and last-admin guards)
- [x] Mount `adminRouter` in [`apps/api/src/app.ts`](file:///home/machenike/Projects/tarn/apps/api/src/app.ts).
- [x] Author comprehensive Supertest test suite in [`apps/api/tests/admin.test.ts`](file:///home/machenike/Projects/tarn/apps/api/tests/admin.test.ts).

### Phase 4: Frontend API, Route Guard & Marker Admin Console (`apps/web`)
- [x] Create [`apps/web/src/features/admin/api/admin-api.ts`](file:///home/machenike/Projects/tarn/apps/web/src/features/admin/api/admin-api.ts) for typed API communication.
- [x] Create [`apps/web/src/routes/admin-route.tsx`](file:///home/machenike/Projects/tarn/apps/web/src/routes/admin-route.tsx) verifying `user?.role === 'ADMIN'`.
- [x] Build [`apps/web/src/features/admin/pages/admin-console-page.tsx`](file:///home/machenike/Projects/tarn/apps/web/src/features/admin/pages/admin-console-page.tsx):
  - **System Diagnostics Tab:** Telemetry cards for uptime, Node/Platform info, Memory metrics (Heap/RSS), DB ping latency, and global platform volume.
  - **Users Directory Tab:** Filterable high-density data table (Search, Role, Status filters, User profile summary, application counts).
  - **Action Dialogs:** Confirmation modals for role updates (with self-demotion warnings) and account activation/suspension.
- [x] Update [`apps/web/src/layouts/app-layout.tsx`](file:///home/machenike/Projects/tarn/apps/web/src/layouts/app-layout.tsx):
  - Conditionally render `Admin Console` in the sidebar navigation when `user?.role === 'ADMIN'`.
  - Add an `ADMIN` visual indicator badge next to user profile display.
- [x] Mount `/admin` in [`apps/web/src/app/router.tsx`](file:///home/machenike/Projects/tarn/apps/web/src/app/router.tsx).

### Phase 5: Verification & Quality Gates
- [x] Run backend admin test suite (`pnpm --filter @tracker/api test tests/admin.test.ts` - 14/14 tests passing).
- [x] Run full monorepo test suite (`pnpm test` - all 173 tests passing cleanly across 26 suites).
- [x] Run full monorepo build verification (`pnpm build` - all packages and applications compiled).

---

## 3. Verification Matrix

| Test Scenario | Expected Outcome | Verification Tool |
|---|---|---|
| Unauthenticated request to `/api/v1/admin/system/status` | `401 AUTHENTICATION_ERROR` | Supertest (`admin.test.ts`) |
| Regular user (`mika@example.com`) requesting `/api/v1/admin/*` | `403 AUTHORIZATION_ERROR` | Supertest (`admin.test.ts`) |
| Admin requesting `/api/v1/admin/system/status` | `200 OK` with latency, uptime, memory, counts | Supertest (`admin.test.ts`) |
| Admin listing users with search/filter | `200 OK` with paginated user list | Supertest (`admin.test.ts`) |
| Admin promotes user to `ADMIN` | `200 OK`, user role updated | Supertest (`admin.test.ts`) |
| Admin demotes themselves | `400 BAD_REQUEST`, blocked | Supertest (`admin.test.ts`) |
| Admin demotes the last remaining admin | `400 BAD_REQUEST`, blocked | Supertest (`admin.test.ts`) |
| Admin suspends a user | `200 OK`, `isActive = false` | Supertest (`admin.test.ts`) |
| Suspended user attempts login | `401 AUTHENTICATION_ERROR`, blocked | Supertest (`admin.test.ts`) |
| Suspended user sends cookie to protected route | `401 AUTHENTICATION_ERROR`, blocked immediately | Supertest (`admin.test.ts`) |
| Admin suspends themselves | `400 BAD_REQUEST`, blocked | Supertest (`admin.test.ts`) |
| Non-admin user views sidebar | `Admin Console` is hidden | Manual & React test |
| Non-admin navigates to `/admin` URL | Redirected to `/dashboard` | Manual & React test |
| Admin navigates to `/admin` URL | Renders Marker Admin Console with live telemetry & user table | Manual inspection |
