# Claude Code Project Guidelines

This repository is governed by the **Vibe Coding Stack** defined in `AGENTS.md`. Always review and adhere to `AGENTS.md` before generating code.

## Available Skills & Commands

### 1. Structural Awareness (Graphify)
- Trigger: `/graphify .`
- When starting work on a new feature or complex bug, check `graphify-out/GRAPH_REPORT.md` or invoke `/graphify query "<question>"` to trace dependencies.
- Update the graph after adding new modules: `/graphify . --update`.

### 2. Simplicity & YAGNI (Ponytail)
- Always stop at the earliest rung of the Ponytail ladder:
  1. YAGNI -> 2. Existing code -> 3. Standard library -> 4. Platform native -> 5. Existing deps -> 6. One-liner -> 7. Minimum viable code.
- Slash command: `/ponytail-review` to inspect diffs and eliminate bloat.

### 3. Engineering Lifecycle (Agent Skills)
- `/spec` — Generate a specification PRD before starting implementation.
- `/plan` — Decompose the spec into small atomic tasks.
- `/build` or `/build auto` — Implement tasks incrementally with strict TDD.
- `/test` — Verify functionality with unit tests or browser inspection.
- `/review` — Staff engineer 5-axis review before committing.
- `/code-simplify` — Clean up and simplify code without breaking tests.
- `/ship` — Final commit and shipping checklist.

### 4. Design & Motion Commands (Impeccable, Taste & Emil)
- `/impeccable init` — Gather durable product context into `PRODUCT.md`.
- `/impeccable craft` — Interactive shape-then-build visual flow.
- `/impeccable audit` — 61 zero-token deterministic checks for contrast, a11y, and hierarchy.
- `/impeccable polish` — Final design system alignment and shipping pass.
- `/impeccable bolder` / `/impeccable quieter` — Dial visual intensity up or down.
- `/impeccable distill` — Strip visual noise down to its pure functional essence.
- `/impeccable live` — Real-time browser element variant testing.
- `/animate` — Build fluid, physics-based motion with decelerating curves.
- `/review-animations` — Audit existing transitions for jank and linear easing.

