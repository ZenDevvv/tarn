# 💎 Impeccable — Design Guidance & Quality Detector for AI Agents

> *"Design guidance for AI coding agents. 1 skill, 24 commands, live browser iteration, and 61 deterministic detector rules for AI-generated frontend design."*

[![Official Docs](https://img.shields.io/badge/Docs-impeccable.style-blue)](https://impeccable.style)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/pbakaus/impeccable/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/pbakaus/impeccable?style=flat-square&label=Stars)](https://github.com/pbakaus/impeccable)

---

## 📖 Overview

* **Repository:** [https://github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable)
* **Author:** Paul Bakaus (Former Google Web Creator Advocate, jQuery UI Core team)
* **Category:** Design Systems, UX Guidance & Static Design Quality Detector
* **Target Tools:** Claude Code, Cursor, Codex, Gemini CLI, Antigravity, Grok Build, Hermes Agent, and VS Code

Every major AI model was trained on the same ubiquitous SaaS landing page templates. When left without design constraints, AI agents generate the exact same telltale visual clichés on every project:
* **The "Inter" Monopoly:** Defaulting to Inter font for every single heading, body, and label.
* **The Purple-to-Blue Gradient:** Predictable, uninspired color schemes.
* **Card Nesting Syndrome:** Cards wrapped inside cards wrapped inside more cards.
* **Low-Contrast Illegibility:** Light gray text placed directly on saturated or dark backgrounds.
* **The Icon Tile Habit:** A rounded-square icon badge positioned clumsily over every sub-heading.

**Impeccable** eliminates this generic "AI look" by establishing durable product context in `PRODUCT.md`, enforcing design tokens in `DESIGN.md`, and running **61 deterministic detector rules** that catch design flaws **without consuming a single LLM API token**.

---

## 🎯 Key Architectural Pillars

### 1. Durable Product Truth (`PRODUCT.md`)
Running `/impeccable init` performs an interactive, one-time setup that captures the real identity of your product: target audience, voice, constraints, core purpose, and operating context. Future AI design commands query `PRODUCT.md` so they never confuse your product's core intent with superficial styling choices.

### 2. 61 Zero-Token Deterministic Quality Rules
Impeccable ships with a local binary engine that evaluates frontend code deterministically (no API keys, zero token fees):
* Verifies WCAG AA color contrast ratios automatically.
* Checks typography scale consistency (ensures headings and labels follow a modular mathematical scale).
* Detects nested cards, un-tinted pure black (`#000000`) or pure gray shades.
* Audits responsive layout rhythm and mobile touch target sizes (minimum 44x44px).

### 3. Live Browser Iteration (`/impeccable live`)
Allows you to iterate on frontend elements live inside the browser, previewing design variants and applying design changes in real time before committing.

---

## ⌨️ The 24 Design Commands

All commands are executed via `/impeccable <command>`:

| Command | Category | What It Does |
|---|---|---|
| `/impeccable init` | **Setup** | One-time project setup: asks for product context, writes `PRODUCT.md`, recommends next design steps. |
| `/impeccable craft` | **Build** | Full shape-then-build design workflow with live visual variant iteration. |
| `/impeccable document` | **System** | Analyzes existing code and generates a standardized root `DESIGN.md`. |
| `/impeccable extract` | **System** | Extracts reusable UI components, colors, and typography into clean design tokens. |
| `/impeccable shape` | **UX** | Plans layout, hierarchy, and UX flows before generating code. |
| `/impeccable critique` | **Review** | Comprehensive UX design review focusing on visual hierarchy, clarity, and tone. |
| `/impeccable audit` | **Quality** | Runs the 61 deterministic checks for accessibility (a11y), performance, and responsive layout. |
| `/impeccable polish` | **Ship** | Final pass before shipping: aligns spacing, micro-interactions, and design system tokens. |
| `/impeccable bolder` | **Styling** | Amplifies timid or boring designs with bolder contrast, typography, and punchier accents. |
| `/impeccable quieter` | **Styling** | Tones down overly aggressive, loud, or busy designs into calm, elegant layouts. |
| `/impeccable distill` | **Refactor** | Strips unnecessary decorative clutter down to its pure functional essence. |
| `/impeccable typeset` | **Typography** | Fixes font pairings, font hierarchy, line lengths (45–75 chars), and line heights. |
| `/impeccable layout` | **Layout** | Fixes grid spacing, alignment, padding, and vertical rhythm. |
| `/impeccable colorize` | **Color** | Introduces intentional, harmonious palettes with tinted grays instead of dead neutrals. |
| `/impeccable animate` | **Motion** | Adds purposeful micro-animations and physics-based transitions. |
| `/impeccable harden` | **Edge Cases** | Robustness pass: adds error boundaries, empty states, text overflow ellipses, and i18n support. |
| `/impeccable onboard` | **UX Flow** | Designs first-run experiences, empty state callouts, and user activation paths. |
| `/impeccable adapt` | **Responsive** | Optimizes layouts for mobile, tablet, desktop, and ultra-wide screens. |
| `/impeccable delight` | **Polish** | Adds subtle, memorable moments of polish (sound, haptics, celebratory animations). |
| `/impeccable live` | **Browser** | Launches live browser variant mode to preview design tweaks on the fly. |

> **Pro-Tip:** You can pin any command to create top-level shortcuts using `/impeccable pin <command>` (e.g. `/impeccable pin audit` creates `/audit`).

---

## 🚫 Explicit Anti-Patterns Enforced

Impeccable strictly forbids the following common AI design errors:
1. ❌ **No Overused Default Fonts:** Blocks default Arial, Inter, or system sans-serif without explicit brand justification.
2. ❌ **No Pure Gray or Black:** All dark tones and neutral grays must be subtly tinted with the brand's primary temperature (e.g., slate blue or warm taupe).
3. ❌ **No Gray-on-Color Text:** Forbids placing light gray text on vibrant backgrounds (a classic AI contrast failure).
4. ❌ **No Card Nesting:** Prevents placing cards inside other cards; forces the use of whitespace and dividers instead.
5. ❌ **No Dated Easing:** Forbids cartoonish elastic or bounce transitions.

---

## 🛠️ Complete Installation Guide

### Option 1: Automatic CLI Installer (Recommended)
From your project's root folder, run:

```bash
npx impeccable install
```

* Automatically detects your AI tools (Cursor, Claude Code, Codex, Gemini CLI, Grok, etc.).
* Allows you to choose between project-local or global installation.
* Configures provider-native lifecycle hooks for continuous quality enforcement.

To update an existing installation:
```bash
npx impeccable update
```

### Option 2: Git Submodule Integration
Keep Impeccable vendored and tracked within your Git repository:

```bash
git submodule add https://github.com/pbakaus/impeccable .impeccable
npx impeccable link --source=.impeccable --providers=claude,cursor
git add .gitmodules .impeccable .claude .cursor
git commit -m "feat: add Impeccable design guidance"
```

### Option 3: VS Code Extension
Install directly from the Visual Studio Marketplace:
```bash
code --install-extension renaissance-geek.impeccable
```
