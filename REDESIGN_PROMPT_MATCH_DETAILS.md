# AI Redesign Prompt — Admin Match Details Page

Paste the section below into your AI design tool (v0, Lovable, Figma AI, Claude, etc.). It's written as a self-contained brief so the model doesn't need to see the codebase.

---

## Role

You are a senior product designer redesigning the **admin "match details" page** of a youth basketball league management web app (ElevateBallers). This page is the scorekeeper's live command center during a game, and also serves as the post-game audit view. I want a cleaner, faster, less modal-heavy redesign.

## Context

- **Users:** league admins / scorekeepers, often on a laptop or tablet courtside, under time pressure, recording every play as it happens.
- **Match lifecycle:** `UPCOMING` → `LIVE` → `COMPLETED`. The same page serves all three states; controls gate on status.
- **Stack constraints (for layout feasibility, not visuals):** Astro + React 19 islands, Tailwind, Radix UI primitives, Zustand state, Web-Worker-driven game clock, ~10s server poll, optimistic updates, offline event buffering via IndexedDB.
- **Tone:** professional sports ops tool. Dense but legible. Think NBA scorer's table meets Linear.

## What the page must contain

### 1. Header
- Back button, match title, status badge (`LIVE` / `UPCOMING` / `COMPLETED`).
- Secondary actions: Edit Match, Download Stat Sheet (completed only).

### 2. Match summary
- Team 1 (logo, name, score) • center status • Team 2 (logo, name, score).
- Metadata: date, time, league, season. Winner/tie badge when completed.

### 3. Live Game Tracking Panel (only when `LIVE` or `UPCOMING`)
The core interactive surface. Currently split across many cards; redesign should feel like **one unified console**.

**Scoreboard block**
- Large dual-team score.
- Period/quarter indicator + prev/next quarter controls (only when clock paused).
- Per-team: team fouls with bonus indicator, timeouts remaining.
- Possession indicator — must be prominent and one-click to toggle.

**Clock block**
- Large MM:SS display, driven by a Web Worker (smooth, survives tab backgrounding).
- Play/Pause, Reset to period length, ±time nudges, set-exact-time, configure period duration.
- "Start Game" entry state when match is `UPCOMING`.
- Auto-pauses at 0.

**Event entry — "Quick Events"**
Fast grid of buttons for the scorer to hammer on:
`2PT Made / 2PT Miss / 3PT Made / 3PT Miss / FT Made / FT Miss / Foul / Turnover / OReb / DReb / Steal / Block / Assist`
Flow: pick team → pick player → tap event. Must be usable at speed; minimize dropdown depth. Consider keyboard shortcuts.

**Substitution**
Team → player out (on-floor list) → player in (bench list) → record. Should not require a modal.

**Timeout**
Team → timeout type → record. Period + clock auto-captured. Should not require a modal.

**Play-by-play log**
Chronological, color-coded by event category (green=made, orange=miss, red=foul/TO, blue=assist/steal/block). Per-event undo. Live updating.

**End Game** — destructive confirm action.

### 4. Rosters ("Match Players")
Two teams side-by-side. Per player: name, jersey, position, starter badge, **on-floor / out** live status (pulsing), minutes played, edit/remove. Bulk "Add Players" with starter toggles; inline "create new player" escape hatch.

### 5. Full event log + manual entry
- Full-form "Add Event" supporting 22 event types (includes fouls/technical/flagrant, injury, break, play resumed, etc.) with conditional fields (some need team, player, assist; some don't).
- Import events from external source.
- Edit/delete per event (gated to `LIVE`).

### 6. Timeline view
Chronological vertical timeline of all events with minute markers. **Currently duplicates the event log — please merge these into one view with a toggle (list ↔ timeline) instead of two separate cards.**

### 7. Media
Match photo gallery strip.

## Real-time behaviors to preserve

- Clock ticks locally via Web Worker; server state polled every 10s and paused when tab hidden.
- Optimistic UI on every mutation; offline buffer drains on reconnect.
- **Connection status must be visible at all times** (currently buried) — a persistent pill in the header is fine.

## Status gating rules

| Control | UPCOMING | LIVE | COMPLETED |
|---|---|---|---|
| Start Game | ✅ | — | — |
| Clock / quick events / subs / timeouts | — | ✅ | — |
| Add/edit/delete events | — | ✅ | ❌ |
| Edit match metadata | ✅ | ✅ | ❌ |
| Download stat sheet | — | — | ✅ |
| Import events | ✅ | ✅ | ❌ |

## Known pain points — please solve these

1. **Modal overload.** 5+ modals (add player, add event, edit player, edit event, import, end game, clock settings, reset confirm). Collapse into inline panels, side sheets, or a command palette wherever possible.
2. **Duplicate event views.** "Match Events" card and "Match Timeline" card show the same data twice. Unify.
3. **Cluttered rosters.** Overlapping badges (Starter / On Floor / Out / Position / Jersey) make rows noisy. Propose a cleaner badge system.
4. **Pagination friction.** Rosters paginate 10-per-team with separate controls per side — easy to miss. Prefer single scrollable lists or virtualization.
5. **Event entry form complexity.** 22 event types with conditional fields is confusing. Group types, show only relevant fields, and make the happy path (shot / foul / rebound) one-tap from the main console.
6. **Possession control is buried** inside the scoreboard card. Elevate it.
7. **No player stats at a glance.** Player rows show no live stats (points/fouls/rebounds). Add inline or on-hover.
8. **Offline indicator barely visible.** Make it obvious; scorekeepers need to trust the tool.
9. **No keyboard shortcuts.** Courtside scoring is a hotkey game — propose a shortcut scheme.
10. **Timer controls are split across the clock block and a settings dialog.** Keep common actions inline.

## Deliverables

1. A responsive desktop-first layout (1440px target, graceful to 1024px tablet).
2. Clear visual hierarchy distinguishing **live console** (above the fold, always reachable) from **audit data** (rosters, full log, media).
3. A component map — name every major block and describe its state transitions across UPCOMING / LIVE / COMPLETED.
4. Interaction specs for the three hot paths: (a) recording a made 2PT with assist, (b) running a substitution, (c) calling a timeout. Each should be ≤3 clicks and keyboard-operable.
5. A reduced modal inventory — show which current modals become inline/side-sheet, and justify any that remain.
6. A revised badge/status system for player rows.
7. Dark mode consideration (gym lighting varies).

## Out of scope

- Public-facing live match view.
- Authentication / RBAC flows.
- Report generation UI.

---

**End of prompt.** Use as-is or trim sections you don't need.
