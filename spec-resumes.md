# Spec: Resume Version Management & Application Linking (`resumes`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Resume Version Management  
> **Module ID:** `resumes`  
> **Design System:** **Marker** (`app/DESIGN.md`, `apps/web/src/index.css`, `StageRing`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `app/job-application-tracker-brd-prd.md` (Section 7.13 Resume Management, Section 18.2 Navigation)  
> 2. `app/job-application-tracker-project-architecture.md` (Section 46 File Storage, Section 47 File Upload Flow, Section 48 Allowed File Types)  
> 3. `app/DESIGN.md` (Marker design rules, typography hierarchy, hairline borders, muted palettes)  
> 4. `CAPABILITY_MAP.md` (Resume versioning and application linking)  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
Modern job seekers tailor resumes for specific roles (e.g. Frontend Specialist vs. Full Stack Engineer vs. Engineering Lead) and iterate through multiple revisions. When applying to companies, remembering exactly which resume version was submitted to which company is critical for interview preparation. Currently, the sidebar exposes a **Resumes** navigation item (`FileText` icon), but navigating to `/resumes` bounces back to the dashboard because no resume route, page, API, or database model exists.

### 1.2 User Stories
- **Resume Hub (`/resumes`):** As a job seeker, I want a dedicated Resumes page displaying all my tailored resume versions with summary statistics (Total Resumes, Default Resume, Target Roles, Linked Applications).
- **Multiple Versions & Roles:** As a job seeker, I want to store multiple resume versions, each with a version label (e.g., `v1.0`, `v2.4`), target role (e.g., `Senior Frontend Engineer`), highlighted skill tags, and notes on how it was tailored.
- **File Upload & External Link Support:** As a job seeker, I want to upload PDF, DOCX, or text files directly, or link to an external document (Google Docs, Dropbox, personal site, AWS S3).
- **Default Resume:** As a job seeker, I want to designate one resume as my default/primary version.
- **Application Linking:** As a job seeker, I want to see which job applications used each resume version, with direct links and live status `StageRing` badges.
- **Direct Preview & Download:** As a job seeker, I want 1-click preview and download of any uploaded or linked resume file.
- **Search & Filter:** As a job seeker, I want to search resumes by name, target role, skills, or notes, and filter by target role.
- **CRUD Operations:** As a job seeker, I want to create, view details, edit, set as default, and safely delete resume versions.
- **Sidebar Integration:** As a job seeker, I want the sidebar `/resumes` link to show a dynamic count badge of my active resumes.

---

## 2. Technical Contracts & Architecture

### 2.1 Database Layer (`packages/database`)

#### Prisma Schema:
```prisma
model Resume {
  id          String   @id @default(cuid())
  userId      String
  name        String
  version     String?
  targetRole  String?
  fileUrl     String?
  filename    String?
  fileSize    Int?
  mimeType    String?
  isDefault   Boolean  @default(false)
  skills      String[] @default([])
  notes       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications Application[]

  @@index([userId])
  @@index([userId, isDefault])
  @@map("resumes")
}
```

#### Application Model Update:
```prisma
model Application {
  // ... existing fields ...
  resumeId String?
  resume   Resume? @relation(fields: [resumeId], references: [id], onDelete: SetNull)
  // ...
  @@index([resumeId])
}
```

### 2.2 Shared Types & Validation (`packages/types`, `packages/validation`)

#### Types (`packages/types/src/entities.ts`):
```typescript
export interface ResumeDTO {
  id: string;
  userId: string;
  name: string;
  version?: string | null;
  targetRole?: string | null;
  fileUrl?: string | null;
  filename?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  isDefault: boolean;
  skills: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeWithDetailsDTO extends ResumeDTO {
  applicationsCount: number;
  applications: Array<{
    id: string;
    status: ApplicationStatus;
    priority: Priority;
    appliedAt?: string | null;
    company?: {
      id: string;
      name: string;
    } | null;
    job?: {
      id: string;
      title: string;
    } | null;
  }>;
}
```

#### Validation (`packages/validation/src/resume.schema.ts`):
- `createResumeSchema`:
  - `name`: string min 1, max 120
  - `version`: optional string
  - `targetRole`: optional string
  - `fileUrl`: optional string (URL or relative path)
  - `filename`: optional string
  - `fileSize`: optional number
  - `mimeType`: optional string
  - `isDefault`: optional boolean
  - `skills`: optional array of strings or comma-delimited string
  - `notes`: optional string
- `updateResumeSchema`: partial of create
- `resumeFiltersSchema`:
  - `search`: optional string
  - `targetRole`: optional string
  - `isDefault`: optional string ('true' | 'false')
  - `sortBy`: optional ('createdAt' | 'name' | 'version' | 'updatedAt')
  - `sortOrder`: optional ('asc' | 'desc')

### 2.3 Backend API (`apps/api`)

- `GET /api/v1/resumes`: List user's resumes with filters, search, and application counts.
- `GET /api/v1/resumes/:id`: Get single resume with full application links.
- `POST /api/v1/resumes`: Create new resume. If `isDefault` is true, automatically unset previous default for this user.
- `PATCH /api/v1/resumes/:id`: Update resume details.
- `POST /api/v1/resumes/:id/default`: Set resume as default.
- `DELETE /api/v1/resumes/:id`: Delete resume (unlinks applications via SetNull).
- `POST /api/v1/resumes/upload`: Secure file upload endpoint supporting PDF/DOCX/TXT up to 10MB using Node stdlib `fs`/`path`/`crypto`. Serves uploads at `/uploads/resumes/:filename`.

### 2.4 Frontend Design & Marker Aesthetic (`apps/web`)

- **Palette & Tokens:** Matches `app/DESIGN.md` and `apps/web/src/index.css`.
- **Typography:** Display titles in `Bricolage Grotesque`, UI body in `Instrument Sans`.
- **Components:**
  - `ResumeCard`: Card with resume title, version pill, target role badge, file icon, size, 1-click preview/download, "Default" indicator, and expandable linked applications.
  - `ResumeFilters`: Search input, target role filter, sort order dropdown.
  - `ResumeFormModal`: Tabbed or combined upload/link form with drag-and-drop file picker, auto-fill filename and file size, versioning, skills tag input, and notes.
  - `ResumeDetailModal`: Full inspection modal with PDF preview iframe/link, metadata breakdown, and list of linked applications with `StageRing` status.
  - `ConfirmDeleteModal`: Safe deletion confirmation.
- **Routing & AppLayout:**
  - Route `/resumes` configured in `apps/web/src/app/router.tsx`.
  - Sidebar `/resumes` item wired to live count badge.
