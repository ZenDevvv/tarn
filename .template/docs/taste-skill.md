# 🎯 Taste Skill — The Anti-Slop Frontend Framework for AI Agents

> *"The Anti-Slop Frontend Framework for AI Agents — Upgrades AI-built interfaces with stronger layout, typography, motion, and bespoke aesthetic direction."*

[![Official Site](https://img.shields.io/badge/Site-tasteskill.dev-blue)](https://tasteskill.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/leonxlnx/taste-skill/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/leonxlnx/taste-skill?style=flat-square&label=Stars)](https://github.com/leonxlnx/taste-skill)

---

## 📖 Overview

* **Repository:** [https://github.com/leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill)
* **Author:** Leon Lin (`leonxlnx`)
* **Category:** Frontend Art Direction, Aesthetic Personas, Anti-Slop Dials & Image-to-Code
* **Target Tools:** Claude Code, Cursor, Codex, Gemini CLI, Antigravity, and ChatGPT

When prompting AI to create a website or app interface, the output almost always looks like a generic Tailwind component library template: cookie-cutter 3-column feature grids, safe symmetrical layouts, and flat corporate styling.

**Taste Skill** is a portable framework that breaks agents out of this template trap. It equips AI models with **tunable aesthetic dials** (1–10) and **distinct visual styles** (from luxury soft-spoken minimalism to high-contrast Swiss brutalism) so every project has an authentic, memorable art direction.

---

## 🎛️ The 3 Core Aesthetic Dials

At the top of the skill file, you can tune three simple 1–10 numbers to completely transform how the agent designs:

```
DESIGN_VARIANCE = 7    # 1: Clean & symmetrical ────▶ 10: Asymmetric, editorial & avant-garde
MOTION_INTENSITY = 6   # 1: Subtle CSS hover    ────▶ 10: Rich GSAP scroll & magnetic physics
VISUAL_DENSITY = 4     # 1: Airy luxury layout  ────▶ 10: Dense, high-information dashboard
```

* **`DESIGN_VARIANCE`:** Controls how experimental the layout is. Lower numbers produce structured, conventional layouts; higher numbers generate unexpected asymmetric grids, overlapping elements, and dynamic typography breaks.
* **`MOTION_INTENSITY`:** Controls animation depth. From minimal micro-interactions up to smooth GSAP-driven scroll timelines.
* **`VISUAL_DENSITY`:** Controls information density per viewport. Use low density for consumer landing pages; use high density for developer tools and financial dashboards.

---

## 🎨 Specialized Aesthetic Personas

Taste Skill provides targeted skills tailored for specific visual identities:

| Skill | Install Name | Best For / Visual Style |
|---|---|---|
| **Taste Skill v2** | `design-taste-frontend` | **Default:** Dynamic design-system mapping, strict pre-flight checks, GSAP code skeletons, and balanced modern layout. |
| **High-End Visual** | `high-end-visual-design` | **Luxury / Soft:** Calm, expensive, Linear/Apple aesthetic. Generous whitespace, refined serif/sans pairings, and gentle spring physics. |
| **Minimalist UI** | `minimalist-ui` | **Editorial Product:** Notion/Craft style. Restrained palette, crisp micro-borders, clean typography, and quiet elegance. |
| **Industrial Brutalist** | `industrial-brutalist-ui` | **Technical / Avant-Garde:** High contrast, Swiss typography, monospaced accents, mechanical grids, and raw borders. |
| **Redesign Existing** | `redesign-existing-projects` | **Refactoring Legacy Code:** Audits an existing frontend first, identifies visual hierarchy problems, then restyles without breaking functionality. |
| **Image to Code** | `image-to-code` | **Visual Workflow:** Generates design reference boards first, analyzes the layout, and then implements matching code. |

---

## 🖼️ Image-Generation Reference Skills

In addition to code generation, Taste Skill includes prompts for AI image generators (ChatGPT Images, Midjourney, Flux) to create mood boards and design references before coding:

* **`imagegen-frontend-web`:** Generates high-fidelity desktop website comps and hero sections with distinct art direction.
* **`imagegen-frontend-mobile`:** Generates coherent multi-screen mobile app flows and UI mockups.
* **`brandkit`:** Generates complete brand identity boards (color palettes, logo concepts, typography samples).

> **Workflow Tip:** Feed the generated image directly to Cursor, Codex, or Claude Code along with `image-to-code` to turn the visual concept into production code.

---

## 🛠️ Complete Installation Guide

### Install via Skills CLI
Install all Taste Skill variants with a single command:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill
```

Or install specific individual skills by name:

```bash
# Install the default modern anti-slop skill
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"

# Install high-end luxury styling
npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"

# Install editorial minimalist styling
npx skills add https://github.com/Leonxlnx/taste-skill --skill "minimalist-ui"

# Install legacy redesign protocol
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```

### Manual Integration
Copy any `SKILL.md` from the repository into your project's `.cursor/skills/` or `~/.claude/skills/` directory.
