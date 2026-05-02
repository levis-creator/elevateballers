import { prisma } from '../../../lib/prisma';
import { MATCH_TIMEZONE } from '../domain/usecases/utils';

/**
 * Convert an arbitrary string to a URL-safe slug fragment.
 * Lower-cased, ASCII alphanumerics + hyphens only.
 */
export function slugifyFragment(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** YYYY-MM-DD in the league timezone, suitable for use in a slug. */
export function dateSlugFragment(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  // Use the league timezone so doubleheaders on the same calendar day collide
  // (and pick up the -2/-3 disambiguation) rather than splitting across UTC days.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MATCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return parts; // en-CA produces YYYY-MM-DD
}

/**
 * Build a stable, human-readable base slug for a match.
 * Format: {team1}-vs-{team2}-{YYYY-MM-DD}
 * Falls back to the freeform team names if there's no Team relation,
 * and to "match-{shortId}" if there's no team info at all.
 */
export function buildMatchBaseSlug(opts: {
  team1Slug?: string | null;
  team2Slug?: string | null;
  team1Name?: string | null;
  team2Name?: string | null;
  date?: Date | string | null;
  fallbackId?: string;
}): string {
  const t1 =
    slugifyFragment(opts.team1Slug) || slugifyFragment(opts.team1Name);
  const t2 =
    slugifyFragment(opts.team2Slug) || slugifyFragment(opts.team2Name);
  const datePart = dateSlugFragment(opts.date);

  if (t1 && t2) {
    return [t1, 'vs', t2, datePart].filter(Boolean).join('-');
  }

  // No usable team info — fall back to a short id-based slug.
  const idTail = opts.fallbackId ? opts.fallbackId.slice(-8) : '';
  return idTail ? `match-${idTail}` : 'match';
}

/**
 * Resolve a unique slug for a match. If the base slug is already used by a
 * *different* match, append -2, -3, … until we find one that's free.
 */
export async function uniqueMatchSlug(
  base: string,
  opts: { excludeMatchId?: string } = {},
): Promise<string> {
  if (!base) {
    throw new Error('uniqueMatchSlug: base slug is required');
  }

  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.match.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === opts.excludeMatchId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

/**
 * Compute and persist a slug for a single match by id. Idempotent — if the
 * match already has a slug and team/date inputs haven't changed, returns
 * the existing slug without touching the row.
 */
export async function ensureMatchSlug(matchId: string): Promise<string> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { team1: true, team2: true },
  });
  if (!match) throw new Error(`ensureMatchSlug: match ${matchId} not found`);

  const base = buildMatchBaseSlug({
    team1Slug: match.team1?.slug,
    team2Slug: match.team2?.slug,
    team1Name: match.team1Name ?? match.team1?.name,
    team2Name: match.team2Name ?? match.team2?.name,
    date: match.date,
    fallbackId: match.id,
  });

  // If the existing slug already matches the desired base (or a -N variant of
  // it), keep it — no need to churn URLs on every save.
  if (match.slug && (match.slug === base || match.slug.startsWith(`${base}-`))) {
    return match.slug;
  }

  const slug = await uniqueMatchSlug(base, { excludeMatchId: match.id });
  await prisma.match.update({ where: { id: match.id }, data: { slug } });
  return slug;
}
