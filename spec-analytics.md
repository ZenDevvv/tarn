# Specification: Job-Search Analytics Hub (`analytics`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Analytics & Insights Hub  
> **Module ID:** `analytics`  
> **Design System:** **Marker** (`app/DESIGN.md`, `app/index.css`, `app/stage-ring.tsx`)  
> **Source Documents:** `app/job-application-tracker-brd-prd.md` (§7.18), `app/job-application-tracker-project-architecture.md` (§49, §50), `app/DESIGN.md`  
> **Status:** Approved Specification  

---

## 1. Overview & Objective

The **Analytics Hub** (`/analytics`) provides comprehensive, descriptive job-search intelligence to help candidates understand their application pipeline dynamics, funnel conversion efficiency, platform performance, and velocity over time.

Per **§7.18 of the PRD** and **Marker Design System standards**:
- Analytics are **descriptive of historical data**. The system presents empirical facts without predictive claims (e.g., never saying "LinkedIn is better than Indeed").
- Computations occur **server-side** in PostgreSQL / Node.js to ensure high performance and zero client-side calculation lag.
- Visualizations follow **Marker design principles**:
  - Numbers big, labels small (`text-title` for stats, `text-small`/`text-caption` for metrics).
  - Surfaces separated by tone and hairlines (`border-border`), no 1px card-nesting inside cards.
  - Native platform SVG and CSS layouts (responsive, accessible, lightweight).
  - Status as shape: `StageRing` integration.
  - Budgeted `.marker` highlighter for key achievements (e.g. offers, top response platforms).

---

## 2. Scope & Boundaries

### In Scope
1. **Time Range Filtering:** Query parameter `?range=all|30d|90d|ytd` allowing candidates to inspect all-time performance or focused recent windows.
2. **Core KPIs Strip:**
   - Total applications (with active pipeline subtext)
   - Response rate (% and count moved past applied)
   - Interview rate (% and count reaching interview rounds)
   - Offer rate (% and count receiving offers)
3. **Application Conversion Funnel:**
   - 6-stage progressive funnel:
     1. Applied (`APPLIED` and beyond)
     2. Response Received (`APPLICATION_VIEWED`, `RECRUITER_CONTACTED`, and beyond)
     3. HR Screening (`HR_INTERVIEW` and beyond)
     4. Technical Round (`TECHNICAL_INTERVIEW` and beyond)
     5. Final Interview (`FINAL_INTERVIEW` and beyond)
     6. Offer (`OFFER`, `ACCEPTED`)
   - For each stage: absolute count, percentage of total applied, and step-to-step conversion/drop-off rate.
4. **Platform / Source Breakdown:**
   - Volume, interviews, offers, and interview conversion rate grouped by job board / source (LinkedIn, Indeed, JobStreet, Referral, etc.).
5. **Velocity & Activity Trends:**
   - Applications per week (12-week timeline).
   - Applications per month (6-month distribution).
6. **Timing & Cycle Velocity:**
   - Average days from application to first response.
   - Average days from application to first interview.
   - Average days from application to closure / rejection.
7. **Work Setup & Salary Insights:**
   - Applications and interview conversion by work setup (Remote, Hybrid, On-site).
   - Average advertised salary range and disclosed salary percentage.
8. **Comprehensive Status Distribution:**
   - All 12 ATS stages with counts, percentages, and `StageRing` visual shapes.
9. **Responsive & Accessible Design:**
   - Clean layout down to 360px mobile viewports.
   - Proper ARIA descriptions on visual charts and full keyboard accessibility.

### Out of Scope
- Predictive AI modeling or speculative hiring chance estimation.
- External analytics tracker scripts or cookies.
- PDF export (deferred to future reporting phase).

---

## 3. Data Contracts & Schemas

### 3.1 Query Parameter Validation Schema (`packages/validation/src/analytics.schema.ts`)

```typescript
import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  range: z.enum(['all', '30d', '90d', 'ytd']).default('all'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
```

### 3.2 Analytics DTO Contracts (`packages/types/src/entities.ts`)

