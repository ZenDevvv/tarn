# Spec: Account Settings, Profile & Preferences (`settings`)

> **Initiative:** Job Application Tracker — Personal ATS Web Application  
> **Phase:** Phase 12 — Account Settings, Profile & User Preferences  
> **Module ID:** `settings`  
> **Design System:** **Marker** (`app/DESIGN.md`, `apps/web/src/index.css`, `StageRing`)  
> **Status:** Specification  
> **Source-of-Truth Documents:**  
> 1. `app/job-application-tracker-brd-prd.md` (FR-AUTH-006 Account Settings, Section 18.2 Navigation)  
> 2. `app/job-application-tracker-project-architecture.md` (Section 8 Frontend Features, Section 12 Frontend State Strategy)  
> 3. `app/DESIGN.md` (Marker design rules, typography hierarchy, hairline borders, muted palettes, no cards-in-cards)  
> 4. `CAPABILITY_MAP.md`  

---

## 1. Objective & User Stories

### 1.1 Problem Statement
The application layout currently features a **Settings** link with a gear icon in both the desktop/tablet sidebar and mobile navigation. However, navigating to `/settings` bounces back to the dashboard because no `/settings` route, page, API module, or preferences model exists. Users currently cannot view or update their profile details (headline, location, timezone, links, bio), customize default application settings (default work setup, default currency, default resume version), adjust notification preferences, update their password, or export their data.

### 1.2 User Stories
- **Settings Hub (`/settings`):** As a job seeker, I want a dedicated Settings page with intuitive tabs (Profile, Preferences, Security, Data & Export) adhering to the Marker design system.
- **Profile Management:** As a job seeker, I want to edit my full name, professional headline (e.g., "Staff Frontend Engineer"), primary location, timezone, phone number, website/portfolio link, LinkedIn URL, and bio.
- **Application Defaults:** As a job seeker, I want to set default preferences for new applications (e.g. Default Currency like USD, EUR, GBP; Default Work Setup like Remote, Hybrid, Onsite; Default Resume version) so that new job applications are pre-configured.
- **Notification Preferences:** As a job seeker, I want to toggle reminders for upcoming interviews, follow-up alerts, and weekly digest summaries.
- **Theme & Appearance:** As a job seeker, I want to choose my preferred appearance (Paper Light, Night Pine Dark, or System Sync).
- **Security & Password Update:** As a job seeker, I want to securely change my account password by providing my current password and a new secure password.
- **Data Portability & Export:** As a job seeker who values data privacy and ownership, I want to export my entire job search archive (profile, applications, jobs, companies, contacts, interviews, follow-ups, resumes) with 1 click as a formatted JSON document.
- **Account Overview & Summary:** As a job seeker, I want to see a summary of my account footprint (member since date, total applications, interviews, contacts, resumes).

---

## 2. Technical Contracts & Architecture

### 2.1 Database Layer (`packages/database`)

Extend the `User` model in `schema.prisma` with profile and preference fields:

```prisma
model User {
  id                 String        @id @default(cuid())
  email              String        @unique
  passwordHash       String
  name               String
  headline           String?
  location           String?
  timezone           String?       @default("UTC")
  phone              String?
  website            String?
  linkedinUrl        String?
  bio                String?       @db.Text
  defaultCurrency    String?       @default("USD")
  defaultWorkSetup   WorkSetup?
  defaultResumeId    String?
  emailNotifications Boolean       @default(true)
  interviewReminders Boolean       @default(true)
  followUpAlerts     Boolean       @default(true)
  weeklyDigest       Boolean       @default(false)
  themePreference    String?       @default("system")
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  applications       Application[]
  companies          Company[]
  jobs               Job[]
  followUps          FollowUp[]
  interviews         Interview[]
  contacts           Contact[]
  resumes            Resume[]

  @@map("users")
}
```

### 2.2 Shared Types (`packages/types`)

- `UserSettingsDTO`: Comprehensive object containing full user profile, preferences, default resume label if set, and account statistics.
- `UpdateProfileInput`: `{ name, headline?, location?, timezone?, phone?, website?, linkedinUrl?, bio? }`
- `UpdatePreferencesInput`: `{ defaultCurrency?, defaultWorkSetup?, defaultResumeId?, emailNotifications?, interviewReminders?, followUpAlerts?, weeklyDigest?, themePreference? }`
- `ChangePasswordInput`: `{ currentPassword, newPassword }`
- `UserDataExportDTO`: Full export containing user metadata and all child entity arrays.

### 2.3 Shared Validation (`packages/validation`)

- `updateProfileSchema`: Validates name (min 2), optional URLs (valid URL format or empty string), phone, timezone, and bio length (max 1000).
- `updatePreferencesSchema`: Validates optional currency (3 letters), WorkSetup enum, notification booleans, theme preference enum (`light`, `dark`, `system`).
- `changePasswordSchema`: Validates `currentPassword` (min 1) and `newPassword` (min 8).

### 2.4 Backend API Endpoints (`apps/api`)

Base path: `/api/v1/settings` (all authenticated via JWT cookie):

1. `GET /api/v1/settings`
   - Returns: `{ data: UserSettingsDTO }`
2. `PATCH /api/v1/settings/profile`
   - Body: `UpdateProfileInput`
   - Returns: `{ data: UserSettingsDTO, message: "Profile updated successfully" }`
3. `PATCH /api/v1/settings/preferences`
   - Body: `UpdatePreferencesInput`
   - Returns: `{ data: UserSettingsDTO, message: "Preferences updated successfully" }`
4. `POST /api/v1/settings/password`
   - Body: `ChangePasswordInput`
   - Returns: `{ message: "Password updated successfully" }`
5. `GET /api/v1/settings/export`
   - Returns: Formatted JSON with `Content-Disposition: attachment; filename="job-tracker-export-{date}.json"`

### 2.5 Frontend Architecture (`apps/web`)

Feature folder: `apps/web/src/features/settings/`
- `api/settings-api.ts`: TanStack Query hooks & mutators
- `components/settings-nav.tsx`: Responsive tab bar (Profile, Preferences, Security, Data & Export)
- `components/profile-section.tsx`: Identity, contact, and bio form
- `components/preferences-section.tsx`: Defaults and notification toggles
- `components/security-section.tsx`: Current & new password form
- `components/theme-selector.tsx`: Visual Paper / Night Pine / System switcher
- `components/data-section.tsx`: Account metrics summary & 1-click JSON export
- `pages/settings-page.tsx`: Main page coordinating tabs and saving states

Route: `/settings` registered in `apps/web/src/app/router.tsx` inside `AppLayout`.

---

## 3. Acceptance Criteria & Quality Gates

1. **Routing:** Clicking "Settings" in the sidebar or "More" on mobile successfully navigates to `/settings` with zero redirects.
2. **Profile Updates:** Changing name, headline, location, or bio persists and reflects in the UI and sidebar user display.
3. **Preferences:** Changing default currency, work setup, or notification preferences persists in the database.
4. **Password Security:** Changing password requires correct current password; returns 401/400 if current password is wrong; successfully updates hash when valid.
5. **Data Export:** Exporting data downloads valid JSON containing all user-owned applications, companies, jobs, interviews, contacts, follow-ups, and resumes.
6. **Design Compliance:** 100% compliant with Marker design system (Bricolage Grotesque titles, sentence-case labels, no cards inside cards, light and dark mode support).
7. **Automated Verification:** 100% passing tests across API and Web with zero build errors.
