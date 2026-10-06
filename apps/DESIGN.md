# DESIGN.md

Design rules for **Job Application Tracker** (design system name: **Marker**).
Read this before creating or changing any UI. Follow it exactly. If a rule here conflicts with a default from shadcn/ui, Tailwind, or your own habits, this file wins.

Source-of-truth order when documents disagree:
1. `job-application-tracker-brd-prd.md` (what the product does)
2. `job-application-tracker-project-architecture.md` (where code lives, which libraries)
3. This file (how it looks and reads)
4. `apps/web/src/index.css` (the actual token values)

A live reference with every component rendered is in `design-system.html`.

---

## 1. Stack and file placement

- React + TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Recharts, React Router, TanStack Query, React Hook Form + Zod.
- Tokens live in `apps/web/src/index.css`. Never hard-code a hex value in a component. Use Tailwind token classes (`bg-card`, `text-muted-foreground`) or `var(--token)`.
- Generic primitives go in `apps/web/src/components/ui/` (button, input, dialog, tabs...).
- Anything that knows about applications, follow-ups, or statuses goes inside its feature folder, e.g. `features/applications/components/`. Never put `application-card.tsx` in `components/ui/`.
- Status display lives in `features/applications/components/application-status-badge.tsx` (exports `StageRing`, `ApplicationStatusBadge`, `STATUS_CONFIG`).
- Fonts: `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/instrument-sans`. Do not add other font families.
- Icons: `lucide-react` only. 16px in controls and nav, 20px in the mobile tab bar, stroke 1.5, `currentColor`.

---

## 2. The five ideas that make this product look like itself

1. **Next action first.** Every active application answers "what do I do now?" The marker exists to answer that.
2. **Progress is shape, not color.** Status is shown with the Stage Ring, not colored pills.
3. **Quiet until it matters.** Separate surfaces by tone and hairline borders. Shadows only on floating layers.
4. **Numbers big, labels small.** Headings and figures use the display face. Labels stay small, plain, sentence case.
5. **Personal, not corporate.** Plain second-person copy. No enterprise chrome, no confetti, no gradients.

If a design decision isn't covered below, choose the option that is quieter and plainer.

---

## 3. Color

Use tokens only. Tailwind class on the left, role on the right.

### Surfaces and ink

| Class | Role | Light | Dark |
|---|---|---|---|
| `bg-background` | Page (paper) | `#F4F5F2` | `#0E1714` |
| `bg-card` | Raised surface: cards, tables, dialogs | `#FFFFFF` | `#15201C` |
| `bg-secondary` / `bg-muted` | Sunken wells: Kanban columns, code blocks, tag fill | `#E9ECE6` | `#1B2A24` |
| `bg-accent` | Hover fill for rows and menu items | `#DDE3D6` | `#22332C` |
| `border-border` | Hairline dividers and card edges | `#DADFD6` | `#263630` |
| `border-input` | Edges of form controls (3:1 contrast) | `#7C867F` | `#6C7C72` |
| `text-foreground` | Primary text | `#16251F` | `#E8EDE6` |
| `text-muted-foreground` | Secondary text, captions, metadata | `#5A665F` | `#93A197` |

### Brand and accent

| Class | Role |
|---|---|
| `bg-primary text-primary-foreground hover:bg-primary-hover` | Pine. The primary button and nothing louder. Flips to pale sage in dark mode. |
| `bg-marker text-marker-foreground` or the `marker` utility | The highlighter. See section 5. |
| `ring-ring` | Focus ring (pine). |

### Signals

| Class | Use |
|---|---|
| `text-destructive`, `bg-destructive-tint` | Errors, overdue, rejected, destructive actions |
| `text-warning`, `bg-warning-tint` | Warnings |
| `text-info`, `bg-info-tint` | Informational notes |
| `text-success`, `bg-success-tint` | Completed states. Success is the same pine as the brand on purpose. |

### Color rules

- Neutrals make up roughly 90% of any screen.
- Do not introduce a new color. If you think you need one, you need a different structure (shape, weight, position).
- Never use pure `#000` or `#fff` for text or backgrounds outside tokens.
- Never use gradients, glows, or colored shadows.
- Never convey meaning by color alone. Pair color with text or shape.

