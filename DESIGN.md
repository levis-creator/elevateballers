# ElevateBallers — Design Document

A full-stack web platform for running a youth basketball league: fixtures, live game tracking, player/team management, standings, news, media, and reporting.

## 1. Goals & Non-Goals

**Goals**
- Public-facing site for fixtures, standings, player/team profiles, news, media galleries.
- Admin dashboard for league operations (matches, rosters, CMS, users, RBAC, reports).
- Live in-game tracker with low-latency clock, play-by-play, substitutions, timeouts, and offline resilience.
- Dual deployment: Vercel (serverless) and cPanel (standalone Node) from a single codebase.

**Non-Goals**
- Native mobile apps (web is mobile-responsive but not packaged).
- Multi-tenant / white-label support — the app is scoped to one league org.
- Real-time WebSocket fan-out; live views rely on polling + optimistic client state.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5 (SSR) + React 19 islands |
| Language | TypeScript (Node 20+) |
| Styling | Tailwind 3 + Radix UI + CVA |
| ORM / DB | Prisma 7 → MySQL/MariaDB (cPanel) or Postgres (Vercel) |
| Auth | JWT (httpOnly cookie) + bcryptjs + email OTP 2FA + Turnstile |
| Jobs | Upstash QStash (async), inline fallback |
| Cache / Rate limit | Upstash Redis |
| Email | SMTP / Resend / Brevo (provider-agnostic) |
| Forms / validation | React Hook Form + Zod |
| Rich text | Quill 2 (sanitized) |
| Media | Sharp (compression), Dexie (offline buffer) |
| Testing | Vitest |

## 3. Deployment Topology

Adapter is selected by `DEPLOY_TARGET` in [astro.config.mjs](astro.config.mjs):

- **Vercel** — `@astrojs/vercel` serverless, Prisma bundled, Web Analytics enabled.
- **cPanel** — Astro Node standalone via [scripts/build-cpanel.js](scripts/build-cpanel.js); Prisma marked external for CJS interop.

Database adapter is likewise environment-driven in [src/lib/prisma.ts](src/lib/prisma.ts) — `@prisma/adapter-mariadb` for cPanel, Postgres driver for Vercel. This is the single most load-bearing portability seam: all other code talks only to the Prisma client.

## 4. Repository Layout

```
src/
  pages/          Astro SSR pages + /api endpoints (~115)
  features/       Domain modules (clean-arch: data / domain / presentation)
    cms/          Core queries + types (largest module)
    game-tracking/Live clock, events, subs, timeouts
    matches/      Match aggregation + list/detail UI
    standings/    Standings computation
    tournaments/  Brackets
    reports/      PDF/CSV generation
    rbac/         Permission sync + enforcement
    news/ media/ comments/ registration/ ...
  lib/            Cross-cutting: auth, prisma, qstash, redis,
                  rateLimit, apiError, turnstile, email, sanitize
  components/ui/  Shared Radix-based primitives
  store/          Zustand (global UI + useGameTrackingStore)
  hooks/          useOfflineSync and friends
  layouts/ styles/ types/
prisma/           schema.prisma (40+ models), seeds, migrations
public/workers/   timer.worker.js (game clock)
scripts/          build-cpanel, create-admin, db utilities
```

Feature modules follow a light clean-architecture split (`data/`, `domain/`, `presentation/`) so each domain has an isolated surface and can be tested independently.

## 5. Domain Model

Primary entities (see [prisma/schema.prisma](prisma/schema.prisma)):

