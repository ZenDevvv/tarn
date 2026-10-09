# Tailoring Fixes — Engineering Report

> **Module:** `tailoring-fixes` · **Repo:** tarn (`github.com/ZenDevvv/tarn`)
> **Source plan:** `tasks/plan-tailoring-fixes.md` · **Status of plan:** approved, not yet executed
> **Scope:** Post-implementation hardening of the application-tailoring engine for multi-user safety and honesty.

---

## 1. Executive Summary

The tailoring engine (Resume-Builder port) shipped with a sound data layer but a
generation layer tuned for a single seeded user. It is functional for Zen's own
use but breaks — silently or expensively — for any other user. This report
documents 8 findings, the remediation plan (8 tasks in 3 priority tiers), and the
verification strategy. **P0 findings are ship-blockers for multi-user.**

A key product decision was locked: the deliverable feature becomes a **paid plan**,
but this work builds it fully functional behind a one-line entitlement stub
(`402 PLANS_REQUIRED`) so the paywall flips on later without a rewrite. Payment and
subscription architecture are explicitly out of scope here.

---

## 2. Current State

| Layer | Component | State | Notes |
|---|---|---|---|
| DB | `MasterProfile` (`@unique userId`), `CoverLetter`, `Resume`+`content/isTailored/matchScore` | Shipped | Clean, user-scoped |
| API | master-profile routes, tailoring routes | Shipped | All `authenticate`-gated |
| Backend svc | `JdAnalyzerService`, `TailoringValidatorService`, `PdfRendererService`, `ProfileExtractorService`, `TailoringService` | Shipped | Deterministic + Gemini AI modes |
| Frontend | Career Profile tab, scorecard, deliverables, studio + preview modals | Shipped | Marker design system |
| Tests | `master-profile`, `tailoring`, `tailoring-analysis`, `bullet-utils` | Shipped | Present, all-green at ship |

Working tree has substantial uncommitted WIP (the tailoring feature itself, ~6.4k
lines across 54 files) plus 4 untracked new files. Not yet committed.

---

## 3. Findings

Severity: **P0** = ship-blocker for multi-user · **P1** = product claims exceed reality · **P2** = robustness debt.

### F1 — Shared AI billing, no per-user gate (P0)
`process.env.GEMINI_API_KEY` is a single platform key. Every user's AI generation
bills one quota with no per-user cap or entitlement. One abusive user drains it for
everyone.
→ **Task 1:** platform key stays; add `GenerationUsage` (per-user/day counter) +
per-user rate limiter + `402 PLANS_REQUIRED` entitlement stub on `/generate`.

### F2 — Extractor fabricates data, PH-centric (P0)
`ProfileExtractorService.parseResumeText` invents facts on parse failure:
placeholder bullets, hardcoded `graduation: '2024'`, fake `https://github.com/`
links, `'Company'` employer. Location parsing only recognizes Philippine cities
(`Pasig|Quezon|Manila|Cebu…`), so US/EU resumes lose location entirely. Fabricated
facts pass the validator as "grounded."
→ **Task 2:** delete all fabricated fallbacks; generic location/URL parsing;
`{profile, warnings}` return; **review-before-commit** upload flow.

### F3 — PDF generation fails silently (P0)
`PdfRendererService.findChromiumBinary()` checks fixed paths; no Chromium → writes
an `.html` file and returns it as `pdfUrl`. "Download PDF" hands the user an HTML
file. No error surfaced.
→ **Task 3:** hard error on missing/failed Chromium; no HTML fallback; DB rollback
on render failure.

### F4 — "Tailoring" is reorder + template, not adaptation (P1)
`assembleDeterministic` sorts bullets by keyword hits and plugs 3 JD phrases into a
**hardcoded cover-letter skeleton**. Two users get the same letter structure. The
resume only re-sorts — it never rewrites to close gaps, so keyword coverage doesn't
improve; the match score measures the master resume, not what tailoring added.
→ **Task 4:** compose letters from the user's own data (variants keyed by
positioning rules); surface unclosable gaps honestly; add coverage-delta to scorecard.