---

## 4. Typography

| Utility | Size / line | Face and weight | Use |
|---|---|---|---|
| `text-display` | 40/44 | Display 600, tracking -2.5% | Dashboard greeting only |
| `text-title` | 28/34 | Display 600, -2% | Page titles, large stat numbers (32px for stats) |
| `text-heading` | 20/26 | Display 600, -1% | Section headings, dialog titles |
| `text-subheading` | 16/22 | Sans 600 (company names use Display 600) | Card titles, panel headings |
| `text-body` | 14/22 | Sans 400 / 500 | Default UI text |
| `text-small` | 13/18 | Sans | Card facts, table secondary lines |
| `text-caption` | 12/16 | Sans | Hints, timestamps. 12px is the minimum size. |
| `text-reading` | 15/26 | Sans, max `68ch` | Job descriptions and long notes |

Faces: `font-display` = Bricolage Grotesque. `font-sans` = Instrument Sans (default on body).

Rules:
- Sentence case everywhere: buttons, labels, headings, tabs, nav. **Never** ALL CAPS, never letter-spaced eyebrow labels above headings.
- Tabular numbers are on globally. Keep salaries, dates, counts, and IDs in the UI face so columns align.
- Do not use monospace for data labels. Monospace is for code blocks only.
- Do not emphasize a single word in a heading with color, italic, or highlight.
- Keep line length under 80 characters; job descriptions under 68ch.
- Format: currency `₱50k–₱70k` (en dash), dates `Sep 28` or `Oct 2, 10:30 AM`, IDs `APP-2026-0042`.

---

## 5. The marker (most important rule)

The marker is a lime highlighter swipe behind text. It means **"this is yours to do now."**

**Use it only on:**
- The text of a next action or follow-up that is due **today** or **overdue**.
- The "Due today" chip.
- The Undo action text in a toast (as `text-marker`, no background).
- The core dot of the Accepted stage ring.

**Never use it on:** headings, buttons, navigation, tags, selected states, hover states, links, charts (except the in-progress week bar), empty states, or decoration.

**Budget:** at most 2 to 3 markers per screen region. If a screen has many due items, mark the top few and leave the rest plain. Future actions (due after today) are plain text.

**Implementation:**
```tsx
const actionable = nextActionDueAt && isTodayOrPast(nextActionDueAt);

<span className={cn(actionable && "marker", justSet && "marker-sweep")}>
  {nextAction}
</span>
```
- Text on the marker is always `text-marker-foreground`, in both themes.
- `marker-sweep` (500ms) plays once, when a next action is newly set or changed. Do not play it on page load or on list re-render.

---

## 6. Stage Ring (status display)

Status is shown with `<ApplicationStatusBadge status="..." />` (ring + label) or `<StageRing status="..." />` (ring only). **Do not** build status pills, colored badges, or per-status color maps.

| Status enum | Label | Ring |
|---|---|---|
| `SAVED` | Saved | empty ring |
| `APPLIED` | Applied | 1/8 filled |
| `APPLICATION_VIEWED` | Application viewed | 2/8 |
| `RECRUITER_CONTACTED` | Recruiter contacted | 3/8 |
| `HR_INTERVIEW` | HR interview | 4/8 |
| `TECHNICAL_INTERVIEW` | Technical interview | 5/8 |
| `FINAL_INTERVIEW` | Final interview | 6/8 |
| `OFFER` | Offer | 7/8 |
| `ACCEPTED` | Accepted | full, with lime core |
| `REJECTED` | Rejected | ring with an X, `text-stage-rejected` |
| `WITHDRAWN` | Withdrawn | dashed ring, `text-stage-closed` |
| `NO_RESPONSE` | No response | dotted ring, `text-stage-closed` |

Rules:
- The label always appears next to the ring. The SVG is `aria-hidden`.
- Sizes: 16px inline, 20px in pipeline strips, 22 to 24px in lists of statuses, 44px for the empty state.
- Kanban column headers show the ring, the label, and a count.
- Changing status creates a timeline event, and the timeline node for that event uses the same ring.
- Status colors come from `text-stage-active`, `text-stage-closed`, `text-stage-rejected` only.
- To add or rename a status, edit `STATUS_CONFIG` in one place and keep the ring progression consistent.
- The shadcn `Badge` is for tags only. Never use it for status.