```typescript
export interface AnalyticsKpiDTO {
  totalApplications: number;
  activeApplications: number;
  closedApplications: number;
  responseCount: number;
  responseRate: number; // 0-100, 1 decimal
  interviewCount: number;
  interviewRate: number; // 0-100, 1 decimal
  offerCount: number;
  offerRate: number; // 0-100, 1 decimal
  rejectionCount: number;
  rejectionRate: number; // 0-100, 1 decimal
}

export interface FunnelStageDTO {
  id: string;
  name: string;
  count: number;
  conversionFromTotal: number; // 0-100%
  stepConversion: number; // 0-100% of previous step
}

export interface PlatformMetricDTO {
  platform: string;
  totalApplications: number;
  activeCount: number;
  interviewCount: number;
  offerCount: number;
  interviewRate: number; // 0-100%
  offerRate: number; // 0-100%
}

export interface WorkSetupMetricDTO {
  setup: WorkSetup | 'UNSPECIFIED';
  label: string;
  count: number;
  percentage: number;
  interviewCount: number;
  interviewRate: number;
}

export interface VelocityMetricDTO {
  label: string;
  count: number;
  isCurrent?: boolean;
}

export interface TimingMetricsDTO {
  avgDaysToResponse: number | null;
  avgDaysToInterview: number | null;
  avgDaysToRejection: number | null;
}

export interface SalaryInsightsDTO {
  disclosedCount: number;
  disclosedPercentage: number;
  avgSalaryMin: number | null;
  avgSalaryMax: number | null;
  currency: string;
}

export interface StatusDistributionDTO {
  status: ApplicationStatus;
  count: number;
  percentage: number;
}

export interface AnalyticsOverviewDTO {
  range: 'all' | '30d' | '90d' | 'ytd';
  rangeLabel: string;
  kpis: AnalyticsKpiDTO;
  funnel: FunnelStageDTO[];
  platforms: PlatformMetricDTO[];
  workSetups: WorkSetupMetricDTO[];
  weeklyVelocity: VelocityMetricDTO[];
  monthlyVelocity: VelocityMetricDTO[];
  timing: TimingMetricsDTO;
  salaryInsights: SalaryInsightsDTO;
  statusDistribution: StatusDistributionDTO[];
}
```

---

## 4. API Endpoints

### `GET /api/v1/analytics/overview`
- **Auth:** Requires authenticated session (`authenticate` middleware).
- **Query Params:** `?range=all|30d|90d|ytd` (default `all`).
- **Response:**
  ```json
  {
    "data": {
      "range": "all",
      "rangeLabel": "All time",
      "kpis": {
        "totalApplications": 24,
        "activeApplications": 14,
        "closedApplications": 10,
        "responseCount": 11,
        "responseRate": 45.8,
        "interviewCount": 6,
        "interviewRate": 25.0,
        "offerCount": 1,
        "offerRate": 4.2,
        "rejectionCount": 5,
        "rejectionRate": 20.8
      },
      "funnel": [ ... ],
      "platforms": [ ... ],
      "workSetups": [ ... ],
      "weeklyVelocity": [ ... ],
      "monthlyVelocity": [ ... ],
      "timing": {
        "avgDaysToResponse": 4.2,
        "avgDaysToInterview": 7.5,
        "avgDaysToRejection": 14.1
      },
      "salaryInsights": { ... },
      "statusDistribution": [ ... ]
    }
  }
  ```

---

## 5. UI Architecture & Marker Standards

### Route: `/analytics`
Registered inside `AppLayout` protected routes in `apps/web/src/app/router.tsx`.

### Layout Composition:
1. **Header:** Title "Analytics", descriptive sentence-case subtitle ("Empirical performance metrics and conversion dynamics across your search"), and date range pill selector (`All time`, `30 days`, `90 days`, `Year to date`).
2. **KPIs Strip (4 columns):**
   - Total applications (with active vs closed counts)
   - Response rate (with total responses count)
   - Interview rate (with interview rounds count)
   - Offer rate (with offer count in `.marker` highlight)
3. **Application Funnel Section:**
   - Horizontal or vertical descending conversion flow.
   - Stage bars with fill percentage, total counts, and drop-off indicator between stages.
4. **Two-Column Analytical Grid:**
   - **Column A: Platform Performance:** Table/card with platform icon/name, total apps, interviews reached, conversion rate, and offers.
   - **Column B: Time & Cycle Velocity:** Cards showing average days to response, interview, and rejection, alongside 12-week activity bar graph.
5. **Secondary Grid (Work Setup & Salary & Statuses):**
   - Work Setup distribution bars (Remote, Hybrid, Onsite).
   - Salary metrics (disclosed percentage, average range).
   - Full 12-status distribution with `StageRing` indicators.
6. **Zero-State Handling:**
   - When 0 applications exist: Clean, centered empty state explaining that metrics will compute as applications are added, with a direct "Add your first application" button.

---

## 6. Acceptance Criteria

1. **Endpoint Correctness:** `GET /api/v1/analytics/overview` returns accurate, multi-tenant scoped calculations for any date range with zero 500 errors even on empty databases.
2. **Supertest Test Coverage:** Integration tests pass in `apps/api/tests/analytics.test.ts` validating calculations, tenant isolation, and date range filters.
3. **Frontend Integration:**
   - Navigating to `/analytics` renders the analytics dashboard cleanly.
   - Switching date ranges (`All time`, `30 days`, etc.) smoothly refetches and updates all cards and charts.
   - Navigation links in desktop sidebar and mobile navigation open `/analytics` directly.
4. **Marker Design Conformance:**
   - Uses `bg-background`, `bg-card`, `bg-secondary`, `border-border`, `text-foreground`, `text-muted-foreground`.
   - Uses Bricolage Grotesque for headings and numbers; Instrument Sans for labels.
   - No generic Inter fonts, no harsh pure `#000000`, no card-nesting anti-patterns.
   - Smooth deceleration animations (`cubic-bezier(0.16, 1, 0.3, 1)`).
5. **Full Workspace Build & Test Pass:** All Vitest suites pass across workspace with 0 errors.
