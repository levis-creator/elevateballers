/**
 * v2 Stat-Leaders data source. Reuses the SAME event-based stat computation the
 * player/home pages use (`calculatePlayerStatistics`). Completed matches are
 * bucketed by (season, league); within each bucket every player who appeared
 * gets one `LeaderRow` of per-game averages. Returns null on failure/empty so
 * the use-case can fall back to demo data.
 */
import { prisma } from "@/lib/prisma";
import { calculatePlayerStatistics } from "@/features/player/lib/playerStats";
import type { LeadersData, LeaderRow, StatKey } from "@/features/stats/domain/entities/leaders-v2";
import { ALL_LEAGUES } from "@/features/stats/domain/entities/leaders-v2";

const r1 = (v: number): number => Math.round(v * 10) / 10;

const initialsOf = (name: string): string => {
	const w = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

interface RawMatch {
	id: string;
	status: string;
	date: Date;
	season: { name: string } | null;
	league: { name: string } | null;
	events: Array<{ eventType: any; playerId: string | null; assistPlayerId: string | null; isUndone: boolean }>;
}

export async function fetchLeadersData(): Promise<LeadersData | null> {
	try {
		const [players, matches] = (await Promise.all([
			prisma.player.findMany({
				where: { approved: true },
				select: { id: true, slug: true, firstName: true, lastName: true, team: { select: { name: true } } },
			}),
			prisma.match.findMany({
				where: { status: "COMPLETED" },
				select: {
					id: true,
					status: true,
					date: true,
					season: { select: { name: true } },
					league: { select: { name: true } },
					events: {
						where: { isUndone: false },
						select: { eventType: true, playerId: true, assistPlayerId: true, isUndone: true },
					},
				},
			}),
		])) as [any[], RawMatch[]];

		if (!players.length || !matches.length) return null;

		const playerById = new Map(players.map((p) => [p.id, p]));

		// Bucket completed matches by (season name, league name). A player's stats
		// only make sense within one competition, so each bucket is scored on its own.
		const buckets = new Map<string, { season: string; league: string; ts: number; matches: RawMatch[] }>();
		for (const m of matches) {
			const season = m.season?.name?.trim() || "Season";
			const league = m.league?.name?.trim() || "Unaffiliated";
			const key = `${season}|${league}`;
			const ts = new Date(m.date).getTime();
			const cur = buckets.get(key);
			if (!cur) buckets.set(key, { season, league, ts, matches: [m] });
			else {
				cur.matches.push(m);
				if (ts > cur.ts) cur.ts = ts;
			}
		}

		const rows: LeaderRow[] = [];
		for (const b of buckets.values()) {
			// Only players who actually appeared in this bucket's matches.
			const appeared = new Set<string>();
			for (const m of b.matches) for (const e of m.events) if (e.playerId) appeared.add(e.playerId);

			for (const pid of appeared) {
				const p = playerById.get(pid);
				if (!p) continue; // hidden / unapproved
				const s = calculatePlayerStatistics(b.matches as any, pid);
				if (s.totalMatches <= 0) continue;
				const vals: Record<StatKey, number> = {
					Points: r1(s.pointsPerGame),
					Rebounds: r1(s.reboundsPerGame),
					Assists: r1(s.assistsPerGame),
					Steals: r1(s.stealsPerGame),
					Blocks: r1(s.blocksPerGame),
					"3-Pointers": r1(s.totalThreePointersMade / s.totalMatches),
				};
				rows.push({
					playerId: pid,
					name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown",
					team: p.team?.name ?? "Free Agent",
					initials: initialsOf(`${p.firstName ?? ""} ${p.lastName ?? ""}`),
					href: `/players/${p.slug || p.id}`,
					league: b.league,
					season: b.season,
					gp: s.totalMatches,
					vals,
				});
			}
		}

		if (!rows.length) return null;

		// Season options: distinct names, most-recent bucket first.
		const seasonTs = new Map<string, number>();
		for (const b of buckets.values()) {
			const cur = seasonTs.get(b.season);
			if (cur == null || b.ts > cur) seasonTs.set(b.season, b.ts);
		}
		const seasons = [...seasonTs.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
		const leagues = [ALL_LEAGUES, ...[...new Set([...buckets.values()].map((b) => b.league))].sort()];

		// Threshold to qualify. Kept low (1) because this is a young league where
		// most players have only a game or two — a higher bar would empty the board.
		return { rows, seasons, leagues, defaultSeason: seasons[0] ?? "", minGames: 1 };
	} catch {
		return null;
	}
}
