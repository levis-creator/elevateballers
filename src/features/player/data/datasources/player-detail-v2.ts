/**
 * v2 Player-detail data source. Resolves the player (slug- or id-based) and
 * derives season averages, per-game splits, a recent game log, shooting
 * percentages, season highs and a shot summary from real match events — reusing
 * the existing player-stat helpers. Manual stat overrides on the player (the
 * `stats` JSON) are applied to the averages, matching the v1 behaviour.
 */
import { getPlayerBySlug, getPlayerById } from "@/features/cms/lib/queries";
import { ensurePlayerSlug } from "@/features/player/lib/slug";
import { getPlayerMatches, getPlayerMatchEvents } from "@/features/player/lib/queries";
import { calculatePlayerStatistics, calculatePlayerMatchStats, type PlayerMatchStatistics } from "@/features/player/lib/playerStats";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type { PlayerView, SplitRow, GameLogRow, HighItem } from "@/features/player/domain/entities/player-detail-v2";

const pct = (made: number, att: number): string => (att > 0 ? `${Math.round((made / att) * 100)}%` : "—");
const avg = (sum: number, n: number): string => (n > 0 ? (sum / n).toFixed(1) : "0.0");

const ageOf = (value: Date | string | null | undefined): string => {
	if (!value) return "";
	const born = new Date(value);
	if (Number.isNaN(born.getTime())) return "";
	const now = new Date();
	let age = now.getFullYear() - born.getFullYear();
	if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age -= 1;
	return age >= 0 ? String(age) : "";
};