- **League → Season → Match** — competition hierarchy; matches reference two `Team`s.
- **Team → Player** — roster; players have jersey, position, stats, team history.
- **Match → MatchPlayer** — per-game roster row; parent of `PlayerPlayingTime` segments.
- **Match → GameState** — live snapshot: period, scores, team fouls, timeouts, clock anchor (`clockStartedAt`, `clockSecondsAtStart`), possession.
- **Match → MatchEvent** — play-by-play: shots, fouls, assists, rebounds, turnovers; self-relation for assist → scorer linkage.
- **Match → Substitution / Timeout / JumpBall / MatchPeriod** — fine-grained events.
- **GameRules** — configurable period length, foul/timeout limits, 3-point rules; attached per match.
- **User → UserRole → Role → RolePermission → Permission** — RBAC.
- **NewsArticle, Comment, Media, Folder, Page, Sponsor, PlayerOfTheWeek** — CMS/marketing.
- **Staff, RegistrationNotification, ContactMessage, Subscriber** — ops inbox.
- **LoginEvent, UserAuditLog, EventHistory, TwoFactorOtp, PasswordResetToken** — auth & audit.
- **ReportTemplate, ReportGeneration, EmailReport** — report pipeline.

Cascading deletes keep referential integrity; audit tables are never cascaded. JSON `stats` / `metadata` columns give flexible per-entity extension without schema churn.

## 6. API Surface

~115 endpoints under [src/pages/api/](src/pages/api/), grouped by domain. All mutations go through [src/lib/apiError.ts](src/lib/apiError.ts) for uniform error shape and through middleware for auth + RBAC.

**Auth** — `login`, `verify-otp`, `forgot-password`, `reset-password`, `me`, `logout`.
**Games (live)** — `state` GET/PUT, `start`, `pause`, `end`, `play-by-play`, `jump-ball`, `substitution`, `timeout`.
**Matches** — CRUD, `players` (roster), `events` (full log).
**Players** — CRUD, `leaders`, `events`, `matches`, `playing-time`, `team-history`, bulk approve/delete.
**Teams** — CRUD + public registration endpoints.
**News / Comments / Media / Folders / Pages** — CMS.
**Admin** — `roles`, `permissions`, `users`, `standings`, `leagues`, `seasons`, `game-rules`, `contact-messages`, `audit-logs`, `settings`.
**Jobs** — `jobs/send-email`, `jobs/recalc-standings` (QStash targets).
**Integrations** — `integrations/maxpreps`.

## 7. Frontend

**Public pages (Astro SSR):** home, standings, fixtures, match detail, teams, players, news, league-registration, rules, about, contacts.

**Admin dashboard (`/admin/*`):** matches (incl. live tracker at `/admin/matches/view/{id}`), players, teams, news (Quill editor), media gallery w/ folders + batch ops, leagues, game-rules, reports, users, roles, staff, subscribers, messages, audit-logs, pages, settings, highlights.

**State** — Zustand only:
- [src/store/useStore.ts](src/store/useStore.ts) — global UI / auth / filters.
- `useGameTrackingStore` — live game state with optimistic mutations + conditional polling.

Server data is fetched directly (no React Query) because the only truly live surface is game tracking, which needs its own sync strategy anyway.

## 8. Live Game Tracking (Critical Path)

The trickiest part of the app. Four concerns interact: visual clock smoothness, server as ground truth, optimistic UX, and offline resilience.

**Clock**
- [public/workers/timer.worker.js](public/workers/timer.worker.js) runs a 200ms loop in a Web Worker.
- Uses a `Date.now()` anchor (`endTime = now + remainingSeconds*1000`) rather than tick counting — survives tab backgrounding.
- Server persists `clockStartedAt` + `clockSecondsAtStart`; client recomputes `remaining = clockSecondsAtStart - (Date.now() - clockStartedAt)/1000` on every fetch, so pauses, period changes, and admin corrections never drift.

**Mutations & polling**
- Button press → immediate Zustand update → POST → background reconcile.
- `useGameTrackingStore.fetchGameState()` polls every few seconds **but skips while `isUpdating=true`**, preventing stale GETs from clobbering in-flight PUTs.
- Play-by-play events go through the same optimistic path.

**Offline**
- Dexie (IndexedDB) buffers pending events when the network drops.
- `useOfflineSync` drains the queue on reconnect.
- A `ConnectionStatus` indicator surfaces state to the scorekeeper.

