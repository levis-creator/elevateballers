import { ZodError } from 'zod';
import { auditPermissionDenied } from './permissionDeniedAudit';

/**
 * Shared API error handling utilities.
 *
 * Centralises HTTP status mapping so route catch blocks stay small and consistent.
 * Handles:
 *   - Auth/permission errors thrown by requirePermission()
 *   - Zod validation errors (parseBody) → 400 Bad Request with field-level issues
 *   - Prisma P2002 (unique constraint) → 409 Conflict
 *   - Prisma P2025 (record not found) → 404 Not Found
 *   - LeagueSeasonScopeError → 400 Bad Request
 *   - Generic errors → 500 (detail only in development)
 */

/** Thin wrapper for JSON responses — avoids repeating headers everywhere. */
export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Maps a caught error to a proper HTTP Response.
 *
 * @param error    The caught value (unknown)
 * @param context  Short label for the server log, e.g. "fetch match"
 * @param request  Optional request for IP logging
 */
export function handleApiError(error: unknown, context: string, request?: Request): Response {
  const msg = error instanceof Error ? error.message : String(error);
  const clientIp = getClientIp(request);

  // Auth errors thrown by requirePermission / requireAnyPermission etc.
  if (msg.startsWith('Unauthorized')) {
    console.warn(`[api:${context}] Unauthorized`, buildLogMeta(msg, clientIp));
    return json({ error: 'Authentication required' }, 401);
  }
  if (msg.startsWith('Forbidden')) {
    console.warn(`[api:${context}] Forbidden`, buildLogMeta(msg, clientIp));
    if (request) auditPermissionDenied(request, msg, context, clientIp);
    return json({ error: 'Insufficient permissions' }, 403);
  }
  if (
    error instanceof Error &&
    (error.name === 'LeagueSeasonScopeError' || error.name === 'FixtureScopeError')
  ) {
    return json({ error: msg }, 400);
  }
  // Match-day squad rules (5 starters + 7 bench, no suspended or injured
  // players): a conflict with current state.
  if (error instanceof Error && (error.name === 'SquadLimitError' || error.name === 'PlayerUnavailableError' || error.name === 'RosterDropoutError' || error.name === 'PlayerTransferError')) {
    return json({ error: msg }, 409);
  }
  if (error instanceof Error && error.name === 'ActiveSeasonConflictError') {
    return json({ error: msg }, 409);
  }
  if (error instanceof Error && error.name === 'RegistrationConflictError') {
    return json({ error: msg }, 409);
  }

  // Resource-lookup guards (e.g. requireMatchScopedPermission, requirePlayerScopedPermission)
  // throw a plain `new Error('X not found')` when the id in the URL doesn't exist —
  // an expected client condition, not a server fault. Map it to 404 instead of
  // falling through to the generic 500 branch below.
  if (/ not found$/i.test(msg)) {
    console.warn(`[api:${context}] Not found`, buildLogMeta(msg, clientIp));
    return json({ error: msg }, 404);
  }

  // Validation errors thrown by parseBody() / schema.parse()
  if (error instanceof ZodError) {
    return json({ error: 'Validation failed', issues: error.flatten().fieldErrors }, 400);
  }

  // Prisma known-error codes
  if (isPrismaError(error)) {
    if (error.code === 'P2025') {
      return json({ error: 'Record not found' }, 404);
    }
    if (error.code === 'P2002') {
      const fields = (error.meta as any)?.target ?? 'field';
      return json({ error: `Duplicate value for ${fields}` }, 409);
    }
  }

  // Generic server error — never expose details in production
  if (clientIp) {
    console.error(`[api:${context}]`, { ip: clientIp }, error);
  } else {
    console.error(`[api:${context}]`, error);
  }
  return json(
    {
      error: `Failed to ${context}`,
      ...(process.env.NODE_ENV === 'development' && { details: msg }),
    },
    500
  );
}

/** Narrows `unknown` to a Prisma ClientKnownRequestError shape. */
function isPrismaError(err: unknown): err is { code: string; meta?: unknown } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as any).code === 'string' &&
    (err as any).code.startsWith('P')
  );
}

function buildLogMeta(message: string, ip: string | null): Record<string, string> {
  return ip ? { message, ip } : { message };
}

function getClientIp(request?: Request): string | null {
  if (!request) return null;
  const header =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('true-client-ip') ||
    request.headers.get('x-client-ip');
  if (!header) return null;
  const first = header.split(',')[0]?.trim();
  return first || null;
}
