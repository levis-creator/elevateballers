/**
 * Player slug helpers — mirror the match-slug approach. Players are located by a
 * human-readable, SEO-friendly slug (`firstname-lastname`, de-duplicated with
 * -2/-3…). Existing rows without a slug are backfilled lazily on first visit
 * (and via a one-off backfill) so URLs canonicalise to the slug.
 */
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/features/cms/domain/usecases/utils";

/** Build the base slug for a player from their name, with an id fallback. */
export function buildPlayerBaseSlug(firstName?: string | null, lastName?: string | null, fallbackId?: string): string {
	const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
	const base = name ? generateSlug(name) : "";
	if (base) return base;
	const tail = fallbackId ? fallbackId.slice(-8) : "";
	return tail ? `player-${tail}` : "player";
}

/** Resolve a unique slug, appending -2, -3, … if the base is taken by another player. */
export async function uniquePlayerSlug(base: string, excludeId?: string): Promise<string> {
	let candidate = base || "player";
	let n = 1;
	while (true) {
		const existing = await prisma.player.findFirst({
			where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
			select: { id: true },
		});
		if (!existing) return candidate;
		n += 1;
		candidate = `${base}-${n}`;
	}
}

/**
 * Ensure a player has a slug, generating and persisting one from their name if
 * missing. Idempotent — returns the existing slug when present.
 */
export async function ensurePlayerSlug(playerId: string): Promise<string | null> {
	const player = await prisma.player.findUnique({
		where: { id: playerId },
		select: { id: true, slug: true, firstName: true, lastName: true },
	});
	if (!player) return null;
	if (player.slug && player.slug.trim()) return player.slug;

	const base = buildPlayerBaseSlug(player.firstName, player.lastName, player.id);
	const slug = await uniquePlayerSlug(base, player.id);
	try {
		await prisma.player.update({ where: { id: player.id }, data: { slug } });
	} catch {
		// Lost a race or the column is briefly locked — re-read the persisted slug.
		const fresh = await prisma.player.findUnique({ where: { id: player.id }, select: { slug: true } });
		return fresh?.slug ?? slug;
	}
	return slug;
}
