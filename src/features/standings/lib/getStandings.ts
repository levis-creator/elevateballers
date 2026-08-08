import { prisma } from "../../../lib/prisma";
import { cacheGet, cacheSet } from "../../../lib/cache";
import {
  LeagueSeasonScopeError,
  resolveLeagueSeasonScope,
} from "../../seasons/data/league-season-scope";
import { standingsCacheKey } from "./standings-cache";

export interface GetStandingsOptions {
  leagueSeasonId?: string;
  conferenceId?: string;
  /** Phase 9 compatibility bridge; new callers must send leagueSeasonId. */
  leagueId?: string;
  /** Phase 9 compatibility bridge; new callers must send leagueSeasonId. */
  seasonId?: string;
}

export interface StandingEntry {
  teamId: string;
  team: string;
  nickname: string | null;
  logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  url: string;
  rank: number;
}

interface Participant {
  team: {
    id: string;
    name: string;
    nickname: string | null;
    logo: string | null;
    slug: string;
  };
}

interface CompletedMatch {
  team1Id: string | null;
  team2Id: string | null;
  team1Score: number | null;
  team2Score: number | null;
}

export function calculateStandings(
  participants: Participant[],
  matches: CompletedMatch[],
): StandingEntry[] {
  const entries = new Map<string, StandingEntry>();
  for (const { team } of participants) {
    entries.set(team.id, {
      teamId: team.id,
      team: team.name,
      nickname: team.nickname,
      logo: team.logo,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      url: `/teams/${team.slug}`,
      rank: 0,
    });
  }

  const apply = (entry: StandingEntry, own: number, opponent: number) => {
    entry.played++;
    entry.goalsFor += own;
    entry.goalsAgainst += opponent;
    if (own > opponent) entry.won++;
    else if (own === opponent) entry.drawn++;
    else entry.lost++;
  };

  for (const match of matches) {
    if (match.team1Score === null || match.team2Score === null) continue;
    const home = match.team1Id ? entries.get(match.team1Id) : undefined;
    const away = match.team2Id ? entries.get(match.team2Id) : undefined;
    if (home) apply(home, match.team1Score, match.team2Score);
    if (away) apply(away, match.team2Score, match.team1Score);
  }

  const rows = [...entries.values()];
  for (const row of rows) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.points = row.won * 3 + row.drawn;
  }
  rows.sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.team.localeCompare(b.team),
  );
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getStandings(options: GetStandingsOptions): Promise<StandingEntry[]> {
  if (!options.leagueSeasonId && !(options.leagueId && options.seasonId)) {
    throw new LeagueSeasonScopeError("leagueSeasonId is required for standings.");
  }
  const scope = await resolveLeagueSeasonScope(options);
  const competition = await prisma.leagueSeason.findUnique({
    where: { id: scope.leagueSeasonId },
    select: { competitionStructure: true },
  });
  if (!competition) throw new LeagueSeasonScopeError("League competition not found.");

  if (options.conferenceId) {
    if (competition.competitionStructure !== "CONFERENCES") {
      throw new LeagueSeasonScopeError(
        "Conference standings are unavailable for a single-table competition.",
      );
    }
    const conference = await prisma.conference.findFirst({
      where: {
        id: options.conferenceId,
        leagueSeasonId: scope.leagueSeasonId,
      },
      select: { id: true },
    });
    if (!conference) {
      throw new LeagueSeasonScopeError(
        "conferenceId does not belong to the selected league competition.",
      );
    }
  }

  const cacheKey = standingsCacheKey(scope.leagueSeasonId, options.conferenceId);
  const cached = await cacheGet<StandingEntry[]>(cacheKey);
  if (cached) return cached;

  const [participants, matches] = await Promise.all([
    prisma.seasonTeam.findMany({
      where: {
        leagueSeasonId: scope.leagueSeasonId,
        ...(options.conferenceId ? { conferenceId: options.conferenceId } : {}),
      },
      select: {
        team: {
          select: {
            id: true,
            name: true,
            nickname: true,
            logo: true,
            slug: true,
          },
        },
      },
      orderBy: { team: { name: "asc" } },
    }),
    prisma.match.findMany({
      where: {
        leagueSeasonId: scope.leagueSeasonId,
        status: "COMPLETED",
        resultPublishedAt: { not: null },
      },
      select: {
        team1Id: true,
        team2Id: true,
        team1Score: true,
        team2Score: true,
      },
    }),
  ]);

  const result = calculateStandings(participants, matches);
  await cacheSet(cacheKey, result, 1800);
  return result;
}
