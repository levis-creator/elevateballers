/**
 * Resolves the real client IP for a request. Prefers proxy headers (set by the
 * production reverse proxy/CDN); falls back to Astro's `clientAddress` (the
 * actual socket address) so local dev and any deploy target without those
 * headers still get a real IP instead of the literal string "unknown".
 */
export function getClientIp(request: Request, clientAddress?: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return clientAddress || 'unknown';
}
