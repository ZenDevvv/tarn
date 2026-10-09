# Specification: Application Tailoring, Scoring & Multi-User Career Profile (`tailoring`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 3 — Intelligent Application Studio & Multi-User Profile Engine  
> **Module ID:** `tailoring`  
> **Design System:** **Marker** (`app/DESIGN.md`, `apps/web/src/index.css`, `StageRing`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `Resume-Builder/prompt_guide.md` (Keyword-Driven Tailoring Algorithm & classic layout rules)  
> 2. `Resume-Builder/data/master_resume.json` (Sample factual ground truth & positioning rules)  
> 3. `Resume-Builder/scripts/analyze_job_description.py` & `validate_tailoring.py` (NLP extraction & fidelity validation)  
> 4. `app/DESIGN.md` (Marker aesthetic, typography hierarchy, hairline borders, muted palettes)  
> 5. `CAPABILITY_MAP.md` (Module dependencies: `applications`, `resumes`, `jobs`, `settings`)  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
When applying to jobs, applicants must tailor their resumes and cover letters for specific roles. However:
1. Tarn currently only allows manual uploads of static files; there is no automated tailoring or document generator.
2. Cover letters do not exist in the database or UI.
3. Job descriptions saved in Tarn are passive text with no automated keyword analysis, match scoring, or gap detection.
4. **Multi-User Isolation Requirement:** Tarn is a multi-user ATS. Each user must have their own **Career Profile & Fact Bank** (work experience, projects, skills, education, and custom positioning rules). Different users must be able to upload their existing resume (PDF/DOCX) or JSON to automatically establish their factual ground truth without manual data entry.

### 1.2 User Stories
- **Multi-User Career Profile (`Settings > Career Profile`):** As any job seeker, I want a dedicated tab in Settings where I can upload my existing resume (PDF/DOCX) or import JSON to automatically populate my factual Master Profile, or edit it visually.
- **Custom Positioning Rules:** As a job seeker, I want to define my own career positioning rules (e.g., "Lead with Senior Frontend roles", "Highlight Bandai Namco HRIS", "Do not frame as career switcher") that guide the tailoring engine.
- **Opportunity Scoring (`ApplicationDetailPage`):** When viewing an application with a job description, I want an automated **Match & Tailoring Scorecard** showing keyword match %, high-priority matched skills, skill gaps, and high-value exact phrases to echo.
- **Application Deliverables Hub:** Dedicated deliverable cards on the application detail page for **Tailored Resume** and **Targeted Cover Letter**, showing active version, match scores, preview links, and 1-click PDF download buttons.
- **Tailoring Studio Workspace:** As a job seeker, I want to click "Tailor Application" and open an interactive workspace where I can inspect extracted keywords, generate documents using either a **deterministic engine** (instant, 100% offline, zero-AI) or an **AI engine** (Gemini Flash), review automated fidelity validation (0 invented tools/metrics against *my* fact bank), and save both documents directly to the application.
- **Classic Document Layout:** Generated deliverables are rendered in an ATS-friendly classic 1-page layout matching `Zen Obrero RESUME.backup.pdf` (education first, work experience, project experience, technical skills, no summary section, black text, classic blue links).

---

## 2. Technical Contracts & Architecture

### 2.1 Database Layer (`packages/database`)

#### MasterProfile Model:
```prisma
model MasterProfile {
  id                String   @id @default(cuid())
  userId            String   @unique
  basics            Json     // { name, location, phone, email, links: [{ label, url }] }
  positioningRules  String[] @default([]) // User-specific rules for AI/generator
  factBank          Json     // { core_positioning: string[], priority_themes: string[], quantified_highlights: string[], highlight_project?: any }
  summaryCandidates Json?    @default("[]")
  workExperience    Json     // Array of { company, location, role, date_range, bullets: string[] }
  projectExperience Json     // Array of { name, subtitle, stack: string[], bullets: string[] }
  technicalSkills   Json     // { [category: string]: string[] }
  education         Json     // Array of { school, location, degree, honors, graduation, bullets: string[] }
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("master_profiles")
}
```

#### CoverLetter Model:
```prisma
model CoverLetter {
  id            String   @id @default(cuid())
  userId        String
  applicationId String?
  name          String
  role          String?
  company       String?
  content       String   @db.Text // Markdown source
  htmlContent   String?  @db.Text
  fileUrl       String?  // PDF path or URL
  matchScore    Int?
  echoedPhrases String[] @default([])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  application Application? @relation(fields: [applicationId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([applicationId])
  @@map("cover_letters")
}
```

#### Resume Model Enhancements:
```prisma
model Resume {
  // Existing fields: id, userId, name, version, targetRole, fileUrl, filename, fileSize, mimeType, isDefault, skills, notes, createdAt, updatedAt
  content    Json?   // Structured tailored resume payload (resume.json)
  isTailored Boolean @default(false)
  matchScore Int?
}
```

#### Application Model Relation:
```prisma
model Application {
  // ... existing fields ...
  coverLetters CoverLetter[]
}
```

---

### 2.2 Shared Types & Validation (`packages/types`, `packages/validation`)

#### Types (`packages/types/src/entities.ts`):
- `MasterProfileDTO`
- `CoverLetterDTO`
- `JdAnalysisResultDTO` (match score, matched keywords, missing keywords, exact phrases, verbs)
- `TailoredResumePayload`
- Updated `ApplicationWithDetailsDTO` with `coverLetters?: CoverLetterDTO[]`.

#### Validation (`packages/validation/src/tailoring.schema.ts`):
- `updateMasterProfileSchema`
- `uploadProfileResumeSchema`
- `generateTailoringSchema` (`{ mode: 'ai' | 'deterministic', role?: string, company?: string }`)
- `updateCoverLetterSchema`

---

### 2.3 Backend API (`apps/api`)

#### Modules & Services:
1. **`ProfileExtractorService`**:
   - Parses uploaded PDF/DOCX resume text or incoming JSON into structured `MasterProfile` sections (Basics, Experience, Projects, Skills, Education).
2. **`JdAnalyzerService`**:
   - Frequency-based n-grams (unigrams, bigrams, trigrams, 4-grams), stop-word filter, tech regex pattern, action verb scoring.
   - Computes match score against the authenticated user's `MasterProfile`.
3. **`TailoringValidatorService`**:
   - Computes keyword coverage % in resume.
   - Counts exact phrase echoes in cover letter (target $\ge 3$).
   - Verifies zero ungrounded skills, employers, or metrics against the authenticated user's `MasterProfile`.
4. **`PdfRendererService`**:
   - Compiles classic HTML matching `Zen Obrero RESUME.backup.pdf`.
   - Executes `/usr/bin/chromium --headless=new --print-to-pdf` to generate clean PDFs.
5. **`TailoringService`**:
   - Deterministic ranking of master bullets and project cards based on keyword frequency.
   - Optional AI generation via Gemini Flash / OpenAI if API key present, strictly respecting user's `positioningRules`.
   - Automated validation and saving to database.

#### API Endpoints:
- **Master Profile & Resume Upload:**
  - `GET /api/v1/master-profile`: Get current user's profile.
  - `PUT /api/v1/master-profile`: Update profile.
  - `POST /api/v1/master-profile/upload-resume`: Upload PDF/DOCX resume to auto-populate profile.
  - `POST /api/v1/master-profile/import-json`: Import JSON profile.
  - `GET /api/v1/master-profile/export-json`: Export JSON profile.
- **Application Tailoring:**
  - `GET /api/v1/applications/:id/tailoring/analysis`: Get real-time match scorecard.
  - `POST /api/v1/applications/:id/tailoring/generate`: Generate tailored resume & cover letter.
  - `GET /api/v1/resumes/:id/preview-html`: Render classic resume HTML.
  - `GET /api/v1/cover-letters/:id/preview-html`: Render classic cover letter HTML.
- **Cover Letters:**
  - `GET /api/v1/cover-letters/:id`: Get cover letter.
  - `PATCH /api/v1/cover-letters/:id`: Update cover letter Markdown.
  - `DELETE /api/v1/cover-letters/:id`: Delete cover letter.

---

### 2.4 Frontend Design & Marker Aesthetic (`apps/web`)

1. **`SettingsPage > Career Profile Tab` (`/settings`):**
   - **Upload Resume Dropzone:** Drag-and-drop existing PDF/DOCX to auto-parse and pre-populate profile.
   - **JSON Import / Export:** 1-click import/export of structured fact bank.
   - **Visual Fact Bank Editor:** Forms for Contact Basics, Experience bullets, Projects, Skills, Education, and custom Positioning Rules.
2. **`TailoringScorecard` (`ApplicationDetailPage`):**
   - Visual match ring (% alignment score).
   - Matched Keywords pills in Marker lime accent (`bg-primary/10 text-primary border-primary/20`).
   - Missing Keywords in subtle secondary pills.
   - Echo Phrases pill count.
   - Action: "Tailor Application" / "Regenerate".
3. **`ApplicationDeliverables` (`ApplicationDetailPage`):**
   - Dual cards for **Tailored Resume** and **Targeted Cover Letter**.
   - Shows active version, match %, echoed phrases.
   - Actions: Preview in modal, Download PDF, Re-tailor.
4. **`TailoringStudioModal`:**
   - Interactive dialog displaying JD keyword breakdown, mode selector (Deterministic vs AI vs Copy Prompt), live generation progress, and automated validation report card.
5. **`DocumentPreviewModal`:**
   - Sandboxed iframe preview of the classic resume and cover letter with Print/Download triggers.
