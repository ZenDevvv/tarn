# 🕸️ Graphify — Multimodal Knowledge Graph for Codebases & Docs

> *"A Claude Code skill that reads your files, builds an interactive knowledge graph, and unlocks structure you didn't know was there — with 71.5x fewer tokens per query."*

[![CI Badge](https://github.com/Graphify-Labs/graphify/actions/workflows/ci.yml/badge.svg?branch=v1)](https://github.com/Graphify-Labs/graphify)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Graphify-Labs/graphify)

---

## 📖 Overview

* **Repository:** [https://github.com/Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify)  
* **Alternative URL:** [https://github.com/safishamsi/graphify](https://github.com/safishamsi/graphify)  
* **Author:** Safi Shamsi (`safishamsi` / `Graphify-Labs`)  
* **Category:** Codebase Analysis, Knowledge Graphs & Claude Code Skill  
* **PyPI Package:** `graphifyy` (CLI command is `graphify`)  

When an AI coding agent works on a project touching dozens or hundreds of files, simply feeding raw source code into the LLM context window quickly breaks down:
1. **Context Window Saturation:** Context fills up rapidly, inflating token costs on every single turn.
2. **"Lost in the Middle" Hallucinations:** Large language models overlook subtle relationships between distant files, schemas, and API handlers.
3. **Multimodal Disconnect:** Agents read code, but rarely connect it to the architecture diagrams, research PDFs, whiteboard photos, or markdown documentation sitting in the repo.

**Graphify** solves this by converting any directory into an interconnected, queryable **multimodal knowledge graph**. Inspired by Andrej Karpathy's `/raw` folder pattern, it extracts call graphs, concepts, citations, and visual elements into a persistent graph that reduces query tokens by **up to 71.5x**.

---

## 🎯 Key Capabilities & Advantages

### 1. 📉 Massive Token Reduction (71.5x Efficiency)
Instead of forcing the LLM to ingest 50+ raw files on every user prompt, Graphify queries the structured graph:
* On a mixed corpus (Karpathy repositories + 5 research papers + 4 architecture images), Graphify demonstrated **71.5x fewer tokens consumed per query**.
* Token reduction scales with project size — the bigger the project, the more dramatic the savings.

### 2. 🌐 Truly Multimodal Ingestion

| Data Type | Supported Extensions | Extraction Method |
|---|---|---|
| **Source Code** | `.py`, `.ts`, `.js`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.rb`, `.cs`, `.kt`, `.scala`, `.php` | Full AST parsing via **tree-sitter** with call-graph generation. |
| **Documentation** | `.md`, `.txt`, `.rst` | Conceptual extraction and relationship mapping. |
| **Research Papers** | `.pdf` | Citation mining, formula mapping, and thesis/concept extraction. |
| **Visual Artifacts** | `.png`, `.jpg`, `.webp`, `.gif` | **Claude Vision** extracts concepts from UI screenshots, flowcharts, and architecture diagrams in any language. |

### 3. 🔍 Architectural Intelligence
* **God Nodes:** Identifies the highest-degree concepts and architectural bottlenecks (the central hubs everything connects through).
* **Surprising Connections:** Ranks non-obvious cross-domain links (e.g., highlighting that an obscure utility function in module A directly impacts the auth flow in module B).
* **Suggested Questions:** Automatically drafts 4–5 high-leverage investigative questions the graph is uniquely positioned to answer.
* **Edge Honesty:** Every edge is explicitly categorized as `EXTRACTED` (verifiable code/doc truth), `INFERRED` (deduced relationship), or `AMBIGUOUS`.

### 4. 📚 Agent-Navigable Markdown Wiki (`--wiki`)
Graphify can compile your entire project into a Wikipedia-style markdown directory (`graphify-out/wiki/index.md`). Agents can browse and navigate the codebase concept-by-concept using simple file reads rather than wrestling with complex JSON data.

---

## 🛠️ Complete Installation Guide

### Prerequisites
* **Python 3.10+**
* [Claude Code](https://claude.ai/code) or any CLI coding agent with bash/tool access.

---

### Step 1: Install Python Package

```bash
# Using pip
pip install graphifyy && graphify install

# OR using pipx (recommended for isolated environments)
pipx install graphifyy
```

> **Windows Note:** If `graphify` is not recognized after installation, ensure Python's Scripts folder is added to your system `PATH`:  
> `%APPDATA%\Python\Python3xx\Scripts` (e.g. `Python312\Scripts`).

> **macOS Note:** If `pip install` fails with an `externally-managed-environment` error, use `pipx install graphifyy`.

---

### Step 2: Configure Claude Code

**Automatic Registration:**  
Running `graphify install` automatically registers the `/graphify` skill inside Claude Code.

**Manual Registration (Fallback):**
1. Download the skill instruction:
   ```bash
   mkdir -p ~/.claude/skills/graphify
   curl -fsSL https://raw.githubusercontent.com/Graphify-Labs/graphify/v1/skills/graphify/skill.md > ~/.claude/skills/graphify/SKILL.md
   ```
2. Add the following to your `~/.claude/CLAUDE.md` file:
   ```markdown
   - **graphify** (`~/.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
   When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.
   ```

---

## ⌨️ Command Reference & Usage

Open Claude Code or your terminal in any project directory:

```bash
# 1. Analyze the current directory and build the graph
/graphify .

# 2. Analyze a specific folder (e.g. docs, research papers, or raw assets)
/graphify ./raw

# 3. Deep mode (more aggressive relationship inference)
/graphify ./src --mode deep

# 4. Incremental update (processes only files modified since last run)
/graphify ./src --update

# 5. Add external URLs directly to the graph
/graphify add https://arxiv.org/abs/1706.03762
/graphify add https://x.com/karpathy/status/...
```

### Asking Graph Questions
```bash
# Query concept relationships
/graphify query "What connects user authentication to the payment webhook?"

# Trace execution or dependency paths between two entities
/graphify path "AuthMiddleware" "BillingDatabase"

# Explain a specific component's role in the architecture
/graphify explain "OrderDispatcher"
```

### Automation & Continuous Sync
* **Watch Mode:**
  ```bash
  /graphify ./src --watch
  ```
  Runs in the background. AST code updates trigger an instant local rebuild with zero LLM token cost. Doc or image changes notify you to trigger an update pass.
* **Git Commit Hook:**
  ```bash
  graphify hook install
  ```
  Installs a post-commit hook that automatically updates the graph after every git commit.

---

## 📂 Output Artifacts (`graphify-out/`)

When Graphify completes, it creates a `graphify-out/` directory in your workspace:

```
graphify-out/
├── graph.html       # Interactive browser graph (zoom, node search, community clustering)
├── GRAPH_REPORT.md  # Architectural summary: God nodes, surprising links, suggested questions
├── wiki/            # Agent-crawlable Wikipedia-style markdown files with index.md
├── obsidian/        # Ready-to-open Obsidian markdown vault with bi-directional links
├── graph.json       # Persistent graph database for fast querying weeks later
└── cache/           # SHA256 checksum cache enabling instant incremental runs
```

### Export Formats
* `/graphify . --svg` — Exports high-resolution vector visual (`graph.svg`).
* `/graphify . --graphml` — Exports GraphML for Gephi or yEd.
* `/graphify . --neo4j` — Generates Cypher queries for importing into Neo4j instances.
* `/graphify . --mcp` — Starts a Model Context Protocol (MCP) stdio server for external agent querying.
