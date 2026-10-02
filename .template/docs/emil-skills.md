# 🎨 Emil Kowalski's Skills — Design Engineering & Motion Craft

> *"Skills for designers and engineers to build better user interfaces — A shortcut to stand out in a sea of AI slop."*

[![skills.sh](https://skills.sh/b/emilkowalski/skills)](https://skills.sh/emilkowalski/skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/emilkowalski/skills)

---

## 📖 Overview

* **Repository:** [https://github.com/emilkowalski/skills](https://github.com/emilkowalski/skills)
* **Author:** Emil Kowalski (Design Engineer at Linear & Vercel, creator of [Sonner](https://sonner.emilkowal.ski), author of *Animations on the Web*)
* **Category:** Motion Design, Micro-interactions, UI Craftsmanship & Mobile Polish
* **Target Platforms:** Web (React, Next.js, Vanilla), Mobile (React Native, Expo), Swift

When AI coding models build frontends, they possess virtually **zero natural taste for motion, physics, and tactile feel**:
* They pick the wrong animation easings (e.g., using `ease-in` for an entering modal when it should strictly be `ease-out`).
* They use harsh, solid 1px borders instead of soft, semi-transparent layered shadows.
* They build web apps that feel clunky on mobile devices (sticky hover states on touch screens, 100vh mobile browser height bugs, zoom jumps on input focus, and sluggish tap delays).
* They hand-roll buggy toast systems or install abandoned npm animation libraries.

**Emil Kowalski's Skills** packages years of world-class design engineering experience from **Linear** and **Vercel** into modular, machine-executable rules that teach AI agents how to craft premium, fluid user interfaces.

---

## 🧩 Comprehensive Skills Catalog

The repository provides 13 specialized design engineering skills:

| Skill | Folder / Name | What It Does & When to Use It |
|---|---|---|
| **Master Design Engineering** | `emil-design-eng` | The flagship skill: holistic design and animation advice, typography scale, spacing discipline, and interaction polish. |
| **Motion from Scratch** | `animate` | Builds fluid animations from scratch. Chooses mathematically correct cubic-bezier curves, natural durations (typically 150ms–300ms), and enforces transform/opacity-only properties. |
| **React Native & Expo Motion** | `animate-expo` | Native mobile motion: smooth gestures, bottom sheets, haptic feedback triggers, and keeping animations strictly off the JavaScript thread. |
| **Animation Quality Review** | `review-animations` | Strictly audits existing CSS and JS animations in a PR/commit to eliminate jank, inappropriate easing, and excessive movement. |
| **Codebase Motion Audit** | `improve-animations` | Scans your whole frontend for animations and generates prioritized, self-contained implementation plans that any agent can execute. |
| **Motion Opportunity Discovery** | `find-animation-opportunities` | Identifies user flows that would genuinely benefit from motion (e.g., state transitions, layout shifts) while strictly instructing the agent on what **not** to animate. |
| **Motion Terminology** | `animation-vocabulary` | Teaches your agent the exact vocabulary of professional motion design (damping, stiffness, mass, stagger, spring physics) so prompts yield precise results. |
| **Apple Design Principles** | `apple-design` | Apple's WWDC interface design guidelines and fluid physics distilled and translated specifically for modern web interfaces. |
| **Mobile-Native Web Polish** | `mobile-native` | Eliminates the telltale bugs of web-on-mobile: removes sticky hover states, fixes tap highlight flashes, solves the 100vh mobile browser bug, stops page-zooming inputs, and adds safe-area padding. |
| **Curated UI Primitive Selection** | `pick-ui-library` | Stops agents from hand-rolling fragile components (like custom dialogs or toasts) by directing them to battle-tested primitives (Radix, Ark UI, Tailwind primitives, etc.). |
| **Component Variant Prototyping** | `prototype` | Builds multiple distinct UI variations for a single component and wraps them in an interactive on-screen switcher so you can choose the best design. |
| **Modern Swift Design** | `write-swift` | Native Apple engineering: Swift 6 concurrency, value types, fluid SwiftUI animations, and modern Swift Testing. |
| **Sonner Toast Mastery** | `ask-sonner` | Complete architectural guide, styling recipes, and troubleshooting for the popular [Sonner](https://sonner.emilkowal.ski) toast notifications library. |

---

## 🛠️ Installation & Integration

Install across any modern coding agent using the open skills CLI:

```bash
# Install the complete pack (all skills)
npx skills@latest add emilkowalski/skills

# Or install individual skills by name
npx skills@latest add emilkowalski/skills --skill "emil-design-eng"
npx skills@latest add emilkowalski/skills --skill "animate"
npx skills@latest add emilkowalski/skills --skill "mobile-native"
npx skills@latest add emilkowalski/skills --skill "apple-design"
```

### Manual Setup (Cursor, Claude Code, Antigravity)
* **Claude Code:** Add to `~/.claude/skills/` or project `.claude/skills/`.
* **Cursor:** Copy relevant `SKILL.md` files into `.cursor/skills/` or reference them in `.cursor/rules/`.
* **Antigravity / Gemini CLI:** Drop skill instructions into `.agents/rules/`.

---

## 💡 Practical Examples: Before vs. After

### 1. Entrance Easing
* **Without Skill:** Agent writes `transition: all 0.5s ease-in;` — the element starts slow and slams abruptly into position.
* **With Skill:**
  ```css
  /* emil: enter transitions must decelerate into place */
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out;
  ```

### 2. Component Shadows vs. Borders
* **Without Skill:** Agent puts a harsh `border: 1px solid #e2e8f0;` around every card.
* **With Skill:** Uses layered, semi-transparent box-shadows with subtle ambient occlusion for depth:
  ```css
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 12px 24px rgba(0, 0, 0, 0.06);
  ```

### 3. Mobile Viewport Height Bug
* **Without Skill:** Agent sets `height: 100vh;` causing bottom navigation bars to jump when mobile address bars hide/show.
* **With Skill:**
  ```css
  /* emil: mobile-native safe height */
  height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom);
  ```
