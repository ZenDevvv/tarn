# 🧭 Tarn

> **Intelligent Personal ATS & Job Search Copilot**  
> A fast, privacy-first, editorial web application engineered to give job seekers complete command over their career pipeline. Built with the **Marker** design system.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ⚡ Overview

Applying across dozens of platforms—LinkedIn, Indeed, JobStreet, company career pages, and direct referrals—frequently leads to spreadsheet burnout, lost job descriptions when postings expire, and forgotten follow-ups.

**Tarn** turns the tables by placing the applicant in control with a personal **Applicant Tracking System (ATS)**. It centralizes postings, tracks multi-stage interview funnels, archives full job specifications, and provides actionable search velocity metrics in a clean, distraction-free interface.

---

## ✨ Key Features

### 📋 12-Stage Application Lifecycle & Kanban

- Seamlessly transition applications across 12 distinct lifecycle states:
  `Saved` → `Applied` → `Application Viewed` → `Recruiter Contacted` → `HR Interview` → `Technical Interview` → `Final Interview` → `Offer` → `Accepted` / `Rejected` / `Withdrawn` / `No Response`.
- Toggle effortlessly between an interactive **Kanban Board** and a high-density **Data Table** with sorting, filtering, and rapid search.

### 📌 Permanent Job Description Preservation

- Capture and lock the full original job description, source URL, salary brackets, and work setup (`Remote`, `Hybrid`, `Onsite`) so you never get caught unprepared when a posting returns 404.

### ⏱️ Timeline & Activity History

- Automated chronological activity logs record status updates, notes, interview milestones, and follow-up completions for every application.

### 🗓️ Interview Hub & Recruiter CRM

- Log upcoming and past interview rounds, record interviewers, and capture instant debrief notes.
- Built-in mini-CRM for tracking company profiles, recruiter points of contact, and direct communication history.

### 📄 Resume & Document Version Tracking

- Associate the exact resume variant and portfolio submitted with each job application to ensure pitch consistency during callbacks.

### 📊 Search Velocity & Funnel Analytics

- Real-time analytics tracking conversion rates across pipeline stages, response times, weekly application velocity, and top application sources.

### 🤖 AI-Ready Foundation

- Architected for intelligent job search automation:
  - Automated job posting parsing and metadata extraction from URLs.
  - Resume-to-job keyword alignment & skills-gap analysis _(roadmap)_.
  - AI-assisted interview preparation and tailored follow-up drafting _(roadmap)_.

---

## 🎨 The Marker Design Philosophy

Tarn is built with **Marker**, an intentional design system created to resist generic enterprise software tropes:

1. **Next action first:** The vibrant lime marker accent (`#D6F04F`) is strictly reserved to highlight tasks due today or overdue.
2. **Progress as shape:** Application states are represented through geometric **Stage Rings** rather than cluttered rainbow badges.
3. **Calm until it matters:** Surfaces are separated by subtle tones and hairline borders; elevation shadows are reserved only for active floating layers.
4. **Editorial typography:** Dual-face pairing of **Bricolage Grotesque** (display titles & metrics) with **Instrument Sans** (body & UI controls).

---

## 🏗️ Architecture & Monorepo Structure

Tarn is structured as a high-performance monorepo powered by **pnpm workspaces**:

```text
tarn/
├── apps/
│   ├── web/               # React 18 SPA (Vite, Tailwind CSS v4, TanStack Query, React Hook Form)
│   └── api/               # REST API service (Express, TypeScript, Prisma Client, JWT Auth)
├── packages/
│   ├── database/          # Prisma schema, migrations, and PostgreSQL seed scripts
│   ├── types/             # Shared TypeScript domain contracts and DTOs
│   └── validation/        # Shared Zod validation schemas
├── docker-compose.yml     # Local PostgreSQL database container configuration
└── package.json           # Root workspace scripts and tooling
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** `>= 20.x`
- **pnpm** `>= 9.x` (`corepack enable pnpm`)
- **Docker & Docker Compose** (for local PostgreSQL)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ZenDevvv/tarn.git
cd tarn
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

_(Review `.env` to verify your database credentials and authentication secrets.)_

### 3. Spin Up PostgreSQL & Setup Database

```bash
# Automated setup (starts PostgreSQL, applies migrations, seeds sample data)
pnpm db:setup
```

_(Or manually step-by-step: `pnpm db:up` ➔ `pnpm db:migrate` ➔ `pnpm db:seed`)_

### 4. Start Development Servers

Run the API and Web client in parallel:

```bash
pnpm dev
```

_(Automatically ensures PostgreSQL is running and latest migrations are applied before starting servers.)_

- **Web App:** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:4000](http://localhost:4000)
- **Prisma Studio:** `pnpm db:studio` (opens database GUI on [http://localhost:5555](http://localhost:5555))

---

## 🛠️ Available Scripts

| Command                  | Description                                                                     |
| :----------------------- | :------------------------------------------------------------------------------ |
| `pnpm dev`               | Starts PostgreSQL container, checks migrations, and runs Web + API concurrently |
| `pnpm dev:web`           | Starts the Vite frontend application only                                       |
| `pnpm dev:api`           | Starts the Express backend application only                                     |
| `pnpm db:setup`          | Starts Docker DB, applies Prisma migrations, and seeds test data                |
| `pnpm db:up`             | Boots the PostgreSQL container via Docker Compose                               |
| `pnpm db:down`           | Shuts down the local PostgreSQL container                                       |
| `pnpm db:migrate`        | Runs interactive database migrations in development (`migrate dev`)             |
| `pnpm db:migrate:deploy` | Applies pending migrations in non-interactive mode (`migrate deploy`)           |
| `pnpm db:push`           | Pushes schema directly without recording migrations                             |
| `pnpm db:seed`           | Populates database with sample mock data (`mika@example.com`)                   |
| `pnpm db:studio`         | Launches Prisma Studio GUI for database browsing                                |
| `pnpm build`             | Compiles all packages and applications                                          |
| `pnpm test`              | Runs unit and integration test suites                                           |
| `pnpm lint`              | Runs linter across all workspaces                                               |
| `pnpm format`            | Formats all source files with Prettier                                          |

---

## 🔒 Security & Data Isolation

- **Multi-user Scoping:** Every query and mutation is strictly partitioned by `userId`.
- **HttpOnly Cookies:** Authentication leverages secure, signed `httpOnly` cookies with `SameSite=lax` protections—no vulnerable token storage in `localStorage`.
- **Zod Validation:** All incoming HTTP requests and web form payloads are validated against shared runtime schemas.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
