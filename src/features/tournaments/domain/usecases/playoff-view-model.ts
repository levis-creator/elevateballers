/**
 * Playoff View Model (pure / client-safe)
 *
 * Turns a season's participating teams + bracket-stage matches into everything
 * the public playoffs page renders: the bracket, a per-team breakdown of who is
 * still alive vs. eliminated, the champion, and summary stats.
 *
 * All functions here are pure — no DB, no framework — so they are unit-testable
 * and safe to import from client components.
 */
import type { MatchWithTeamsAndLeagueAndSeason, Season, Team } from '../../../cms/types';
import type { BracketMatch } from './bracket-converter';
import {
  convertMatchesToBracket,
  convertMatchesToDoubleEliminationBracket,
  detectBracketType,
} from './bracket-converter';
import { calculateBracketStats } from './bracket-stats';

export type PlayoffTeamStatus = 'champion' | 'alive' | 'eliminated';

export interface PlayoffTeamVM {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  wins: number;
  losses: number;
  status: PlayoffTeamStatus;
}

export type SingleBracket = BracketMatch[];
export type DoubleBracket = {
  upper: BracketMatch[];
  lower: BracketMatch[];
  grandFinal?: BracketMatch[];
};

export interface PlayoffStats {
  teamCount: number;
  rounds: number;
  byes: number;
  totalMatches: number;
  matchesPlayed: number;
}

export interface PlayoffViewModel {
  bracketType: 'single' | 'double';
  hasBracket: boolean;
  bracket: SingleBracket | DoubleBracket;
  teams: {
    all: PlayoffTeamVM[];
    alive: PlayoffTeamVM[];
    eliminated: PlayoffTeamVM[];
    champion: PlayoffTeamVM | null;
  };
  stats: PlayoffStats;
}

/** A match is decided once it has a recorded winner. */
function isDecided(m: MatchWithTeamsAndLeagueAndSeason): boolean {
  return Boolean(m.winnerId);
}

/** The team id that lost a decided match, or null if it can't be determined. */
function loserIdOf(m: MatchWithTeamsAndLeagueAndSeason): string | null {
  if (!m.winnerId) return null;
  if (m.team1Id && m.team1Id !== m.winnerId) return m.team1Id;
  if (m.team2Id && m.team2Id !== m.winnerId) return m.team2Id;
  return null;
}

export interface BuildPlayoffInput {
  season: Pick<Season, 'bracketType'>;
  teams: Team[];
  matches: MatchWithTeamsAndLeagueAndSeason[];
}

export function buildPlayoffViewModel({
  season,
  teams,
  matches,
}: BuildPlayoffInput): PlayoffViewModel {
  // Prefer the season's explicit setting; fall back to detecting from matches.
  const bracketType: 'single' | 'double' =
    season.bracketType === 'double'
      ? 'double'
      : season.bracketType === 'single'
        ? 'single'
        : detectBracketType(matches);

  const bracket: SingleBracket | DoubleBracket =
    bracketType === 'double'
      ? convertMatchesToDoubleEliminationBracket(matches)
      : convertMatchesToBracket(matches);

  // Tally wins/losses per team from decided matches.
  const winsById = new Map<string, number>();
  const lossesById = new Map<string, number>();
  const decided = matches.filter(isDecided);

  for (const m of decided) {
    if (m.winnerId) winsById.set(m.winnerId, (winsById.get(m.winnerId) ?? 0) + 1);
    const loserId = loserIdOf(m);
    if (loserId) lossesById.set(loserId, (lossesById.get(loserId) ?? 0) + 1);
  }

  // In single elimination one loss is out; in double it takes two.
  const eliminationThreshold = bracketType === 'double' ? 2 : 1;

  // The champion is whoever won the decided final (championship / grand final).
  const finalMatch =
    [...decided]
      .reverse()
      .find(
        (m) => m.stage === 'CHAMPIONSHIP' || m.bracketType === 'grand-final'
      ) ?? null;
  const championId = finalMatch?.winnerId ?? null;

  const all: PlayoffTeamVM[] = teams.map((team) => {
    const wins = winsById.get(team.id) ?? 0;
    const losses = lossesById.get(team.id) ?? 0;
    let status: PlayoffTeamStatus;
    if (championId && team.id === championId) {
      status = 'champion';
    } else if (losses >= eliminationThreshold) {
      status = 'eliminated';
    } else {
      status = 'alive';
    }
    return { id: team.id, name: team.name, slug: team.slug, logo: team.logo ?? null, wins, losses, status };
  });

  const champion = all.find((t) => t.status === 'champion') ?? null;
  const alive = all.filter((t) => t.status === 'alive');
  const eliminated = all.filter((t) => t.status === 'eliminated');

  const baseStats = calculateBracketStats(Math.max(teams.length, 1), bracketType);
  const stats: PlayoffStats = {
    teamCount: teams.length,
    rounds: baseStats.rounds,
    byes: baseStats.byes,
    totalMatches: baseStats.totalMatches,
    matchesPlayed: decided.length,
  };

  const hasBracket = Array.isArray(bracket)
    ? bracket.length > 0
    : bracket.upper.length > 0 || bracket.lower.length > 0;

  return {
    bracketType,
    hasBracket,
    bracket,
    teams: { all, alive, eliminated, champion },
    stats,
  };
}
