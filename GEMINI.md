# Gemini & Antigravity Project Directives

This project operates on the **Universal Model-Agnostic Vibe Coding Stack**. Regardless of whether this session is powered by Gemini Pro, Gemini Flash, or budget/free endpoints, follow these core principles:

## 1. Restraint First (Ponytail)
- **Do not over-engineer:** Before writing code, test the 7-rung ladder:
  1. YAGNI -> 2. Existing codebase code -> 3. Standard library -> 4. Native platform feature -> 5. Installed dependency -> 6. One-liner -> 7. Minimum viable code.
- Prefer standard library functions, native HTML/CSS platform elements, and modern runtime built-ins over adding third-party packages.
- Never compromise security, validation, error handling, or accessibility.

## 2. Structural Awareness (Graphify)
- Check `graphify-out/GRAPH_REPORT.md` before making architectural decisions or cross-module changes.
- If asked about connections between files, query the graph or trace paths rather than guessing.

## 3. Engineering Rigor (Agent Skills)
- For any non-trivial change, execute step-by-step:
  - `/spec`: Clarify requirements and acceptance criteria before writing code.
  - `/plan`: Decompose the implementation into small, atomic tasks (~100 lines each).
  - `/build`: Implement thin vertical slices with Red-Green-Refactor TDD.
  - `/test`: Verify code with unit tests or browser inspection.
  - `/review`: 5-axis review (Correctness, Security, Performance, Maintainability, Simplicity).
  - `/ship`: Commit atomic changes with clear messages.

## 4. Frontend Design & Motion Craft (profile-dependent; Motion is the default)
- **Eliminate AI Slop:** Never default to generic Inter fonts, harsh 1px borders, or cards inside cards.
- **Tune Dials:** Calibrate `DESIGN_VARIANCE` (asymmetry), `MOTION_INTENSITY` (GSAP/physics), and `VISUAL_DENSITY`.
- **Motion Physics:** Decelerate on enter with `ease-out` / `cubic-bezier(0.16, 1, 0.3, 1)`. Animate only `transform` and `opacity`.
- **Mobile-Native:** Use `100dvh` for full viewports, `@media (hover: hover)` for touch devices, and `env(safe-area-inset-bottom)`.

