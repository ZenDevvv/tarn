# 🛠️ Essential Toolkit for High-Performance "Vibe Coding"

> A curated collection of next-generation tools, skills, and gateways designed to transform AI-assisted coding ("vibe coding") from chaotic, prompt-and-pray iterations into disciplined, ultra-lean, cost-efficient, and production-grade software delivery.

---

## 🧭 The Vibe Coding Stack at a Glance

When vibe coding, developers face five major failure modes:
1. **Bloat & Over-engineering:** AI models default to writing hundreds of lines of complex code and pulling in heavyweight dependencies for simple problems.
2. **Context Blindness:** In large codebases, feeding raw source files into LLM context windows quickly exhausts token budgets and causes the AI to hallucinate or miss cross-module connections.
3. **Lack of Engineering Discipline:** Without quality gates, agents produce unverified, untested, and fragile changes that fail silently.
4. **Token Limits & API Bills:** Agentic loops burn through millions of tokens, hitting rate limits and running up costly inference bills.
5. **Generic "AI Slop" & Bad Frontend Taste:** AI models generate cookie-cutter templates with identical fonts (Inter), awkward animation curves, harsh borders, and nested cards.

This toolkit solves all five bottlenecks:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  THE VIBE CODING PIPELINE                                       │
├──────────────────┬──────────────────┬──────────────────┬─────────────────────┬──────────────────┤
│   1. GATEWAY     │   2. STRUCTURE   │   3. WORKFLOW    │     4. DESIGN       │   5. RESTRAINT   │
│  (Cost & Quota)  │ (Knowledge Map)  │(Lifecycle Gates) │(Aesthetics & Motion)│(Anti-Bloat/YAGNI)│
├──────────────────┼──────────────────┼──────────────────┼─────────────────────┼──────────────────┤
│    OmniRoute     │     Graphify     │   Agent Skills   │Impeccable/Taste/Emil│     Ponytail     │
│ Free AI Gateway  │ Knowledge Graph  │Senior Engineering│ Anti-Slop, Dials &  │"Laziest Dev" Rule│
│ & Multi-Provider │ & AST Navigation │Workflows (Addy O)│ Fluid Micro-Motion  │ & 1-Liner Ladder │
└──────────────────┴──────────────────┴──────────────────┴─────────────────────┴──────────────────┘
```

---

## 1. 🦹‍♂️ Ponytail

*“He says nothing. He writes one line. It works.”*

* **Repository:** [https://github.com/dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail)
* **Author:** Dietrich Gebert
* **Primary Role:** Anti-Overengineering Rule & Skill for AI Agents

### 📌 Overview
You know that senior developer with the ponytail who has been at the company forever? You show him a 50-line component proposal; he looks at it, says nothing, and replaces it with a single native HTML attribute or built-in standard library call. **Ponytail embeds that senior engineer directly into your AI coding agent.**

By default, LLMs love to over-engineer: ask for a date picker, and an agent installs a third-party package, writes a custom React wrapper, imports a stylesheet, and spends tokens debating timezone offsets. Ponytail forces the agent to use `<input type="date">` instead.

### 🪜 The 7-Rung Decision Ladder
Before writing any code, Ponytail requires the agent to stop at the first rung that satisfies the requirement:
1. **Does this need to exist?** → No: skip it (**YAGNI**).
2. **Already in this codebase?** → Reuse it; do not rewrite.
3. **Standard library does it?** → Use standard library.
4. **Native platform feature?** → Use browser/OS native features (e.g., `<dialog>`, CSS grid, `fetch`).
5. **Installed dependency?** → Use what is already in `package.json` / `requirements.txt`.
6. **One line?** → Write one line.
7. **Only then:** Write the minimum necessary code that works.

> **Important:** Ponytail is lazy about unnecessary code, never about quality. Security boundaries, input validation, data-loss protection, error handling, and accessibility (WCAG) are strictly preserved.

### 📊 Real-World Benchmarks
* **~54% less code generated** on average (reaching up to **94% reduction** on overbuilt UI tasks like date/color pickers).
* **~20% lower token cost** per feature.
* **~27% faster execution** per ticket.
* **100% safety score** retained on benchmark test suites.

### 🚀 Quick Start & Installation

* **Antigravity CLI (`agy`):**
  ```bash
  agy plugin install https://github.com/DietrichGebert/ponytail
  ```
* **Claude Code:**
  ```bash
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  ```
* **Cursor:**
  ```bash
  git clone https://github.com/DietrichGebert/ponytail
  node ponytail/scripts/cursor-hooks.js install
  # Or copy .cursor/rules/ponytail.mdc into your project's .cursor/rules/
  ```
* **Gemini CLI / Codex / Copilot CLI / OpenCode:**
  Works natively across 20+ agent environments via `AGENTS.md`, plugin systems, or slash commands.

### ⌨️ Key Commands
* `/ponytail` — View active mode and status.
* `/ponytail [lite | full | ultra | off]` — Set aggressiveness level (`ultra` for radical simplification).
* `/ponytail-review` — Review a diff or PR to strip out unnecessary code and complexity.
* `/ponytail-audit` — Scan existing project files for dead code, redundant libraries, and bloat.
* `/ponytail-debt` — Identify technical debt caused by over-engineered abstractions.

---

## 2. 🌐 OmniRoute *(Optional Gateway)*

*“The Free AI Gateway — Never Stop Coding.”*

* **Repository:** [https://github.com/diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute)
* **Author:** Diego Souza (`diegosouzapw`)
* **Primary Role:** Unified AI Proxy, Smart Fallback Router & Free Tier Aggregator
* **Note:** *Marked as optional in setup — recommended if you run multi-agent workflows, experience rate limits, or want zero-cost LLM backends.*

### 📌 Overview
Vibe coding sessions consume massive token counts. Juggling API keys, hitting mid-session rate limits, and paying steep bills across multiple vendor portals quickly breaks development flow.

**OmniRoute** is a lightweight, local-first proxy running on `http://localhost:20128/v1`. It acts as a universal adapter between your favorite coding tools (Cursor, Claude Code, Cline, Codex, Antigravity, Copilot) and **358+ AI providers**, automatically managing **150+ free tiers** offering **~1.62 Billion free tokens per month**.

