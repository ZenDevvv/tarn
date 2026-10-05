# Spec: Recruiter & Hiring Contact Management (`contacts`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 2 — Recruiter & Contact Management  
> **Module ID:** `contacts`  
> **Design System:** **Marker** (`app/DESIGN.md`, `apps/web/src/index.css`, `StageRing`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `app/job-application-tracker-brd-prd.md` (Section 7.10 Recruiter / Contact Management, Section 18.2 Navigation)  
> 2. `app/DESIGN.md` (Marker design rules, typography hierarchy, hairline borders, muted palettes)  
> 3. `CAPABILITY_MAP.md` (Phase 2 recruiter/contact book)  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
When pursuing opportunities across multiple companies, job seekers communicate with recruiters, headhunters, hiring managers, peer interviewers, and referral contacts. Currently, these contacts are either lost in email threads, scattered across LinkedIn messages, or not tied to specific job applications and companies. While the desktop/tablet sidebar includes a **Contacts** item (`Users` icon), clicking it previously bounced back to the dashboard because no `/contacts` page, backend module, or database entity existed.

### 1.2 User Stories
- **Contacts Directory (`/contacts`):** As a job seeker, I want a dedicated Contacts page displaying all my professional recruiter and hiring contacts with summary statistics (total contacts, recruiters, hiring managers, linked applications).
- **Search & Filter:** As a job seeker, I want to search contacts by name, role, email, or notes, and filter by company or contact category.
- **Add / Edit Contact:** As a job seeker, I want to create or edit a contact record with their name, role/title, email, phone, LinkedIn profile URL, associated company, associated application, and private notes.
- **Direct Actions:** As a job seeker, I want 1-click actions on each contact card to send an email (`mailto:`), initiate a call (`tel:`), or visit their LinkedIn profile.
- **Company & Application Association:** As a job seeker, I want to link each contact to an existing company and optionally to a specific job application, showing active stage ring badges for linked opportunities.
- **Contact Details View:** As a job seeker, I want to view full details and notes for any contact in a clean modal/drawer.
- **Safe Deletion:** As a job seeker, I want to delete a contact with a confirmation prompt.
- **Sidebar Integration:** As a job seeker, I want the sidebar `/contacts` link to show a dynamic badge count reflecting the total number of contacts.

---

## 2. Technical Contracts & Architecture

### 2.1 Database Layer (`packages/database`)

#### Prisma Schema:
```prisma
model Contact {
  id            String       @id @default(cuid())
  userId        String
  name          String
  role          String?      // e.g. "Technical Recruiter", "Engineering Manager"
  email         String?
  phone         String?
  linkedinUrl   String?
  companyId     String?
  applicationId String?
  notes         String?      @db.Text
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  company     Company?     @relation(fields: [companyId], references: [id], onDelete: SetNull)
  application Application? @relation(fields: [applicationId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([companyId])
  @@index([applicationId])
  @@map("contacts")
}
```

Relations to update:
- `User`: `contacts Contact[]`
- `Company`: `contacts Contact[]`
- `Application`: `contacts Contact[]`

---

### 2.2 Shared Types & Validation (`packages/types`, `packages/validation`)

#### Types (`packages/types/src/entities.ts`):
```typescript
export interface ContactDTO {
  id: string;
  userId: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  companyId?: string | null;
  applicationId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWithDetailsDTO extends ContactDTO {
  company?: {
    id: string;
    name: string;
    website?: string | null;
  } | null;
  application?: {
    id: string;
    status: ApplicationStatus;
    priority: Priority;
    job?: {
      id: string;
      title: string;
    } | null;
  } | null;
}
```

#### Validation (`packages/validation/src/contact.schema.ts`):
```typescript
export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  role: z.string().max(150).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  companyId: z.string().cuid().optional().nullable().or(z.literal('')),
  applicationId: z.string().cuid().optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable().or(z.literal('')),
});

export const updateContactSchema = createContactSchema.partial();

export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  companyId: z.string().optional(),
  hasApplication: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'company']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
```

---

### 2.3 Backend API (`apps/api`)

#### Modules Structure:
```text
apps/api/src/modules/contacts/
├── contact.repository.ts
├── contact.service.ts
├── contact.controller.ts
└── contact.routes.ts
```

#### API Endpoints Contract:
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/contacts` | List all contacts with company/application details & filter options | Yes |
| `GET` | `/api/v1/contacts/:id` | Get single contact with details | Yes |
| `POST` | `/api/v1/contacts` | Create a new contact | Yes |
| `PATCH` | `/api/v1/contacts/:id` | Update contact metadata | Yes |
| `DELETE` | `/api/v1/contacts/:id` | Delete contact | Yes |

---

### 2.4 Frontend Scope (`apps/web`)

```text
apps/web/src/features/contacts/
├── api/
│   └── contact-api.ts
├── components/
│   ├── contact-card.tsx
│   ├── contact-filters.tsx
│   ├── contact-form-modal.tsx
│   └── contact-detail-modal.tsx
└── pages/
    └── contacts-page.tsx
```

#### Marker Design Implementation:
- Header with `Users` icon, page title, subtitle, and "+ Add contact" button (`bg-primary text-primary-foreground`).
- Stats strip:
  - Total contacts (`Users` icon)
  - With active applications (`Briefcase` icon)
  - Target companies represented (`Building2` icon)
- Responsive Grid of contact cards:
  - Clean avatar circle with initial letters, tinted with pine brand colors.
  - Name, role/title badge, company name link.
  - Quick action pill buttons: Email (`Mail`), LinkedIn (`Linkedin`), Phone (`Phone`).
  - Associated application chip with `StageRing` showing live progress status.
  - Options menu (view details, edit, delete).
- Empty state: clean, encouraging state when no contacts match or exist.
- Form modal for creating/editing contacts with company and application selector dropdowns.
- Detail modal for viewing full notes, timeline context, and contact information.
- Navigation in `apps/web/src/app/router.tsx` to handle `/contacts` route.
- Real-time badge count on the sidebar navigation item in `apps/web/src/layouts/app-layout.tsx`.
