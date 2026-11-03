import { prisma } from './prisma';
import { NEW_DETAIL_PATH, type LegacyResolution } from './legacyUrls';

// Answers for old WordPress URLs are permanent, so let Cloudflare cache them.
const CACHEABLE = 'public, max-age=3600, s-maxage=86400';

function redirect(to: string): Response {
  return new Response(null, { status: 301, headers: { Location: to, 'Cache-Control': CACHEABLE } });
}

function gone(): Response {
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Page removed</title><p>This page has been removed. <a href="/">Go to Elevate Ballers</a>.</p>',
    { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': CACHEABLE } },
  );
}

async function slugExists(entity: 'player' | 'match' | 'team', slug: string): Promise<boolean> {
  const where = { where: { slug }, select: { id: true } } as const;
  if (entity === 'player') return Boolean(await prisma.player.findUnique(where));
  if (entity === 'match') return Boolean(await prisma.match.findUnique(where));
  return Boolean(await prisma.team.findUnique(where));
}

/** The response for an old URL, or null to fall through to normal routing (e.g. the database is unreachable). */
export async function legacyUrlResponse(resolution: LegacyResolution): Promise<Response | null> {
  if (resolution.kind === 'redirect') return redirect(resolution.to);
  if (resolution.kind === 'gone') return gone();
  try {
    return (await slugExists(resolution.entity, resolution.slug))
      ? redirect(`${NEW_DETAIL_PATH[resolution.entity]}/${encodeURIComponent(resolution.slug)}/`)
      : gone();
  } catch {
    return null;
  }
}