### F5 — Validator overclaims (P1)
Checks skills vs master and employers vs master — good. But the spec promises "zero
ungrounded metrics" and it checks **no** metrics, dates, or project names, and does
not validate the cover letter at all. A Gemini run inventing "cut latency 40%" sails
through.
→ **Task 5:** add metric/date/project-name/cover-letter fidelity checks; `blocking`
flag + `overrideWarnings`; honest UI copy.

### F6 — Unprotected Gemini calls (P2)
`fetch` with no timeout (long JDs hang); `JSON.parse(textOutput)` with zero schema
validation before it hits templates.
→ **Task 6:** `AbortSignal.timeout(30s)`; Zod validation of AI output; deterministic
fallback on any failure; never leak the key.

### F7 — Thin keyword extraction (P2)
Fixed English tech allowlist; no stemming (`manage|management|managing` = 3 tokens);
bigram match requires every content word present, so multi-word keywords rarely
match — coverage reads low for non-tech roles.
→ **Task 7:** light stemmer; any-content-word matching; profile-skill tech prior.

### F8 — Non-atomic generate (P2)
Resume → CoverLetter → application update → timeline = 4 sequential writes. Failure
after the first leaves orphan rows and a stray PDF.
→ **Task 8:** `prisma.$transaction` + file cleanup on rollback + up-front IDs.

---

## 4. Remediation Plan (summary — details in `plan-tailoring-fixes.md`)

| Task | Tier | Finding | Acceptance gate |
|---|---|---|---|
| 1. Quota + entitlement + rate limit | P0 | F1 | 6th/day → 402; failed gen doesn't burn quota |
| 2. Extractor de-fabrication + review flow | P0 | F2 | zero fabricated strings; no write until confirm |
| 3. Loud PDF failure | P0 | F3 | no Chromium → 503, no orphans |
| 4. Real letter composition + coverage delta | P1 | F4 | 2 users → different letters; delta shown |
| 5. Validator completeness | P1 | F5 | ungrounded metric → blocking warning |
| 6. Gemini hardening | P2 | F6 | slow/invalid/malformed → deterministic fallback |
| 7. Stemming + fairer matching | P2 | F7 | manage≈management; partial bigram match |
| 8. Atomic generate | P2 | F8 | forced failure → no orphans, quota unchanged |

**Execution order:** 2+3 → 1 (batch migration) → 4+5 → 6+7 → 8.
**Per-task gate (repo AGENTS.md):** TDD; `pnpm test && pnpm build` green before done.

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Entitlement stub leaks into prod as always-on-free unintentionally | Med | Revenue | Single flag; test the 402 path |
| Extractor rewrite regresses Zen's own resume import | Med | UX | Review-before-commit surfaces warnings; seed data untouched |
| Quota counter tied to deletable rows | Low | Abuse | New `GenerationUsage` table, survives deletion |
| Schema migration in a live DB | Med | Downtime | Batch Tasks 1+2 into one `prisma db push` |
| Deterministic fallback masks Gemini outage | Low | Trust | `fallbackReason` surfaced in UI |

---

## 6. Verification Strategy

- **Unit/integration:** every task ships/extends tests in `apps/api/tests/`.
  No test weakened. `bullet-utils.test.ts` already guards the parser.
- **E2E gates:** generate happy path (deterministic + AI fallback), quota exhaustion
  (402), PDF-unavailable (503), review-before-commit (no write until confirm),
  atomic-rollback (forced failure → no orphans).
- **Build:** `pnpm test && pnpm build` green across the monorepo per task.
- **Multi-user isolation:** two seeded users with different profiles produce
  different deliverables; no cross-user data leakage.

---

## 7. Locked Decisions (do not re-litigate)

1. **AI is the only selectable engine.** Deterministic assembly stays as the silent
   fallback; `mode: 'deterministic'` removed from the user-facing schema.
2. **No BYOK.** One platform `GEMINI_API_KEY`; per-user quota + rate limit is the gate.
3. **Paid deliverables, built free.** `402 PLANS_REQUIRED` stub on `/generate` now;
   payments later behind the same check. No payment architecture here.
4. **Review-before-commit** upload flow.
5. **Hard-error** PDF failure — no silent HTML fallback.

---

## 8. Out of Scope

- Payment/subscription/billing implementation and schema.
- Changing the seeded MasterProfile or Zen's personal data.
- Any frontend redesign beyond the scorecard/studio copy changes named in Tasks 4–5.
