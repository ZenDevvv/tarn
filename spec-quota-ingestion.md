# Specification: Domain-Agnostic Quota-Gated Resume Ingestion

## 1. Problem Statement & Motivation
Tarn currently provides 5 free daily AI generations per user for tailoring deliverables (`generation_usages` table). However, resume ingestion currently invokes Google's Gemini 2.5 Flash API unmetered and unconditionally for any uploaded file. This leaves the system vulnerable to API quota and cost exhaustion. Furthermore, users currently lack visibility or choice over whether to spend an AI generation credit or use fast, free standard parsing.

## 2. Core Objectives
1. **Shared Quota Metering:** Connect AI resume ingestion to the existing 5 daily generations allowance tracked in `generationUsage`.
2. **Dual Domain-Agnostic Ingestion Engines:**
   - **Engine A: AI-Powered Extraction (`mode: 'ai'`)**
     - Consumes 1 credit from daily quota.
     - Uses Gemini 2.5 Flash zero-shot schema induction + dual consensus reconciler.
     - Discovers polymorphic custom sections (`timeline`, `credentials`, `publications`, `skills_matrix`, `freeform`).
     - Error policy: If the external AI call fails or times out, halt with a descriptive error message and **do not deduct** an AI credit.
   - **Engine B: Standard Extraction (`mode: 'standard'`)**
     - 100% Free & Unlimited (0 credits deducted).
     - Domain-agnostic deterministic engine (hardened section aliases, multi-degree education segmentation, international dates, global regions).
     - Includes standard discretion note informing the user that non-standard or multi-column layouts may have minor inaccuracies and should be reviewed.
3. **Interactive Choice Modal:**
   - Immediately upon selecting or dropping a file, render a choice modal displaying:
     - Remaining AI credits for today (e.g., "4 of 5 credits remaining").
     - Option 1: AI-Powered Deep Extraction (1 credit). Disabled if quota is 0.
     - Option 2: Standard Extraction (Free / 0 credits).
     - Clear start button and cancel option.
4. **Draft Review Modal with Discretion Notes:**
   - Display the extracted draft in an interactive review modal with candidate contact inputs, section counters, and verification warnings/discretion notes.

## 3. Data Schemas & API Contracts

### 3.1 Input Schema (`packages/validation/src/tailoring.schema.ts` / `resume.schema.ts`)
```ts
export const uploadProfileResumeSchema = z.object({
  filename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileData: z.string().min(1),
  mode: z.enum(['ai', 'standard']).default('standard'),
});
```

### 3.2 Endpoint Behavior (`POST /api/v1/master-profile/upload-resume`)
- If `mode === 'ai'`:
  - Check quota via `tailoringService.assertCanGenerate(userId)`.
  - If quota remaining <= 0, throw `PlansRequiredError` (`402 / 403`).
  - Invoke `ProfileExtractorService.extractWithAi(extractedText, apiKey)`.
  - If successful, atomically increment `generationUsage` for `(userId, today)`.
  - Return `{ data: { profile, warnings, quota } }`.
- If `mode === 'standard'`:
  - Invoke `ProfileExtractorService.parseResumeText(extractedText)`.
  - Append discretion advisory note to `warnings`:
    *"Parsed via local deterministic engine. While tuned across multiple professions, unconventional layouts may require quick verification."*
  - Do NOT decrement quota.
  - Return `{ data: { profile, warnings, quota } }`.

## 4. Acceptance Criteria
- [x] Users with 0 remaining AI credits cannot trigger AI extraction (proper error returned).
- [x] Standard extraction never decrements quota and always works for free.
- [x] Selecting a file opens the choice modal displaying live quota remaining.
- [x] If AI extraction fails or times out, no quota is consumed and the user can retry or switch to standard.
- [x] Both modes parse domain-agnostic resumes (medicine, law, engineering, academia, trades) cleanly.
- [x] All existing test suites pass with zero regressions.
