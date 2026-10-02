# 🌐 OmniRoute — The Free AI Gateway & Smart Router

> *"Never stop coding. 358 AI providers · 150+ free tiers · ~1.62B free tokens/mo · 19 routing strategies · $0 to start."*

[![npm version](https://img.shields.io/npm/v/omniroute?color=cb3837&logo=npm)](https://www.npmjs.com/package/omniroute)
[![Docker Hub](https://img.shields.io/docker/v/diegosouzapw/omniroute?label=Docker%20Hub&logo=docker&color=2496ED)](https://hub.docker.com/r/diegosouzapw/omniroute)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/diegosouzapw/OmniRoute/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/diegosouzapw/OmniRoute?style=social)](https://github.com/diegosouzapw/OmniRoute)

---

## 📖 Overview

* **Repository:** [https://github.com/diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute)
* **Author:** Diego Souza (`diegosouzapw`)
* **Category:** Universal Local AI Gateway, Reverse Proxy & Load Balancer
* **Default Endpoint:** `http://localhost:20128/v1`
* **Web Dashboard:** `http://localhost:20128/dashboard`

During prolonged AI coding ("vibe coding") sessions, developers inevitably hit four major pain points:
1. **Sudden Rate Limits:** You are mid-refactor in Cursor or Claude Code, and your subscription quota runs out or the provider blocks your API key.
2. **Expensive Token Ingestion:** Coding agents send entire files, terminal traces, and test outputs back and forth, consuming hundreds of thousands of tokens per minute.
3. **API Key Juggling:** Keeping track of 10+ provider dashboards, credit card minimums, and billing surprises.
4. **Tool Fragmentation:** Different agents and IDEs demand different endpoints, schemas, or authentication headers.

**OmniRoute** solves this by acting as a **single, local-first gateway** that sits between your coding tools and **358+ AI providers**, managing **150+ free tiers** and automatically balancing traffic with smart fallback.

---

## 💰 The ~1.62B Free Monthly Token Pool

OmniRoute catalogs **489 free-tier entries across 35 recurring pool keys** deduplicated by provider. It aggregates over **1.62 Billion free tokens per month** (climbing to ~2.22B in month one with initial signup credits) across providers like:
* Mistral (1B tokens)
* Nara (210M tokens)
* LLM7 (150M tokens)
* xKiro (150M tokens)
* Groq (30M tokens across five per-model caps)
* Keyless providers like OpenCode Free (instant, no-signup fallback)

A live tracker is accessible directly in the local dashboard at `/dashboard/free-tiers`.

---

## 🎯 Key Architectural Features

### 1. 🆓 Works Instantly with Zero Config
OmniRoute requires **no API keys, credit cards, or signups** to start. On fresh install, sending a request with `"model": "auto"` routes directly to keyless providers (such as OpenCode Free) out of the box.

### 2. ⚡ 4-Tier Cascading Fallback
When a provider encounters a rate limit (HTTP 429), server error (HTTP 5xx), or timeout, OmniRoute automatically cascades across four tiers:

```
               IDE / Agent (Cursor, Claude Code, Cline, Antigravity)
                                        │
                                        ▼
                          http://localhost:20128/v1
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │ OmniRoute Smart Router & Resilience Layer │
                  └─────────────────────┬─────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│     TIER 1       │ ──fail─▶ │      TIER 2      │ ──fail─▶ │      TIER 3      │ ──fail─▶ TIER 4
│  Subscriptions   │          │  Direct API Keys │          │   Cheap Models   │          Free Tiers
│ (Claude, Codex)  │          │(OpenAI, DeepSeek)│          │(MiniMax, Kimi K3)│          (150+ pools)
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

### 3. 🗜️ Stacked Token Compression (RTK + Caveman)
OmniRoute automatically applies real-time token compression on large prompts, agent logs, and code diffs:
* **Token savings: 15% to 95% (averaging ~89%)**.
* Strips redundant conversational fluff, repetitive stack traces, and formatting padding while retaining critical semantic structure.

### 4. 🛡️ Enterprise Resilience & Local-First Security
* **Circuit Breakers:** Temporarily quenches failing endpoints without killing the active agent session.
* **Key Pools & Fair Quota:** Balances usage across multiple API keys.
* **Local-First & Private:** API keys are stored locally on your machine encrypted with **AES-256-GCM**.
* **Model Context Protocol (MCP):** Pre-equipped with 110+ MCP tools for extended agent workflows.

---

## 🛠️ Complete Installation Guide

### Option 1: Global NPM Install (Recommended)

Requires Node.js 18+.

```bash
# 1. Install globally
npm install -g omniroute

# 2. Launch server (starts on http://localhost:20128)
omniroute
```

To run OmniRoute continuously as a background service:
```bash
# Using PM2
npm install -g pm2
pm2 start omniroute --name "omniroute-gateway"
pm2 startup
pm2 save
```

---

### Option 2: Docker / Docker Compose

Run OmniRoute inside a lightweight container:

```bash
docker run -d \
  --name omniroute \
  -p 20128:20128 \
  -v omniroute-data:/app/data \
  --restart unless-stopped \
  diegosouzapw/omniroute:latest
```

**Docker Compose (`docker-compose.yml`):**
```yaml
version: '3.8'
services:
  omniroute:
    image: diegosouzapw/omniroute:latest
    container_name: omniroute
    ports:
      - "20128:20128"
    volumes:
      - ./data:/app/data
    restart: always
```

---

### Option 3: From Source (PNPM)

```bash
git clone https://github.com/diegosouzapw/OmniRoute.git
cd OmniRoute
pnpm install
pnpm build
pnpm start
```

---

## 🔌 Connecting to Your IDE & Coding Agents

Once OmniRoute is running at `http://localhost:20128`, configure your tools to use it as an OpenAI-compatible endpoint:

### 1. Cursor
1. Open Cursor **Settings** (`Ctrl+,` or `Cmd+,`) → **Models**.
2. Enable **OpenAI API Key** and enter any dummy text (e.g., `omniroute-local`).
3. Under **OpenAI Base URL**, enter:
   ```
   http://localhost:20128/v1
   ```
4. Add model names like `auto`, `claude-3-7-sonnet`, `gpt-4o`, `kimi-k3`, or `deepseek-chat`.

### 2. Claude Code
Point Claude Code's API base to OmniRoute:
```bash
export ANTHROPIC_BASE_URL="http://localhost:20128/v1"
export ANTHROPIC_API_KEY="omniroute-dummy-key"
claude
```

### 3. Cline (VS Code Extension)
1. Open Cline settings.
2. Select API Provider: **OpenAI Compatible**.
3. **Base URL:** `http://localhost:20128/v1`
4. **API Key:** `omniroute`
5. **Model ID:** `auto` (or provider specific, e.g., `mistral/mistral-large`).

### 4. Antigravity CLI / Gemini CLI
Specify custom API endpoint configurations in your profile or via environment variables pointing to `http://localhost:20128/v1`.

---

## 🧪 Verification & Testing

### Instant cURL Test (Zero Credentials)
```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Explain vibe coding in one sentence."}
    ]
  }'
```

### Python SDK
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:20128/v1",
    api_key="omniroute-local"  # Any string works for free-tier auto routing
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello OmniRoute!"}]
)

print(response.choices[0].message.content)
```

### Node.js SDK
```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:20128/v1",
  apiKey: "omniroute-local",
});

const completion = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Ping test" }],
});

console.log(completion.choices[0].message.content);
```

---

## 📊 Dashboard & Monitoring

Open your browser to:
```
http://localhost:20128/dashboard
```

* **`/dashboard/free-tiers`:** Real-time quota gauges for all 150+ free tiers showing used vs. remaining tokens.
* **`/dashboard/analytics`:** Token savings breakdown from RTK + Caveman compression.
* **`/dashboard/providers`:** Add, toggle, and rank your custom provider keys (OpenAI, Anthropic, Gemini, Groq, Kimi, Mistral, etc.).
* **`/dashboard/routes`:** Configure failover rules and preferred model mappings.
