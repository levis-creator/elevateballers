/**
 * Box-score style figures worked out from the event log: player stat lines,
 * score by period, team fouls, timeouts, turnovers by kind and the running
 * score at each scoring event.
 */
import type { ConsoleRules } from './rules';
import {
  POINTS,
  PLAYER_FOULS,
  turnoverKind,
  type ConsoleEvent,
} from './model';

export interface PlayerLine {
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  tf: number;
  uf: number;
  ej: number;
}

export const emptyLine = (): PlayerLine => ({
  pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0,
  ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, tf: 0, uf: 0, ej: 0,
});

export interface TeamTotals {
  score: number;
  /** Points per period. */
  byPeriod: Record<number, number>;
  /** Player fouls per period (personal, technical, unsportsmanlike, ejection). */
  foulsByPeriod: Record<number, number>;
  benchTechs: number;
  coachTechs: number;
  timeouts: ConsoleEvent[];
  turnoversByKind: Record<string, number>;
}

export interface Derived {
  lines: Map<string, PlayerLine>;
  teams: Map<string, TeamTotals>;
  /** "home–away" running score keyed by event key, for scoring events. */
  scoreAt: Map<string, string>;
  /** Players who recorded any event. */
  involved: Set<string>;
}

const emptyTeam = (): TeamTotals => ({
  score: 0,
  byPeriod: {},
  foulsByPeriod: {},
  benchTechs: 0,
  coachTechs: 0,
  timeouts: [],
  turnoversByKind: {},
});

export function derive(events: ConsoleEvent[], homeId: string, awayId: string): Derived {
  const lines = new Map<string, PlayerLine>();
  const teams = new Map<string, TeamTotals>([
    [homeId, emptyTeam()],
    [awayId, emptyTeam()],
  ]);
  const scoreAt = new Map<string, string>();
  const involved = new Set<string>();
  const line = (pid: string) => {
    let l = lines.get(pid);
    if (!l) {
      l = emptyLine();
      lines.set(pid, l);
    }
    return l;
  };

  for (const e of events) {
    const team = e.teamId ? teams.get(e.teamId) : undefined;
    const s = e.playerId ? line(e.playerId) : null;
    if (e.playerId) involved.add(e.playerId);

    switch (e.eventType) {
      case 'TWO_POINT_MADE':
        if (s) { s.pts += 2; s.fgm++; s.fga++; }
        break;
      case 'TWO_POINT_MISSED':
        if (s) s.fga++;
        break;
      case 'THREE_POINT_MADE':
        if (s) { s.pts += 3; s.fgm++; s.fga++; s.tpm++; s.tpa++; }
        break;
      case 'THREE_POINT_MISSED':
        if (s) { s.fga++; s.tpa++; }
        break;
      case 'FREE_THROW_MADE':
        if (s) { s.pts++; s.ftm++; s.fta++; }
        break;
      case 'FREE_THROW_MISSED':
        if (s) s.fta++;
        break;
      case 'ASSIST': if (s) s.ast++; break;
      case 'REBOUND_OFFENSIVE': if (s) s.oreb++; break;
      case 'REBOUND_DEFENSIVE': if (s) s.dreb++; break;
      case 'STEAL': if (s) s.stl++; break;
      case 'BLOCK': if (s) s.blk++; break;
      case 'TURNOVER': {
        if (s) s.tov++;
        if (team) {
          const kind = turnoverKind(e.metadata.subtype);
          team.turnoversByKind[kind] = (team.turnoversByKind[kind] ?? 0) + 1;
        }
        break;
      }
      case 'FOUL_PERSONAL': if (s) s.pf++; break;
      case 'FOUL_TECHNICAL': if (s) s.tf++; break;
      case 'FOUL_FLAGRANT':
      case 'FOUL_UNSPORTSMANLIKE': if (s) s.uf++; break;
      case 'EJECTION': if (s) s.ej++; break;
      case 'FOUL_BENCH_TECHNICAL': if (team) team.benchTechs++; break;
      case 'FOUL_COACH_TECHNICAL': if (team) team.coachTechs++; break;
      case 'TIMEOUT': if (team) team.timeouts.push(e); break;
    }

    if (team && PLAYER_FOULS.has(e.eventType)) {
      team.foulsByPeriod[e.period] = (team.foulsByPeriod[e.period] ?? 0) + 1;
    }

    const pts = POINTS[e.eventType];
    if (pts && team) {
      team.score += pts;
      team.byPeriod[e.period] = (team.byPeriod[e.period] ?? 0) + pts;
    }
    if (pts) {
      scoreAt.set(e.key, `${teams.get(homeId)!.score}–${teams.get(awayId)!.score}`);
    }
  }

  return { lines, teams, scoreAt, involved };
}

export function lineOf(d: Derived, pid: string): PlayerLine {
  return d.lines.get(pid) ?? emptyLine();
}

/** Why a player can no longer play, or null. FIBA disqualification rules. */
export function disqualification(l: PlayerLine, rules: ConsoleRules): string | null {
  if (l.ej) return 'Ejected';
  if (l.tf >= rules.techsToDQ) return 'DQ · 2 T';
  if (l.uf >= rules.unsportsToDQ) return 'DQ · 2 U';
  if (l.tf >= 1 && l.uf >= 1) return 'DQ · T + U';
  if (l.pf + l.tf + l.uf >= rules.foulsToFoulOut) return 'Fouled out';
  return null;
}

export function personalFoulCount(l: PlayerLine): number {
  return l.pf + l.tf + l.uf;
}

/** Team fouls that count toward the bonus in the given period. */
export function teamFoulsNow(t: TeamTotals, period: number, rules: ConsoleRules): number {
  if (period > rules.periods && rules.teamFoulsCarryIntoOT) {
    return Object.entries(t.foulsByPeriod)
      .filter(([p]) => Number(p) >= rules.periods)
      .reduce((sum, [, n]) => sum + n, 0);
  }
  return t.foulsByPeriod[period] ?? 0;
}
