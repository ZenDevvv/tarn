# Implementation Plan: Cloud Hardening, HTTP Defense & Observability

> **Objective:** Harden Tarn for production cloud deployment by implementing HTTP security defense (`helmet`, tiered `express-rate-limit`, proxy trust, payload isolation), structured JSON logging and request tracing (`pino`, `pino-http`, correlation IDs), cloud health probes (`/health/ready`), and an immutable administrative `AuditLog` trail.

---

## User Review Required

> [!IMPORTANT]
> **New Production Dependencies:**
> - `helmet`: Standard OWASP security headers (`nosniff`, `X-Frame-Options`, `HSTS`, `Referrer-Policy`, hides `X-Powered-By`).
> - `express-rate-limit`: In-memory IP rate limiter protecting `/auth/*`, `/applications/parse-job-url`, and general API routes.
>
> *(Note: `pino`, `pino-http`, and `pino-pretty` are already installed in `apps/api/package.json` and will now be actively configured and used).*

> [!WARNING]
> **Rate Limiter Test Environment Guard:**
> To ensure test suites never flake or trigger HTTP 429 during automated testing, all rate limiters will automatically bypass when `NODE_ENV === 'test'`. A dedicated test file (`security.test.ts`) will test rate limiting in an isolated environment.

> [!IMPORTANT]
> **Database Migration:**
> Adding `AuditAction` enum and `AuditLog` model to PostgreSQL. Records administrative operations (role promotions/demotions, account suspensions) with actor ID, target ID, client IP, user agent, diff details, and timestamp.

---

## Architecture & Data Flow

```
                      ┌──────────────────────────────────────────────┐
                      │          Cloud Reverse Proxy / Ingress       │
                      │       (AWS ALB, Cloudflare, Cloud Run)       │
                      └──────────────────────┬───────────────────────┘
                                             │  x-forwarded-for, x-request-id
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │            Express Application               │
                      │  - app.set('trust proxy', 1)                 │
                      │  - helmet() security headers                 │
                      │  - pino-http structured request logger       │
                      │  - express.json({ limit: '100kb' })          │
                      └──────────────────────┬───────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │     Security Limiters     │               │    Cloud Health Probes    │
         │ - authLimiter (10/15m)    │               │ - GET /api/v1/health/live │
         │ - scraperLimiter (15/1m)  │               │ - GET /api/v1/health/ready│
         │ - apiLimiter (120/1m)     │               │   (tests DB connection)   │
         └─────────────┬─────────────┘               └───────────────────────────┘
                       │
                       ▼
         ┌───────────────────────────┐
         │     Administrative API    │
         │ - PATCH .../role          │───▶ Writes AuditLog record
         │ - PATCH .../status        │     (actor, target, action, diff, IP)
         └───────────────────────────┘
```

---

## Proposed Changes

---

### Component 1: Database & Audit Logging (`packages/database`)

#### [MODIFY] [`schema.prisma`](file:///home/machenike/Projects/tarn/packages/database/prisma/schema.prisma)
- Add `AuditAction` enum:
  ```prisma
  enum AuditAction {
    USER_ROLE_UPDATED
    USER_STATUS_UPDATED
  }
  ```
- Add `AuditLog` model:
  ```prisma
  model AuditLog {
    id        String      @id @default(cuid())
    actorId   String
    action    AuditAction
    targetId  String?
    ipAddress String?
    userAgent String?
    details   Json?
    createdAt DateTime    @default(now())

    actor User @relation("UserAuditLogs", fields: [actorId], references: [id], onDelete: Cascade)

    @@index([actorId])
    @@index([action])
    @@index([createdAt])
    @@map("audit_logs")
  }
  ```
- Add relation to `User` model:
  ```prisma
  auditLogs AuditLog[] @relation("UserAuditLogs")
  ```
- Create migration: `add_audit_logs`.

---

### Component 2: Shared Contracts (`packages/types`)

#### [MODIFY] [`entities.ts`](file:///home/machenike/Projects/tarn/packages/types/src/entities.ts)
- Add `AuditAction` and `AuditLogDTO`:
  ```ts
  export type AuditAction = 'USER_ROLE_UPDATED' | 'USER_STATUS_UPDATED';

  export interface AuditLogDTO {
    id: string;
    actorId: string;
    actorEmail?: string;
    action: AuditAction;
    targetId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: Record<string, any> | null;
    createdAt: string;
  }
  ```

---

### Component 3: Backend Security & Observability (`apps/api`)

#### [MODIFY] [`package.json`](file:///home/machenike/Projects/tarn/apps/api/package.json)
- Add dependencies:
  - `helmet`: `^8.0.0`
  - `express-rate-limit`: `^7.4.1`

#### [NEW] [`logger.ts`](file:///home/machenike/Projects/tarn/apps/api/src/lib/logger.ts)
- Initialize Pino logger:
  - When `NODE_ENV === 'production'`: Pure structured JSON output suitable for cloud logging aggregators (CloudWatch, GCP Cloud Logging, Datadog).
  - When `NODE_ENV === 'development'`: Formatted output via `pino-pretty`.
  - When `NODE_ENV === 'test'`: Silent or error-only log level.

