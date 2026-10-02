# 🧊 img2threejs — Procedural 3D Reconstruction for AI Agents

> *"Rebuild the object in a reference image as a code-only, procedural Three.js model — quality-gated, animation-ready, and deliberately token-efficient."*

[![Official Site](https://img.shields.io/badge/Demo_Gallery-img2threejs.io-blue)](https://img2threejs.io/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/img2threejs/img2threejs/blob/main/LICENSE)
[![Runtime: Three.js](https://img.shields.io/badge/Runtime-Three.js-000000.svg)](https://threejs.org)
[![Tooling: Python 3.10+ stdlib](https://img.shields.io/badge/Tooling-Python_3.10+_stdlib-3776ab.svg)](https://github.com/img2threejs/img2threejs)
[![GitHub Stars](https://img.shields.io/github/stars/img2threejs/img2threejs?style=flat-square&label=Stars)](https://github.com/img2threejs/img2threejs)

---

## 📖 Overview

* **Repository:** [https://github.com/img2threejs/img2threejs](https://github.com/img2threejs/img2threejs)
* **Author:** Nick (`iamnick` / `img2threejs`)
* **Category:** Procedural 3D Modeling, Image-to-Code, WebGL UI, Creative Engineering
* **Runtime:** Three.js / TypeScript (or React Three Fiber)
* **Tooling:** Python 3.10+ standard library (zero external pip packages)
* **Target Tools:** Claude Code, Cursor, Codex, Gemini CLI, Antigravity, and OpenCode

Most image-to-3D tools rely on photogrammetry, Gaussian splatting, or neural mesh extraction that output massive, un-diffable binary files (`.glb`, `.obj`, `.ply`, often 20MB–100MB each).

**`img2threejs` takes a completely different paradigm: Reconstruction-by-Code.**
You provide a single 2D reference image of an object, character, or UI element. The agent inspects it and proceduralizes it into clean, modular, self-contained **TypeScript / Three.js code** (`THREE.Group` factory) constructed from geometric primitives, parametric extrusions, custom vertex transforms, procedural PBR shader materials, animation pivots, and interaction sockets.

---

## 💡 Why It Belongs in Modern Vibe Coding

1. **Zero Asset Bloat:** The 3D scene is pure code. It can be checked into Git, code-reviewed, diffed, and tree-shaken with zero binary asset overhead.
2. **Interactive UI "Hero" Elements:** Perfect for creating luxury landing page interactive artifacts (e.g., floating luxury watches, rotating badges, glowing emblems, mechanical switches, isometric game assets).
3. **Deterministic & Token-Efficient:** Instead of burning LLM tokens on mathematical calculations, JSON validation, and file manipulation, `img2threejs` handles the heavy lifting via deterministic, zero-dependency Python stdlib scripts (`forge/`). The agent's tokens are spent strictly on visual judgment and TypeScript generation.
4. **Animation & Interaction Ready:** Generated models don't emerge as an inert, frozen mesh lump. They expose a structured hierarchy:
   * **Pivots:** For joints, rotors, triggers, or moving parts.
   * **Sockets:** For attaching accessories, badges, or particles.
   * **Colliders:** Bounding volumes for physics and raycast pointer clicks.
   * **`userData.tick(delta)`:** Built-in update loop for idle floating, spinning, or breathing animations.

---

## 🏗️ The 8-Stage Sculpting Pipeline

Rather than generating complex 3D scenes in a single speculative prompt, `img2threejs` executes a staged, quality-gated engineering pipeline:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               8-STAGE SCULPTING PIPELINE                               │
├─────────────┬──────────────────────────────────────────────────────────────────────────┤
│ 1. Blockout │ Bounding boxes, proportions, pivot hierarchies, and mass distribution.   │
│ 2. Structural│ Major primary forms, parent-child relationships, and primary silhouette. │
│ 3. Form     │ Secondary shapes, bevels, chamfers, lathed curves, and contours.         │
│ 4. Material │ PBR shaders, procedural roughness/metalness maps, and clearcoats.        │
│ 5. Surface  │ Panel seams, fasteners, engraved linework, wear, and micro-textures.     │
│ 6. Lighting │ Studio multi-point light rig, directional shadows, and ambient bounce.   │
│ 7. Interact │ Mouse-hover tilt, rotational drift, click states, and physics colliders. │
│ 8. Optimize │ Geometry merging/instancing, draw-call reduction, and mobile budgets.   │
└─────────────┴──────────────────────────────────────────────────────────────────────────┘
```

Every pass requires a visual comparison gate between the reference image and the live render before unlocking the next pass.

---

## 📦 Prerequisites

* **Runtime:** A web project with Three.js installed (`npm install three @types/three`).
* **Harness Tooling:** Python 3.10 or newer (uses standard library only — **no `pip install` required**; PNG manipulation uses built-in `struct` and `zlib`).
* **Model Capability:** Any multimodal vision-capable AI model (Claude 3.5/3.7, Gemini 1.5/2.0 Pro, GPT-4o) or an agent equipped with browser screenshot tools (e.g., Antigravity browser subagent or Ponytail).

---

## 🚀 Installation & Setup

### Option 1: Direct Agent Skills Checkout (Recommended)

Clone the repository directly into your agent's skills directory:

* **Claude Code / Global Skills:**
  ```bash
  git clone https://github.com/img2threejs/img2threejs.git ~/.claude/skills/img2threejs
  ```

* **Antigravity / Gemini CLI:**
  ```bash
  # Clone to your global or project skills directory
  git clone https://github.com/img2threejs/img2threejs.git ~/.gemini/config/skills/img2threejs
  ```

* **Multi-Agent Symlink Setup (Claude, Codex, Cursor):**
  ```bash
  git clone https://github.com/img2threejs/img2threejs.git ~/.agent-skills/img2threejs
  ln -s ~/.agent-skills/img2threejs ~/.claude/skills/img2threejs
  ln -s ~/.agent-skills/img2threejs ~/.codex/skills/img2threejs
  ```

---

### Option 2: Using the Official `img2` Harness & Plugin CLI

The project also provides an `img2` manager for installing specialized domain plugins (such as CS2 weapon finishes or rigged character skeletons):

```bash
# 1. Install the img2 CLI harness
npx github:img2threejs/img2 install

# 2. (Optional) Add specialized domain plugins
img2 add img2threejs/plugin-character   # Adds Stage R rigging & animation gates
img2 add img2threejs/plugin-cs2         # Specialized weapon finishes and review gates

# 3. Verify installation integrity
img2 doctor
```

---

## ⌨️ How to Use with Coding Agents

### 1. Basic Single-Image Prompt
Attach or specify the path to your reference image and run:

```text
/img2threejs Rebuild this object as a Three.js model. Keep proportions, angles, and colors true to the reference.
```

The skill will:
1. Probe the image resolution and color depth.
2. Run a detail inventory (`detailInventory`) cataloging bevels, materials, and seams.
3. Formulate the `ObjectSculptSpec` contract.
4. Execute the staged pipeline and generate `createObjectModel.ts`.

---

### 2. High-Precision Prompt (For Production UI Elements)

When crafting an interactive hero asset for a web app:

```text
/img2threejs Rebuild the subject in this image as a procedural Three.js component.

Fidelity:   Hold strict silhouette and proportions. Enumerate identity-defining details
            (panel seams, chamfers, bevels, gloss zones) and model them procedurally.
Materials:  Derive PBR roughness, metalness, and emissive values from the reference pixels.
Runtime:    Export a function `createHeroAsset(): THREE.Group`.
            Expose `userData.tick(delta)` for a gentle floating hover and drift.
            Include pointer hover tilt physics.
Quality:    Enforce --strict-quality before finalizing the output factory.
```

---

### 3. Local CLI Script Execution (`forge/`)

You can also run the deterministic validation harness manually:

```bash
# 1. Probe image metadata
python3 forge/stage1_intake/probe_image.py ./assets/reference.png

# 2. Generate pre-spec assessment
python3 forge/stage2_spec/new_pre_spec_assessment.py "MechanicalKey" --image ./assets/reference.png --out assessment.json

# 3. Create sculpt specification
python3 forge/stage2_spec/new_sculpt_spec.py "MechanicalKey" --image ./assets/reference.png --assessment assessment.json --out spec.json

# 4. Strictly validate the spec against quality rules
python3 forge/stage2_spec/validate_sculpt_spec.py spec.json --strict-quality

# 5. Generate the TypeScript Three.js factory
python3 forge/stage3_build/generate_threejs_factory.py spec.json --out src/components/createKeyModel.ts
```

---

## 🤝 Synergy with the Vibe Coding Stack

| Companion Tool | Synergy & Practical Workflow |
|---|---|
| **Ponytail** | Enforces clean Three.js code: prevents the agent from pulling in giant external 3D loaders or extraneous math libraries when native Three.js primitives suffice. |
| **Taste Skill** | Supplies the overall visual aesthetic (lighting warmth, camera FOV, backdrop color harmony) so the 3D element seamlessly blends into the page. |
| **Emil's Skills** | Drives spring physics and cubic-bezier damping curves for camera orbits, hover tilts, and interactive click reactions. |
| **Agent Skills** | Organizes the 3D asset development into disciplined PRD specs and atomic verification tasks (`/spec` → `/plan` → `/build`). |

---

## ⚖️ When to Use vs. When to Skip

* **Use When:**
  * Building high-impact landing page heroes, interactive product showcases, 3D badges, or gamified UI switches.
  * You need the 3D asset to be 100% lightweight, Git-versionable, and generated directly from code without managing external asset CDN URLs.
* **Skip When:**
  * Building standard dashboards, data tables, CRUD portals, or purely content-driven apps.
  * Exact photorealistic human faces are required (prefer traditional 3D scanning or Gaussian splatting for photoreal human scans).