---

## 7. Shape, space, elevation

### Radius (hierarchy, not one value)

| Class | px | Use |
|---|---|---|
| `rounded-xs` | 4 | Tags, checkboxes |
| `rounded-md` | 8 | Buttons, inputs, selects, menu items |
| `rounded-lg` | 12 | Application cards, dialogs, popovers, toasts |
| `rounded-xl` | 20 | Panels, Kanban columns, dashboard shell |
| `rounded-full` | - | Follow-up chips, avatars, circular checkboxes |

A child should never be rounder than its parent.

### Spacing

- 4px grid. Common steps: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72.
- Card padding: 14px vertical, 16px horizontal. Gap between cards: 8 to 12px. Between page sections: 28 to 40px.
- Content max width 1200px. Forms cap at 640px. Reading text caps at 68ch.

### Elevation

| Level | Treatment | Use |
|---|---|---|
| 0 | `bg-background` | Page |
| 1 | `bg-card` + 1px `border-border`, **no shadow** | Cards, tables, panels |
| 2 | `bg-card` + border + `shadow-float` | Dialogs, popovers, dropdown menus, toasts, a Kanban card while dragging |

- Remove shadcn's default `shadow-xs`, `shadow-sm` from Card, Input, Select, Button.
- Card hover: border darkens to `border-input`. No lift, no shadow, no scale.
- Dragging card: `shadow-float`, `rotate-[1.2deg]`, `scale-[1.015]`.

---

## 8. Components

### Buttons
- One primary button per view. Global primary is **Add application** (plus icon, left).
- Variants: `default` (pine), `secondary` (card bg, `border-input`), `ghost`, `danger` (`bg-destructive`).
- Heights: sm 30, default 36, lg 42. On touch, keep a 44px hit area.
- Labels say the outcome: "Save application", "Delete application", "Create anyway". Never "Submit", "OK", or "Yes".
- No trailing arrows or chevrons in labels.

### Form fields
- Label above the control (`text-small font-medium`), hint below (`text-caption text-muted-foreground`). An error replaces the hint, uses `text-destructive text-caption`, an icon, and says what to do next.
- Inputs: 36px high, `rounded-md`, `border-input`, `bg-card`. Invalid: destructive border plus inset 1px.
- Focus: 2px `ring` outline. Never remove outlines.
- Required fields are marked in the label text ("Company (required)"), not with a lone asterisk.
- Validate with Zod through React Hook Form. Show errors on blur and on submit.

### Application card (`application-card.tsx`)
Content order, top to bottom:
1. Stage ring + status label (left), priority glyph (right)
2. Company (display face, 16px 600), position below in `text-muted-foreground`
3. Facts row: work setup, salary range, platform. Separate with 14px gaps, **not** middle dots (single line, no wrapping)
4. Divider, then applied date with calendar icon (left) and relative age (right).

Surface: `bg-card border rounded-lg`, uniform height across grid (`h-full flex flex-col justify-between`). The whole card is one link to `/applications/:id`.

### Priority
Three-bar glyph (1, 2, or 3 bars filled in `text-foreground`). Never color-coded. Always has an `aria-label` ("High priority"). Priority is user-defined, not a recommendation.

### Follow-up chips
| State | Style |
|---|---|
| Pending | Outline, clock icon, "Pending, Oct 4" |
| Due today | `bg-marker text-marker-foreground`, no border |
| Overdue | `bg-destructive-tint text-destructive`, "Overdue 2 days" |
| Completed | `bg-success-tint text-success`, check icon, label struck through |
| Snoozed | Dashed border, muted, "Snoozed until Oct 3" |

### Tags
`bg-muted rounded-xs`, 24px high, 12px medium. No color per tag. Outline variant for secondary tags.

### Tabs
Text tabs with a 2px pine underline on the selected one. Arrow keys move between tabs. Use on the application detail page: Overview, Job description, Timeline, Interviews, Notes.

