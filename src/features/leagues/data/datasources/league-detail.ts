import { prisma } from "@/lib/prisma";
import { getStandings } from "@/features/standings/lib/getStandings";
import type {
	LeagueDetail,
	LeagueMatchSummary,
	LeagueSeasonSummary,
	LeagueStandingRow,
	LeagueTeamSummary,
} from "@/features/leagues/domain/entities/league-detail";
import type { AdminLeague } from "@/features/leagues/domain/entities/league";

const RECENT_MATCH_LIMIT = 6;

/**
 * Assembles everything the admin league-detail page needs in one round trip.
 *
 * Every count here is scoped to the league on purpose: a Season can run in more
 * than one League (see the `league_seasons` join), so a season's own
 * `_count.seasonTeams` / `_count.matches` would include other leagues' entries.
 *
 * Returns null when the league does not exist.
 */
export async function getLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
	const league = await prisma.league.findUnique({
		where: { id: leagueId },
		include: { _count: { select: { matches: true, leagueSeasons: true } } },
	});
	if (!league) return null;

	const [links, matchGroups, teamGroups, teamRows, recentRows] = await Promise.all([
		prisma.leagueSeason.findMany({
			where: { leagueId },
			include: { season: true },
			orderBy: { season: { startDate: "desc" } },
		}),
		// Matches of THIS league, bucketed by season + status.
		prisma.match.groupBy({
			by: ["seasonId", "status"],
			where: { leagueId },
			_count: { _all: true },
		}),
		// Teams entered in THIS league, bucketed by season.
		prisma.seasonTeam.groupBy({
			by: ["seasonId"],
			where: { leagueId },
			_count: { _all: true },
		}),
		prisma.seasonTeam.findMany({
			where: { leagueId },
			select: { team: { select: { id: true, name: true, slug: true, logo: true } } },
			distinct: ["teamId"],
			orderBy: { team: { name: "asc" } },
		}),
		prisma.match.findMany({
			where: { leagueId },
			orderBy: { date: "desc" },
			take: RECENT_MATCH_LIMIT,
			select: {
				id: true,
				date: true,
				status: true,
				team1Score: true,
				team2Score: true,
				team1Name: true,
				team2Name: true,
				team1: { select: { name: true } },
				team2: { select: { name: true } },
			},
		}),
	]);

	// ── Per-season match tallies ──────────────────────────────────────────
	const matchesBySeason = new Map<string, number>();
	const completedBySeason = new Map<string, number>();
	let completedMatches = 0;

	for (const group of matchGroups) {
		const count = group._count._all;
		const key = group.seasonId ?? "";
		matchesBySeason.set(key, (matchesBySeason.get(key) ?? 0) + count);
		if (group.status === "COMPLETED") {
			completedBySeason.set(key, (completedBySeason.get(key) ?? 0) + count);
			completedMatches += count;
		}
	}

	const teamsBySeason = new Map<string, number>();
	for (const group of teamGroups) {
		teamsBySeason.set(group.seasonId, group._count._all);
	}

	const seasons: LeagueSeasonSummary[] = links.map(({ season }) => ({
		id: season.id,
		name: season.name,
		startDate: season.startDate.toISOString(),
		endDate: season.endDate.toISOString(),
		active: season.active,
		bracketType: season.bracketType,
		teams: teamsBySeason.get(season.id) ?? 0,
		matches: matchesBySeason.get(season.id) ?? 0,
		completed: completedBySeason.get(season.id) ?? 0,
	}));

	// The season the league is "on" now: the active one, else the most recent.
	const current = links.find((l) => l.season.active)?.season ?? links[0]?.season ?? null;
	const currentSeason = current ? { id: current.id, name: current.name } : null;

	// ── Standings ─────────────────────────────────────────────────────────
	// Season table for the Overview; league-wide table only to source each
	// team's W–L for the Teams tab. Both are cached inside getStandings.
	const [seasonTable, leagueTable] = await Promise.all([
		getStandings({ leagueId, seasonId: currentSeason?.id }),
		getStandings({ leagueId }),
	]);

	const standings: LeagueStandingRow[] = seasonTable.map((row) => ({
		rank: row.rank,
		teamId: row.teamId,
		team: row.team,
		logo: row.logo,
		won: row.won,
		lost: row.lost,
		points: row.points,
	}));

	const recordByTeam = new Map(leagueTable.map((row) => [row.teamId, row]));

	const teams: LeagueTeamSummary[] = teamRows.map(({ team }) => {
		const record = recordByTeam.get(team.id);
		return {
			id: team.id,
			name: team.name,
			slug: team.slug,
			logo: team.logo,
			played: record?.played ?? 0,
			won: record?.won ?? 0,
			lost: record?.lost ?? 0,
		};
	});

	const recentMatches: LeagueMatchSummary[] = recentRows.map((match) => ({
		id: match.id,
		date: match.date.toISOString(),
		status: match.status,
		team1: match.team1?.name ?? match.team1Name ?? "TBD",
		team2: match.team2?.name ?? match.team2Name ?? "TBD",
		team1Score: match.team1Score,
		team2Score: match.team2Score,
	}));

	return {
		league: {
			...league,
			registrationOpensAt: league.registrationOpensAt?.toISOString() ?? null,
			registrationClosesAt: league.registrationClosesAt?.toISOString() ?? null,
			createdAt: league.createdAt.toISOString(),
			teamCount: teams.length,
		} as AdminLeague,
		currentSeason,
		completedMatches,
		seasons,
		teams,
		recentMatches,
		standings,
	};
}
