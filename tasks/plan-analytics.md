# Implementation Plan: Job-Search Analytics Hub (`analytics`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Analytics & Insights Hub  
> **Module ID:** `analytics`  
> **Specification:** `spec-analytics.md`  

---

## Task Decomposition

### Task 1: Shared Types & Validation Schemas [COMPLETED]
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/validation/src/analytics.schema.ts`
  - `packages/validation/src/index.ts`
- **Actions:**
  - Define `AnalyticsOverviewDTO` and sub-interfaces (`AnalyticsKpiDTO`, `FunnelStageDTO`, `PlatformMetricDTO`, `WorkSetupMetricDTO`, `VelocityMetricDTO`, `TimingMetricsDTO`, `SalaryInsightsDTO`, `StatusDistributionDTO`) in `packages/types/src/entities.ts`.
  - Create `packages/validation/src/analytics.schema.ts` defining `analyticsQuerySchema`.
  - Re-export in `packages/validation/src/index.ts`.
- **Verification:** `pnpm --filter @tracker/types build; pnpm --filter @tracker/validation build` [PASSED]

### Task 2: Backend Analytics Overview Service, Controller & Tests (TDD) [COMPLETED]
- **Files:**
  - `apps/api/src/modules/analytics/analytics.service.ts`
  - `apps/api/src/modules/analytics/analytics.controller.ts`
  - `apps/api/src/modules/analytics/analytics.routes.ts`
  - `apps/api/tests/analytics.test.ts`
- **Actions:**
  - Implement `analyticsService.getAnalyticsOverview(userId, query)` with multi-tenant filtering, date range handling (`all`, `30d`, `90d`, `ytd`), funnel progression calculation, platform grouping, velocity timeline, timing averages, salary aggregation, and full 12-status distribution.
  - Implement `analyticsController.getOverview` and connect in `analytics.routes.ts`.
  - Write Supertest integration tests in `apps/api/tests/analytics.test.ts` covering:
    - `GET /api/v1/analytics/dashboard` returns expected data
    - `GET /api/v1/analytics/overview` with default range returns all metrics
    - Date range filtering (`30d`, `90d`, `ytd`)
    - Tenant isolation (User B only sees User B's metrics)
    - Safe execution on empty user accounts (zero division guards)
- **Verification:** `pnpm --filter @tracker/api test tests/analytics.test.ts` [5 PASSED]

### Task 3: Frontend Analytics API Client & Visual Components [COMPLETED]
- **Files:**
  - `apps/web/src/features/analytics/api/analytics-api.ts`
  - `apps/web/src/features/analytics/components/analytics-header.tsx`
  - `apps/web/src/features/analytics/components/analytics-kpi-strip.tsx`
  - `apps/web/src/features/analytics/components/analytics-funnel.tsx`
  - `apps/web/src/features/analytics/components/platform-breakdown.tsx`
  - `apps/web/src/features/analytics/components/velocity-trend.tsx`
  - `apps/web/src/features/analytics/components/timing-metrics.tsx`
  - `apps/web/src/features/analytics/components/work-setup-and-salary.tsx`
  - `apps/web/src/features/analytics/components/status-distribution.tsx`
  - `apps/web/src/features/analytics/components/analytics.test.ts`
- **Actions:**
  - Implement `analyticsApi.getOverview(range)` using `apiClient`.
  - Build UI components matching the **Marker** design system:
    - `AnalyticsKpiStrip`: 4 stat cards with Bricolage Grotesque large figures, sentence-case captions, subtle borders.
    - `AnalyticsFunnel`: Visual multi-step conversion funnel with step bars, counts, and conversion percentages.
    - `PlatformBreakdown`: Tabular card showing applications, interview rate, and offer rate per source.
    - `VelocityTrend`: 12-week velocity bar chart with current week marker styling and month view toggle.
    - `TimingMetrics`: Clean metric cards for average response time, interview time, and rejection time.
    - `WorkSetupAndSalary`: Distribution bars for Remote/Hybrid/Onsite and disclosed salary statistics.
    - `StatusDistribution`: Complete 12-status breakdown with `StageRing` shapes.
- **Verification:** `pnpm --filter @tracker/web test` [10 PASSED]

### Task 4: Analytics Page & App Router Integration [COMPLETED]
- **Files:**
  - `apps/web/src/features/analytics/pages/analytics-page.tsx`
  - `apps/web/src/app/router.tsx`
- **Actions:**
  - Build `AnalyticsPage` coordinating state (range selection: `all`, `30d`, `90d`, `ytd`), TanStack Query hooks, loading/error states, and empty state CTA.
  - Register `/analytics` route under `ProtectedRoute` > `AppLayout` in `apps/web/src/app/router.tsx`.
- **Verification:** `pnpm build` [PASSED]

### Task 5: Full Verification, Polish & Verification [COMPLETED]
- **Actions:**
  - Run full monorepo test suite (`pnpm test` - 97 passed across 14 test suites).
  - Run monorepo build (`pnpm build` - all packages built cleanly).
  - Verified Vite dev server compilation of `/analytics` endpoint with 200 OK.

