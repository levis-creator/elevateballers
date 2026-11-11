import { prisma } from '../../../../lib/prisma';
import { PLAYOFF_STAGES, getSeasonIdsWithPlayoffs } from './playoffQueries';
import { buildPlayoffBracket, type PlayoffBracket, type PlayoffTeamRef } from '../../domain/usecases/playoff-series';
import { configuredLeagueName, type PublicCompetitionSettings } from '../../../settings/application/competitionSettings';

export type PlayoffsLeague = { slug: string; code: string; name: string; bracket: PlayoffBracket };

export type PlayoffsPageData = {
  season: { slug: string; name: string };
  /** Seasons that have a playoff bracket, newest first. */
  seasons: { slug: string; label: string }[];
  leagues: PlayoffsLeague[];
  initialLeague: string;
};

/** "Elevate Ballers League (EBL)" → EBL; "… - EWBL" → EWBL; else initials. */
export function leagueCodeOf(name: string): string {
  const bracketed = name.match(/\(([A-Za-z0-9]{2,8})\)\s*$/)?.[1];
  if (bracketed) return bracketed.toUpperCase();
  const suffix = name.match(/[-–]\s*([A-Za-z0-9]{2,8})\s*$/)?.[1];
  if (suffix) return suffix.toUpperCase();
  return name.split(/\s+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 5).toUpperCase();
}

/** The league's display name without its code, e.g. "Elevate Ballers League". */
const plainLeagueName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*[-–]\s*[A-Za-z0-9]{2,8}\s*$/, '').trim() || name;

const teamRef = (
  team: { id: string; name: string; shortName: string | null } | null,
  fallbackName: string | null
): PlayoffTeamRef | null => {
  if (team) return { id: team.id, name: team.name, short: team.shortName?.trim() || team.name };
  return fallbackName ? { id: '', name: fallbackName, short: fallbackName } : null;
};

/** Everything the v2 /playoffs/[season] page renders, or null for an unknown season. */
export async function getPlayoffsPageData(
  slug: string,
  leagueSlug: string | undefined,
  competitionSettings: PublicCompetitionSettings
): Promise<PlayoffsPageData | null> {
  const season = await prisma.season.findFirst({ where: { slug }, select: { id: true, slug: true, name: true } });
  if (!season) return null;

  const [playoffSeasonIds, games] = await Promise.all([
    getSeasonIdsWithPlayoffs(),
    prisma.match.findMany({
      where: { seasonId: season.id, stage: { in: PLAYOFF_STAGES } },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        slug: true,
        stage: true,
        date: true,
        status: true,
        team1Score: true,
        team2Score: true,
        team1Name: true,
        team2Name: true,
        league: { select: { id: true, name: true, slug: true } },
        team1: { select: { id: true, name: true, shortName: true } },
        team2: { select: { id: true, name: true, shortName: true } },
      },
    }),
  ]);
  if (!games.length) return null;

  const seasonRows = await prisma.season.findMany({
    where: { id: { in: playoffSeasonIds } },
    select: { slug: true, name: true, startDate: true },
    orderBy: { startDate: 'desc' },
  });
  const nameCounts = new Map<string, number>();
  for (const row of seasonRows) nameCounts.set(row.name, (nameCounts.get(row.name) ?? 0) + 1);
  const seasons = seasonRows.map((row) => ({
    slug: row.slug,
    label: (nameCounts.get(row.name) ?? 0) > 1 ? `${row.name} · ${row.slug}` : row.name,
  }));

  const byLeague = new Map<string, { league: { id: string; name: string; slug: string } | null; games: typeof games }>();
  for (const game of games) {
    const key = game.league?.id ?? '';
    const entry = byLeague.get(key) ?? { league: game.league, games: [] };
    entry.games.push(game);
    byLeague.set(key, entry);
  }
  const leagueOrder = [...byLeague.values()].sort((x, y) => (x.league?.name ?? '').localeCompare(y.league?.name ?? ''));
  const leagues: PlayoffsLeague[] = leagueOrder.map(({ league, games: leagueGames }, index) => {
    const sourceName = league?.name ?? 'Playoffs';
    const configured = configuredLeagueName(sourceName, competitionSettings, index);
    return {
      slug: league?.slug ?? 'all',
      code: configured?.code || leagueCodeOf(sourceName),
      name: plainLeagueName(configured?.name || sourceName),
      bracket: buildPlayoffBracket(
        leagueGames.map((game) => ({
          id: game.id,
          slug: game.slug,
          stage: game.stage ?? '',
          date: game.date.toISOString(),
          status: game.status,
          team1: teamRef(game.team1, game.team1Name),
          team2: teamRef(game.team2, game.team2Name),
          team1Score: game.team1Score,
          team2Score: game.team2Score,
        }))
      ),
    };
  });

  const initialLeague = leagues.find((league) => league.slug === leagueSlug)?.slug ?? leagues[0].slug;
  return { season: { slug: season.slug, name: season.name }, seasons, leagues, initialLeague };
}
