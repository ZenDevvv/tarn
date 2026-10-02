# 🚀 Model-Agnostic Agent Template

> A turnkey, production-grade starter template for disciplined, high-performance "vibe coding".  
> Built on 4 Core Pillars: **Graphify**, **Agents**, **Skills**, and **Ponytail** — supplemented by a dedicated **Frontend Design & Motion Suite** (Impeccable, Taste Skill, Emil Kowalski). 100% model-agnostic.

[![Template Repository](https://img.shields.io/badge/GitHub-Template_Repository-blue?logo=github)](https://github.com/ZenDevvv/model-agnostic-agent-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Model Agnostic](https://img.shields.io/badge/Models-100%25_Agnostic-success)](README.md#-100-model-agnostic-free-budget--frontier-models)

---

## ⚡ The 4 Core Pillars of this Template

| Pillar | Powered By | What It Does For Your Project |
|---|---|---|
| **1. Structural Awareness** | [Graphify](https://github.com/Graphify-Labs/graphify) | Ingests code (AST across 13+ languages), docs, and diagrams into a knowledge graph. Saves **up to 71.5x tokens** per query vs reading raw files and identifies architectural "God nodes". |
| **2. Specialist Personas** | **Agents** ([addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)) | 4 pre-configured review personas: Senior Staff Code Reviewer, QA Test Engineer, Security Auditor, and Web Performance Auditor. |
| **3. Engineering Lifecycle** | **Skills** ([addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)) | Addy Osmani's 25 production skills. Enforces Red-Green-Refactor TDD, PRDs before code (`/spec`), atomic task planning (`/plan`), and atomic ~100-line changes (`/build auto`). |
| **4. Anti-Bloat Restraint** | [Ponytail](https://github.com/dietrichgebert/ponytail) | The "laziest senior dev in the room." Enforces the 7-rung ladder (YAGNI → Native → 1-liner). Slashes generated lines of code by **~54%** on average while maintaining 100% safety. |

---

## 🎨 Frontend & Design Skills (Anti-Slop, Motion & UX Quality)

To complement the core engineering pillars, this template comes pre-configured with a dedicated design suite to eliminate generic "AI slop" and elevate frontend interfaces:

| Design Skill | Creator | Focus & Capabilities |
|---|---|---|
| **[Impeccable](https://github.com/pbakaus/impeccable)** | Paul Bakaus (ex-Google) | **Design Systems & UX Quality:** Records durable product truth in `PRODUCT.md` (`/impeccable init`), provides 24 UX commands (`/impeccable craft`, `audit`, `bolder`, `quieter`, `polish`), and runs **61 zero-token deterministic rules** auditing contrast and hierarchy. |
| **[Taste Skill](https://github.com/leonxlnx/taste-skill)** | Leon Lin (`leonxlnx`) | **Anti-Slop Art Direction:** 3 tunable 1–10 dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`) and distinct visual genres (Luxury Soft, Minimalist Editorial, Brutalist) that stop models from producing bland cookie-cutter templates. |
| **[Emil Kowalski's Skills](https://github.com/emilkowalski/skills)** | Emil Kowalski (Linear / Vercel) | **Motion Physics & Mobile Polish:** Mathematically correct cubic-bezier deceleration curves, Apple WWDC fluid physics, and mobile-native touch fixes (`100dvh`, tap delay elimination, safe-area padding). |

### 🧊 Optional Creative & 3D Extensions
For projects requiring interactive 3D hero elements, product showcases, or spatial UI without asset bloat:
* **[img2threejs](https://github.com/img2threejs/img2threejs)** — **Reconstruction-by-Code:** Reconstructs 2D reference images directly into pure TypeScript / Three.js code (`THREE.Group`) using an 8-stage quality-gated pipeline. Zero `.glb`/`.obj` file bloat; 100% diffable procedural code with pivots and interaction hooks. See [`docs/img2threejs.md`](docs/img2threejs.md).

---

## 🚀 Quick Start (Starting a New Project)

### 1. Use this Template
Click the green **"Use this template"** button on GitHub, or clone it locally:
```bash
git clone https://github.com/ZenDevvv/model-agnostic-agent-template.git my-new-project
cd my-new-project
```

### 2. Run the One-Click Setup

* **On Windows (PowerShell):**
  ```powershell
  .\.template\setup.ps1
  ```
* **On macOS / Linux / WSL (Bash):**
  ```bash
  bash .template/setup.sh
  ```

By default, setup installs the Motion design profile: Impeccable, Taste Skill, and Emil Kowalski motion/mobile skills. Choose frontend, minimal, or custom interactively, or use `-DesignProfile` / `--design-profile`. Add `-DryRun` / `--dry-run` to preview the selected profile without changing the project.

Setup then automatically:

- Installs and verifies **Graphify** via Python `pip`.
- Installs the post-commit git hook to keep the knowledge graph continuously up to date.
- Installs Addy Osmani's **Agent Skills** into your local agent environment.
- Configures rules for **Cursor**, **Claude Code**, and **Antigravity CLI**.

---

## 💻 The Vibe Coding Workflow: Two Distinct Flows

To keep vibe coding fast, predictable, and bloat-free, this template cleanly separates responsibilities between **You** (the Product Director) and the **AI Agent** (the Senior Engineering Staff):

* **The User Flow (You):** You define intent, approve plans, and test the app. You can speak in plain English—no commands to memorize.
* **The Agent Flow (The AI):** The agent automatically checks architecture, drafts PRDs, plans atomic tasks, and writes test-driven code following the Ponytail simplicity ladder.

```
       YOU (The Director)                            THE AGENT (The Builder)
┌───────────────────────────────┐               ┌───────────────────────────────┐
│ 1. Describe your idea/goal    │ ────────────▶ │ A. Drafts /spec & checks AST  │
│ 2. Review & approve plan      │ ◀──────────── │ B. Breaks down into /plan     │
│ 3. Give the green light       │ ────────────▶ │ C. /build auto (TDD + YAGNI)  │
│ 4. Test & request tweaks      │ ◀──────────── │ D. /review & auto-commits     │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

### 👤 Flow 1: The User Flow (What YOU Actually Do)

You do **not** need to memorize slash commands. You can simply chat in natural language, or use slash shortcuts if you prefer:

| Stage | What You Say (Plain English) | Optional Shortcut | What Happens |
|---|---|---|---|
| **1. Define** | *"I want to build a [feature/app]. Ask me questions or write a spec before coding."* | `/spec` | Prevents the agent from rushing into hallucinated code. |
| **2. Approve** | *"Looks good, break this down into small tasks."* | `/plan` | Gives you a checklist of small, verifiable steps. |
| **3. Build** | *"Go ahead and build the tasks autonomously."* | `/build auto` | Agent writes tests and implements tasks slice-by-slice. |
| **4. Verify** | *"Review this code for bloat, security, and bugs."* | `/review` | Senior staff audit + code simplification. |

> **💡 Day 0 (Brand New Project) vs. Day 2+ (Growing Codebase):**
> * **On Day 0 (Empty Project):** You have no code yet. **Skip architectural checks entirely!** Go straight to **Stage 1 (Define)** to describe what you want built.
> * **On Day 2+ (Existing Project):** When you ask for modifications or new features, the agent will automatically check the codebase knowledge graph first so it never breaks other files.

---

### 🤖 Flow 2: The Agent Flow (What the AGENT Executes Behind the Scenes)

When you ask the AI to build or change something, the agent is governed by [AGENTS.md](../AGENTS.md) and [.cursor/rules/](../.cursor/rules/) to execute this disciplined 6-phase engineering lifecycle:

#### 1. Architectural Orientation (`graphify`)
* Before touching multi-module code, the agent inspects `graphify-out/GRAPH_REPORT.md` or queries the AST graph (e.g. `graphify query "What connects module X to service Y?"`).
* It identifies "God nodes" and cross-module dependencies to calculate the blast radius before modifying anything.

#### 2. Requirements Definition (`/spec`)
* The agent drafts a lightweight Product Requirements Document (`spec.md`) with explicit constraints, API contracts, and acceptance criteria.
* If your prompt was ambiguous, it triggers `interview-me` to clarify requirements one question at a time.

#### 3. Task Breakdown (`/plan`)
* Decomposes the spec into small, verifiable implementation steps (~100 lines each) with strict dependency ordering in `plan.md`.

#### 4. Autonomous TDD Implementation (`/build` / `/build auto`)
* Implements tasks one vertical slice at a time using strict Red-Green-Refactor Test-Driven Development (TDD).
* **Enforces the Ponytail 7-Rung Ladder:** Refuses to write unnecessary boilerplate. Stops at the earliest rung: YAGNI ➔ Codebase reuse ➔ Stdlib ➔ Native platform feature ➔ 1-liner ➔ Minimum viable code.

#### 5. Senior Staff Review (`/review` & `/code-simplify`)
* Evaluates code across 5 axes: Correctness, Security, Performance, Maintainability, and Simplicity.
* Applies Chesterton's Fence to strip accidental complexity and eliminate dead code without breaking tests.

#### 6. Shipping & Continuous Graph Sync (`/ship`)
* Commits the changes with atomic, descriptive messages.
* The installed post-commit hook automatically updates `graphify-out/` so the knowledge graph is always in sync for your next prompt.

---

## 📂 Template Repository Structure

```
my-new-project/
├── .agents/
│   └── rules/
│       └── vibe-stack.md        # Antigravity CLI / Gemini CLI workspace rules
├── .cursor/
│   └── rules/
│       ├── ponytail.mdc         # Cursor rule: YAGNI & 7-rung ladder
│       ├── agent-skills.mdc     # Cursor rule: 6-phase SDLC & TDD
│       ├── graphify.mdc         # Cursor rule: Architectural context checking
│       └── design-and-motion.mdc# Cursor rule: Impeccable, Taste dials & Emil motion
├── .template/                   # 📦 Template tooling, guides & setup
│   ├── docs/                    # Deep-dive guides for each pillar
│   │   ├── tools-for-vibe-coding.md
│   │   ├── ponytail.md
│   │   ├── graphify.md
│   │   ├── agent-skills.md
│   │   ├── emil-skills.md
│   │   ├── impeccable.md
│   │   ├── taste-skill.md
│   │   ├── img2threejs.md
│   │   └── omniroute.md
│   ├── setup.ps1                # One-click Windows setup script
│   ├── setup.sh                 # One-click macOS/Linux setup script
│   └── README.md                # This comprehensive template manual
├── AGENTS.md                    # Universal agent directives (Cursor, Codex, Antigravity, etc.)
├── app/                          # Generated application code
├── CLAUDE.md                    # Claude Code directives and slash commands
├── GEMINI.md                    # Google Gemini & Antigravity IDE directives
├── .gitignore                   # Configured for Node, Python, and Graphify caches
├── LICENSE                      # MIT License
└── README.md                    # ⭐ User's Project README
```

---

## 🧠 100% Model-Agnostic (Free, Budget & Frontier Models)

This template **does not lock you into any specific AI vendor or expensive subscription**. It is designed to work with **any model backend**:

| Model Tier | Examples | How This Template Supercharges Them |
|---|---|---|
| **Free & Budget Models** | **Space Bunny**, **Gemini Flash / Flash Lite**, **DeepSeek-V3**, **Qwen 2.5 Coder**, **Llama 3.3**, OpenRouter free tiers | **Solves context and hallucination limits:** Smaller models often hallucinate complex npm/pip APIs or get confused in 50-file codebases. **Ponytail** forces them to write native 1-liners, **Graphify** gives them a compact 71.5x compressed summary, and **Agent Skills** keeps them focused on small, atomic ~100-line tasks. |
| **Frontier Models** | **Claude 3.7 / 3.8 Sonnet**, **GPT-5 / GPT-4o**, **Gemini Pro** | **Enforces architectural discipline:** Prevents frontier models from over-engineering abstractions or making unchecked assumptions during rapid coding sprints. |
| **Local Models** | **Ollama**, **vLLM**, **LM Studio** | **Zero-cloud privacy:** Runs local AST code parsing via Graphify and executes structured prompts locally without breaking token budgets. |

---

## 🛠️ Supported AI Coding Environments

This template works out of the box with:
* **Cursor** (via `.cursor/rules/*.mdc`)
* **Antigravity CLI & Gemini CLI** (via `GEMINI.md` and `.agents/rules/vibe-stack.md`)
* **Claude Code** (via `CLAUDE.md` and native skills)
* **Codex** (via `AGENTS.md`)
* **Cline / Roo Code** (via `AGENTS.md` and OpenAI-compatible endpoints)
* **GitHub Copilot / Windsurf / OpenCode / Aider** (via `AGENTS.md`)
