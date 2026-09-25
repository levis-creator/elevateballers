import { waitUntil } from '@vercel/functions';
import { getUserIdFromRequest, writeAuditLog } from '../../domain/usecases/auth';

/**
 * Keeps the serverless function alive until the write lands. Without this,
 * Vercel can suspend the function once the response is sent and silently drop
 * the row. Outside Vercel it is a no-op and the write simply runs.
 */
function keepAlive(write: Promise<void>): void {
  try {
    waitUntil(write);
  } catch {
    // Not in a request context (tests, scripts): the write still runs.
  }
}

// High-frequency mutation actions that are skipped to reduce DB write load.
// Business-critical actions (user role changes, deletions, auth events) still log.
const SKIP_AUDIT_ACTIONS = new Set([
  'MATCH_EVENT_CREATED',
  'MATCH_EVENT_UPDATED',
  'GAME_CLOCK_TOGGLED',
  'GAME_STATE_UPDATED',
  'GAME_TIMEOUT_RECORDED',
  'GAME_SUBSTITUTION_RECORDED',
  'GAME_JUMP_BALL_RECORDED',
  'MATCH_PLAYER_UPDATED',
  'MATCH_PLAYER_ADDED',
]);

/**
 * Fire-and-forget audit logging. Returns immediately — the caller never waits
 * for the DB write, but the platform does. Errors are logged but never thrown.
 */
export function logAudit(
  request: Request,
  action: string,
  metadata?: Record<string, unknown>,
  targetUserId?: string,
  source: 'explicit' | 'middleware' | 'legacy' = 'explicit'
): void {
  if (SKIP_AUDIT_ACTIONS.has(action)) return;

  const actorId = getUserIdFromRequest(request) ?? 'anonymous';
  const userId = targetUserId ?? actorId;
  const nextMetadata = { ...(metadata ?? {}), source };

  // Fire and forget — do NOT await
  keepAlive(
    writeAuditLog(userId, action, actorId, nextMetadata).catch((err: unknown) => {
      console.error('[audit] Failed to write audit log:', { action, userId, actorId, err });
    })
  );
}

/**
 * System audit logging (also fire-and-forget).
 */
export function logAuditSystem(
  action: string,
  metadata?: Record<string, unknown>,
  targetUserId: string = 'system'
): void {
  const nextMetadata = { ...(metadata ?? {}), source: 'system' };
  keepAlive(
    writeAuditLog(targetUserId, action, 'system', nextMetadata).catch((err: unknown) => {
      console.error('[audit] Failed to write system audit log:', { action, targetUserId, err });
    })
  );
}
