# Implementation Plan: Application Tailoring, Scoring & Multi-User Career Profile (`tailoring`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 3 — Intelligent Application Studio & Multi-User Profile Engine  
> **Module ID:** `tailoring`  
> **Specification:** `spec-tailoring.md`  

---

## Task Decomposition

### Task 1: Database Model & Prisma Schema Updates (`packages/database`)
- **Files:** `packages/database/prisma/schema.prisma`
- **Actions:**
  - Add `MasterProfile` model storing candidate factual ground truth (`basics`, `positioningRules`, `factBank`, `workExperience`, `projectExperience`, `technicalSkills`, `education`).
  - Add `CoverLetter` model (`userId`, `applicationId`, `name`, `role`, `company`, `content`, `htmlContent`, `fileUrl`, `matchScore`, `echoedPhrases`).
  - Add `content`, `isTailored`, and `matchScore` fields to `Resume` model.
  - Add relation `coverLetters CoverLetter[]` on `Application`.
  - Add relation `masterProfile MasterProfile?` and `coverLetters CoverLetter[]` on `User`.
  - Push Prisma schema changes (`pnpm --filter @tracker/database prisma db push`) and generate client.
  - Update `packages/database/prisma/seed.ts` to pre-seed the default user's `MasterProfile` directly with the factual data from `Resume-Builder/data/master_resume.json`.
- **Verification:** Prisma schema validates cleanly and `pnpm --filter @tracker/database build` succeeds.

---

### Task 2: Shared Contracts & Validation Schemas (`packages/types`, `packages/validation`)
- **Files:**
  - `packages/types/src/entities.ts`
  - `packages/validation/src/tailoring.schema.ts`
  - `packages/validation/src/index.ts`
- **Actions:**
  - Export `MasterProfileDTO`, `CoverLetterDTO`, `JdAnalysisResultDTO`, `TailoredResumePayload` from `entities.ts`.
  - Update `ApplicationWithDetailsDTO` to include `coverLetters?: CoverLetterDTO[]`.
  - Implement `tailoring.schema.ts` exporting:
    - `updateMasterProfileSchema`
    - `uploadProfileResumeSchema`
    - `generateTailoringSchema`
    - `updateCoverLetterSchema`
  - Export new schemas from `packages/validation/src/index.ts`.
- **Verification:** Workspace type check (`pnpm --filter @tracker/types build && pnpm --filter @tracker/validation build`).

---

### Task 3: Profile Extraction & Resume Parsing Service (`apps/api`)
- **Files:**
  - `apps/api/src/modules/master-profile/profile-extractor.service.ts`
  - `apps/api/src/modules/master-profile/master-profile.service.ts`
  - `apps/api/src/modules/master-profile/master-profile.controller.ts`
  - `apps/api/src/modules/master-profile/master-profile.routes.ts`
  - `apps/api/tests/master-profile.test.ts`
- **Actions:**
  - Implement `ProfileExtractorService`:
    - Parses text extracted from uploaded PDF/DOCX resumes (detecting headers like Experience, Education, Skills, Projects).
    - Structures content into `MasterProfile` shape (Basics, Work Experience bullets, Projects, Skills, Education).
    - Supports direct JSON import/export.
  - Implement routes:
    - `GET /api/v1/master-profile`
    - `PUT /api/v1/master-profile`
    - `POST /api/v1/master-profile/upload-resume`
    - `POST /api/v1/master-profile/import-json`
    - `GET /api/v1/master-profile/export-json`
  - Write unit/integration tests for master profile CRUD and resume parsing.
- **Verification:** Vitest tests in `apps/api/tests/master-profile.test.ts` pass.

---

### Task 4: Deterministic NLP Analyzer & Validation Services (`apps/api`)
- **Files:**
  - `apps/api/src/modules/tailoring/jd-analyzer.service.ts`
  - `apps/api/src/modules/tailoring/tailoring-validator.service.ts`
  - `apps/api/tests/tailoring-analysis.test.ts`
- **Actions:**
  - Port `Resume-Builder/scripts/analyze_job_description.py` to TypeScript `JdAnalyzerService`:
    - Frequency-based n-grams (1 to 4 grams), stop words, tech regex, and action verbs.
    - Match score calculator comparing extracted keywords against user's specific `MasterProfile`.
  - Port `Resume-Builder/scripts/validate_tailoring.py` to TypeScript `TailoringValidatorService`:
    - Calculates keyword coverage %.
    - Counts exact phrase echoes in cover letters.
    - Verifies zero ungrounded skills/metrics against user's `MasterProfile`.
  - Write unit tests in `apps/api/tests/tailoring-analysis.test.ts` verifying extraction, scoring, and fidelity validation.
- **Verification:** Unit tests pass with Vitest.

---

### Task 5: Template Engine & Headless PDF Renderer Service (`apps/api`)
- **Files:**
  - `apps/api/src/modules/tailoring/pdf-renderer.service.ts`
  - `apps/api/src/modules/tailoring/templates/resume-template.ts`
  - `apps/api/src/modules/tailoring/templates/cover-letter-template.ts`
- **Actions:**
  - Port classic layout HTML templates and CSS from `Resume-Builder`:
    - Centered hero header with classic blue links (`#0563c1`).
    - Education first, Work Experience, Project Experience, Technical Skills.
    - Strict omit of Professional Summary section per positioning rules.
    - Render candidate's specific name, contact, bullets, projects, and skills dynamically.
  - Implement PDF rendering via native `/usr/bin/chromium --headless=new --print-to-pdf` saving to `uploads/resumes/` and `uploads/cover-letters/`.
