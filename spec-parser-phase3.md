# Specification: Resume Ingestion Phase 3 (LLM Zero-Shot Extraction & Dual Consensus)

> **Initiative:** LLM Zero-Shot Extraction & Dual Consensus Architecture  
> **Targets:**  
> - `apps/api/src/modules/master-profile/profile-extractor.service.ts`  
> - `apps/api/src/modules/master-profile/master-profile.service.ts`  
> **Status:** Approved for Implementation  
> **Parent Architecture:** [roadmap-parser-evolution.md](file:///home/machenike/Projects/tarn/brain/82b03a4a-3f53-4e1c-8003-b119ac0843b2/roadmap-parser-evolution.md)  
> **Task Plan:** [tasks/plan-parser-phase3.md](tasks/plan-parser-phase3.md)  

---

## 1. Objective

Integrate Google Gemini zero-shot document understanding into resume ingestion, using Zero-Shot Open-Schema Entity Structure Discovery (ZOES) to natively ingest unstructured resumes from any global profession and language without regex maintenance.

The Phase 1 hardened regex parser serves as an automatic **offline fallback and cross-validation gate**:
1. **Primary Path:** Gemini 2.5 Flash structured output parses unstructured text directly into the polymorphic schema (`basics`, `workExperience`, `education`, `skills`, `factBank`, `customSections`).
2. **Consensus Gate:** Deterministic regex extraction cross-references extracted contact basics (email, phone, URLs). If the LLM omits literal contact tokens that regex detected, they are automatically coalesced.
3. **Graceful Fallback:** If the Gemini API is unreachable, unconfigured, or rate-limited, the system falls back to the deterministic Phase 1 parser with zero downtime.

---

## 2. Requirements & Acceptance Criteria

### 2.1 Gemini Zero-Shot Extractor (`ProfileExtractorService.extractWithAi`)
- Utilize Gemini API via native `fetch` with `responseMimeType: "application/json"` and `temperature: 0.1`.
- Instruct Gemini to perform polymorphic section classification (e.g., classifying clinical rotations, bar admissions, apprenticeships, and publications into `customSections[]`).
- Schema validation: Validate returned JSON with `updateMasterProfileSchema` to ensure strict type compliance.

### 2.2 Dual-Engine Consensus & Fallback
- Cross-validate basics: If regex finds email, phone, or literal links that AI missed, coalesce them into the final draft.
- If Gemini API fails (network error, timeout, 429 rate limit, missing API key):
  - Catch the error cleanly.
  - Log warning and fall back to `ProfileExtractorService.parseResumeText(extractedText)`.
  - Append an advisory warning: `"AI extraction unavailable; extracted via deterministic engine"`.
  - Guarantee that `POST /api/v1/master-profile/upload-resume` never 500s or fails on AI outages.

### 2.3 Master Profile Persistence
- In `master-profile.service.ts`:
  - Preserve `customSections` during `uploadResume`, `importJson`, `updateProfile`, and `getProfile`.
  - Store `customSections` in `factBank.customSections` to ensure zero database migrations.

---

## 3. Constraints & Ponytail Ladder

1. **Zero New Dependencies:** Native `fetch` with `AbortSignal.timeout(20000)` handles all API calls.
2. **Never Block on AI:** The system must function completely offline or without an API key using Phase 1.
3. **No Key Leaks:** API keys must be redacted from error messages or logs.
