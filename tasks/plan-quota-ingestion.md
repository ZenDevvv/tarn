# Implementation Plan: Quota-Gated Dual-Mode Resume Ingestion

## Task Breakdown

### Task 1: Validation & Type Schema Updates
- **File:** `packages/validation/src/tailoring.schema.ts` (and re-export if needed)
- **Changes:** Add `mode: z.enum(['ai', 'standard']).default('standard')` to `uploadProfileResumeSchema`.
- **Verify:** `pnpm --filter @tracker/validation build`.

### Task 2: Backend Quota Metering & Discretion Logic
- **Files:**
  - `apps/api/src/modules/master-profile/master-profile.service.ts`
- **Changes:**
  - In `uploadResume(userId, input)`:
    - If `input.mode === 'ai'`:
      - Call `tailoringService.assertCanGenerate(userId)` to verify quota.
      - Call `ProfileExtractorService.extractWithAi(extractedText, apiKey)`.
      - On success, atomically increment `generationUsage` via Prisma.
    - If `input.mode === 'standard'`:
      - Call `ProfileExtractorService.parseResumeText(extractedText)`.
      - Append discretion note: `"Parsed via local deterministic engine. While tuned across multiple professions, unconventional layouts may require quick verification."`
      - Zero quota deducted.
  - Return updated quota info alongside profile and warnings.
- **Verify:** Write unit/integration tests in `apps/api/tests/master-profile.test.ts`.

### Task 3: Ingestion Choice Modal & Web Flow
- **Files:**
  - `apps/web/src/features/settings/components/resume-upload-dropzone.tsx`
- **Changes:**
  - Fetch live quota using `tailoringApi.getQuota()`.
  - When a file is dropped or selected, do NOT upload immediately; instead stage the file and open the **Extraction Method Choice Modal**.
  - Choice Modal displays:
    - Current daily quota badge (e.g. "Remaining today: X / 5 AI credits").
    - **Option A (AI-Powered):** 1 Credit. Deep layout & polymorphic section induction. Disabled if `remainingToday <= 0`.
    - **Option B (Standard):** Free (0 Credits). Deterministic multi-domain parsing with advisory note.
  - Action buttons: "Cancel" and "Start Extraction".
  - If AI fails/times out, display error banner with option to retry or fall back to Standard without deducting credits.
  - Render the extracted draft in an interactive review modal with candidate contact inputs, warnings/discretion notes, and confirm/discard buttons.
- **Verify:** Monorepo build and manual verification.

### Task 4: Automated Verification & Monorepo Build
- Run `pnpm --filter @tracker/api test`.
- Run `pnpm -r build`.
