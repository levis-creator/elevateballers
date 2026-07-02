# Product

## Register

brand

> Dual-surface project. The **default** register is `brand` (the public fan-facing
> site, where design *is* the product). The admin dashboard (`/admin/*`) is a
> `product` surface, where design *serves* the workflow. Override per task: state
> which surface a task targets, and treat the admin scorekeeper/CMS work as
> `product` register.

## Users

**Public site (brand).** Fans, parents, players, and the wider community around a
youth basketball league. They arrive on mobile as often as desktop, usually
mid-season, to check a fixture, a score, standings, a team roster, or the latest
news/media. Context is casual and quick: they want the answer fast and want to feel
part of something. Secondary: prospective teams/players using the registration flow.

**Admin dashboard (product).** League admins, CMS editors, and courtside
scorekeepers. The scorekeeper is the sharpest case: on a laptop or tablet at the
scorer's table, under time pressure, recording every play as it happens, in variable
gym lighting. Editors manage news, media, rosters, seasons, and reports. Their job
is operational accuracy and speed, not browsing.

## Product Purpose

ElevateBallers is a full-stack platform for running a youth basketball league end to
end. It exists so one league organization can publish everything fans need (fixtures,
standings, live scores, team/player profiles, news, media) and run everything staff
need (live game tracking, CMS, RBAC, registration, reporting) from a single codebase.

Success looks like:
- A fan finds the score, fixture, or standing they came for in one glance, on any
  device, and leaves wanting to come back.
- A scorekeeper records a full game accurately without fighting the tool, even
  offline or under time pressure.
- The league looks credibly run: organized, current, alive during gameday.

## Brand Personality

**Youthful, community-minded, energetic** — in that order.

- Voice: warm, direct, encouraging. It celebrates young players' growth, not just
  final scores. Speaks to a community, not a customer base.
- Tone: gameday energy without shouting. Confident and current, never corporate.
- Emotional goals: belonging and pride for the community; on the live/gameday
  surfaces, a jolt of competitive energy.
- The existing brand carries this through condensed sports display type (Teko) over a
  humanist body (Rubik) and a committed red/gold/teal palette on dark surfaces —
  energy is carried by type, color, and imagery, not by decoration.

## Anti-references

Explicitly should NOT look like any of these:

- **Generic SaaS / dashboard template.** No cream/near-white default backgrounds, no
  tiny uppercase tracked eyebrows on every section, no identical icon-card grids, no
  gradient text. The AI-slop look is a failure state here.
- **Cluttered legacy sports portal.** No ad-stuffed density, table soup, or clashing
  widgets (the old local-league / dated-ESPN feel). Data should be dense where it
  earns it (standings, box scores) but never noisy.
- **Corporate / enterprise stiff.** No navy-and-gray soulless palette. This is a
  basketball league, not a bank; it must feel alive.
- **Overdesigned gamer-neon.** No excessive glow, heavy decorative glassmorphism, or
  esports-neon aesthetic that fights legibility. Energy, not spectacle.

## Design Principles

1. **Answer first.** On public pages, the thing the fan came for (score, fixture,
   standing) is reachable at a glance before any storytelling. Content over chrome.
2. **Energy is earned, not sprinkled.** Loudness (large display type, saturated
   color, motion) is reserved for gameday and hero moments. Everyday surfaces stay
   calm and legible so the loud moments land.
3. **Celebrate the players.** The community's people (young athletes, teams) are the
   emotional center. Faces, names, and stories get real visual weight.
4. **The console must be trustworthy.** On the admin/scorekeeper surface, speed,
   legibility, and always-visible system state (connection, live/offline) beat
   visual polish. A scorekeeper has to trust the tool under pressure.
5. **One brand, two jobs.** Public and admin share the palette and type system so it
   reads as one product, but they optimize for different things: engagement vs.
   operational accuracy. Don't force fan energy onto a data table, or bury a fan's
   answer under it.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA**: body text ≥4.5:1 contrast, large text ≥3:1, visible focus
  states, full keyboard navigation.
- Respect `prefers-reduced-motion` on every animation with a non-motion alternative.
- Don't rely on color alone to convey meaning (e.g. play-by-play event categories,
  win/loss, live status) — pair with text, icon, or shape.
- Extra care on the scorekeeper console given the courtside context: large tap
  targets and high-contrast controls usable in variable gym lighting on a tablet.
