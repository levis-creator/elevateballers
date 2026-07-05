/**
 * v2 Players-directory data source. Lists every approved player with real
 * per-game averages computed from match events (same helper as the player-detail
 * and home pages), then applies the player's manual `stats` JSON overrides so the
 * card numbers match the detail page. Returns null on failure/empty → demo data.
 */
import { prisma } from "@/lib/prisma";
import { calculatePlayerStatistics } from "@/features/player/lib/playerStats";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { PlayersDirectoryData, PlayerCard, PosCode } from "@/features/player/domain/entities/players-directory-v2";

const r1 = (v: number): number => Math.round(v * 10) / 10;

const initialsOf = (name: string): string => {
	const w = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

// Roster positions are stored as standard abbreviations (PG/SG/SF/PF/C); map each
// to a coarse tab bucket + a friendly label. Falls back to keyword matching for
// any free-text values.
const ABBR: Record<string, { code: PosCode; label: string }> = {
	PG: { code: "G", label: "Point Guard" },
	SG: { code: "G", label: "Shooting Guard" },
	SF: { code: "F", label: "Small Forward" },
	PF: { code: "F", label: "Power Forward" },
	C: { code: "C", label: "Center" },
};

/** Resolve a raw position string to a tab bucket + display label. */
function resolvePosition(position: string | null | undefined): { code: PosCode; label: string } {
	const raw = (position || "").trim();
	const hit = ABBR[raw.toUpperCase()];
	if (hit) return hit;
	const p = raw.toLowerCase();
	if (p.includes("guard")) return { code: "G", label: raw };
	if (p.includes("forward")) return { code: "F", label: raw };
	if (p.includes("cent")) return { code: "C", label: raw }; // center / centre
	return { code: "?", label: raw || "—" };
}

/** Manual override from the player's `stats` JSON, or the computed base. */
function withOverride(base: number, overrides: any, key: string): number {
	if (overrides && typeof overrides === "object" && overrides[key] !== undefined) {
		const v = Number(overrides[key]);
		if (!Number.isNaN(v)) return v;
	}
	return base;
}

export async function fetchPlayersDirectory(): Promise<PlayersDirectoryData | null> {
	try {
		const [players, matches] = await Promise.all([
			prisma.player.findMany({
				where: { approved: true },
				select: {
					id: true,
					slug: true,
					firstName: true,
					lastName: true,
					position: true,
					jerseyNumber: true,
					image: true,
					stats: true,
					team: { select: { name: true } },
				},
			}),
			prisma.match.findMany({
				where: { status: "COMPLETED" },
				select: {
					id: true,
					status: true,
					events: {
						where: { isUndone: false },
						select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
					},
				},
			}),
		]);

		if (!players.length) return null;

		const cards: PlayerCard[] = players.map((p) => {
			const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";
			const s = calculatePlayerStatistics(matches as any, p.id);
			const { code: posCode, label: posLabel } = resolvePosition(p.position);
			return {
				id: p.id,
				name,
				team: p.team?.name ?? "Free Agent",
				posCode,
				posLabel,
				number: p.jerseyNumber != null ? String(p.jerseyNumber) : "—",
				initials: initialsOf(name),
				href: `/players/${p.slug || p.id}`,
				image: getDisplayImageUrl(p.image),
				ppg: r1(withOverride(s.pointsPerGame, p.stats, "ppg")),
				rpg: r1(withOverride(s.reboundsPerGame, p.stats, "rpg")),
				apg: r1(withOverride(s.assistsPerGame, p.stats, "apg")),
			};
		});

		const teams = ["All Teams", ...[...new Set(cards.map((c) => c.team))].sort()];
		return { players: cards, teams, total: cards.length };
	} catch {
		return null;
	}
}
