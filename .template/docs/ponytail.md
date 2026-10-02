# 🦹‍♂️ Ponytail — The Anti-Overengineering Agent Skill

> *"He says nothing. He writes one line. It works."*

[![GitHub Stars](https://img.shields.io/github/stars/DietrichGebert/ponytail?style=flat-square&color=111111&label=Stars)](https://github.com/dietrichgebert/ponytail)
[![License: MIT](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](https://github.com/dietrichgebert/ponytail/blob/main/LICENSE)
[![Works with 20+ Agents](https://img.shields.io/badge/works%20with-20%20agents-111111?style=flat-square)](https://github.com/dietrichgebert/ponytail)

---

## 📖 Overview

**Repository:** [https://github.com/dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail)  
**Author:** Dietrich Gebert  
**Category:** Agent Ruleset, Skill & Plugin  

You know that senior software engineer with the ponytail and oval glasses who has been around longer than the git commit history? When you present him with a 50-line custom component, he looks at it in silence, deletes it, and replaces it with a single native HTML element or standard library function call.

**Ponytail puts that senior engineer inside your AI agent.**

When left unchecked, AI coding models (such as Claude 3.7 / 3.8, GPT-4o / GPT-5, Gemini 2.5 / 3.0) possess a chronic tendency to **over-engineer**. They install external npm/pip dependencies for trivial tasks, generate massive wrapper abstractions, and write 300 lines of boilerplate for problems that modern browsers or standard libraries already solve out of the box.

Ponytail intercepts that reflex and forces the agent to follow a strict **simplicity ladder** before writing a single line of code.

---

## 🪜 The 7-Rung Simplicity Ladder

Before writing any implementation, the agent must evaluate the problem against these rungs in order, stopping at the **first rung that satisfies the requirement**:

```
1. Does this need to exist?   ──▶ NO: Skip it (YAGNI).
2. Already in this codebase?  ──▶ Reuse existing helper/component; do not rewrite.
3. Stdlib does it?            ──▶ Use standard library (e.g., Python collections, Node fs/path).
4. Native platform feature?   ──▶ Use browser/OS built-in (e.g., <input type="date">, CSS grid, <dialog>).
5. Installed dependency?      ──▶ Use what is already in package.json / requirements.txt.
6. One line?                  ──▶ Write a one-liner.
7. Only then:                 ──▶ The minimum necessary code that works.
```

### The Lazy, Not Negligent Principle
Ponytail is lazy about unnecessary code, but **never about security or correctness**:
* ❌ Never cuts input validation or trust boundaries.
* ❌ Never removes error handling or data-loss protection.
* ❌ Never strips accessibility attributes (`aria-*`, keyboard navigation, semantic HTML).
* ✅ Aggressively eliminates custom date pickers, manual color pickers, reinvented debounce utilities, custom modal frameworks, and bloated state machines.

---

## 📊 Proven Benchmarks & Impact

Tested on headless Claude Code sessions editing real-world full-stack repositories ([tiangolo's full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template)), Ponytail achieved:

| Metric | Ponytail vs No-Skill Baseline | Caveman (Terse Prose) | Generic "YAGNI" Prompt |
|---|:---:|:---:|:---:|
| **Lines of Code (LOC)** | **-54%** (Up to -94%) | -20% | -33% |
| **Token Consumption** | **-22%** | +7% | -14% |
| **Inference Cost** | **-20%** | +3% | -21% |
| **Task Completion Time** | **-27%** | +2% | -30% |
| **Safety Retention** | **100%** | 100% | 95% (Dropped guard) |

*The reduction is highest where agents fall into classic over-building traps (e.g., custom date picker reduced from 404 lines down to 23 lines by adopting native browser `<input type="date">`).*

---

## 🛠️ Complete Installation Guide

Ponytail integrates with over 20 agent environments either as an active lifecycle plugin, an on-demand skill, or an always-on ruleset.

### 1. Antigravity CLI (`agy`)
Antigravity CLI automatically loads the plugin and registers the ponytail commands as skills:
```bash
agy plugin install https://github.com/DietrichGebert/ponytail
```
*To apply Ponytail as an always-on workspace rule instead, copy [`AGENTS.md`](https://github.com/dietrichgebert/ponytail/blob/main/AGENTS.md) into `.agents/rules/ponytail.md`.*

### 2. Claude Code
Install through the Claude Code plugin marketplace (requires two separate commands):
```text
/plugin marketplace add DietrichGebert/ponytail
```
```text
/plugin install ponytail@ponytail
```
*In Claude Code Desktop: Click `+` next to the prompt box → **Plugins** → **Add plugin**.*

### 3. Cursor
Cursor supports both native lifecycle hooks and markdown rules:

**Option A: Lifecycle Hooks (Recommended for dynamic mode switching)**
```bash
git clone https://github.com/DietrichGebert/ponytail
node ponytail/scripts/cursor-hooks.js install
```
*This installs hooks into `~/.cursor/hooks.json` (or add `--project` for project-level scope).*

**Option B: Static Rule File**
Copy [`.cursor/rules/ponytail.mdc`](https://github.com/dietrichgebert/ponytail/blob/main/.cursor/rules/ponytail.mdc) directly into your project's `.cursor/rules/ponytail.mdc`.

### 4. Codex CLI & Codex Desktop
```bash
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
```
*Restart Codex or type `/hooks` to approve lifecycle hooks.*

### 5. GitHub Copilot CLI
```bash
copilot plugin marketplace add DietrichGebert/ponytail
copilot plugin install ponytail@ponytail
```
*In interactive chat sessions, invoke commands with the namespace prefix: `/ponytail:ponytail ultra` or `/ponytail:ponytail-review`.*

### 6. Gemini CLI
```bash
gemini extensions install https://github.com/DietrichGebert/ponytail
```

### 7. OpenCode
Add to your project's `opencode.json`:
```json
{
  "plugin": ["@dietrichgebert/ponytail"]
}
```

### 8. Windsurf / Cline / Aider / Devin / Zed
Copy the universal instruction file [`AGENTS.md`](https://github.com/dietrichgebert/ponytail/blob/main/AGENTS.md) or specific rule files:
* **Windsurf:** [`.windsurf/rules/ponytail.md`](https://github.com/dietrichgebert/ponytail/blob/main/.windsurf/rules/)
* **Cline:** [`.clinerules`](https://github.com/dietrichgebert/ponytail/blob/main/.clinerules/)
* **Aider:** Add contents of `AGENTS.md` to your `.aider.conf.yml` or run with `--read AGENTS.md`.

---

## ⌨️ Command Reference & Modes

Ponytail provides several modes and diagnostic commands:

| Command | Action / Purpose |
|---|---|
| `/ponytail` | Displays current active mode and configuration status. |
| `/ponytail lite` | **Gentle:** Reminds the agent to prefer native features and avoid redundant libraries. |
| `/ponytail full` | **Default:** Actively stops at the 7-rung ladder and halts over-engineering. |
| `/ponytail ultra` | **Aggressive:** Maximum restraint. Eliminates all non-essential code, abstractions, and boilerplate. Best used on legacy bloat. |
| `/ponytail off` | Temporarily disables Ponytail enforcement for the current session. |
| `/ponytail-review` | Inspects a pull request or `git diff` and identifies lines that should be deleted, simplified, or replaced with built-ins. |
| `/ponytail-audit` | Audits the codebase for redundant dependencies, dead abstractions, and over-engineered components. |
| `/ponytail-debt` | Surfaces tech debt introduced by past over-engineering. |
| `/ponytail-help` | Displays command cheatsheet and usage tips. |

---

## ⚙️ Configuration & Environment Variables

* **`PONYTAIL_DEFAULT_MODE`**: Set default mode for all sessions (`lite`, `full`, `ultra`, `off`).
* **Config File Path**:
  * Windows: `%APPDATA%\ponytail\config.json`
  * macOS / Linux: `~/.config/ponytail/config.json`
  ```json
  {
    "defaultMode": "full"
  }
  ```
* **`PONYTAIL_SUBAGENT_MATCHER`**: Regex pattern specifying which spawned subagents receive the Ponytail ruleset (e.g., `explore|general`).

---

## 💡 Practical Examples

### Example 1: Date Input
* **Without Ponytail:** Agent installs `flatpickr` or `react-datepicker`, writes a custom wrapper, configures styling, and imports 85KB of vendor assets.
* **With Ponytail:**
  ```html
  <!-- ponytail: browser has one -->
  <input type="date" name="due_date" required />
  ```

### Example 2: UUID Generation
* **Without Ponytail:** Agent installs the `uuid` npm package and adds `import { v4 as uuidv4 } from 'uuid'`.
* **With Ponytail:**
  ```javascript
  // ponytail: platform built-in
  const id = crypto.randomUUID();
  ```

### Example 3: Debouncing
* **Without Ponytail:** Agent imports `lodash.debounce` or writes a custom generic debounce class.
* **With Ponytail:** Reuses existing internal timer utility or uses native modern event timing.
