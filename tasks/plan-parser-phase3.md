# Implementation Plan: Resume Ingestion Phase 3 (LLM Zero-Shot Extraction & Dual Consensus)

> **Specification:** [spec-parser-phase3.md](../spec-parser-phase3.md)  
> **Method:** Strict Red-Green-Refactor TDD per AGENTS.md §3  
> **Target Files:**  
> - `apps/api/src/modules/master-profile/profile-extractor.service.ts`  
> - `apps/api/src/modules/master-profile/master-profile.service.ts`  
> **Test Files:**  
> - `apps/api/tests/profile-extractor.test.ts`  
> - `apps/api/tests/master-profile.test.ts`  

---

## Dependency Graph

```
Task 1 (Write Red Tests for AI Extractor & Fallback)
       │
       ▼
Task 2 (Green: Implement extractWithAi in ProfileExtractorService)
       │
       ▼
Task 3 (Green: Integrate extractWithAi in MasterProfileService & Persist customSections)
       │
       ▼
Task 4 (Verify Full Test Suite & Monorepo Build)
```

---

## Tasks

### Task 1: Write Red Tests for AI Extractor & Fallback
- **File:** `apps/api/tests/profile-extractor.test.ts`
- **Actions:**
  - Mock global `fetch` to simulate Gemini API responses.
  - Test `extractWithAi`: returns AI-extracted profile with `customSections`.
  - Test `extractWithAi`: coalesces phone/email from regex if AI missed them.
  - Test `extractWithAi`: falls back cleanly to deterministic parser when Gemini times out or throws.
- **Done when:** Tests fail (Red) because `extractWithAi` does not exist yet.

### Task 2: Implement `ProfileExtractorService.extractWithAi`
- **File:** `apps/api/src/modules/master-profile/profile-extractor.service.ts`
- **Actions:**
  - Implement `extractWithAi(rawText: string, apiKey?: string): Promise<MasterProfileDraftDTO>`.
  - Build prompt enforcing ZOES schema induction and polymorphic component extraction.
  - Execute native `fetch` to Gemini API with 20s timeout.
  - Implement consensus reconciliation with deterministic regex output.
  - Implement try/catch fallback returning `parseResumeText(rawText)`.
- **Done when:** `apps/api/tests/profile-extractor.test.ts` passes (Green).

### Task 3: Integrate with `MasterProfileService`
- **File:** `apps/api/src/modules/master-profile/master-profile.service.ts`
- **Actions:**
  - Update `uploadResume` to call `extractWithAi(extractedText, process.env.GEMINI_API_KEY)`.
  - Update `updateProfile` and `getProfile` to persist and return `customSections` via `factBank.customSections`.
- **Done when:** `apps/api/tests/master-profile.test.ts` passes and `customSections` are preserved.

### Task 4: Verify Full Suite & Monorepo Build
- **Actions:**
  - Run `pnpm --filter @tracker/api test`.
  - Run `pnpm -r build`.
  - Commit Phase 3 changes.
- **Done when:** All tests pass, build is clean, zero regressions.
