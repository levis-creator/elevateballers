# Redesign Prompt — Court Console (live match scoring)

Paste everything below the line into Claude. Attach a screenshot of the current console **as a reference for what already works**, not as the thing to reinvent. The prompt is written so the image is supporting evidence, not the whole brief.

---

## Role

You are redesigning the **visual layer** of a live basketball scoring console that is already fast and well-liked by its users. This is a **reskin and refinement, not a re-architecture.** The interaction model is proven under real courtside pressure. If your redesign makes any recorded action take more taps than it does today, the redesign has failed regardless of how good it looks.

Treat every instruction below as a hard constraint. Where the brief and your design instincts conflict, the brief wins.

## Who uses it

League scorekeepers, courtside, on a laptop or tablet, in a loud gym with variable lighting, recording plays as they happen with no time to look twice. They already know the tool. They are not new users and do not need onboarding, tooltips, or explanatory copy.

## The interaction model — FROZEN, do not change

This is why the console works. Preserve it exactly.

1. **Arm-then-act.** The scorekeeper taps a player's jersey tile to "arm" that player. The armed player stays armed. Every stat button then applies to the armed player. This is a two-tap flow for every event: `arm → action`. It stays two taps. Do not introduce a player picker, a dropdown, a modal, or a confirm step between action and save.
2. **Ten jersey tiles, always visible.** Five on-floor players per team, side by side, on one screen, no scrolling, no pagination. The armed tile has an unmistakable active state.
3. **A flat grid of stat buttons, always visible.** Roughly 13 primary actions (2PM, 3PM, FTM, 2PA, 3PA, FTA, PF, Ast, OReb, DReb, Stl, Blk, TO) plus a "More" reveal for rare events (technical, unsportsmanlike, ejection, bench/coach technical). No nesting, no tabs, no category drill-down for the primary 13.
4. **Compound follow-up prompts.** After a made shot, the action grid is *replaced in place* by an "Assist by?" row of that team's other on-floor players (plus "No assist"). After a missed shot, it's replaced by a "Rebound by?" row of all ten players. The prompt auto-dismisses after 5 seconds. It appears in the same slot the action grid occupies — it must not be a modal, a popover, or anything that shifts layout underneath it.
5. **A possession toggle at the top.** One click per team, always reachable, immediately obvious which team has the ball.
6. **Keyboard shortcuts, unchanged.** `Q W E R T` arm team-1 jerseys 1–5, `Y U I O P` arm team-2 jerseys 1–5, `2`/`3` made shots (shift = miss), `M` free throw, `F` foul, `A` assist, `D`/`O` rebounds, `S` steal, `B` block, `G` turnover, `Space` toggles clock. If your layout reorders jersey tiles, the key mapping must still read left-to-right in visual order.
7. **Connection status, permanently visible.** Events queue offline and sync on reconnect. The scorekeeper must be able to trust the tool at a glance — online/offline plus pending-event count, never hidden.
8. **Optimistic feedback.** Score updates instantly on tap. A transient confirmation ("Recorded", "Assist recorded", "Saved offline") appears and fades. Errors appear in the same slot in a distinct color.

## What you MAY change — this is the actual job

- Typography, color, spacing, density, contrast, elevation, borders, radii.
- The visual treatment of jersey tiles: how the armed state reads, how the possession team reads, how team identity (home vs away) is distinguished.
- The visual grouping and rhythm of the stat-button grid — shots vs. defensive stats vs. fouls should be readable at a glance without adding clicks.
- Motion: press feedback, the transition into and out of the assist/rebound prompt, the score tick.
- How the scoreboard, clock, and console relate on screen. Today they're three stacked blocks; if a tighter composition serves the scorekeeper better, propose it.
- Legibility under gym conditions — this is a real problem worth solving, not a nicety.

## Design system it must fit

- **Stack:** React 19 islands inside Astro, Tailwind, Radix primitives. Output Tailwind classes, not raw CSS, and not a component library the project doesn't have.
- **Theme:** dark by default. Deep indigo/slate ground, white-alpha surfaces (`bg-white/[0.04]`-ish), white-alpha borders.
- **Accent:** brand gold (`#FFBA00`) — used today for possession, made shots, and the armed/active state. Keep gold as the "this is the live, important thing" signal.
- **Team colors:** sky for the home side, rose for the away side.
- **Type:** a condensed uppercase heading face with wide letter-spacing for labels and stat buttons; system sans for body.
- Existing shared components you should reuse rather than reinvent: `ArenaPanel`, `ArenaChip`, `CourtTile`, `ConnectionStatus`.

## Constraints on your output

- **Do not add features.** No player stat popovers, no shot charts, no undo history panel, no command palette, no settings drawer. If you think of one, list it at the end under "Ideas I did not build" and move on.
- **Do not add modals or dialogs** anywhere in the console.
- **Do not add copy.** No helper text, no empty-state paragraphs, no tooltips beyond what exists.
- Target 1440px desktop, degrade cleanly to a 1024px tablet in landscape. Touch targets stay thumb-sized.
- Every interactive element must have a visible disabled state — the console is inert when the match isn't LIVE.

## Deliverable

One self-contained React component for the console surface, styled with Tailwind, with realistic placeholder data (two teams, five players each, a live score, a running clock). Static state is fine — I will wire it to the real store. Show it in three states so I can judge the transitions:

1. Idle live game, one player armed.
2. The "Assist by?" prompt open, immediately after a made 2PT.
3. Offline with 3 events queued.

Then, briefly: what you changed visually and why, in plain sentences. No rationale essays.

## The one-sentence test

A scorekeeper who used the old console yesterday should be able to use yours today without being told anything — and should notice only that it's easier to read.

---

**End of prompt.**
