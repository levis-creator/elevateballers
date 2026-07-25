import { prisma } from "@/lib/prisma";
import { getStandings } from "@/features/standings/lib/getStandings";
import type { AdminSeason } from "@/features/seasons/domain/entities/season";
import type {
	SeasonConferenceOption,
	SeasonDetail,
	SeasonFixture,
	SeasonStandingRow,
	SeasonTeamSummary,
} from "@/features/seasons/domain/entities/season-detail";

/**
 * Assembles everything the admin season-detail page needs in one round trip.
 *
 * Standings are never combined across competition editions. Until Phase 9 adds
 * a competition selector to this page, a table is shown only for a season with
 * exactly one enabled league.
 *
 * Returns null when the season does not exist.
 */
export async function getSeasonDetail(seasonId: string): Promise<SeasonDetail | null> {
	const season = await prisma.season.findUnique({
		where: { id: seasonId },
		include: {
			leagueSeasons: { include: { league: { select: { id: true, name: true } } } },
			conferences: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
			_count: { select: { matches: true } },
		},
	});
	if (!season) return null;
	const standingsCompetition =
		season.leagueSeasons.length === 1 ? season.leagueSeasons[0] : null;

	const [matchGroups, fixtureRows, teamRows, table] = await Promise.all([
		prisma.match.groupBy({
			by: ["status"],
			where: { seasonId },
			_count: { _all: true },
		}),
		prisma.match.findMany({
			where: { seasonId },
			orderBy: { date: "asc" },
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
		// Every team entered in the season — including any yet to play a match,
		// which the standings table (played > 0 only) would drop.
		prisma.seasonTeam.findMany({
			where: { seasonId },
			select: {
				conferenceId: true,
				conference: { select: { name: true } },
				team: { select: { id: true, name: true, slug: true, logo: true } },
			},
			orderBy: { team: { name: "asc" } },
		}),
		standingsCompetition?.id
			? getStandings({ leagueSeasonId: standingsCompetition.id })
			: Promise.resolve([]),
	]);

	const completed = matchGroups.find((group) => group.status === "COMPLETED")?._count._all ?? 0;

	const adminSeason: AdminSeason = {
		id: season.id,
		name: season.name,
		slug: season.slug,
		description: season.description,
		startDate: season.startDate.toISOString(),
		endDate: season.endDate.toISOString(),
		active: season.active,
		bracketType: season.bracketType,
		leagues: season.leagueSeasons.map((link) => ({ id: link.league.id, name: link.league.name })),
		matches: season._count.matches,
		completed,
	};

	const fixtures: SeasonFixture[] = fixtureRows.map((match) => ({
		id: match.id,
		date: match.date.toISOString(),
		status: match.status,
		team1: match.team1?.name ?? match.team1Name ?? "TBD",
		team2: match.team2?.name ?? match.team2Name ?? "TBD",
		team1Score: match.team1Score,
		team2Score: match.team2Score,
	}));

	const standings: SeasonStandingRow[] = table.map((row) => ({
		rank: row.rank,
		teamId: row.teamId,
		team: row.team,
		logo: row.logo,
		won: row.won,
		lost: row.lost,
		points: row.points,
	}));

	const recordByTeam = new Map(table.map((row) => [row.teamId, row]));

	const teams: SeasonTeamSummary[] = teamRows.map(({ team, conferenceId, conference }) => {
		const record = recordByTeam.get(team.id);
		return {
			id: team.id,
			name: team.name,
			slug: team.slug,
			logo: team.logo,
			played: record?.played ?? 0,
			won: record?.won ?? 0,
			lost: record?.lost ?? 0,
			conferenceId: conferenceId ?? null,
			conferenceName: conference?.name ?? null,
		};
	});

	const conferences: SeasonConferenceOption[] = season.conferences.map((c) => ({ id: c.id, name: c.name }));

	return { season: adminSeason, fixtures, standings, teams, conferences };
}
