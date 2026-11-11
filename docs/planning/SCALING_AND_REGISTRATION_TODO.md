# Scaling and Registration Implementation TODO

This plan keeps the current Astro full-stack app and hardens it for more users before considering a separate backend. Work through the phases in order.

Last checked against the code on 2026-11-11 (updated after the duplicate, phone and health-check changes). Production now runs as a single Node process on cPanel (see `docs/DEPLOYMENT.md`), not serverless, so items about serverless pooling and QStash no longer apply as written.

## Phase 1: Stabilize Public Registration

- [x] Add IP-based rate limiting to `src/pages/api/registration/team.ts`.
- [x] Add IP-based rate limiting to `src/pages/api/registration/player.ts`.
- [x] Add email-based rate limiting for repeated submissions from the same contact email.
- [x] Add a honeypot field to the public registration forms.
- [x] Normalize emails, phone numbers, team names, and player names before validation.
- [x] Add strict max lengths for all public registration fields.
- [x] Return generic public errors for duplicate/suspicious submissions while logging details internally.
- [x] Add tests for open/closed registration windows, rate limits, and invalid payloads.

## Phase 2: Move Slow Work Out of Requests

QStash was replaced by a database outbox: registration writes `PublicRegistrationEmailJob` rows in the same transaction, and the endpoint sends them after responding (`processRegistrationEmailJob`).

- [x] Queue registration emails instead of sending them inline (database outbox, not QStash).
- [x] Job types for team/player auto-replies and admin notifications.
- [x] Ensure queued email jobs are idempotent or safe to retry (claim lock, `SENT`/`EXHAUSTED` states).
- [x] Log failed email jobs without failing the registration submission.
- [x] Retry failed email jobs. `/api/jobs/notification-maintenance` (pinged hourly) resends `FAILED` jobs, `PENDING` jobs older than 10 minutes and expired `PROCESSING` locks, until the email delivery retry limit marks them `EXHAUSTED`.

## Phase 3: Make Registration Writes Reliable

- [x] Wrap team registration writes in a Prisma transaction.
- [x] Wrap player registration writes in a Prisma transaction.
- [x] Ensure registration notification creation and audit logging cannot leave half-created records.
- [x] Add an idempotency key to public form submissions.
- [x] Store submitted idempotency keys with a short expiry or durable submission record (`PublicRegistrationSubmission`).
- [x] Prevent duplicate team submissions caused by refresh, double-click, or network retry.
- [x] Prevent duplicate player submissions caused by refresh, double-click, or network retry.

## Phase 4: Add Returning Team Season Renewal

- [x] Add a public choice between `New team` and `Returning team` (`SeasonRegistrationType`).
- [x] Add a verified ownership flow for returning teams (email verification via `TeamOwnershipClaim`, plus `TeamOwnership` and the team portal).
- [x] Do not allow claiming a team by team name alone.
- [x] Add a `SeasonRegistration` model or equivalent submission table (`SeasonRegistrationApplication`).
- [x] Store renewal submissions as pending applications before mutating season participation.
- [x] Pre-fill existing team and coach information for returning teams.
- [x] Let coaches review previous roster and propose additions/removals (`SeasonRegistrationRosterChange`).
- [x] On approval, create or confirm the `SeasonTeam` record.
- [x] Keep historical teams, seasons, and rosters unchanged.

## Phase 5: Season-Specific Rosters

- [x] Add a season roster model (`SeasonTeamPlayer`).
- [x] Model roster membership by `leagueSeasonId`, `teamId`, and `playerId`.
- [x] Add a unique constraint for one player per team per league season.
- [x] Avoid relying only on `Player.teamId` for season history (`SeasonRosterHistory`).
- [x] Support roster statuses such as `PENDING`, `APPROVED`, `REJECTED`, and `WITHDRAWN`.
- [x] Add admin approval actions for roster changes.
- [x] Add player transfer/history handling across seasons (`SeasonPlayerTransfer`).

## Phase 6: Admin Scaling

- [x] Add a registration review queue (`/api/registration/review-queue`).
- [x] Filter registrations by league, season, team, and submitted date (`leagueId`, `seasonId`, `teamId`, `from`, `to` on the review queue and its export).
- [ ] Add pagination to all large admin lists. **Deferred on 2026-11-11; not needed yet.** Production sizes: players 455, staff 36, teams 26, users 10; comments load per article (max 4). Only players is large, and its full list is ~45 KB gzipped (239 KB raw) and returns in ~0.6 s. Server paging would mean moving the page's filters, season scope, sorting and CSV export server-side. Revisit at about 2,000 players or if `/api/players` takes over 2 s.
- [x] Add bulk approve/reject actions for teams and players (`bulk-approve` with `approved: false` rejects).
- [x] Add `Needs changes` status with admin notes (`reviewStatus = NEEDS_CHANGES` plus `reviewNotes` on players and teams; the applicant is emailed the note).
- [x] Add duplicate detection for:
  - [x] team name (unique constraint plus an admin notification on a repeat submission)
  - [x] coach email (not a duplicate: one coach may run several teams. A repeat coach email reuses the same coach record, and the queue shows "Same coach: …")
  - [x] players. Email and name alone are **not** duplicates: minors often register with their coach's email or phone, and names repeat across teams (on 2026-11-11 production had 13 players sharing 5 emails and 5 same-name pairs). Registrations are never rejected on either. The review queue groups records by full name and marks a group a *likely* duplicate only when they also share a phone, email, date of birth or team; name-only groups are listed separately. Player rows show who else uses the same contact, as context. Logic: `src/features/registration/domain/player-duplicates.ts`.
