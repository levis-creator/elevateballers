# Scaling and Registration Implementation TODO

This plan keeps the current Astro full-stack app and hardens it for more users before considering a separate backend. Work through the phases in order.

## Phase 1: Stabilize Public Registration

- [ ] Add IP-based rate limiting to `src/pages/api/registration/team.ts`.
- [ ] Add IP-based rate limiting to `src/pages/api/registration/player.ts`.
- [ ] Add email-based rate limiting for repeated submissions from the same contact email.
- [ ] Add a honeypot field to the public registration forms.
- [ ] Normalize emails, phone numbers, team names, and player names before validation.
- [ ] Add strict max lengths for all public registration fields.
- [ ] Return generic public errors for duplicate/suspicious submissions while logging details internally.
- [ ] Add tests for open/closed registration windows, rate limits, and invalid payloads.

## Phase 2: Move Slow Work Out of Requests

- [ ] Update registration endpoints to use `publishToJob('/api/jobs/send-email', ...)`.
- [ ] Keep inline email sending only as a fallback when QStash is unavailable.
- [ ] Add QStash job types for:
  - [ ] `team_registration_auto_reply`
  - [ ] `player_registration_auto_reply`
  - [ ] `team_registration_admin_notification`
  - [ ] `player_registration_admin_notification`
- [ ] Ensure queued email jobs are idempotent or safe to retry.
- [ ] Log failed email jobs without failing the registration submission.

## Phase 3: Make Registration Writes Reliable

- [ ] Wrap team registration writes in a Prisma transaction.
- [ ] Wrap player registration writes in a Prisma transaction.
- [ ] Ensure registration notification creation and audit logging cannot leave half-created records.
- [ ] Add an idempotency key to public form submissions.
- [ ] Store submitted idempotency keys with a short expiry or durable submission record.
- [ ] Prevent duplicate team submissions caused by refresh, double-click, or network retry.
- [ ] Prevent duplicate player submissions caused by refresh, double-click, or network retry.

## Phase 4: Add Returning Team Season Renewal

- [ ] Add a public choice between `New team` and `Returning team`.
- [ ] Add a verified ownership flow for returning teams:
  - [ ] coach/staff login, or
  - [ ] email verification link, or
  - [ ] admin-issued invite link.
- [ ] Do not allow claiming a team by team name alone.
- [ ] Add a `SeasonRegistration` model or equivalent submission table.
- [ ] Store renewal submissions as pending applications before mutating season participation.
- [ ] Pre-fill existing team and coach information for returning teams.
- [ ] Let coaches review previous roster and propose additions/removals.
- [ ] On approval, create or confirm the `SeasonTeam` record.
- [ ] Keep historical teams, seasons, and rosters unchanged.

## Phase 5: Season-Specific Rosters

- [ ] Add a season roster model if one does not already exist.
- [ ] Model roster membership by `leagueSeasonId`, `teamId`, and `playerId`.
- [c ] Add a unique constraint for one player per team per league season.
- [ ] Avoid relying only on `Player.teamId` for season history.
- [ ] Support roster statuses such as `PENDING`, `APPROVED`, `REJECTED`, and `WITHDRAWN`.
- [ ] Add admin approval actions for roster changes.
- [ ] Add player transfer/history handling across seasons.

## Phase 6: Admin Scaling

- [ ] Add a registration review queue.
- [ ] Filter registrations by league, season, status, type, team, and submitted date.
- [ ] Add pagination to all large admin lists.
- [ ] Add bulk approve/reject actions for teams and players where safe.
- [ ] Add `Needs changes` status with admin notes.
- [ ] Add duplicate detection for:
  - [ ] team name
  - [ ] coach email
  - [ ] player email
  - [ ] player name plus date/team context
- [ ] Add CSV export for registrations, teams, players, and rosters.
- [ ] Add clear audit events for approval, rejection, roster edits, and ownership changes.

## Phase 7: Database and Query Hardening

- [ ] Confirm indexes for public registration lookup fields:
  - [ ] `Team.name`
  - [ ] `Team.slug`
  - [ ] `Player.email`
  - [ ] `Player.teamId`
  - [ ] `SeasonTeam.leagueSeasonId`
  - [ ] `SeasonTeam.teamId`
  - [ ] registration status fields once added.
- [ ] Check all admin `findMany` calls for `take`, `skip`, or cursor pagination.
- [ ] Avoid loading entire tables into memory for dashboards, exports, and selectors.
- [ ] Add query logging or slow-query monitoring in production.
- [ ] Review database connection limits for the actual hosting target.
- [ ] Consider Prisma/Data Proxy or managed pooling if serverless concurrency grows.

## Phase 8: Security and Abuse Protection

- [ ] Keep Turnstile on all public forms.
- [ ] Add rate limits to login, forgot password, registration, contact, and upload endpoints.
- [ ] Add file upload size/type limits where missing.
- [ ] Ensure registration endpoints do not expose private player/coach data in responses.
- [ ] Ensure public endpoints do not reveal whether a private email belongs to an existing user.
- [ ] Add structured logs for suspicious registration behavior.
- [ ] Review RBAC permissions for season/team/registration management.

## Phase 9: Load Testing and Observability

- [ ] Create a load-test script for player registration.
- [ ] Create a load-test script for team registration.
- [ ] Test with 50, 100, and 300 near-concurrent submissions.
- [ ] Record response times, error rates, and database connection usage.
- [ ] Monitor queue delivery times for QStash email jobs.
- [ ] Add uptime monitoring against `/api/health`.
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

## Suggested Implementation Order

1. Rate-limit registration endpoints.
2. Queue registration emails through QStash.
3. Add transactions and idempotency.
4. Add returning-team `SeasonRegistration`.
5. Add season-specific roster records.
6. Improve admin review and bulk actions.
7. Load test and tune database/query bottlenecks.

