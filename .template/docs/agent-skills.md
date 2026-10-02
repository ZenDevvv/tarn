# 🧠 Agent Skills — Production Engineering Workflows for AI Agents

> *"Production-grade engineering skills, quality gates, and mental models for AI coding agents — authored by Addy Osmani."*

[![GitHub Stars](https://img.shields.io/github/stars/addyosmani/agent-skills?style=flat-square&color=111111&label=Stars)](https://github.com/addyosmani/agent-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/addyosmani/agent-skills/blob/main/LICENSE)
[![Compatible with 70+ Agents](https://img.shields.io/badge/Works%20with-70%2B%20Agents-blue?style=flat-square)](https://github.com/addyosmani/agent-skills)

---

## 📖 Overview

* **Repository:** [https://github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)  
* **Author:** Addy Osmani (Engineering Leader, Google Chrome)  
* **Category:** Agent Skills, Workflows, Quality Gates & Personas  
* **Compatible Tools:** Antigravity CLI, Claude Code, Cursor, Codex, Copilot, Cline, Windsurf, Kiro, OpenCode, and 70+ others  

Left to their own devices, AI coding agents write code like inexperienced developers in a hurry:
* They dive straight into coding without asking questions or checking requirements.
* They create massive 500-line multi-file pull requests that are impossible to review.
* They delete or comment out failing assertions just to see tests pass green.
* They hallucinate library methods and introduce subtle security vulnerabilities.

**Agent Skills** packages the workflows, review rubrics, and automated quality gates that senior staff engineers rely on into **25 structured skills and 4 specialist personas**. It transforms AI agents from erratic prompt responders into methodical, disciplined software engineers.

---

## 🔄 The 6-Phase Software Engineering Lifecycle

Agent Skills organizes development into a clean, 6-stage pipeline. Each stage is invoked with an intuitive slash command:

```
  DEFINE           PLAN            BUILD           VERIFY          REVIEW           SHIP
┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
│  Idea  │ ───▶ │  Spec  │ ───▶ │  Code  │ ───▶ │  Test  │ ───▶ │   QA   │ ───▶ │   Go   │
│ Refine │      │  PRD   │      │  Impl  │      │ Debug  │      │  Gate  │      │  Live  │
└────────┘      └────────┘      └────────┘      └────────┘      └────────┘      └────────┘
  /spec           /plan           /build          /test          /review          /ship
```

### ⚡ Autonomous Execution with `/build auto`
Once a spec and plan are defined, **`/build auto`** executes all planned tasks end-to-end in a single approved pass. It removes manual human intervention between tasks while **strictly maintaining verification**: every single slice is still test-driven, verified, and committed individually, immediately pausing if any test breaks.

---

## 📋 Comprehensive Skills Catalog (25 Skills)

### 1. Meta Skills
* **`using-agent-skills`**: Analyzes the current task and routes incoming work to the optimal skill workflow.

### 2. Phase 1: DEFINE — Clarify What to Build
* **`/spec` (`spec-driven-development`)**: Drafts an exhaustive Product Requirement Document (PRD) covering objectives, command structures, data schemas, and acceptance criteria *before writing any implementation*.
* **`interview-me`**: Asks targeted, one-question-at-a-time clarifying queries until ~95% confidence is reached regarding what the user truly wants.
* **`idea-refine`**: Leverages structured divergent/convergent thinking to translate vague notions into concrete technical proposals.
* **`/constraints` (`constraint-driven-development`)**: Establishes strict quality thresholds (`CONSTRAINTS.md`) and stops agents from silencing checks or skipping tests.

### 3. Phase 2: PLAN — Break It Down
* **`/plan` (`planning-and-task-breakdown`)**: Decomposes PRDs into atomic, verifiable tasks with explicit dependencies and acceptance criteria.

### 4. Phase 3: BUILD — Write the Code
* **`/build` (`incremental-implementation`)**: Implements thin vertical slices with feature flags, safe defaults, and rollback readiness.
* **`test-driven-development`**: Enforces strict Red-Green-Refactor, test pyramids (80% unit, 15% integration, 5% E2E), and the "Beyonce Rule" (*If you liked it, you should have put a test on it*).
* **`doubt-driven-development`**: An adversarial self-check protocol (`CLAIM` → `EXTRACT` → `DOUBT` → `RECONCILE` → `STOP`) for high-stakes decisions.
* **`source-driven-development`**: Grounds every library or framework decision in official documentation and cites source versions.
* **`context-engineering`**: Packs the right context, rules, and MCP servers into the agent's active memory.
* **`frontend-ui-engineering`**: Modern component architecture, responsive design, and WCAG 2.1 AA accessibility compliance.
* **`api-and-interface-design`**: Contract-first API design, Hyrum's Law mitigation, error semantics, and boundary validation.

### 5. Phase 4: VERIFY — Prove It Works
* **`/test` (`browser-testing-with-devtools`)**: Connects to the Chrome DevTools MCP to perform live DOM inspections, network request validation, console log capture, and runtime profiling.
* **`debugging-and-error-recovery`**: 5-step triage framework: Reproduce → Localize → Reduce → Fix → Guard.

### 6. Phase 5: REVIEW — Quality Gates
* **`/review` (`code-review-and-quality`)**: Senior Staff 5-axis code review; enforces change sizing (~100 lines) and strict cleanliness standards.
* **`/code-simplify` (`code-simplification`)**: Applies Chesterton's Fence and the Rule of 500 to simplify convoluted logic while preserving identical external behavior.
* **`security-and-hardening`**: Audits for OWASP Top 10 vulnerabilities, validates authentication/authorization, and checks secret handling.
* **`/webperf` (`performance-optimization`)**: Measures Core Web Vitals (LCP, INP, CLS) and pinpoints render-blocking assets.

### 7. Phase 6: SHIP — Deploy with Confidence
* **`/ship` (`git-workflow-and-versioning`)**: Trunk-based workflow, atomic git commits, and the "commit-as-save-point" pattern.
* **`ci-cd-and-automation`**: Quality gate automation and build pipelines.
* **`observability-and-instrumentation`**: Structured logging, RED metrics, and OpenTelemetry tracing.
* **`documentation-and-adrs`**: Architecture Decision Records (ADRs) that document the *why* behind architectural choices.
* **`deprecation-and-migration`**: Safe migration patterns and zombie code removal.
* **`shipping-and-launch`**: Staged rollouts, feature flag management, and rollback plans.

---

## 🤖 4 Specialist Agent Personas

In addition to workflow skills, the pack provides 4 pre-configured personas for specialized review turns:

| Persona | Role | Standard Applied |
|---|---|---|
| **`code-reviewer`** | Senior Staff Engineer | 5-axis code review with the standard: *"Would a staff engineer approve this to merge?"* |
| **`test-engineer`** | QA Specialist | Test strategy, edge case discovery, and the Prove-It pattern. |
| **`security-auditor`** | Security Engineer | Threat modeling, boundary validation, and OWASP Top 10 checks. |
| **`web-performance-auditor`** | Web Perf Specialist | Core Web Vitals audit and metric-driven optimization. |

---

## 🛠️ Complete Installation Guide

### Option 1: Universal CLI (Works with 70+ Agents)
Using the open [skills CLI](https://github.com/vercel-labs/skills), install all 25 skills with a single command:

```bash
# Install all skills
npx skills add addyosmani/agent-skills

# Or preview available skills first
npx skills add addyosmani/agent-skills --list

# Install specific individual skills
npx skills add addyosmani/agent-skills --skill code-review-and-quality
npx skills add addyosmani/agent-skills --skill interview-me
npx skills add addyosmani/agent-skills --skill test-driven-development
```

---

### Option 2: Antigravity CLI (`agy`)
Install as a native plugin:
```bash
agy plugin install https://github.com/addyosmani/agent-skills.git
```
*Alternatively, from a local clone:*
```bash
git clone https://github.com/addyosmani/agent-skills.git
agy plugin install ./agent-skills
```

---

### Option 3: Claude Code (Recommended Native Marketplace)
```text
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

> **Git/SSH Troubleshooting:** If the marketplace returns SSH permission errors, use the full HTTPS URL:
> ```bash
> /plugin marketplace add https://github.com/addyosmani/agent-skills.git
> /plugin install agent-skills@addy-agent-skills
> ```

---

### Option 4: Cursor
1. Clone or download the repository.
2. Copy the `skills/` directory into your project at `.cursor/skills/` (or global `~/.cursor/skills/`).
3. Add specific policies to `.cursor/rules/*.mdc`.

---

### Option 5: Codex CLI & Desktop
```bash
codex plugin marketplace add addyosmani/agent-skills
codex plugin add agent-skills@agent-skills
```
*Invoke installed skills in chat using `@` (e.g., `@spec-driven-development`).*

---

### Option 6: Gemini CLI
```bash
gemini skills install https://github.com/addyosmani/agent-skills.git --path skills
```

---

### Option 7: Windsurf, OpenCode & Copilot
* **Windsurf:** Copy the skill markdown files into `.windsurf/rules/`.
* **OpenCode:** Copy to `.opencode/skills/` and add to project `AGENTS.md`.
* **Copilot:** Include personas from `agents/` in `.github/copilot-instructions.md`.

---

## 🎯 Recommended Adoption Strategy

* **For New (Greenfield) Projects:**  
  Start from day one with `/spec` to draft requirements, `/plan` to outline tasks, and `/build auto` for test-driven execution.
* **For Existing (Legacy) Codebases:**  
  Introduce skills incrementally. Start with `/review` to audit PRs, `interview-me` to clarify bugs, and `/code-simplify` to clean up refactored modules before running full lifecycles.