### 🎯 Key Features
* **Zero-Config Out-of-the-Box:** Works immediately upon install with no API keys or configuration needed by routing through keyless providers via model `auto`.
* **4-Tier Auto-Fallback Cascade:** When a request encounters a rate limit or failure, OmniRoute automatically cascades across targets:
  1. *Tier 1:* Active Subscriptions
  2. *Tier 2:* Direct API Keys
  3. *Tier 3:* Low-Cost Providers
  4. *Tier 4:* Free Tiers & Free-Forever Endpoints
* **Stacked Token Compression (RTK + Caveman):** Automatically compresses repetitive tool outputs, system instructions, and bloated prompts by **15% to 95% (averaging ~89%)**, preventing context-window exhaustion.
* **Resilience & Privacy:** Local-first architecture, AES-256-GCM encrypted keys, circuit breakers, rate-limit cooldowns, model lockout protection, and TLS stealth.
* **Built-in MCP Server:** Exposes 110+ Model Context Protocol (MCP) tools for coding agents.

### 🚀 Quick Start & Installation

1. **Install and run the local gateway:**
   ```bash
   npm i -g omniroute
   # Server launches on http://localhost:20128
   ```
2. **Instant Test (Zero Credentials Required):**
   ```bash
   curl http://localhost:20128/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"auto","messages":[{"role":"user","content":"Hello from OmniRoute!"}]}'
   ```
3. **Connect Your IDE / Agent:**
   In Cursor, Claude Code, Cline, or Antigravity, set the OpenAI Base URL to:
   ```
   http://localhost:20128/v1
   ```

---

## 3. 🕸️ Graphify

*“Multimodal Knowledge Graph Engine for Codebases and Research.”*