- [x] Store phones in international form (`+254712345678`). The registration form has a country code picker (Kenya default); numbers sent without a code are read as Kenyan (`src/lib/phone.ts`). Older stored numbers are still as typed; matching normalises them.
- [x] Add CSV export for registrations, teams, players, and rosters. Registrations export has no row cap; teams (`/api/teams/export`) and rosters (`/api/season-rosters/export`) export from the Teams page; players, staff and subscribers export in the browser.
- [x] Add clear audit events for approval, rejection, roster edits, and ownership changes.

## Phase 7: Database and Query Hardening

- [ ] Confirm indexes for public registration lookup fields:
  - [x] `Team.name`
  - [x] `Team.slug`
  - [ ] `Player.email` (no index)
  - [x] `Player.teamId`
  - [x] `SeasonTeam.leagueSeasonId`
  - [x] `SeasonTeam.teamId`
  - [x] registration status fields once added.
- [ ] Check all admin `findMany` calls for `take`, `skip`, or cursor pagination (about 295 calls; not audited).
- [ ] Avoid loading entire tables into memory for dashboards, exports, and selectors.
- [ ] Add query logging or slow-query monitoring in production. Sentry samples 10% of traces but has no Prisma integration or slow-query alert.
- [ ] Review database connection limits for cPanel (1 core, 1 GB, 20 entry processes).
- [x] ~~Consider Prisma/Data Proxy or managed pooling if serverless concurrency grows.~~ Not needed: production is one long-running process.

## Phase 8: Security and Abuse Protection

- [x] Keep Turnstile on all public forms.
- [x] Add rate limits to login, forgot password, registration, contact, and upload endpoints. Player sign-up allows 40 per connection per hour and 40 per email per day so a coach can register a squad; teams stay at 5 and 3.
- [x] Add file upload size/type limits where missing.
- [x] Make per-IP rate limits unspoofable (2026-11-11). Five endpoints read the client IP from the first `X-Forwarded-For` entry, `X-Real-IP` or `CF-Connecting-IP`, all of which anyone can send by calling the origin server (102.218.215.35) directly, so a script could get a fresh limit per request. Apache already resolves the real visitor IP from Cloudflare (its access log shows no Cloudflare addresses), so `src/lib/getClientIp.ts` now uses only the last `X-Forwarded-For` entry, which our own stack appends.
- [x] Ensure registration endpoints do not expose private player/coach data in responses.
- [ ] Ensure public endpoints do not reveal whether a private email belongs to an existing user (not verified).
- [ ] Add structured logs for suspicious registration behavior. Duplicate team submissions raise an admin notification; nothing else is logged in a structured way.
- [ ] Review RBAC permissions for season/team/registration management.

## Phase 9: Load Testing and Observability

- [ ] Create a load-test script for player registration.
- [ ] Create a load-test script for team registration.
- [ ] Test with 50, 100, and 300 near-concurrent submissions.
- [ ] Record response times, error rates, and database connection usage.
- [ ] Monitor delivery times for registration email jobs.
- [ ] Add uptime monitoring against `/api/health`. The endpoint is ready (503 when the database fails or takes over 5 s, never cached); the Sentry uptime monitor still checks `/robots.txt` and must be repointed in Sentry.
- [ ] Add alerts for:
  - [ ] database unreachable
  - [ ] registration error spikes
  - [ ] email job failures
  - [ ] high API latency

## Phase 10: Decide Whether to Split Backend Later

Do not split the frontend and backend yet. Revisit that decision only if one or more of these become true:

- [ ] A mobile app or third-party client needs a stable public API.
- [ ] Background jobs become too large for the Astro app.
- [ ] API code becomes difficult to maintain inside Astro routes.
- [ ] Frontend and backend need separate deployment cycles.
- [ ] Database connection limits remain a problem after pooling and queueing.
- [ ] The team needs separate backend/frontend ownership.

## Suggested Next Steps

1. Repoint the Sentry uptime monitor from `/robots.txt` to `/api/health`.
2. Load test registration against a test copy (`scripts/load-test-registration.ts`), never production.
3. Add an index on `Player.email`.
4. Optionally convert stored phone numbers to international form, and require date of birth for players.
5. Server-side pagination for the players admin list once it nears 2,000 players.
