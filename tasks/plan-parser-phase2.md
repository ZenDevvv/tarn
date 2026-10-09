# Implementation Plan: Resume Ingestion Phase 2 (Polymorphic Component Data Model)

> **Specification:** [spec-parser-phase2.md](../spec-parser-phase2.md)  
> **Method:** Strict Red-Green-Refactor TDD per AGENTS.md §3  
> **Target Files:**  
> - `packages/types/src/entities.ts`  
> - `packages/validation/src/tailoring.schema.ts`  
> - `apps/api/src/modules/tailoring/templates/resume-template.ts`  
> - `apps/api/src/modules/tailoring/tailoring-validator.service.ts`  
> **Test Files:**  
> - `apps/api/tests/resume-template.test.ts`  
> - `apps/api/tests/tailoring-validator.test.ts`  

---

## Dependency Graph

```
Task 1 (Polymorphic Types & Zod Schemas)
       │
       ▼
Task 2 (Write Red Tests in Template & Validator)
       │
       ▼
Task 3 (Green: Polymorphic HTML Rendering in resume-template.ts)
       │
       ▼
Task 4 (Green: Grounding Inclusion in tailoring-validator.service.ts)
       │
       ▼
Task 5 (Verify Full Test Suite & Monorepo Build)
```

---

## Tasks

### Task 1: Add Polymorphic Types & Schemas
- **Files:** `packages/types/src/entities.ts`, `packages/validation/src/tailoring.schema.ts`
- **Actions:**
  - Define `SectionType`, `TimelineItem`, `CredentialItem`, `PublicationItem`, `SkillGroupItem`, `FreeformItem`, and `PolymorphicSection`.
  - Add optional `customSections` to `MasterProfileDTO`.
  - Add `customSections` schema to `updateMasterProfileSchema` and `aiResumePayloadSchema`.
- **Done when:** `pnpm --filter @tracker/types build` and `pnpm --filter @tracker/validation build` succeed.

### Task 2: Write Red Tests for Template & Validator
- **Files:** `apps/api/tests/resume-template.test.ts`, `apps/api/tests/tailoring-validator.test.ts`
- **Actions:**
  - In `resume-template.test.ts`: Add test verifying that a payload with `customSections` (e.g. Clinical Rotations and Bar Admissions) renders with proper HTML kicker, entries, and dates.
  - In `tailoring-validator.test.ts`: Add test verifying that employers and credentials defined in `profile.customSections` are recognized as grounded and do NOT produce ungrounded warnings.
- **Done when:** Tests fail (Red) because `buildResumeHtml` does not yet render custom sections and validator does not index them.

### Task 3: Implement Polymorphic Section Rendering
- **File:** `apps/api/src/modules/tailoring/templates/resume-template.ts`
- **Actions:**
  - Implement renderers for each section type (`timeline`, `credentials`, `publications`, `skills_matrix`, `freeform`).
  - Map custom sections into `sectionMap` and append or order them based on `sectionOrder`.
- **Done when:** `resume-template.test.ts` turns Green.

### Task 4: Implement Polymorphic Grounding in Validator
- **File:** `apps/api/src/modules/tailoring/tailoring-validator.service.ts`
- **Actions:**
  - Index custom section organizations into `masterCompanies`.
  - Index custom section credentials into `masterCerts`.
  - Index text into `profileCorpusLower` and dates into `profileYears`.
- **Done when:** `tailoring-validator.test.ts` turns Green.

### Task 5: Verify Full Test Suite & Review
- **Actions:**
  - Run all 26 test files in `@tracker/api`.
  - Run `pnpm -r build`.
  - Git commit Phase 2.
- **Done when:** 100% tests passing, clean build, zero regressions.