### Kanban (`application-kanban.tsx`)
- Columns: `bg-secondary rounded-xl`, 288px wide, padding 10, horizontal scroll with snap on tablet and mobile.
- Column header: ring + label + count (right, muted).
- Drag: card gets the dragging treatment from section 7. Drop target is a dashed slot (`border-input border-dashed rounded-lg`), label "Drop here".
- Updates are optimistic (see architecture doc section 16). On failure, roll back and show a toast: "Couldn't move the application. Try again."
- **Keyboard path is required.** Every card has a "Move to" menu listing statuses. Announce moves in a polite live region ("Moved to HR interview").
- Mobile: one column at a time, swipe between stages.

### Timeline
- Newest first on the detail page. Three columns: date (right-aligned, caption, muted), node, content.
- Status-change events use a ring node. All other events use a 7px dot in `border-input` color. A 1px `border-border` line connects nodes.
- Titles are plain past-tense events: "Application submitted", "Moved to Technical interview", "Recruiter contacted you".
- New rows fade in over 280ms.

### Dashboard (`/dashboard`)
Fixed section order: greeting + search + Add application, **Needs you today**, stats strip, pipeline strip, recent applications.
- Needs you today: list rows with a circular checkbox, action text (marker if due today/overdue), who it's for in muted small text, due time right-aligned (overdue in `text-destructive font-medium`).
- Stats strip: one bordered band with four figures separated by hairlines. Not four cards. Figure in display face, label in `text-small text-muted-foreground`. No icons, no trend arrows, no gradients.
- Pipeline strip: nine stage rings with counts and labels.
- Recent applications: table with hairline row dividers, `bg-accent` row hover, status column uses `ApplicationStatusBadge`.

### Navigation
- Desktop (1024+): left sidebar 208px. Add application button at top, then nav: Dashboard, Applications, Saved jobs, Companies, Contacts, Interviews, Resumes, Analytics, Settings. Active item: `bg-secondary text-foreground` with a pine icon. Count badges are plain muted text.
- Tablet (640 to 1023): collapsed 64px icon rail.
- Mobile (<640): bottom tab bar with Home, Applications, centered Add (circular pine button), Interviews, More. Everything else is under More. Respect `env(safe-area-inset-bottom)`.
- Global search is focused with `/`. Show the key hint in the input.

### Dialogs, menus, toasts
- Dialog: `rounded-lg shadow-float`, title in display face 18px, body muted, actions right-aligned (secondary left, primary right).
- Duplicate detection: title "Possible duplicate", show the existing application, buttons **View existing** and **Create anyway**. The user always decides.
- Destructive confirm names the object and the consequence: "Delete Halcyon Labs, Frontend Developer? Its timeline and notes go with it."
- Toast: inverted (`bg-foreground text-background`), `rounded-lg shadow-float`, optional Undo in `text-marker`. Auto-dismiss 5s, pause on hover, never for errors that need action.
- Inline errors use the banner: `bg-destructive-tint rounded-lg`, bold title, one sentence on what to do.

### Empty and loading states
- Empty: left-aligned. Large empty ring (44px), heading (20px display), one sentence, one primary button. Example: "No applications yet" / "Start tracking your job search by adding your first application." / **Add application**.
- Loading: skeleton bars in `bg-muted`, shaped like the final content, opacity pulse 1.6s. No spinners for page-level loads. Buttons in progress show the label "Saving..." and are disabled.

---

## 9. Charts (Recharts)

- One hue for magnitude: `var(--chart-1)`. Stepped opacity for funnels (1, .86, .72, .58, .44, .3).
- Categories (platforms): `--chart-1` to `--chart-5`. Five max, group the rest into "Other". Always label directly or in a text legend.
- Horizontal gridlines only, `stroke="var(--border)"`. Baseline axis uses `var(--input)`. Tick labels 12px `var(--muted-foreground)`, no tick lines.
- Bar radius `[4, 4, 0, 0]`. The current, incomplete week uses `--marker` fill with a 1px `--input` outline.
- Always include a text alternative (`role="img"` + `aria-label` summarizing values) or a data table.
- Analytics are descriptive. Never write copy implying a platform or strategy will perform better in future.

---

## 10. Motion

Motion answers a person's action. It never decorates.