const socialLinksOf = (stats: unknown): Array<{ label: string; href: string }> => {
	if (!stats || typeof stats !== "object") return [];
	const source = (stats as any).socialLinks ?? (stats as any).social;
	if (!Array.isArray(source)) return [];
	return source
		.map((item) => ({ label: String(item?.label ?? item?.platform ?? "").trim(), href: String(item?.href ?? item?.url ?? "").trim() }))
		.filter((item) => item.label && /^https?:\/\//i.test(item.href));
};

/** One completed game with the player's derived line. */
interface Game {
	st: PlayerMatchStatistics;
	isHome: boolean;
	win: boolean;
	res: string;
	opp: string;
	href: string;
	ts: number;
	league: string;
	season: string;
	year: number;
}

function applyOverrides(stats: any, overrides: any) {
	if (!overrides || typeof overrides !== "object") return stats;
	const m = { ...stats };
	const map: Record<string, string> = {
		ppg: "pointsPerGame",
		rpg: "reboundsPerGame",
		apg: "assistsPerGame",
		spg: "stealsPerGame",
		bpg: "blocksPerGame",
		fgPercent: "fieldGoalPercentage",
		ftPercent: "freeThrowPercentage",
		threePointPercent: "threePointPercentage",
	};
	for (const [k, target] of Object.entries(map)) if (overrides[k] !== undefined) m[target] = overrides[k];
	return m;
}

export async function fetchPlayerView(slugOrId: string): Promise<PlayerView | null> {
	try {
		const player = (await getPlayerBySlug(slugOrId)) ?? (await getPlayerById(slugOrId));
		if (!player) return null;
		const p: any = player;

		const matches = await getPlayerMatches(p.id);
		const matchesWithEvents = await Promise.all(
			matches.map(async (m: any) => {
				if (m.status === "COMPLETED") {
					const events = await getPlayerMatchEvents(m.id, p.id).catch(() => []);
					return { ...m, events };
				}
				return { ...m, events: [] };
			}),
		);

		let stats: any = calculatePlayerStatistics(matchesWithEvents as any, p.id);
		stats = applyOverrides(stats, p.stats);

		// Per completed game the player featured in (has a line).
		const games: Game[] = matchesWithEvents
			.filter((m: any) => m.status === "COMPLETED")
			.map((m: any) => {
				const st = calculatePlayerMatchStats(p.id, m.events || []);
				const isHome = m.team1Id === p.teamId;
				const my = isHome ? m.team1Score : m.team2Score;
				const ops = isHome ? m.team2Score : m.team1Score;
				const scored = my != null && ops != null;
				const opp = isHome ? m.team2?.name || m.team2Name || "TBD" : m.team1?.name || m.team1Name || "TBD";
				const d = new Date(m.date);
				return {
					st,
					isHome,
					win: scored && my > ops,
					res: scored ? (my > ops ? "W" : my < ops ? "L" : "D") : "—",
					opp,
					href: `/matches/${m.slug || m.id}`,
					ts: d.getTime(),
					league: m.league?.name || m.leagueName || "",
					season: m.season?.name || "",
					year: d.getFullYear(),
				};
			})
			.sort((a, b) => b.ts - a.ts);

		const hasStats = games.length > 0;
		const newest = games[0];
		const seasonLabel = newest?.season || (newest ? String(newest.year) : "");

		// --- season averages ---
		const averages = [
			{ value: stats.pointsPerGame.toFixed(1), label: "Points", accent: true },
			{ value: stats.reboundsPerGame.toFixed(1), label: "Rebounds", accent: false },
			{ value: stats.assistsPerGame.toFixed(1), label: "Assists", accent: false },
			{ value: stats.stealsPerGame.toFixed(1), label: "Steals", accent: false },
			{ value: `${Math.round(stats.fieldGoalPercentage)}%`, label: "FG", accent: false },
			{ value: `${Math.round(stats.threePointPercentage)}%`, label: "3PT", accent: true },
		];

		// --- shooting bars ---
		const shooting = [
			{ label: "Field Goal", pct: `${Math.round(stats.fieldGoalPercentage)}%`, value: Math.round(stats.fieldGoalPercentage), accent: true },
			{ label: "3-Point", pct: `${Math.round(stats.threePointPercentage)}%`, value: Math.round(stats.threePointPercentage), accent: true },
			{ label: "Free Throw", pct: `${Math.round(stats.freeThrowPercentage)}%`, value: Math.round(stats.freeThrowPercentage), accent: false },
		];

		// --- per-game splits ---
		const split = (label: string, subset: Game[]): SplitRow | null => {
			if (subset.length === 0) return null;
			const sum = (f: (s: PlayerMatchStatistics) => number) => subset.reduce((acc, g) => acc + f(g.st), 0);
			return {
				label,
				gp: subset.length,
				pts: avg(sum((s) => s.points), subset.length),
				reb: avg(sum((s) => s.rebounds), subset.length),
				ast: avg(sum((s) => s.assists), subset.length),
				stl: avg(sum((s) => s.steals), subset.length),
				fg: pct(sum((s) => s.fieldGoalsMade), sum((s) => s.fieldGoalsAttempted)),
			};
		};
		const splits = [
			split("All games", games),
			split("Home", games.filter((g) => g.isHome)),
			split("Away", games.filter((g) => !g.isHome)),
			split("Wins", games.filter((g) => g.win)),
		].filter(Boolean) as SplitRow[];

		// Keep the full recent-game collection; presentation settings own the row limit.
		const gamelog: GameLogRow[] = games.map((g) => ({
			va: g.isHome ? "vs" : "@",
			opp: g.opp,
			res: g.res,
			resWin: g.win,
			pts: g.st.points,
			reb: g.st.rebounds,
			ast: g.st.assists,
			tp: g.st.threePointersMade,
			href: g.href,
		}));

		// --- season highs (single-game max + opponent) ---
		const highOf = (label: string, f: (s: PlayerMatchStatistics) => number): HighItem | null => {
			let best: Game | null = null;
			for (const g of games) if (!best || f(g.st) > f(best.st)) best = g;
			if (!best || f(best.st) <= 0) return null;
			return { label, value: f(best.st), opp: best.opp };
		};
		const highs = [
			highOf("Points", (s) => s.points),
			highOf("Assists", (s) => s.assists),
			highOf("Rebounds", (s) => s.rebounds),
			highOf("Steals", (s) => s.steals),
		].filter(Boolean) as HighItem[];

		// --- shooting breakdown (coordinate-free: outcomes by type, not positions) ---
		const fgm = stats.totalFieldGoalsMade;
		const fga = stats.totalFieldGoalsAttempted;
		const tpm = stats.totalThreePointersMade;
		const tpa = stats.totalThreePointersAttempted;
		const ftm = stats.totalFreeThrowsMade;
		const fta = stats.totalFreeThrowsAttempted;
		const twoM = fgm - tpm;
		const twoA = fga - tpa;
		const rate = (m: number, a: number) => (a > 0 ? Math.round((m / a) * 100) : 0);
		const twoShare = fga > 0 ? Math.round((twoA / fga) * 100) : 0;

		const breakdown = {
			fgm,
			fga,
			fgPct: rate(fgm, fga),
			rings: [
				{ label: "Field Goal", pct: rate(fgm, fga), made: fgm, att: fga, accent: true },
				{ label: "2-Point", pct: rate(twoM, twoA), made: twoM, att: twoA, accent: false },
				{ label: "3-Point", pct: rate(tpm, tpa), made: tpm, att: tpa, accent: true },
				{ label: "Free Throw", pct: rate(ftm, fta), made: ftm, att: fta, accent: false },
			],
			// Effective FG% rewards the extra value of made threes.
			efgPct: fga > 0 ? Math.round(((fgm + 0.5 * tpm) / fga) * 100) : 0,
			pointsFromField: twoM * 2 + tpm * 3,
			shotDiet: [
				{ label: "Two-point attempts", att: twoA, share: twoShare, accent: false },
				{ label: "Three-point attempts", att: tpa, share: fga > 0 ? 100 - twoShare : 0, accent: true },
			],
			hasShooting: fga > 0 || fta > 0,
		};

		const teamHref = `/teams/${p.team?.slug || p.teamId || ""}`;
		const teamName = p.team?.name || "Free Agent";

		// Ensure the player has a canonical slug (backfills seed rows on first visit).
		const slug = p.slug?.trim() ? p.slug : await ensurePlayerSlug(p.id).catch(() => null);

		return {
			id: p.id,
			slug,
			hero: {
				first: p.firstName || "Player",
				last: p.lastName || "",
				number: p.jerseyNumber != null ? String(p.jerseyNumber) : "—",
				team: teamName,
				teamHref,
				league: newest?.league || "",
				image: getDisplayImageUrl(p.image),
				backHref: teamHref,
				backLabel: teamName,
			},
			bio: [
				{ k: "Position", v: p.position || "" },
				{ k: "Height", v: p.height || (p.heightCm ? `${p.heightCm} cm` : "") },
				{ k: "Age", v: ageOf(p.dateOfBirth) },
				{ k: "Games", v: String(stats.totalMatches) },
				{ k: "Weight", v: p.weight || (p.weightKg ? `${p.weightKg} kg` : "") },
				{ k: "Jersey number", v: p.jerseyNumber != null ? String(p.jerseyNumber) : "" },
				{ k: "Team", v: teamName },
				{ k: "Nationality", v: p.nationality || "" },
			],
			biography: p.bio?.trim() || null,
			socialLinks: socialLinksOf(p.stats),
			seasonLabel,
			averages,
			splits,
			gamelog,
			shooting,
			highs,
			breakdown,
			hasStats,
		};
	} catch {
		return null;
	}
}
