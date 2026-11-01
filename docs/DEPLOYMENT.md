# Deployment & Operations

How elevateballers.com is hosted, deployed, monitored and backed up. Host
names, ports, usernames and secret values are deliberately left out of this
public repository; they live in GitHub Actions secrets and the server's `.env`.

## Overview

| Piece | What it does |
|---|---|
| **cPanel (CloudLinux + LiteSpeed/Passenger)** | Runs the Astro Node build (`@astrojs/node`, standalone). 1 core, 1 GB memory. |
| **Node 24** | Our own copy in `~/node24`; the host's Node selector stops at 20. |
| **MariaDB** | Production database on the same server, reached via `localhost`. |
| **Cloudflare** | DNS, TLS (Full strict), HTTP→HTTPS, caching, image resizing. |
| **Cloudflare R2** | Uploaded media (public bucket behind `cdn.elevateballers.com`) and database backups (separate private bucket). |
| **Sentry** | Errors, traces, logs, session replays, feedback, cron and uptime monitoring (free plan). |
| **GitHub Actions** | Deploys every push to `master`; pings the hourly notification job. |

## Deploying

Every push to `master` runs `.github/workflows/deploy-cpanel.yml`, so **`master` is production**.

1. Loads the server's `PUBLIC_*` variables (they are inlined at build time).
2. `npm ci`, `npm test`, then `npm run build:cpanel` with `DEPLOY_TARGET=cpanel`.
   With `SENTRY_AUTH_TOKEN` set, source maps are uploaded to Sentry for the
   commit's release and deleted from `dist`.
3. Uploads the release to `~/releases/<sha>` and points `~/current` at it.
4. Moves `~/node24` to the newest 24.x if one is out (SHA-256 checked, previous kept as `~/node24.prev`).
5. Restarts Passenger (`touch ~/prod/tmp/restart.txt`), smoke-tests the origin and rolls back on failure. The newest three releases are kept.

To roll back by hand, point `~/current` at an older release and touch `~/prod/tmp/restart.txt`.

## Server layout

```
~/prod/              Passenger app root: .env, .htaccess, tmp/restart.txt,
                     and symlinks into ~/current (dist, node_modules, src, …)
~/current            -> ~/releases/<sha>
~/public_html/.htaccess   points the main domain's Passenger app at ~/prod
                          and redirects plain HTTP to HTTPS
~/bin/               cron scripts (eb-job.sh, eb-backup.sh, eb-logrotate.sh)
~/backups/db/        nightly database dumps (newest 14)
~/logs/              cron logs
```

`~/prod/.env` holds every secret and never leaves the server. Do not run
`npm install` or builds on the server; the 1 GB memory limit kills them.
`/tmp` is mounted `noexec`, so anything that must execute goes under `$HOME`.

## Scheduled jobs

| When | What | Monitored by |
|---|---|---|
| Every 5 min | `eb-job.sh /api/jobs/sync-mailbox` (server crontab) | Sentry Crons `mailbox-sync` |
| Hourly | `/api/jobs/notification-maintenance` (GitHub Actions) | GitHub failure emails |
| 02:30 server time | `eb-backup.sh`: dump, verify, keep 14, copy to the private R2 bucket (keeps 30) | Sentry issue on failure |
| Sundays 03:15 | `eb-logrotate.sh`: rotate logs over 5 MB | — |

Both job endpoints require `Authorization: Bearer $CRON_SECRET`; the value
must match in the server's `.env` and the GitHub secret.

> **Crontab quirk:** this host's `crontab` drops the final newline, and cron
> then ignores the last job line. Always keep a comment as the last line.

## Restoring a backup

```bash
# On the server: pick a dump from ~/backups/db (or download one from the private R2 bucket)
zcat ~/backups/db/<file>.sql.gz | mysql --defaults-extra-file=<options file> <database>
```

Restore into a scratch database first and compare row counts before touching production.

## Monitoring

- **Errors / logs / traces / replays:** Sentry project `elevateballers`. Browser
  events go through the `/api/monitoring` tunnel so ad blockers don't drop them.
- **Uptime:** Sentry checks `/robots.txt` every minute.
- **App log on the server:** `~/prod/stderr.log` (rotated weekly).
- **Traffic:** Cloudflare Analytics. Resource use: cPanel → Metrics → Resource Usage.

## Caching and images

- A Cloudflare cache rule caches `/api/matches/*` **only** when the origin sends
  `Cache-Control`; signed-in responses are `private, no-store` and bypass it.
- With `PUBLIC_IMAGE_TRANSFORMS=cloudflare`, `optimizeImageUrl()` emits
  `/cdn-cgi/image/...` URLs. Allowed sources are configured in Cloudflare
  (Images → Transformations). The free plan covers 5,000 unique transformations a month.

## Vercel (legacy)

The Vercel adapter is still supported (`npm run build:vercel`, `DEPLOY_TARGET=vercel`)
but the site no longer runs there; `vercel.json` and `.vercelignore` remain for that path.