| Motion | Duration | Trigger |
|---|---|---|
| Marker sweep | 500ms | A next action is newly set |
| Timeline row fade-in | 280ms | A new event is added |
| Drag tilt and lift | instant | Dragging a card |
| Hover color/border transitions | 120ms | Buttons, cards |

- Easing: `cubic-bezier(0.2, 0.7, 0.2, 1)` (`ease-out-soft`).
- No page-load animations, no staggered entrances, no hover lift on cards, no parallax.
- `prefers-reduced-motion` is already handled in `index.css`. Do not override it.

---

## 11. Accessibility (required, not optional)

- Text contrast 4.5:1 minimum. Control edges and meaningful graphics 3:1. Check both themes.
- Visible focus on every interactive element. Do not use `outline-none` without a replacement.
- Use semantic HTML: `<button>`, `<a>`, `<nav>`, `<main>`, `<table>`, real `<label for>`.
- Every icon-only button has an `aria-label`.
- Dialogs trap focus and return it on close (use shadcn/Radix primitives).
- Dynamic updates (status moved, toast, timeline add) go through `aria-live="polite"`.
- Touch targets 44px minimum.
- Test every new component at 360px width, in light and dark, with keyboard only.

---

## 12. Copy and voice

- Plain verbs, active voice, sentence case, second person.
- A control keeps its name through the whole flow: "Archive" button, "Archived" toast.
- Errors never apologize and never say "Oops". They say what happened and what to do.
- Empty states invite an action. No filler, no exclamation marks, no emoji in UI copy.
- Name things the way the user does: "follow-up", "next action", "saved jobs". Never expose system terms ("entity", "record", "payload").

| Instead of | Write |
|---|---|
| Submit | Save application |
| Oops! Something went wrong. | Couldn't save your changes. Your edits are still here. Try again. |
| No data available | No applications yet. Add your first one to start tracking. |
| Invalid input | Enter a salary as a number, like 50000. |
| Status updated successfully! | Moved to HR interview. |

---

## 13. Responsive behavior

- Design mobile-first. The PRD requires dashboard and application detail to stay fully usable on small screens.
- Under 920px: multi-column layouts collapse to one column, sidebar is hidden in favor of the tab bar.
- Tables: hide secondary columns (platform, applied date) on mobile and keep company, status, next action.
- Wide content (tables, code, Kanban) scrolls inside its own container. The page itself never scrolls sideways.
- Use `env(safe-area-inset-*)` for anything pinned to the top or bottom of the screen.

---

## 14. Do not do this

- Do not color-code statuses with a rainbow of badges.
- Do not use the marker for emphasis, selection, or branding.
- Do not add drop shadows to cards, inputs, or buttons.
- Do not make every container the same radius.
- Do not add gradient washes, glassmorphism, or decorative blobs.
- Do not use ALL CAPS labels, spaced eyebrows, or numbered section markers unless the content is truly a sequence.
- Do not chain metadata with middle dots (`A · B · C`). Use spacing.
- Do not append arrows to links or buttons.
- Do not use monospace for small data labels.
- Do not use stock-photo hero sections, illustration packs, or emoji as UI icons.
- Do not make a new card for every piece of information. Prefer a hairline list or a bordered band.
- Do not introduce a new font, color, radius, or shadow value. Extend the tokens in `index.css` first, then use them.

---

## 15. Before you finish: checklist

For every UI change, confirm:

- [ ] Only token classes are used, with no hex values and no arbitrary colors.
- [ ] Works in light and dark.
- [ ] Status uses `ApplicationStatusBadge` / `StageRing`, with a visible text label.
- [ ] Marker appears only on due-today or overdue next actions, within budget.
- [ ] No shadows except level 2 floating layers.
- [ ] Radius follows the hierarchy.
- [ ] Sentence case; no ALL CAPS; no middle-dot metadata; no emoji in copy.
- [ ] Buttons name their outcome; one primary per view.
- [ ] Empty, loading, and error states exist and follow section 8.
- [ ] Keyboard reachable, focus visible, icon buttons labelled, 360px layout checked.
- [ ] Domain components are in their feature folder; only generic primitives are in `components/ui/`.
- [ ] Nothing animates on load; reduced motion respected.

If any item cannot be met, stop and explain why instead of shipping a workaround.
