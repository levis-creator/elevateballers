import { describe, expect, it } from 'vitest';
import { buildPlayoffViewModel } from '../playoff-view-model';
import type { MatchWithTeamsAndLeagueAndSeason, Team } from '../../../../cms/types';

// Minimal factories — buildPlayoffViewModel only reads the fields set here, and
// the bracket converter reads id/stage/date/status/scores/teams. We cast the
// partials to the full types to keep the fixtures readable.
function team(id: string, name: string): Team {
  return { id, name, slug: name.toLowerCase(), logo: null } as Team;
}

function match(
  id: string,
  stage: MatchWithTeamsAndLeagueAndSeason['stage'],
  t1: Team,
  t2: Team,
  winner: Team | null,
  extra: Partial<MatchWithTeamsAndLeagueAndSeason> = {}
): MatchWithTeamsAndLeagueAndSeason {
  const decided = winner !== null;
  const t1Wins = decided && winner!.id === t1.id;
  return {
    id,
    stage,
    date: new Date('2026-06-01T12:00:00Z'),
    status: decided ? 'COMPLETED' : 'UPCOMING',
    team1Id: t1.id,
    team2Id: t2.id,
    winnerId: winner?.id ?? null,
    team1Score: decided ? (t1Wins ? 90 : 80) : null,
    team2Score: decided ? (t1Wins ? 80 : 90) : null,
    team1: t1,
    team2: t2,
    winner,
    league: null,
    season: null,
    leagueName: null,
    bracketType: null,
    bracketRound: null,
    nextWinnerMatchId: null,
    nextLoserMatchId: null,
    ...extra,
  } as MatchWithTeamsAndLeagueAndSeason;
}

const A = team('a', 'Alpha');
const B = team('b', 'Bravo');
const C = team('c', 'Charlie');
const D = team('d', 'Delta');

describe('buildPlayoffViewModel — single elimination', () => {
  const teams = [A, B, C, D];

  it('crowns the final winner as champion and eliminates the rest', () => {
    const matches = [
      match('s1', 'SEMI_FINALS', A, D, A),
      match('s2', 'SEMI_FINALS', B, C, B),
      match('f', 'CHAMPIONSHIP', A, B, A),
    ];

    const vm = buildPlayoffViewModel({ season: { bracketType: 'single' }, teams, matches });

    expect(vm.bracketType).toBe('single');
    expect(vm.teams.champion?.id).toBe('a');
    expect(vm.teams.alive).toHaveLength(0);
    expect(vm.teams.eliminated.map((t) => t.id).sort()).toEqual(['b', 'c', 'd']);
    expect(vm.teams.all.find((t) => t.id === 'a')?.wins).toBe(2);
    expect(vm.teams.all.find((t) => t.id === 'b')?.losses).toBe(1);
  });

  it('keeps unbeaten teams alive when the final has not been played', () => {
    const matches = [
      match('s1', 'SEMI_FINALS', A, D, A),
      match('s2', 'SEMI_FINALS', B, C, B),
      match('f', 'CHAMPIONSHIP', A, B, null), // not yet decided
    ];

    const vm = buildPlayoffViewModel({ season: { bracketType: 'single' }, teams, matches });

    expect(vm.teams.champion).toBeNull();
    expect(vm.teams.alive.map((t) => t.id).sort()).toEqual(['a', 'b']);
    expect(vm.teams.eliminated.map((t) => t.id).sort()).toEqual(['c', 'd']);
  });

  it('reports stats for the participating field', () => {
    const matches = [match('s1', 'SEMI_FINALS', A, D, A)];
    const vm = buildPlayoffViewModel({ season: { bracketType: 'single' }, teams, matches });

    expect(vm.stats.teamCount).toBe(4);
    expect(vm.stats.rounds).toBe(2);
    expect(vm.stats.byes).toBe(0);
    expect(vm.stats.totalMatches).toBe(3);
    expect(vm.stats.matchesPlayed).toBe(1);
  });
});

describe('buildPlayoffViewModel — double elimination', () => {
  it('requires two losses to eliminate a team', () => {
    const teams = [A, B];
    const matches = [
      match('u', 'SEMI_FINALS', A, B, A, { bracketType: 'upper' }), // B: 1 loss
      match('gf', 'CHAMPIONSHIP', A, B, A, { bracketType: 'grand-final' }), // B: 2 losses
    ];

    const vm = buildPlayoffViewModel({ season: { bracketType: 'double' }, teams, matches });

    expect(vm.bracketType).toBe('double');
    expect(vm.teams.champion?.id).toBe('a');
    expect(vm.teams.eliminated.map((t) => t.id)).toEqual(['b']);
  });

  it('keeps a team with a single loss alive in a double-elimination bracket', () => {
    const teams = [A, B];
    const matches = [match('u', 'SEMI_FINALS', A, B, A, { bracketType: 'upper' })];

    const vm = buildPlayoffViewModel({ season: { bracketType: 'double' }, teams, matches });

    expect(vm.teams.champion).toBeNull();
    expect(vm.teams.alive.map((t) => t.id).sort()).toEqual(['a', 'b']);
    expect(vm.teams.eliminated).toHaveLength(0);
  });
});

describe('buildPlayoffViewModel — empty / no bracket', () => {
  it('handles a season with no playoff matches', () => {
    const vm = buildPlayoffViewModel({
      season: { bracketType: null },
      teams: [A, B],
      matches: [],
    });

    expect(vm.hasBracket).toBe(false);
    expect(vm.teams.alive.map((t) => t.id).sort()).toEqual(['a', 'b']);
    expect(vm.teams.champion).toBeNull();
    expect(vm.stats.matchesPlayed).toBe(0);
  });
});
