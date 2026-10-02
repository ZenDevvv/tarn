# Spec: Saved Jobs / Wishlist (`saved-jobs`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Saved Jobs & Opportunity Wishlist  
> **Module ID:** `saved-jobs`  
> **Design System:** **Marker** (`app/DESIGN.md`, `app/index.css`, `app/stage-ring.tsx`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `app/job-application-tracker-brd-prd.md` (Section 7.8: Saved Jobs)  
> 2. `app/DESIGN.md` (Marker design rules, typography, and card conventions)  
> 3. `CAPABILITY_MAP.md` (Module dependencies: `applications`)  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
Job seekers browse numerous job boards daily (LinkedIn, Indeed, JobStreet, company career pages) and need a frictionless way to save promising listings to research, tailor resumes for, and apply to later. Without a dedicated "Saved jobs" view, saved opportunities get buried among active interview pipelines, or users lose track of original posting URLs and application deadlines.

### 1.2 User Stories
- **Quick Save Opportunity:** As a job seeker, I want to quickly bookmark a job listing with company, role, posting URL, work setup, salary, and notes so I can review it later.
- **Dedicated Hub (`/saved-jobs`):** As a job seeker, I want a dedicated page in the primary navigation listing all saved positions separate from active applications.
- **1-Click Convert to Applied:** When I submit my application, I want to click "Mark as applied" with one click to graduate the opportunity into the active application pipeline, set `appliedAt` to today, and log a timeline event.
- **Search & Filter:** As a job seeker, I want to search through my saved jobs by role or company, and filter by platform or work setup.
- **Live Badge in App Shell:** As a job seeker, I want to see the count of saved jobs in the sidebar navigation.

---

## 2. Architecture & Data Model

The existing data model natively supports saved jobs via `Application` with `status: 'SAVED'` (the initial stage of the 12-state lifecycle).

- **Entity:** `Application` with `status = 'SAVED'`
- **Company:** `Company` (auto-linked or created)
- **Job:** `Job` (storing `source`, `sourceUrl`, `workSetup`, `salaryMin`, `salaryMax`, `description`)
- **Conversion to Applied:** `PATCH /api/v1/applications/:id/status` with `{ status: 'APPLIED' }` automatically records a `STATUS_CHANGED` timeline event and sets `appliedAt = new Date()`.
- **API Endpoints Reused:**
  - `GET /api/v1/applications?status=SAVED&search=...`
  - `POST /api/v1/applications` (default `status: 'SAVED'`)
  - `PATCH /api/v1/applications/:id/status` (to transition to `APPLIED`)
  - `DELETE /api/v1/applications/:id` (to delete/archive saved job)

---

## 3. Frontend UI Scope (`apps/web`)

```text
apps/web/
├── src/
│   ├── app/
│   │   └── router.tsx                          # Route /saved-jobs -> SavedJobsPage
│   ├── layouts/
│   │   └── app-layout.tsx                      # Dynamic count badges in sidebar & tab bar
│   └── features/
│       └── saved-jobs/
│           ├── components/
│           │   ├── saved-job-card.tsx          # Marker card with quick "Apply" action & URL link
│           │   └── quick-save-modal.tsx        # Fast modal for saving opportunity
│           └── pages/
│               └── saved-jobs-page.tsx         # Filterable grid of saved opportunities
```

---

## 4. Boundaries

- **Always:**
  - When converting a saved job to applied, set `appliedAt` and trigger query invalidation for `['applications']`, `['saved-jobs']`, and `['dashboard-analytics']`.
  - Maintain the Marker design aesthetic (Bricolage Grotesque headings, StageRing `SAVED`, hairline borders, zero heavy shadows).
- **Never:**
  - Never require re-entering company or job details when transitioning from Saved to Applied.
  - Never lose the original `sourceUrl` or pasted job description.

---

## 5. Success Criteria

- [ ] Route `/saved-jobs` is registered and renders [`SavedJobsPage`](file:///c:/Users/Zen/Desktop/MY%20PROJECTS/test/test-project2/apps/web/src/features/saved-jobs/pages/saved-jobs-page.tsx).
- [ ] Sidebar and mobile tab bar display live count badge of saved jobs.
- [ ] Users can quick-save a job via modal dialog with company, position, URL, salary, and notes.
- [ ] Clicking "Mark as applied" transitions application to `APPLIED` with instant optimistic feedback.
- [ ] Search and platform filters work smoothly.
- [ ] Zero build or test regressions across all workspace packages (`pnpm build` and `pnpm test`).
