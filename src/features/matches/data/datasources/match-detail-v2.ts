/**
 * v2 Match-detail data source. Loads one match with full details and derives a
 * display-ready `MatchView` for every state:
 *  - final / live → quarter scoring (MatchPeriod), box scores, top performers,
 *    team comparison and running play-by-play, all derived from match events.
 *  - upcoming → recent form, head-to-head history and players to watch.
 * Reuses the existing stat helpers and queries — no new stat logic here.
 */
import { prisma } from "@/lib/prisma";
import { getMatchWithFullDetails, getPlayers } from "@/features/cms/lib/queries";
import { getCompletedMatches } from "@/features/matches/lib/queries";
import { getTeamPlayerStats } from "@/features/player/lib/queries";
import { calculatePlayerMatchStats, type PlayerMatchStatistics } from "@/features/player/domain/usecases/playerStats";
import { formatMatchDate, formatMatchTime, getZonedDateParts } from "@/features/matches/domain/usecases/utils";
import { getDisplayImageUrl } from "@/lib/asset-url";
import type {
	MatchView,
	MatchState,
	MatchSide,
	QuarterRow,
	BoxRow,
	ComparisonRow,
	PbpEvent,
	FormGuide,
	H2HRow,
	WatchCard,
} from "@/features/matches/domain/entities/match-detail-v2";

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CREAM = "#f6f2ec";
const DIM = "#8a817a";
const WON = "#141009";
const LOST = "#a49a8d";

