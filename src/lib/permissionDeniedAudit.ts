import { logAudit } from '../features/cms/lib/audit';
import { getUserIdFromRequest } from '../features/cms/lib/auth';

/** A repeat of the same denial inside this window is counted, not logged. */
export const DENIAL_WINDOW_MS = 10 * 60_000;
const MAX_TRACKED = 5_000;

type Seen = { at: number; repeats: number };
const seen = new Map<string, Seen>();

/**
 * Records a signed-in user being refused by a permission or team-scope check.
 *
 * Signed-out requests (401s) are not recorded — bots and expired sessions make
 * those noise. A screen that retries a forbidden call would otherwise write a
 * row per attempt, so each user/endpoint/reason is logged once per window and
 * the next row carries how many repeats were skipped. The window is per server
 * process, which is enough to stop floods without shared state.
 */
export function auditPermissionDenied(request: Request, reason: string, context: string, ip: string | null) {
  // Auditing must never change the 403 the caller is about to return.
  try {
    record(request, reason, context, ip);
  } catch (error) {
    console.error('[audit] Failed to record permission denial:', error);
  }
}

function record(request: Request, reason: string, context: string, ip: string | null) {
  const actorId = getUserIdFromRequest(request);
  if (!actorId) return;

  const url = new URL(request.url);
  const key = `${actorId}|${request.method}|${url.pathname}|${reason}`;
  const now = Date.now();
  const previous = seen.get(key);
  if (previous && now - previous.at < DENIAL_WINDOW_MS) {
    previous.repeats += 1;
    return;
  }

  if (seen.size >= MAX_TRACKED) {
    for (const [k, v] of seen) if (now - v.at >= DENIAL_WINDOW_MS) seen.delete(k);
    if (seen.size >= MAX_TRACKED) seen.clear();
  }
  seen.set(key, { at: now, repeats: 0 });

  logAudit(request, 'AUTH_PERMISSION_DENIED', {
    method: request.method,
    path: url.pathname,
    context,
    reason: reason.replace(/^Forbidden:\s*/, ''),
    ...(ip ? { ip } : {}),
    ...(previous?.repeats ? { repeatsSinceLastLog: previous.repeats } : {}),
  });
}

/** Test hook: forget every tracked denial. */
export function resetPermissionDeniedAudit() {
  seen.clear();
}