#### [NEW] [`rate-limit.ts`](file:///home/machenike/Projects/tarn/apps/api/src/middleware/rate-limit.ts)
- Implement tiered rate limiters using `express-rate-limit`:
  - `authLimiter`: Max 10 requests per 15 minutes per IP (protects `/auth/login` and `/auth/register`).
  - `scraperLimiter`: Max 15 requests per minute per IP (protects `/applications/parse-job-url`).
  - `apiLimiter`: Max 120 requests per minute per IP for general API routes.
  - Standard headers: `draft-7` (`RateLimit-*` headers enabled).
  - Bypasses automatically in `test` environment (`skip: () => env.NODE_ENV === 'test'`).

#### [NEW] [`audit.service.ts`](file:///home/machenike/Projects/tarn/apps/api/src/modules/admin/audit.service.ts)
- Helper service for recording audit logs:
  ```ts
  export const auditService = {
    async log(data: {
      actorId: string;
      action: AuditAction;
      targetId?: string;
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, any>;
    }) {
      return prisma.auditLog.create({ data });
    },
    async list(page = 1, limit = 20) {
      // Query recent audit logs with pagination
    }
  };
  ```

#### [MODIFY] [`admin.service.ts`](file:///home/machenike/Projects/tarn/apps/api/src/modules/admin/admin.service.ts)
- Record audit log entries during `updateUserRole` and `updateUserStatus`.

#### [MODIFY] [`error-handler.ts`](file:///home/machenike/Projects/tarn/apps/api/src/middleware/error-handler.ts)
- Replace raw `console.error` with structured `logger.error`:
  - Log error stack, route path, HTTP method, client IP, and request ID.
  - Return `requestId` in 500 `INTERNAL_SERVER_ERROR` JSON response for instant log correlation.

#### [MODIFY] [`app.ts`](file:///home/machenike/Projects/tarn/apps/api/src/app.ts)
- Configure `app.set('trust proxy', 1)`.
- Mount `helmet()`.
- Mount `pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID() })`.
- Set global JSON parser limit to `100kb`.
- Apply `apiLimiter` globally to `/api/v1`.
- Apply `authLimiter` to `/api/v1/auth`.
- Add cloud health probes:
  - `GET /api/v1/health` & `GET /api/v1/health/live` (Liveness: 200 OK).
  - `GET /api/v1/health/ready` (Readiness: queries DB `SELECT 1`; returns 200 if connected, 503 if unreachable).

#### [MODIFY] [`resume.routes.ts`](file:///home/machenike/Projects/tarn/apps/api/src/modules/resumes/resume.routes.ts)
- Apply explicit `express.json({ limit: '15mb' })` specifically on the upload route `/resumes/upload`.

#### [MODIFY] [`server.ts`](file:///home/machenike/Projects/tarn/apps/api/src/server.ts)
- Implement robust graceful shutdown:
  - Stop accepting new HTTP connections via `server.close()`.
  - Disconnect database client via `await prisma.$disconnect()`.
  - Handle `uncaughtException` and `unhandledRejection` with structured fatal logs.
  - Force process exit after 10 seconds if connections fail to terminate cleanly.

#### [NEW] [`security.test.ts`](file:///home/machenike/Projects/tarn/apps/api/tests/security.test.ts)
- Supertest integration tests verifying:
  - Security headers present (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN/DENY`, `Strict-Transport-Security`).
  - Absence of `X-Powered-By` header.
  - Health liveness (200) and readiness (200 with DB ping, 503 on disconnected DB).
  - AuditLog creation when admin changes role or status.
  - Request ID propagation in responses and error envelopes.

---

## Verification Plan

### Automated Tests
1. **Security & Readiness Test Suite:**
   ```bash
   pnpm --filter @tracker/api test tests/security.test.ts
   ```
   - Verifies HTTP security headers, health probes, audit log recording, and request ID propagation.
2. **Full Monorepo Test Suite:**
   ```bash
   pnpm test
   ```
   - Verifies all existing 173 tests continue to pass with 0 regressions.
3. **Workspace Build Verification:**
   ```bash
   pnpm build
   ```
   - Verifies TypeScript compilation across all packages and apps.

### Manual Verification
1. **Inspect HTTP Response Headers:**
   - Execute `curl -I http://localhost:4000/api/v1/health`:
   - Verify `x-content-type-options: nosniff` is present.
   - Verify `x-powered-by` is absent.
   - Verify `x-request-id` is returned.
2. **Inspect Readiness Probe:**
   - Execute `curl http://localhost:4000/api/v1/health/ready`:
   - Verify 200 response with `{ status: "ready", database: "connected" }`.
3. **Inspect Structured Logs:**
   - Run API in dev (`pnpm --filter @tracker/api dev`), make a request, and verify formatted pino HTTP logs with response duration and status.
4. **Inspect Administrative Audit Log:**
   - Change a user's role from the Admin Console.
   - Inspect PostgreSQL `audit_logs` table and confirm the action, actor ID, and metadata diff were saved.