## 9. Background Jobs

[src/lib/qstash.ts](src/lib/qstash.ts) exposes `publishToJob()` which posts to `/api/jobs/*`. If QStash creds are missing or publishing fails, callers fall back to inline execution — jobs always run, at worst synchronously. Used for:

- Transactional email (OTP, password reset, approvals, registration notifications).
- Standings recalculation after match completion.
- Report generation (PDF/CSV → email delivery).

## 10. Auth & Authorization

**Login flow**
1. Email + password + Turnstile token.
2. Rate limit check (Redis, per-IP, per-email).
3. bcryptjs verify → generate OTP → send via QStash email job.
4. OTP submit → JWT signed with `JWT_SECRET`, includes `tokenVersion`.
5. Token set as httpOnly + SameSite cookie.

`tokenVersion` on `User` lets logout/password-change invalidate all existing sessions instantly.

**RBAC**
- Role → RolePermission → Permission (resource:action pairs).
- [src/lib/syncPermissions.ts](src/lib/syncPermissions.ts) runs once per process from middleware to reconcile DB permissions with code-declared ones — guards against drift after deploys.
- Middleware resolves `user.roles → permissions` before handler execution.

**Hardening**
- CSP, HSTS, `X-Frame-Options: DENY`, strict Referrer-Policy, Permissions-Policy in middleware.
- `LoginEvent`, `UserAuditLog`, `EventHistory` for audit + undo.
- Masked error messages on auth endpoints to avoid user enumeration.

## 11. Cross-Cutting Concerns

- **Rate limiting** — Redis-backed sliding window in [src/lib/rateLimit.ts](src/lib/rateLimit.ts).
- **Input sanitization** — [src/lib/sanitize.ts](src/lib/sanitize.ts) for Quill output.
- **Feature flags** — [src/lib/feature-flags.ts](src/lib/feature-flags.ts).
- **Media pipeline** — Sharp compression on upload, `FileUsage` tracking to prevent orphan deletions, folder-scoped permissions.
- **Email providers** — Single interface, provider chosen by env.
- **Testing** — Vitest unit tests per feature + env validation tests.

## 12. Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Astro SSR + React islands (not Next) | Fast public pages with hydration only where needed; works on cPanel without Edge runtime. |
| Prisma adapter swap per target | One codebase ships to both Vercel and cPanel — the business constraint driving most of `astro.config.mjs` and `prisma.ts`. |
| Web Worker clock + `Date.now()` anchor | Display smoothness independent of main thread; backgrounded tabs don't drift. |
| Conditional polling (`isUpdating` flag) | Prevents the race where a reconcile GET overwrites an in-flight mutation. |
| QStash with inline fallback | Async in prod, deterministic in dev / when creds absent — no silent job loss. |
| Permission auto-sync at boot | Code is the source of truth for permissions; DB is kept in lockstep without manual migration steps. |
| Feature-module clean-arch split | Each domain is independently testable and lets multiple contributors work without stepping on shared folders. |
| Soft/audit tables never cascade | Audit history survives user/match deletion, supports compliance and undo. |

## 13. Known Gotchas

- cPanel build requires Prisma external + CJS interop; Vercel build bundles it — don't collapse the two configs.
- Sharp compression is memory-heavy on bulk uploads; batch endpoints process sequentially.
- Offline sync buffers *events*, not full game state — reconnect still needs a state fetch to resolve server-side edits.
- Clock reconciliation math assumes server and client clocks are within a few seconds; large skew causes visible jumps on fetch.
- Polling cadence on the live tracker is a tradeoff — too fast fights optimistic updates, too slow loses admin corrections.

## 14. Future Considerations

- WebSocket/SSE fan-out for public live match views (currently poll).
- Full-text search over news/players (currently LIKE-based).
- Hardened multi-device scorekeeping (CRDT or server-authoritative event log with sequence numbers).
- Extracted design system package if a second frontend surface appears.
