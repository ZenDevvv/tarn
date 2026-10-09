# Specification: Resume Ingestion Phase 2 (Polymorphic Component Data Model)

> **Initiative:** Polymorphic Component Data Model (Structural Evolution)  
> **Targets:**  
> - `packages/types/src/entities.ts`  
> - `packages/validation/src/tailoring.schema.ts`  
> - `apps/api/src/modules/tailoring/templates/resume-template.ts`  
> - `apps/api/src/modules/tailoring/tailoring-validator.service.ts`  
> **Status:** Approved for Implementation  
> **Parent Architecture:** [roadmap-parser-evolution.md](file:///home/machenike/.gemini/antigravity-cli/brain/82b03a4a-3f53-4e1c-8003-b119ac0843b2/roadmap-parser-evolution.md)  
> **Task Plan:** [tasks/plan-parser-phase2.md](tasks/plan-parser-phase2.md)  

---

## 1. Objective

Provide first-class support for arbitrary domain-specific sections (clinical rotations, bar admissions, judicial clerkships, publications, trade apprenticeships, security clearances) across the Tarn data model, template renderer, and tailoring validator.

Modeled after **Reactive Resume** and **HR Open Standards (LER-RS V2)**, candidates must be able to define polymorphic sections that render with typography and styling matching standard resume sections, and are fully recognized by grounding validation.

---

## 2. Requirements & Data Contracts

### 2.1 Polymorphic Types (`@tracker/types`)
Define typed models for polymorphic components:
- `SectionType`: `'timeline' | 'credentials' | 'publications' | 'skills_matrix' | 'freeform'`
- `TimelineItem`: `{ id?: string; role: string; organization: string; location?: string | null; date_range?: string | null; bullets: string[]; attributes?: Record<string, string> }`
- `CredentialItem`: `{ id?: string; name: string; issuer?: string | null; licenseNumber?: string | null; jurisdiction?: string | null; date?: string | null; status?: string | null }`
- `PublicationItem`: `{ id?: string; title: string; authors?: string[]; venue?: string | null; date?: string | null; doiOrUrl?: string | null }`
- `SkillGroupItem`: `{ category: string; skills: string[] }`
- `FreeformItem`: `{ heading?: string | null; content: string }`
- `PolymorphicSection`: `{ id: string; title: string; type: SectionType; items: any[] }`

Add `customSections?: PolymorphicSection[]` to:
- `MasterProfileDTO`
- `MasterProfileDraftDTO.profile`

### 2.2 Schema Validation (`@tracker/validation`)
Update `updateMasterProfileSchema` and `aiResumePayloadSchema`:
- Validate `customSections` with `z.array(polymorphicSectionSchema).optional().default([])`.
- Retain backward compatibility with existing 6 core sections (`basics`, `workExperience`, `education`, `skills`, `projectExperience`, `factBank`).

### 2.3 Template Rendering (`resume-template.ts`)
Update `buildResumeHtml`:
- Dynamically build HTML for each `customSection` in `payload.customSections`:
  - `timeline`: Render using `.entry`, `.entry-header`, `.entry-meta-row`, `.entry-list`.
  - `credentials`: Render using `.cert-row`, `.cert-label`, `.cert-issuer`, `.cert-date`.
  - `publications`: Render publication title, authors, venue, date.
  - `freeform`: Render section kicker with paragraphs/lists.
- Map custom section titles / IDs into `sectionMap` so they can be positioned in `activeOrder` / `sectionOrder`.
- If a custom section is not explicitly in `sectionOrder`, append it cleanly after experience/projects.

### 2.4 Grounding Validation (`tailoring-validator.service.ts`)
Update `TailoringValidatorService.validate`:
- Include text and entities from `profile.customSections` in:
  - `profileCorpusLower`
  - `masterCompanies` (for timeline organizations)
  - `masterCerts` (for credential items)
  - `profileYears` (for timeline/credential/publication dates)
- Prevent false "Ungrounded" fidelity warnings when tailoring resumes referencing items in custom sections.

---

## 3. Constraints & Ponytail Ladder

1. **Zero Breaking Changes:** Existing profiles without `customSections` continue to serialize, validate, and render identically.
2. **Standard HTML/CSS:** Use existing `.entry`, `.cert-row`, `.section-kicker` classes in `RESUME_CSS` without adding external stylesheets or bloated templates.
3. **Preserve TDD:** Full suite of unit tests for rendering and validation of polymorphic sections.