const abbrOf = (name: string): string => {
	const clean = name.replace(/\(.*?\)/g, "").trim();
	const w = clean.split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

const periodLabel = (n: number): string => (n <= 4 ? `Q${n}` : `OT${n - 4}`);

const mmss = (seconds: number | null | undefined): string => {
	if (seconds == null || seconds < 0) return "";
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const POINTS: Record<string, number> = { TWO_POINT_MADE: 2, THREE_POINT_MADE: 3, FREE_THROW_MADE: 1 };

// Event types shown in the play-by-play feed — meaningful in-game plays only.
// Substitutions, timeouts, possession changes, jump balls etc. are excluded as
// noise (their points, if any, still count toward the running score).
const PBP_SHOW = new Set([
	"TWO_POINT_MADE",
	"TWO_POINT_MISSED",
	"THREE_POINT_MADE",
	"THREE_POINT_MISSED",
	"FREE_THROW_MADE",
	"FREE_THROW_MISSED",
	"REBOUND_OFFENSIVE",
	"REBOUND_DEFENSIVE",
	"ASSIST",
	"STEAL",
	"BLOCK",
	"TURNOVER",
	"FOUL_PERSONAL",
	"FOUL_TECHNICAL",
	"FOUL_FLAGRANT",
]);

const EVENT_LABEL: Record<string, string> = {
	TWO_POINT_MADE: "makes 2-pt field goal",
	TWO_POINT_MISSED: "misses 2-pt field goal",
	THREE_POINT_MADE: "makes 3-pt jumper",
	THREE_POINT_MISSED: "misses 3-pt jumper",
	FREE_THROW_MADE: "makes free throw",
	FREE_THROW_MISSED: "misses free throw",
	ASSIST: "assist",
	REBOUND_OFFENSIVE: "offensive rebound",
	REBOUND_DEFENSIVE: "defensive rebound",
	STEAL: "steal",
	BLOCK: "block",
	TURNOVER: "turnover",
	FOUL_PERSONAL: "personal foul",
	FOUL_TECHNICAL: "technical foul",
	SUBSTITUTION_IN: "substitution",
	TIMEOUT: "timeout",
	JUMP_BALL: "jump ball",
};

const playerName = (p: any): string => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim() || "Unknown";

/** W / L / D for a team in a completed match, or null if unscored. */
function resultFor(m: any, teamId: string): "W" | "L" | "D" | null {
	const isT1 = m.team1Id === teamId;
	const my = isT1 ? m.team1Score : m.team2Score;
	const opp = isT1 ? m.team2Score : m.team1Score;
	if (my == null || opp == null) return null;
	return my > opp ? "W" : my < opp ? "L" : "D";
}

function seasonRecord(completed: any[], teamId: string | undefined, seasonId: string | null | undefined): string | null {
	if (!teamId) return null;
	let w = 0;
	let l = 0;
	for (const m of completed) {
		if (seasonId && m.seasonId !== seasonId) continue;
		if (m.team1Id !== teamId && m.team2Id !== teamId) continue;
		const r = resultFor(m, teamId);
		if (r === "W") w++;
		else if (r === "L") l++;
	}
	return w || l ? `${w}W · ${l}L` : null;
}

function buildComparisonRow(
	label: string,
	home: number,
	away: number,
	unit: string,
	lowerBetter = false,
): ComparisonRow {
	const max = Math.max(home, away) || 1;
	const homeBetter = lowerBetter ? home < away : home > away;
	const awayBetter = lowerBetter ? away < home : away > home;
	return {
		label,
		homeVal: `${home}${unit}`,
		awayVal: `${away}${unit}`,
		homeColor: homeBetter ? "#e4002b" : "#6f665c",
		awayColor: awayBetter ? "#e4002b" : "#6f665c",
		homePct: Math.round((home / max) * 100),
		awayPct: Math.round((away / max) * 100),
	};
}

/** Aggregate a team's per-player stats into team totals. */
function teamTotals(playerIds: string[], statById: Map<string, PlayerMatchStatistics>) {
	const t = { fgm: 0, fga: 0, reb: 0, ast: 0, to: 0, tpm: 0 };
	for (const id of playerIds) {
		const s = statById.get(id);
		if (!s) continue;
		t.fgm += s.fieldGoalsMade;
		t.fga += s.fieldGoalsAttempted;
		t.reb += s.rebounds;
		t.ast += s.assists;
		t.to += s.turnovers;
		t.tpm += s.threePointersMade;
	}
	return t;
}

/** Recent form + head-to-head + players to watch for a pre-game view. */
async function buildUpcomingExtras(
	completed: any[],
	home: { id?: string; name: string; nickname?: string | null; abbr: string },
	away: { id?: string; name: string; nickname?: string | null; abbr: string },
): Promise<{ formGuide: FormGuide[]; h2h: H2HRow[]; watch: WatchCard[] }> {
	const last5 = (teamId?: string): Array<"W" | "L" | "D"> => {
		if (!teamId) return [];
		return completed
			.filter((m) => m.team1Id === teamId || m.team2Id === teamId)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 5)
			.map((m) => resultFor(m, teamId))
			.filter((r): r is "W" | "L" | "D" => r != null);
	};
	const formGuide: FormGuide[] = [
		{ team: home.name, nickname: home.nickname, abbr: home.abbr, logo: null, chips: last5(home.id) },
		{ team: away.name, nickname: away.nickname, abbr: away.abbr, logo: null, chips: last5(away.id) },
	].filter((f) => f.chips.length > 0);

	const h2h: H2HRow[] =
		home.id && away.id
			? completed
					.filter(
						(m) =>
							(m.team1Id === home.id && m.team2Id === away.id) ||
							(m.team1Id === away.id && m.team2Id === home.id),
					)
					.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
					.slice(0, 5)
					.map((m) => {
						const hName = m.team1Name || m.team1?.name || "TBD";
						const aName = m.team2Name || m.team2?.name || "TBD";
						const r = resultFor(m, m.team1Id);
						const winner = r === "W" ? hName : r === "L" ? aName : null;
						return {
							dateText: formatMatchDate(m.date),
							home: hName,
							away: aName,
							score: m.team1Score != null && m.team2Score != null ? `${m.team1Score} – ${m.team2Score}` : "—",
							winner,
						};
					})
			: [];

	// Players to watch — top scorers by season PPG across both teams.
	const watch = await buildWatch(home, away);
	return { formGuide, h2h, watch };
}

async function buildWatch(
	home: { id?: string; name: string; abbr: string },
	away: { id?: string; name: string; abbr: string },
): Promise<WatchCard[]> {
	const forTeam = async (team: { id?: string; abbr: string }): Promise<WatchCard[]> => {
		if (!team.id) return [];
		const [roster, stats] = await Promise.all([getPlayers(team.id), getTeamPlayerStats(team.id)]);
		return roster
			.map((p: any) => {
				const s = (stats as any)[p.id];
				const ppg = s?.pointsPerGame ?? 0;
				return {
					name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown",
					team: team.abbr,
					image: getDisplayImageUrl(p.image),
					ppg,
					rpg: s?.reboundsPerGame ?? 0,
					apg: s?.assistsPerGame ?? 0,
				};
			})
			.filter((p) => p.ppg > 0);
	};
	const [h, a] = await Promise.all([forTeam(home), forTeam(away)]);
	return [...h, ...a]
		.sort((x, y) => y.ppg - x.ppg)
		.slice(0, 3)
		.map((p) => {
			const bits = [`${p.ppg.toFixed(1)} PPG`];
			if (p.rpg >= p.apg && p.rpg > 0) bits.push(`${p.rpg.toFixed(1)} RPG`);
			else if (p.apg > 0) bits.push(`${p.apg.toFixed(1)} APG`);
			return { name: p.name, team: p.team, image: p.image, line: bits.join(" · ") };
		});
}

export async function fetchMatchView(slugOrId: string): Promise<MatchView | null> {
	try {
		const match = await getMatchWithFullDetails(slugOrId);
		if (!match) return null;

		const state: MatchState = match.status === "COMPLETED" ? "final" : match.status === "LIVE" ? "live" : "upcoming";
		const hasScore = state === "final" || state === "live";
		const showStats = hasScore;

		const homeName = match.team1Name || match.team1?.name || "TBD";
		const awayName = match.team2Name || match.team2?.name || "TBD";
		const homeNickname = match.team1?.nickname ?? null;
		const awayNickname = match.team2?.nickname ?? null;
		const team1Id = match.team1Id || match.team1?.id;
		const team2Id = match.team2Id || match.team2?.id;
		const hs = match.team1Score;
		const as = match.team2Score;

		const completed = await getCompletedMatches();

		const p = getZonedDateParts(match.date);
		const weekday = WD[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];

		const home: MatchSide = {
			name: homeName,
			nickname: homeNickname,
			abbr: abbrOf(homeName),
			logo: getDisplayImageUrl(match.team1?.logo || match.team1Logo),
			href: `/teams/${match.team1?.slug || team1Id || ""}`,
			color: !hasScore ? CREAM : hs != null && as != null && hs >= as ? CREAM : DIM,
			record: seasonRecord(completed, team1Id, match.seasonId),
			score: hasScore ? (hs ?? null) : null,
		};
		const away: MatchSide = {
			name: awayName,
			nickname: awayNickname,
			abbr: abbrOf(awayName),
			logo: getDisplayImageUrl(match.team2?.logo || match.team2Logo),
			href: `/teams/${match.team2?.slug || team2Id || ""}`,
			color: !hasScore ? CREAM : as != null && hs != null && as >= hs ? CREAM : DIM,
			record: seasonRecord(completed, team2Id, match.seasonId),
			score: hasScore ? (as ?? null) : null,
		};

		const base = {
			id: match.id,
			slug: (match as any).slug ?? null,
			state,
			hasScore,
			showStats,
			league: match.league?.name || match.leagueName || "Elevate Ballers",
			scoreboardTag: state === "upcoming" ? "Preview" : state === "live" ? "Live" : "Full Time",
			backHref: state === "upcoming" ? "/upcoming-fixtures" : "/matches",
			backLabel: state === "upcoming" ? "← All Fixtures" : "← All Results",
			dateText: `${weekday}, ${MON[p.month - 1]} ${p.day}`,
			time: formatMatchTime(match.date),
			venue: null as string | null,
			liveTag:
				state === "live"
					? `LIVE · ${periodLabel(match.currentPeriod ?? 1)}${match.clockSeconds != null ? ` ${mmss(match.clockSeconds)}` : ""}`
					: null,
			home,
			away,
		};

		if (!showStats) {
			const extras = await buildUpcomingExtras(
				completed,
				{ id: team1Id, name: homeName, nickname: homeNickname, abbr: home.abbr },
				{ id: team2Id, name: awayName, nickname: awayNickname, abbr: away.abbr },
			);
			return {
				...base,
				periodLabels: [],
				quarters: [],
				performers: [],
				comparison: [],
				box: { home: [], away: [] },
				pbpPeriods: [],
				pbpByPeriod: {},
				...extras,
			};
		}

		// --- live / final: derive everything from events + periods ---
		const events: any[] = Array.isArray(match.events) ? match.events : [];
		const players: any[] = Array.isArray(match.matchPlayers) ? match.matchPlayers : [];

		const statById = new Map<string, PlayerMatchStatistics>();
		for (const mp of players) {
			if (!statById.has(mp.playerId)) statById.set(mp.playerId, calculatePlayerMatchStats(mp.playerId, events));
		}

		// Quarter scoring
		const periods = await prisma.matchPeriod.findMany({
			where: { matchId: match.id },
			orderBy: { periodNumber: "asc" },
		});
		const periodLabels = periods.map((pd) => periodLabel(pd.periodNumber));
		const quarters: QuarterRow[] =
			periods.length > 0
				? [
						{
							name: homeName,
							nickname: homeNickname,
							abbr: home.abbr,
							color: hs != null && as != null && hs >= as ? WON : LOST,
							scores: periods.map((pd) => pd.team1Score),
							total: hs ?? periods.reduce((s, pd) => s + pd.team1Score, 0),
						},
						{
							name: awayName,
							nickname: awayNickname,
							abbr: away.abbr,
							color: as != null && hs != null && as >= hs ? WON : LOST,
							scores: periods.map((pd) => pd.team2Score),
							total: as ?? periods.reduce((s, pd) => s + pd.team2Score, 0),
						},
					]
				: [];

		// Box scores
		const boxFor = (teamId?: string): BoxRow[] =>
			players
				.filter((mp) => mp.teamId === teamId)
				.map((mp) => {
					const s = statById.get(mp.playerId)!;
					return {
						num: mp.jerseyNumber != null ? `#${mp.jerseyNumber}` : "",
						name: playerName(mp.player),
						starter: Boolean(mp.started),
						min: mp.minutesPlayed != null ? String(mp.minutesPlayed) : "—",
						pts: s.points,
						reb: s.rebounds,
						ast: s.assists,
						stl: s.steals,
						tp: s.threePointersMade,
					};
				});
		const box = { home: boxFor(team1Id), away: boxFor(team2Id) };

		// Top performers
		const performers = players
			.map((mp) => {
				const s = statById.get(mp.playerId)!;
				return {
					name: playerName(mp.player),
					team: mp.teamId === team1Id ? home.abbr : away.abbr,
					image: getDisplayImageUrl(mp.player?.image),
					pts: s.points,
					reb: s.rebounds,
					ast: s.assists,
				};
			})
			.filter((x) => x.pts > 0 || x.reb > 0 || x.ast > 0)
			.sort((a, b) => b.pts - a.pts)
			.slice(0, 3);

		// Team comparison
		const homeIds = players.filter((mp) => mp.teamId === team1Id).map((mp) => mp.playerId);
		const awayIds = players.filter((mp) => mp.teamId === team2Id).map((mp) => mp.playerId);
		const ht = teamTotals(homeIds, statById);
		const at = teamTotals(awayIds, statById);
		const hasAgg = ht.fga + at.fga + ht.reb + at.reb + ht.ast + at.ast > 0;
		const comparison: ComparisonRow[] = hasAgg
			? [
					buildComparisonRow(
						"Field Goal %",
						ht.fga ? Math.round((ht.fgm / ht.fga) * 100) : 0,
						at.fga ? Math.round((at.fgm / at.fga) * 100) : 0,
						"%",
					),
					buildComparisonRow("Rebounds", ht.reb, at.reb, ""),
					buildComparisonRow("Assists", ht.ast, at.ast, ""),
					buildComparisonRow("Turnovers", ht.to, at.to, "", true),
					buildComparisonRow("3-Pointers", ht.tpm, at.tpm, ""),
				]
			: [];

		// Play-by-play — running score in chronological order (query is desc).
		const chron = events.filter((e) => !e.isUndone).slice().reverse();
		let rh = 0;
		let ra = 0;
		const pbpByPeriod: Record<string, PbpEvent[]> = {};
		for (const e of chron) {
			const pts = POINTS[e.eventType] || 0;
			const isHome = e.teamId === team1Id;
			if (pts) {
				if (isHome) rh += pts;
				else ra += pts;
			}
			// Running score above tracks every scoring event; only surface
			// meaningful plays (skip subs/timeouts/possession noise).
			if (!PBP_SHOW.has(e.eventType)) continue;
			const key = periodLabel(e.period ?? 1);
			const label = EVENT_LABEL[e.eventType] || String(e.eventType).toLowerCase().replace(/_/g, " ");
			const who = e.player ? playerName(e.player) : "";
			const text = (e.description && String(e.description).trim()) || (who ? `${who} ${label}` : label);
			(pbpByPeriod[key] ||= []).push({
				t: mmss(e.secondsRemaining) || `${e.minute ?? 0}′`,
				text,
				score: `${rh}–${ra}`,
				side: e.teamId === team1Id ? "home" : e.teamId === team2Id ? "away" : "neutral",
			});
		}
		const pbpPeriods = Object.keys(pbpByPeriod);

		return {
			...base,
			periodLabels,
			quarters,
			performers,
			comparison,
			box,
			pbpPeriods,
			pbpByPeriod,
			formGuide: [],
			h2h: [],
			watch: [],
		};
	} catch {
		return null;
	}
}