* **Repository:** [https://github.com/Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify)
* **Author:** Safi Shamsi (`Graphify-Labs`)
* **Primary Role:** Codebase & Multi-Format Knowledge Graph Extraction (Claude Code Skill)

### 📌 Overview
When dropping an AI agent into an existing repository or complex project, feeding dozens of raw files into the prompt leads to "lost-in-the-middle" hallucinations and burns thousands of tokens per query.

**Graphify** analyzes your entire workspace — source code across 13+ languages, markdown docs, PDFs, architecture diagrams, whiteboard photos, and screenshots — and compiles them into a unified, queryable knowledge graph. It answers Andrej Karpathy's famous `/raw` folder workflow with an AI-navigable, persistent graph structure.

### 🎯 Key Capabilities & Advantages
* **71.5x Token Reduction:** On mixed corpuses (repositories + papers + architecture diagrams), Graphify achieves up to **71.5x fewer tokens per query** compared to agents loading raw files.
* **Deep Multimodal Parsing:**
  * *Code:* AST parsing via tree-sitter across Python, TypeScript, JavaScript, Go, Rust, Java, C/C++, Ruby, C#, Kotlin, Scala, and PHP with call-graph extraction.
  * *Docs & Papers:* Concepts, citations, and semantic relationships extracted from `.md`, `.txt`, and `.pdf`.
  * *Images:* Diagram and UI screenshot interpretation powered by Claude Vision.
* **Architectural Insights:**
  * **God Nodes:** Highlights the most connected classes, modules, and concepts in the system.
  * **Surprising Connections:** Ranks non-obvious cross-domain links (e.g., how an API route connects back to a specific data schema or paper citation).
  * **Suggested Questions:** Recommends 4–5 high-leverage architectural questions the codebase graph is primed to answer.
* **Agent-Optimized Wiki (`--wiki`):** Generates Wikipedia-style interlinked Markdown articles (`index.md`) that agents can navigate on demand without reading the whole codebase at once.
* **Continuous Synchronization:** Includes `--watch` mode and git post-commit hooks (`graphify hook install`) so the graph automatically stays in sync as code is committed.

### 🚀 Quick Start & Installation

```bash
# Requires Python 3.10+
pip install graphifyy && graphify install
```

*(Note: PyPI package is temporarily named `graphifyy`; CLI and skill commands remain `graphify`)*

### ⌨️ Typical Usage

```bash
# Build knowledge graph of the current repository
/graphify .

# Run on a specific documentation or research folder
/graphify ./docs --mode deep

# Interactive questions & path queries
/graphify query "What connects the auth middleware to the payment handler?"
/graphify path "AuthService" "WebhookReceiver"

# Generate agent-navigable markdown wiki
/graphify . --wiki

# Auto-update on commit
graphify hook install
```

**Generated Artifacts (`graphify-out/`):**
* `graph.html` — Interactive browser visualizer (zoom, filter by community, search).
* `GRAPH_REPORT.md` — God nodes, key hubs, and architectural summary.
* `wiki/` — Wikipedia-style markdown documents for agent reference.
* `graph.json` — Persistent graph data for fast query recall weeks later.

---

## 4. 🧠 Agent Skills

*“Production-Grade Engineering Skills for AI Coding Agents.”*

* **Repository:** [https://github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)
* **Author:** Addy Osmani (Engineering Leader, Google Chrome)
* **Primary Role:** Structured Engineering Lifecycle Workflows, Quality Gates & Personas

### 📌 Overview
AI coding agents are capable of typing fast, but left unguided, they cut corners: they skip unit tests, ignore edge cases, delete safety checks to make tests pass, hallucinate non-existent API parameters, and write unmaintainable "spaghetti" code.

Created by Addy Osmani, **Agent Skills** packages the workflows, mental models, and quality gates of senior staff engineers into **25 structured skills and 4 specialist personas**. It replaces chaotic prompt loops with an end-to-end software development lifecycle (SDLC).

### 🔄 The 6-Phase Engineering Lifecycle

```
  DEFINE           PLAN            BUILD           VERIFY          REVIEW           SHIP
┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
│  Idea  │ ───▶ │  Spec  │ ───▶ │  Code  │ ───▶ │  Test  │ ───▶ │   QA   │ ───▶ │   Go   │
│ Refine │      │  PRD   │      │  Impl  │      │ Debug  │      │  Gate  │      │  Live  │
└────────┘      └────────┘      └────────┘      └────────┘      └────────┘      └────────┘
  /spec           /plan           /build          /test          /review          /ship
```

### 📋 Core Skills & Slash Commands

| Phase | Slash Command / Skill | What It Enforces |
|---|---|---|
| **Define** | `/spec` (`spec-driven-development`) | Writes a thorough PRD with constraints, boundaries, and acceptance criteria *before any code is written*. |
| **Define** | `interview-me` | Asks targeted, one-at-a-time questions to clarify ambiguous requirements until 95% confidence is reached. |
| **Define** | `/constraints` (`constraint-driven-dev`) | Establishes explicit quality bars and prevents agents from skipping failing tests. |
| **Plan** | `/plan` (`planning-and-task-breakdown`) | Decomposes specifications into small, atomic, verifiable implementation steps. |
| **Build** | `/build` & `/build auto` | Executes atomic vertical slices; `/build auto` runs through approved plans while enforcing per-task unit tests. |
| **Build** | `test-driven-development` | Strictly enforces Red-Green-Refactor, test pyramid (80/15/5), and boundary tests. |
| **Build** | `doubt-driven-development` | Adversarial self-review of non-trivial assumptions (`CLAIM` → `DOUBT` → `RECONCILE`). |
| **Verify**| `/test` (`browser-testing-with-devtools`) | Hooks into Chrome DevTools MCP for live DOM inspection, console logs, and performance traces. |
| **Review**| `/review` (`code-review-and-quality`) | Senior Staff 5-axis code review; enforces change sizing (~100 lines) and strict cleanliness standards. |
| **Review**| `/code-simplify` | Applies Chesterton’s Fence and the Rule of 500 to simplify convoluted logic without altering behavior. |
| **Review**| `/webperf` (`performance-optimization`) | Real Core Web Vitals audit and metric-driven optimization. |
| **Ship**  | `/ship` (`git-workflow-and-versioning`) | Atomic commits, trunk-based delivery, rollback safety, and CI/CD validation. |

### 🤖 Specialist Agent Personas
Includes ready-to-run personas for targeted multi-agent reviews:
* `code-reviewer` — Senior Staff Engineer standard for PR approvals.
* `test-engineer` — QA specialist dedicated to edge-case verification and test coverage.
* `security-auditor` — OWASP Top 10 threat modeling and vulnerability inspection.
* `web-performance-auditor` — Deep audit of Core Web Vitals and asset payloads.

### 🚀 Quick Start & Installation

* **Universal Install (Any Agent / 70+ environments):**
  ```bash
  npx skills add addyosmani/agent-skills
  ```
* **Antigravity CLI (`agy`):**
  ```bash
  agy plugin install https://github.com/addyosmani/agent-skills.git
  ```
* **Claude Code:**
  ```bash
  /plugin marketplace add addyosmani/agent-skills
  /plugin install agent-skills@addy-agent-skills
  ```
* **Cursor:**
  Sync skill folders into `.cursor/skills/` and policies into `.cursor/rules/*.mdc`.

---

## 5. 🎨 Emil Kowalski's Skills

*“Skills for designers and engineers to build better user interfaces — Stand out in a sea of AI slop.”*

* **Repository:** [https://github.com/emilkowalski/skills](https://github.com/emilkowalski/skills)
* **Author:** Emil Kowalski (Design Engineer at Linear & Vercel, creator of [Sonner](https://sonner.emilkowal.ski), author of *Animations on the Web*)
* **Primary Role:** Motion Physics, Micro-Interactions, UI Craftsmanship & Mobile Polish

### 📌 Overview
AI models lack intuitive physical taste: they use `ease-in` for entering modals (when it must decelerate via `ease-out`), slap harsh solid borders on everything, hand-roll fragile custom toasts, and ignore mobile touch bugs (100vh jumping, sticky hover, tap delay).

Emil packages years of Linear and Vercel design engineering into 13 high-impact skills that elevate frontend animations from robotic to Apple-level fluidity.

### 🎯 Key Capabilities
* **`animate` & `emil-design-eng`:** Teaches agents mathematically correct cubic-bezier curves, natural durations (150–300ms), and transform/opacity-only rendering.
* **`mobile-native`:** Eliminates telltale mobile-web glitches (fixes the 100vh viewport bug with `100dvh`, removes sticky hover on touchscreens, stops input zoom).
* **`review-animations` & `improve-animations`:** Audits CSS/JS animations and generates clean, prioritized refactoring plans.
* **`apple-design`:** Distills Apple WWDC fluid motion principles for the modern web.
* **`pick-ui-library`:** Prevents agents from reinventing wheels by guiding them to vetted UI primitives (Radix, Ark UI, Sonner).

* **Quick Install:**
  ```bash
  npx skills@latest add emilkowalski/skills
  ```

---

## 6. 💎 Impeccable

*“Design guidance for AI coding agents. 1 skill, 24 commands, live browser iteration, and 61 deterministic detector rules.”*

* **Repository:** [https://github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable)
* **Author:** Paul Bakaus (Former Google Web Creator Advocate, jQuery UI Core team)
* **Primary Role:** Design Systems, UX Guidance & Static Design Quality Detector

### 📌 Overview
AI models trained on the same SaaS landing pages default to predictable visual clichés: Inter font for everything, purple-to-blue gradients, cards nested inside cards, gray text on colored backgrounds, and rounded icon badges above every title.

**Impeccable** establishes durable product truth in `PRODUCT.md` (`/impeccable init`), maps design tokens in `DESIGN.md`, and runs **61 deterministic detector rules** that catch accessibility, hierarchy, and contrast errors **with zero LLM token cost**.

### 🎯 Key Capabilities
* **61 Zero-Token Detector Rules:** Deterministically checks WCAG AA contrast, modular typographic scales, spacing rhythm, and card nesting without API fees.
* **24 Design Commands:** From `/impeccable craft` and `/impeccable critique` to `/impeccable bolder`, `/impeccable quieter`, `/impeccable distill`, and `/impeccable polish`.
* **Live Browser Mode (`/impeccable live`):** Real-time visual variant testing directly in your browser before committing code.

* **Quick Install:**
  ```bash
  npx impeccable install
  ```

---

## 7. 🎯 Taste Skill

*“The Anti-Slop Frontend Framework for AI Agents.”*

* **Repository:** [https://github.com/leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill)
* **Author:** Leon Lin (`leonxlnx`)
* **Primary Role:** Frontend Art Direction, Aesthetic Personas, Anti-Slop Dials & Image-to-Code

### 📌 Overview
Breaks agents out of bland corporate templates by introducing **tunable 1–10 aesthetic dials** and specialized visual genres (luxury minimalism, editorial product, or Swiss brutalism).

### 🎯 Key Capabilities
* **3 Top-of-File Tuning Dials (1–10):**
  * `DESIGN_VARIANCE`: Layout asymmetry & creative composition (clean ──▶ avant-garde).
  * `MOTION_INTENSITY`: Animation depth (simple hover ──▶ magnetic scroll GSAP).
  * `VISUAL_DENSITY`: Viewport information density (airy luxury ──▶ dense dashboard).
* **Targeted Visual Personas:** `high-end-visual-design` (luxury/calm), `minimalist-ui` (Notion/Linear editorial), `industrial-brutalist-ui` (high-contrast Swiss type), and `redesign-existing-projects`.
* **Image-to-Code:** Generates high-fidelity design comps (`imagegen-frontend-web`, `brandkit`) to visually steer the coding agent before implementation.

* **Quick Install:**
  ```bash
  npx skills add https://github.com/Leonxlnx/taste-skill
  ```

---

## 8. 🧊 img2threejs *(Optional 3D & Creative Extension)*

*“Reconstruction-by-Code — Zero 3D Asset Bloat.”*

* **Repository:** [https://github.com/img2threejs/img2threejs](https://github.com/img2threejs/img2threejs)
* **Author:** Nick (`iamnick` / `img2threejs`)
* **Primary Role:** Procedural 3D Reconstruction from 2D Images directly into TypeScript/Three.js Code
* **Note:** *Marked as an optional creative extension — ideal for luxury landing page hero artifacts, interactive badges, 3D product previews, and tactile UI elements.*

### 📌 Overview
Unlike standard photogrammetry or neural mesh extractors that output 20MB–100MB binary `.glb` or `.obj` files, **img2threejs reconstructs objects purely as TypeScript and Three.js code** (`THREE.Group`).

Using an 8-stage quality-gated pipeline (`blockout → structural → form → material → surface → lighting → interaction → optimization`), an AI agent analyses a single 2D image and builds the 3D model using primitives, procedural shaders, and generated geometry.

### 🎯 Key Capabilities
* **Zero Asset Bloat:** No external 3D files to host or download; the entire scene lives directly in your git-diffable code.
* **Deterministic & Token-Efficient:** Comes with `forge/`, a zero-dependency Python 3.10+ standard library test harness that validates bounding boxes, geometries, and materials without wasting LLM tokens.
* **Interactive & Animation-Ready:** Generates hierarchical pivots, sockets, raycast colliders, and `userData.tick` update hooks for fluid hover drift, pointer tilt, and click animations.

* **Quick Install:**
  ```bash
  # Clone into your agent skills directory
  git clone https://github.com/img2threejs/img2threejs.git ~/.claude/skills/img2threejs
  ```

---

## ⚡ The Complete Synergy

When combined, these tools form an end-to-end powerhouse pipeline where cost, speed, engineering discipline, and visual beauty are harmonized:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE COMPLETE STACK                                     │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ 1. Gateway        │ OmniRoute: ~1.62B Free Tokens + Cascading Multi-Provider Failover  │
│ 2. Workflow (SDLC)│ Agent Skills: PRDs (/spec), Atomic Tasks (/plan), TDD (/build auto)│
│ 3. Architecture   │ Graphify: 71.5x Token Compression & Multimodal AST Knowledge Graph │
│ 4. Design & Motion│ Impeccable (Product Truth & Audit) + Taste Skill (Anti-Slop Dials) │
│                   │ + Emil Kowalski (Fluid Curves) + img2threejs (3D Procedural Hero)  │
│ 5. Restraint      │ Ponytail: The 7-Rung YAGNI Ladder & Native 1-Liners                │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

1. **OmniRoute** supplies the uninterrupted inference and token compression.
2. **Agent Skills** sets the disciplined engineering lifecycle (`/spec` → `/plan` → `/build` → `/test`).
3. **Graphify** grounds the agent with structural awareness so it understands cross-module relationships.
4. **Impeccable, Taste Skill & Emil's Skills** elevate the 2D frontend into a stunning, production-ready interface with intentional typography, calibrated dials, and physics-based motion.
5. **img2threejs** adds optional, code-only 3D interactive hero artifacts with zero asset bloat.
6. **Ponytail** prevents the agent from introducing bloat, ensuring that all functionality and styling are implemented with lean, native, standard-compliant code.

---

## 📚 Quick Reference & Dedicated Guides

> Provider counts, free-tier totals, benchmarks, and token-reduction figures are time-sensitive snapshots from the linked upstream projects. Verify current values before using them for purchasing or architecture decisions.

| Tool | Category | Dedicated Local Guide | Repository Link | Primary Strength |
|---|---|---|---|---|
| **Ponytail** | AI Skill / Rule | [ponytail.md](ponytail.md) | [DietrichGebert/ponytail](https://github.com/dietrichgebert/ponytail) | Slashing generated code bloat; enforcing native platform features & YAGNI |
| **OmniRoute** | Proxy & Gateway *(Optional)* | [omniroute.md](omniroute.md) | [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute) | Multi-provider routing, 150+ free tiers, automatic rate-limit failover |
| **Graphify** | Knowledge Graph | [graphify.md](graphify.md) | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | Deep codebase understanding, AST analysis, multimodal architecture maps |
| **Agent Skills** | Engineering Workflow | [agent-skills.md](agent-skills.md) | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 25 production-grade SDLC skills (Spec, Plan, TDD, Review, Ship) by Addy Osmani |
| **Emil's Skills** | Motion & Polish | [emil-skills.md](emil-skills.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Cubic-bezier curves, Apple fluid motion, mobile-native bug fixes |
| **Impeccable** | Design Quality & System | [impeccable.md](impeccable.md) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Product truth (PRODUCT.md), 24 UX commands, 61 zero-token quality rules |
| **Taste Skill** | Aesthetic Art Direction | [taste-skill.md](taste-skill.md) | [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) | 1–10 design dials (variance/motion/density), anti-slop visual personas |
| **img2threejs** | Procedural 3D *(Optional)* | [img2threejs.md](img2threejs.md) | [img2threejs/img2threejs](https://github.com/img2threejs/img2threejs) | Reconstruction-by-code: 2D image to pure TypeScript/Three.js 3D models |

