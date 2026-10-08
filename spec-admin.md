# Technical Specification: Admin Role, RBAC & System Management Console (`admin`)

> **Module:** `admin`  
> **Package / App Targets:** `packages/database`, `packages/types`, `packages/validation`, `apps/api`, `apps/web`  
> **Status:** Draft / Planned  

---

## 1. Overview & Business Objectives

Tarn requires an administrative layer that allows system operators to:
1. **Monitor System Health & Infrastructure Status:** Check live server uptime, process memory metrics (RSS, heap usage), PostgreSQL connection health, query latency, and aggregate platform data volume.
2. **Directory & User Management:** Inspect all registered user accounts, search and filter users, update roles (`USER` vs `ADMIN`), and activate or suspend accounts.
3. **Enforce Role-Based Access Control (RBAC):** Restrict sensitive system diagnostics and user management exclusively to users holding the `ADMIN` role, while ensuring user privacy and tenant data isolation.

---

## 2. Security & Threat Modeling

| Threat Vector | Severity | Mitigation Strategy |
|---|---|---|
| **Privilege Escalation on Registration** | Critical | `registerSchema` only accepts `{ name, email, password }`. The backend strictly assigns `role: Role.USER` and `isActive: true`. |
| **Privilege Escalation on Profile Update** | High | `updateProfileSchema` & `updatePreferencesSchema` strictly disallow modifying `role` or `isActive`. Roles can only be changed via `PATCH /api/v1/admin/users/:id/role`. |
| **Unauthorized Admin Endpoint Access** | Critical | Middleware pipeline requires both `authenticate` (valid JWT + active user) and `requireAdmin` (`req.user.role === 'ADMIN'`). Non-admins receive `403 AUTHORIZATION_ERROR`. |
| **Admin Self-Demotion / Lockout** | High | Service-level guard prevents admins from removing their own admin role or deactivating their own account. Last-admin check prevents demoting/suspending the only remaining active admin. |
| **Suspended Account Access** | High | `authenticate` queries database on each request; if `!user.isActive`, rejects with `401 AUTHENTICATION_ERROR`. Login also checks `isActive`. |
| **Data Leakage via API Envelopes** | Medium | `passwordHash` is never selected in queries. User lists in admin endpoints return metadata and record counts, without exposing personal cover letters or private timeline notes. |

---

## 3. Data Schema & Models

### Prisma (`packages/database/prisma/schema.prisma`)
```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id                 String        @id @default(cuid())
  email              String        @unique
  passwordHash       String
  name               String
  role               Role          @default(USER)
  isActive           Boolean       @default(true)
  headline           String?
  // ... existing fields
}
```

---

## 4. API Contracts (`/api/v1/admin`)

All endpoints require `authenticate` and `requireAdmin`.

### `GET /api/v1/admin/system/status`
Returns:
```json
{
  "data": {
    "status": "healthy",
    "uptimeSeconds": 14250,
    "timestamp": "2026-10-08T19:30:00.000Z",
    "environment": "development",
    "nodeVersion": "v20.15.0",
    "platform": "linux",
    "memory": {
      "rssMb": 64.2,
      "heapTotalMb": 42.1,
      "heapUsedMb": 28.5,
      "externalMb": 4.1
    },
    "database": {
      "status": "connected",
      "latencyMs": 4,
      "counts": {
        "users": 12,
        "activeUsers": 11,
        "applications": 84,
        "companies": 45,
        "jobs": 84,
        "interviews": 22,
        "resumes": 15,
        "contacts": 38
      }
    }
  }
}
```

### `GET /api/v1/admin/users`
Query parameters:
- `page`: number (default 1)
- `limit`: number (default 20, max 100)
- `search`: string (filters name or email)
- `role`: `'USER'` | `'ADMIN'`
- `isActive`: `true` | `false`
- `sortBy`: `'createdAt'` | `'name'` | `'email'`
- `sortOrder`: `'asc'` | `'desc'`

### `GET /api/v1/admin/users/:id`
Returns detailed user profile, activity summary, and counts.

### `PATCH /api/v1/admin/users/:id/role`
Body: `{ "role": "USER" | "ADMIN" }`
Guards: Cannot demote self; cannot demote last active admin.

### `PATCH /api/v1/admin/users/:id/status`
Body: `{ "isActive": boolean }`
Guards: Cannot deactivate self; cannot deactivate last active admin.

---

## 5. Frontend User Experience (`apps/web`)

1. **Sidebar Entry Point:**
   - Appears conditionally under primary navigation only when `user?.role === 'ADMIN'`.
   - Labeled `Admin Console` with administrative shield icon (`ShieldAlert`).
2. **Admin Console Views:**
   - **System Status Tab:** High-density telemetry cards for platform health, DB latency, memory footprint, and global data volume.
   - **Users Tab:** High-density data table with search, role filter, status filter, role promotion/demotion modals, and account suspension toggle with confirmation dialogs.
3. **Route Guarding:**
   - `<AdminRoute>` wraps `/admin` in the router. Non-admin users attempting direct URL access are routed back to `/dashboard`.
