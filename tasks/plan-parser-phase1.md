# Implementation Plan: Resume Ingestion Phase 1 (Deterministic Hardening)

> **Specification:** [spec-parser-phase1.md](../spec-parser-phase1.md)  
> **Method:** Strict Red-Green-Refactor TDD per AGENTS.md §3  
> **Target File:** `apps/api/src/modules/master-profile/profile-extractor.service.ts`  
> **Test File:** `apps/api/tests/profile-extractor.test.ts`  

---

## Dependency Graph

```
Task 1 (Write Red Tests)
       │
       ▼
Task 2 (Green: Section Aliases, Dates, Regions)
       │
       ▼
Task 3 (Green: Multi-Degree Education Parser)
       │
       ▼
Task 4 (Verify Full Suite & Review)
```

---

## Tasks

### Task 1: Write Red Tests for Phase 1 Scenarios
- **File:** `apps/api/tests/profile-extractor.test.ts`
- **Actions:**
  - Add test case: Section alias detection for `CLINICAL EXPERIENCE`, `LICENSES & CERTIFICATIONS`, `BAR ADMISSIONS`.
  - Add test case: Multi-degree education parsing (candidate with MD + BS).
  - Add test case: International dates (`Nov 2021 – Presente`, `Ene 2020 – Actualidad`).
  - Add test case: Global region parsing (`Bangalore, India`, `Paris, France`).
- **Done when:** Tests fail (Red) specifically on the unhandled cases.

### Task 2: Implement Expanded Section Regexes, Dates, and Regions
- **File:** `apps/api/src/modules/master-profile/profile-extractor.service.ts`
- **Actions:**
  - Update `REGION_ALLOWLIST` with European, Asian, Latin American, and Australian regions.
  - Update section heading partitioning regexes in `lines.forEach` with clinical, licensure, academic, and multilingual aliases.
  - Update `dateMatch` regex to accept multilingual present-day markers (`Actualidad`, `Présent`, `Presente`, `Heute`, `至今`, `Ongoing`) and month abbreviations.
- **Done when:** Task 1 tests for section aliases, dates, and regions pass (Green).

### Task 3: Refactor Education Parser for Multi-Degree Support
- **File:** `apps/api/src/modules/master-profile/profile-extractor.service.ts`
- **Actions:**
  - Split `eduLines` into distinct degree/school blocks (e.g. by blank lines or multiple qualification markers).
  - Extract and push each distinct block as an entry into `education[]`.
  - Preserve school-first and degree-first disambiguation on each entry.
- **Done when:** Multi-degree education test passes (Green); existing single-degree tests continue passing without regression.

### Task 4: Full Suite Verification & Simplicity Review
- **Actions:**
  - Run `pnpm --filter @tracker/api test` (all unit and persona tests).
  - Run typechecks and linting if applicable.
  - 5-axis review: Correctness, Security, Performance, Maintainability, Simplicity.
- **Done when:** Entire test suite is 100% green with zero regressions.
