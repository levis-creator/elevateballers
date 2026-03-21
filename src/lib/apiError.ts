/**
 * Shared API error handling utilities.
 *
 * Centralises HTTP status mapping so route catch blocks stay small and consistent.
 * Handles:
 *   - Auth/permission errors thrown by requirePermission()
 *   - Prisma P2002 (unique constraint) → 409 Conflict
 *   - Prisma P2025 (record not found) → 404 Not Found
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
    return json({ error: 'Insufficient permissions' }, 403);
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