- **Verification:** Test PDF rendering producing valid, non-empty PDF files.

---

### Task 6: Tailoring Coordinator & API Routes (`apps/api`)
- **Files:**
  - `apps/api/src/modules/tailoring/tailoring.service.ts`
  - `apps/api/src/modules/tailoring/tailoring.controller.ts`
  - `apps/api/src/modules/tailoring/tailoring.routes.ts`
  - `apps/api/src/modules/cover-letters/cover-letter.routes.ts`
  - `apps/api/src/modules/cover-letters/cover-letter.service.ts`
  - `apps/api/src/app.ts`
- **Actions:**
  - Implement `TailoringService`:
    - Pulls authenticated user's `MasterProfile` and custom `positioningRules`.
    - Deterministic mode: ranks bullets by keyword relevance and builds resume payload & letter.
    - AI mode: calls Gemini Flash (if `GEMINI_API_KEY` present) obeying user's specific `positioningRules`.
    - Saves `Resume` and `CoverLetter` to DB, links to `Application`, renders PDF, logs `TimelineEvent`.
  - Implement routes:
    - `GET /api/v1/applications/:id/tailoring/analysis`
    - `POST /api/v1/applications/:id/tailoring/generate`
    - `GET /api/v1/resumes/:id/preview-html`
    - `GET /api/v1/cover-letters/:id/preview-html`
    - Cover letter CRUD routes.
  - Mount routers in `apps/api/src/app.ts`.
- **Verification:** Integration tests in `apps/api/tests/tailoring.test.ts`.

---

### Task 7: Frontend API Clients & Hooks (`apps/web`)
- **Files:**
  - `apps/web/src/features/master-profile/api/master-profile-api.ts`
  - `apps/web/src/features/tailoring/api/tailoring-api.ts`
  - `apps/web/src/features/cover-letters/api/cover-letter-api.ts`
- **Actions:**
  - Implement API client functions for:
    - Master profile fetching, updating, resume PDF upload, and JSON import/export.
    - JD analysis and package generation.
    - HTML preview fetching and cover letter CRUD.
- **Verification:** Type-check cleanly.

---

### Task 8: Settings "Career Profile & Fact Bank" UI (`apps/web`)
- **Files:**
  - `apps/web/src/features/settings/pages/settings-page.tsx`
  - `apps/web/src/features/settings/components/career-profile-section.tsx`
  - `apps/web/src/features/settings/components/resume-upload-dropzone.tsx`
- **Actions:**
  - Add **"Career Profile"** tab to Settings navigation.
  - Build `ResumeUploadDropzone`:
    - Allows dropping any existing resume (PDF/DOCX) to parse and auto-fill the profile.
    - Shows progress spinner and extraction confirmation preview.
  - Build `CareerProfileSection`:
    - **Basics**: Name, email, phone, location, portfolio/GitHub links.
    - **Positioning Rules**: Custom guidelines for tailoring (tag/list input).
    - **Highlight Project**: Project dropdown selection.
    - **Work Experience**: Bullet list manager with metrics.
    - **Projects & Skills**: Dynamic categories and item badges.
    - **JSON Import / Export**: Quick buttons for backup or manual JSON edit.
- **Verification:** Test uploading resume PDF in Settings, editing fields, and saving.

---

### Task 9: Tailoring Marker UI Components (`apps/web`)
- **Files:**
  - `apps/web/src/features/tailoring/components/tailoring-scorecard.tsx`
  - `apps/web/src/features/tailoring/components/application-deliverables.tsx`
  - `apps/web/src/features/tailoring/components/tailoring-studio-modal.tsx`
  - `apps/web/src/features/tailoring/components/document-preview-modal.tsx`
- **Actions:**
  - Build `TailoringScorecard`:
    - Visual Match Score Ring with percentage.
    - Matched skill badges in Marker lime accent (`bg-primary/10 text-primary border-primary/20`).
    - Missing skill badges and detected echo phrases count.
    - Quick "Tailor Application" trigger.
  - Build `ApplicationDeliverables`:
    - Dual cards for Tailored Resume & Targeted Cover Letter.
    - In-app preview, download PDF, and re-tailor buttons.
  - Build `TailoringStudioModal`:
    - Keyword inspection, engine mode selection (AI vs Deterministic vs Copy Prompt), generation runner, validation results.
  - Build `DocumentPreviewModal`:
    - Sandboxed iframe viewer for classic resume & cover letter.

---

### Task 10: Application Detail Page Redesign (`apps/web`)
- **Files:**
  - `apps/web/src/features/applications/pages/application-detail-page.tsx`
- **Actions:**
  - Embed `TailoringScorecard` below Opportunity Details.
  - Replace basic resume row with `ApplicationDeliverables`.
  - Add collapsible/expandable full Job Description card with in-place edit capability.
  - Wire modals for live generation and document preview.
- **Verification:** Browser preview and automated component tests.

---

### Task 11: Multi-Module Verification & Testing (SHIP)
- **Files:** All modified files
- **Actions:**
  - Run full backend test suite: `pnpm --filter @tracker/api test`.
  - Run full frontend test suite: `pnpm --filter @tracker/web test`.
  - Run full monorepo build: `pnpm build`.
- **Verification:** 100% green tests and clean build.
