# Spec: Dynamic Application Statuses & Workflow Pipeline (`statuses`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 13 — Dynamic Application Statuses & Workflow Pipeline  
> **Module ID:** `statuses`  
> **Design System:** **Marker** (`apps/web/src/index.css`, `StageRing`, `Bricolage Grotesque`, `Instrument Sans`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `AGENTS.md` (Ponytail Protocol, 6-Phase SDLC, Impeccable Design Suite, TDD)  
> 2. `spec.md` (Core Application Lifecycle, Kanban Board, StageRing)  
> 3. `spec-settings.md` (Settings Hub, User Preferences)  
> 4. `CAPABILITY_MAP.md`  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
Currently, application statuses are hardcoded as a fixed enum (`ApplicationStatus`: `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `NO_RESPONSE`). Users have varying interview pipelines (e.g. adding a "Take-Home Project", "System Design Interview", "Partner Chat", or renaming stages to match their regional terminology). Hardcoded enums prevent users from tailoring their hiring pipeline to their own needs.

However, completely free-form unconstrained strings would break deterministic analytics, Kanban columns, and the Marker design system's `StageRing`. 

### 1.2 Proposed Solution: Dynamic Pipeline & Dynamic Closed Outcomes
1. Convert statuses into a user-owned database model (`ApplicationStatus`).
2. **Pipeline Stages (`closeType: null`):** Represent progressive, active stages in the user's pipeline with sequential `order` (`0, 1, 2...`). Rendered as Kanban columns, in the active pipeline strip, and driving the conversion funnel.
3. **Closed Outcomes (`closeType: 'REJECTED' | 'WITHDRAWN' | 'NO_RESPONSE' | 'CANCELLED' | 'OTHER'`):** Represent terminal exit outcomes outside the active pipeline grid (`order: null`). Users can customize default outcomes or create dynamic custom closed outcomes (e.g., *"Hiring Freeze"*, *"Offer Declined"*, *"Archived"*).
4. **Distinct StageRing Visual Glyphs:**
   - Active stages: progress fill fraction $\frac{\text{order}}{\text{totalPipelineStages} - 1}$
   - Rejected: Cross `✕` (`strokeLinecap="round"`)
   - Withdrawn: Dashed circle (`strokeDasharray="3 2.4"`)
   - No Response: Dotted circle (`strokeDasharray="0.01 3.4"`)
   - Cancelled: Diagonal slash `⊘` (`M4.25 11.75L11.75 4.25`)
   - Other: Centered horizontal minus `⊖` (`M4.5 8H11.5`)
5. **Settings Management UI:** Dedicated "Pipeline & Stages" tab in `/settings` allowing users to add/rename/reorder active stages, pick icon glyph styles for custom closed outcomes, and safely delete unused custom stages or closed outcomes.

### 1.3 User Stories
- **Pipeline Customization:** As a job seeker, I want to add custom stages to my pipeline (e.g., "Screening Call", "Take-Home Assessment", "Final Round") and reorder them so that my tracker accurately reflects my actual interview process.
- **Stage Renaming:** As a job seeker, I want to rename existing stages (e.g. rename "Applied" to "Submitted" or "No response" to "Ghosted") without losing data or breaking analytics.
- **Kanban Alignment:** As a job seeker, I want my Kanban board columns to automatically match my custom active stages in their configured order.
- **StageRing Visual Integrity:** As a job seeker, I want the custom `StageRing` to dynamically scale its pie fill according to the stage's relative position in my pipeline.
- **Data Safety on Deletion:** As a job seeker, I want the system to prevent me from accidentally deleting a stage if applications are currently assigned to it, prompting me to reassign them first.

---

## 2. Technical Contracts & Architecture

### 2.1 Database Layer (`packages/database`)

#### Prisma Schema (`schema.prisma`):

```prisma
enum CloseType {
  REJECTED
  WITHDRAWN
  NO_RESPONSE
  CANCELLED
  OTHER
}

model ApplicationStatus {
  id        String     @id @default(cuid())
  userId    String
  name      String     // e.g., "Saved", "Applied", "Take-Home Assignment", "Hiring Freeze"
  order     Int?       // Sequential pipeline position (null for closed outcomes)
  closeType CloseType? // null = active pipeline stage; set = terminal outcome
  isDefault Boolean    @default(false)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications Application[]

  @@unique([userId, name])
  @@index([userId, order])
  @@map("application_statuses")
}
```

#### Application Model Update:
```prisma
model Application {
  // ...
  statusId String
  status   ApplicationStatus @relation(fields: [statusId], references: [id], onDelete: Restrict)
  // ...
  @@index([userId, statusId])
}
```

---

### 2.2 Shared Types (`packages/types`)

```ts
export type CloseType = 'REJECTED' | 'WITHDRAWN' | 'NO_RESPONSE';

export interface ApplicationStatusDTO {
  id: string;
  userId: string;
  name: string;
  order: number;
  closeType: CloseType | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDTO {
  id: string;
  userId: string;
  companyId: string;
  jobId: string;
  statusId: string;
  status: ApplicationStatusDTO;
  priority: Priority;
  appliedAt?: string | null;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  notes?: string | null;
  archivedAt?: string | null;
  resumeId?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: CompanyDTO;
  job?: JobDTO;
  interviews?: InterviewDTO[];
  resume?: ResumeDTO | null;
}

export interface CreateApplicationStatusInput {
  name: string;
  order?: number;
  closeType?: CloseType | null;
  isDefault?: boolean;
}

export interface UpdateApplicationStatusInput {
  name?: string;
  order?: number;
  closeType?: CloseType | null;
  isDefault?: boolean;
}

export interface ReorderStatusesInput {
  statusIds: string[];
}
```

---

### 2.3 Shared Validation (`packages/validation`)

#### `status.schema.ts`:
```ts
export const closeTypeEnum = z.enum(['REJECTED', 'WITHDRAWN', 'NO_RESPONSE']);

export const createStatusSchema = z.object({
  name: z.string().trim().min(1, 'Status name is required').max(50, 'Status name too long'),
  order: z.number().int().nonnegative().optional(),
  closeType: closeTypeEnum.nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const updateStatusSchema = createStatusSchema.partial();

export const reorderStatusesSchema = z.object({
  statusIds: z.array(z.string().min(1)).min(1, 'At least one status ID is required'),
});
```

---

### 2.4 Backend API Endpoints (`apps/api`)

Base path: `/api/v1/statuses` (all authenticated via JWT session):

1. `GET /api/v1/statuses`
   - Returns: `{ data: ApplicationStatusDTO[] }` (ordered by `order asc, createdAt asc`).
   - Automatically seeds the 8 defaults if user has zero statuses.
2. `POST /api/v1/statuses`
   - Body: `CreateApplicationStatusInput`
   - Returns: `{ data: ApplicationStatusDTO, message: "Status created successfully" }` (201 Created)
3. `PATCH /api/v1/statuses/:id`
   - Body: `UpdateApplicationStatusInput`
   - Returns: `{ data: ApplicationStatusDTO, message: "Status updated successfully" }`
4. `PUT /api/v1/statuses/reorder`
   - Body: `ReorderStatusesInput`
   - Returns: `{ data: ApplicationStatusDTO[], message: "Statuses reordered successfully" }`
5. `DELETE /api/v1/statuses/:id`
   - Checks if any application has `statusId === id`.
   - If in use: Returns `409 Conflict` with `{ message: "Cannot delete status because X applications are currently in this stage. Please reassign them first." }`.
   - If unused: Deletes record and returns 200 OK.

---

### 2.5 Dynamic StageRing & Visuals (`apps/web`)

In `StageRing`:
- If `status.closeType === 'REJECTED'`: Renders circle with inner `x` cross icon (`--stage-rejected`).
- If `status.closeType === 'WITHDRAWN'`: Renders dashed circle outline (`strokeDasharray="3 2.4"`).
- If `status.closeType === 'NO_RESPONSE'`: Renders dotted circle outline (`strokeDasharray="0.01 3.4"`).
- If `status.closeType === null`:
  - If last stage (`order === totalStages - 1`): Renders full circle + marker dot.
  - Else: Renders pie slice with progress fraction $\frac{\text{order}}{\text{totalStages} - 1}$.

---

### 2.6 Settings Management UI (`/settings?tab=stages`)

Located inside `apps/web/src/features/settings/components/pipeline-stages-section.tsx`:
- **Active Pipeline Stages List:**
  - Displays each stage with its position number, dynamic `StageRing` preview, and name.
  - Controls: Move Up, Move Down, Rename inline, Delete.
- **Add Stage Form:**
  - Fast inline input to append a stage.
- **Closed Outcomes Section:**
  - View and customize terminal outcome labels (`Rejected`, `Withdrawn`, `No Response`).
- **Design Standards:**
  - Bricolage Grotesque section titles, Instrument Sans UI text.
  - Hairline dividers (`border-border`), no cards inside cards.
  - Micro-animations: 150–200ms `cubic-bezier(0.16, 1, 0.3, 1)` transitions.
  - Mobile touch ergonomics: 44px min touch targets, `@media (hover: hover)`.

---

## 3. Acceptance Criteria & Quality Gates

1. **Deterministic Default Seeding:** Every newly registered user immediately has the 8 default statuses created.
2. **Stage Reordering:** Reordering stages persists instantly to the database and is reflected in the Kanban board and pipeline strip.
3. **Data Integrity Guard:** Attempting to delete a status that has applications returns a 409 Conflict error with an explicit warning message.
4. **Visual Accuracy:** The `StageRing` displays mathematically accurate fractions for all active pipeline stages.
5. **Analytics Integrity:** Active applications count matches `closeType: null`; closed count matches `closeType !== null`; rejection rate calculates accurately from `closeType === 'REJECTED'`.
6. **Zero Build & Lint Errors:** `pnpm build` passes cleanly across all workspaces.
7. **Passing Test Suites:** 100% green tests in API and Web.
