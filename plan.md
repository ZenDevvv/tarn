# Implementation Plan: Application Tailoring, Scoring & Multi-User Career Profile (`tailoring`)

> **Objective:** Integrate the Resume-Builder tailoring engine into Tarn with full multi-user support, elevating the Application Detail view into an active application studio with real-time JD match scoring, high-priority keyword & gap analysis, user-configurable Master Profile settings (with resume PDF upload/auto-parsing, JSON import/export, and visual fact banking), dual deliverable cards (Tailored Resume & Targeted Cover Letter), in-app preview, and 1-click PDF generation matching `Zen Obrero RESUME.backup.pdf`.
> **Detailed Task Plan:** [tasks/plan-tailoring.md](file:///home/machenike/Projects/tarn/tasks/plan-tailoring.md)
> **Specification:** [spec-tailoring.md](file:///home/machenike/Projects/tarn/spec-tailoring.md)

---

## Phased Execution Overview

- [x] **Task 1: Database Schema & Seed Data (`packages/database`)**
  - Add `MasterProfile` and `CoverLetter` models to `schema.prisma`
  - Enhance `Resume` model with `content Json?`, `isTailored`, `matchScore`
  - Link `coverLetters` relation on `Application`
  - Apply Prisma push and re-generate client
  - Pre-seed default user's `MasterProfile` in `seed.ts` with Zen Andrei Obrero's data from `Resume-Builder/data/master_resume.json`

- [x] **Task 2: Shared Domain Contracts & Validation (`packages/types`, `packages/validation`)**
  - Export `MasterProfileDTO`, `CoverLetterDTO`, `JdAnalysisResultDTO`, `TailoredResumePayload`
  - Implement `tailoring.schema.ts` with Zod validation for generation, resume upload, master profile, and cover letters

- [x] **Task 3: Profile Extraction & Resume Parsing Service (`apps/api`)**
  - Implement `ProfileExtractorService` to parse uploaded resume PDFs/DOCX and JSON into structured `MasterProfile` sections
  - Add routes: `GET /api/v1/master-profile`, `PUT /api/v1/master-profile`, `POST /api/v1/master-profile/upload-resume`, `POST /api/v1/master-profile/import-json`, `GET /api/v1/master-profile/export-json`
  - Author integration tests in `tests/master-profile.test.ts`

- [x] **Task 4: Deterministic NLP Analyzer & Validation Services (`apps/api`)**
  - Port `analyze_job_description.py` into TypeScript `JdAnalyzerService` (n-grams, stop-words, tech patterns, action verbs, match score against user's specific profile)
  - Port `validate_tailoring.py` into TypeScript `TailoringValidatorService` (keyword coverage %, echo counts, zero-warning fidelity checks)
  - Author test suite in `tests/tailoring-analysis.test.ts`

- [x] **Task 5: Document Template Engine & Headless PDF Renderer (`apps/api`)**
  - Port classic layout HTML templates and CSS from `Resume-Builder` (dynamic user details, education first, work experience, project experience, technical skills, black text, classic blue links, no summary section)
  - Implement headless Chromium PDF generation via native `/usr/bin/chromium --headless=new --print-to-pdf`

- [x] **Task 6: Tailoring Coordinator & API Endpoints (`apps/api`)**
  - Implement `TailoringService` with user-scoped dynamic tailoring (Deterministic ranking vs Gemini Flash AI synthesis respecting user's custom positioning rules)
  - Expose `GET /api/v1/applications/:id/tailoring/analysis`
  - Expose `POST /api/v1/applications/:id/tailoring/generate`
  - Expose preview HTML and PDF streaming endpoints
  - Implement Cover Letter CRUD routes

- [x] **Task 7: Frontend API Clients & TanStack Query Hooks (`apps/web`)**
  - Implement `master-profile-api.ts`, `tailoring-api.ts`, and `cover-letter-api.ts`

- [x] **Task 8: Settings "Career Profile & Fact Bank" Management UI (`apps/web`)**
  - Add **"Career Profile"** tab to Settings (`/settings`)
  - Build `ResumeUploadDropzone` for 1-click resume PDF auto-extraction
  - Build visual form editor for Contact Basics, Experience bullets, Projects, Skills, Education, and custom Positioning Rules
  - Add JSON import / export buttons for instant backup

- [x] **Task 9: Marker UI Tailoring Components (`apps/web`)**
  - Implement `TailoringScorecard` (radial match ring %, matched lime pills, gap pills, echo phrases)
  - Implement `ApplicationDeliverables` (dual elevated cards for Tailored Resume & Cover Letter with preview/download actions)
  - Implement `TailoringStudioModal` (keyword inspection, engine mode selector, live generation, validation report)
  - Implement `DocumentPreviewModal` (sandboxed iframe preview for classic documents)

- [x] **Task 10: Application Detail Page Redesign (`apps/web`)**
  - Integrate `TailoringScorecard` and `ApplicationDeliverables` into `application-detail-page.tsx`
  - Add collapsible/expandable Job Description card with in-place editing
  - Wire modals for live generation, editing, and previewing

- [x] **Task 11: Multi-Module Verification & Testing (SHIP)**
  - Run full test suite across monorepo (`pnpm test`)
  - Run build verification (`pnpm build`)

---

## Domain-Agnostic Remediation (2026-10-09)

> **Objective:** Remove software-engineering bias from the tailoring engine per the Cross-Domain Audit
> **Specification:** [spec-domain-agnostic.md](spec-domain-agnostic.md)
> **Detailed Task Plan:** [tasks/plan-domain-agnostic.md](tasks/plan-domain-agnostic.md)

- [x] **Tasks 1–3: Contracts** — `technicalSkills` → `skills` rename (Prisma + DTO + validation), DB reset, legacy import compat
- [x] **Tasks 4–5: Ingestion** — delete "full-stack engineer" positioning seeds; `titleRegex` role/company disambiguation with ambiguity warnings
- [x] **Tasks 6–9: Scoring** — remove `TECH_PATTERN` weights; cross-domain verb lexicon + POS-agnostic gate; generalized metric nouns; keyword-sourced exact phrases
- [x] **Tasks 10–11: Synthesis policy** — default-on professional summary; certifications float order + widened key matching
- [x] **Task 12: Corpora** — certifications + summary counted in validator coverage and score-lift evaluation
- [x] **Tasks 13–14: Presentation** — data-driven skills kicker ("Skills & Competencies"); UI relabels
- [x] **Task 15: Verification** — Persona A/B/C regression suite + repo grep gates + full suite/lint/typecheck

## Resume Rendering Fidelity & Document Agnosticism (2026-10-10)

> **Objective:** Close three empirically-reproduced rendering defects and open the document-type axis
> **Specification:** [spec-resume-fidelity.md](spec-resume-fidelity.md)
> **Detailed Task Plan:** [tasks/plan-resume-fidelity.md](tasks/plan-resume-fidelity.md)
> **Branch:** `fix/resume-rendering-fidelity`
> **Source:** E2E run — ICU nurse profile → CNS application → generated PDF. 2 custom sections stored,
> `content.customSections === null` on output, `isValid: true`; page 2 orphan; skills kicker `LEADERSHIP`.

**Phase 1 — reproduced defects (independently shippable):**
- [ ] **Task 1: Pagination CSS** — `break-inside: avoid` / `avoid-page` on `.entry`, `.section`, `.cert-row`
- [ ] **Task 2: Skills kicker generic list** — stop labelling a multi-category section `LEADERSHIP`
- [ ] **Task 3: Deterministic customSections merge** — profile sections are authoritative, never rewritten by the model
- [ ] **Task 4: Completeness dimension** — `custom_section_coverage`; dropped sections become fidelity warnings
- [ ] **Task 5: `overrideWarnings` gates** — make the existing "Save Anyway" button truthful
- [ ] **Exit gate:** E2E replay — 4 previously-missing tokens present, kicker neutral, no orphan page

**Phase 2 — cheap wins:**
- [ ] **Task 6: `justify` → `left`** — readability, zero ATS cost

**Phase 3 — document-type axis:**
- [ ] **Tasks 7–8:** `documentType` contract + render `attributes` (salary/hours/supervisor/clearance) and credential license/jurisdiction
- [ ] **Tasks 9–10:** data-driven section kickers for all fixed sections; web UI selector
- [ ] *(Rejected: profession classifier, second visual template, dynamic auto-fit loop — see spec §6)*

**Phase 4 — verification:**
- [ ] **Task 11:** Promote E2E replay to Persona D regression fixture; full suite + build + grep gates
