/**
 * Parses match events pasted or dropped into the Match events import panel.
 *
 * Main format, one event per line (header line and `#` comments optional):
 *
 *   period, clock, team, jersey, action[, detail]
 *   2, 04:12, MAL, 7, 3PT_MADE
 *   Q4, 0:35, MASFO, -, TIMEOUT
 *
 * The older ID-based CSV (header row with eventType, minute, period,
 * secondsRemaining, teamId, playerId, assistPlayerId, description) is also
 * accepted, so existing templates keep working.
 *
 * Every row is validated against the match players before anything is sent,
 * and gets an idempotency key derived from its content, so importing the same
 * file twice doesn't duplicate events.
 */
import { gameMinute, periodLength, type ConsoleRules } from './rules';

export interface ImportTeam {
  id: string;
  short: string;
  name: string;
}

export interface ImportPlayer {
  id: string;
  teamId: string;
  no: number | null;
}

export interface ImportEvent {
  eventType: string;
  teamId: string | null;
  playerId: string | null;
  period: number;
  secondsRemaining: number | null;
  minute: number;
  description: string | null;
  clientId: string;
}

export interface ImportRow {
  line: number;
  text: string;
  event?: ImportEvent;
  error?: string;
}

const ACTIONS: Record<string, string> = {
  '2PT_MADE': 'TWO_POINT_MADE', '2PM': 'TWO_POINT_MADE', '2PT_MISSED': 'TWO_POINT_MISSED', '2PA': 'TWO_POINT_MISSED',
  '3PT_MADE': 'THREE_POINT_MADE', '3PM': 'THREE_POINT_MADE', '3PT_MISSED': 'THREE_POINT_MISSED', '3PA': 'THREE_POINT_MISSED',
  FT_MADE: 'FREE_THROW_MADE', FTM: 'FREE_THROW_MADE', FT_MISSED: 'FREE_THROW_MISSED', FTA: 'FREE_THROW_MISSED',
  AST: 'ASSIST', OREB: 'REBOUND_OFFENSIVE', DREB: 'REBOUND_DEFENSIVE', STL: 'STEAL', BLK: 'BLOCK',
  TOV: 'TURNOVER', TO: 'TURNOVER', PF: 'FOUL_PERSONAL', TF: 'FOUL_TECHNICAL', UF: 'FOUL_UNSPORTSMANLIKE',
  EJ: 'EJECTION', BTF: 'FOUL_BENCH_TECHNICAL', CTF: 'FOUL_COACH_TECHNICAL',
};

export const IMPORTABLE_TYPES = new Set([
  'TWO_POINT_MADE', 'TWO_POINT_MISSED', 'THREE_POINT_MADE', 'THREE_POINT_MISSED', 'FREE_THROW_MADE',
  'FREE_THROW_MISSED', 'ASSIST', 'REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE', 'STEAL', 'BLOCK', 'TURNOVER',
  'FOUL_PERSONAL', 'FOUL_TECHNICAL', 'FOUL_FLAGRANT', 'FOUL_UNSPORTSMANLIKE', 'FOUL_BENCH_TECHNICAL',
  'FOUL_COACH_TECHNICAL', 'EJECTION', 'TIMEOUT', 'SUBSTITUTION_IN', 'SUBSTITUTION_OUT', 'OTHER',
]);

/** Actions that belong to a team, not a player. */
const TEAM_ONLY = new Set(['TIMEOUT', 'FOUL_BENCH_TECHNICAL', 'FOUL_COACH_TECHNICAL']);

/** Splits one CSV line, honouring double-quoted fields. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function parseAction(raw: string): string | null {
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const type = ACTIONS[key] ?? key;
  return IMPORTABLE_TYPES.has(type) ? type : null;
}

export function parsePeriod(raw: string, rules: ConsoleRules): number | null {
  const v = raw.trim().toUpperCase();
  let m = v.match(/^Q?(\d{1,2})$/);
  if (m) return Number(m[1]) || null;
  m = v.match(/^OT(\d{1,2})?$/);
  if (m) return rules.periods + (Number(m[1] ?? 1) || 1);
  return null;
}

export function parseClock(raw: string): number | null | undefined {
  const v = raw.trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m || Number(m[2]) > 59) return undefined;
  return Number(m[1]) * 60 + Number(m[2]);
}

function findTeam(raw: string, teams: ImportTeam[], homeId: string, awayId: string): ImportTeam | null {
  const v = raw.trim().toUpperCase();
  if (v === 'HOME' || v === 'H') return teams.find((t) => t.id === homeId) ?? null;
  if (v === 'AWAY' || v === 'A') return teams.find((t) => t.id === awayId) ?? null;
  return teams.find((t) => t.short.toUpperCase() === v || t.name.toUpperCase() === v || t.id === raw.trim()) ?? null;
}

interface Context {
  rules: ConsoleRules;
  teams: ImportTeam[];
  homeId: string;
  awayId: string;
  players: ImportPlayer[];
}

export function parseImport(text: string, ctx: Context): ImportRow[] {
  const lines = text.split(/\r?\n/).map((t, i) => ({ text: t.trim(), line: i + 1 })).filter((l) => l.text && !l.text.startsWith('#'));
  if (!lines.length) return [];
  const first = splitCsvLine(lines[0].text).map((c) => c.toLowerCase());
  const legacy = first.includes('eventtype');
  const header = legacy ? first : null;
  const body = legacy || first[0] === 'period' ? lines.slice(1) : lines;

  const seen = new Map<string, number>();
  return body.map(({ text: raw, line }) => {
    const cells = splitCsvLine(raw);
    const row: ImportRow = { line, text: raw };
    const fail = (error: string) => ({ ...row, error });
    // Identical lines are separate events; number repeats so each gets its own key.
    const n = (seen.get(raw) ?? 0) + 1;
    seen.set(raw, n);
    const clientId = `imp-${hash(raw)}-${n}`;

    if (header) {
      const get = (name: string) => cells[header.indexOf(name.toLowerCase())] ?? '';
      const eventType = parseAction(get('eventType'));
      if (!eventType) return fail(`Unknown event type "${get('eventType')}"`);
      const period = Number(get('period') || 1);
      const secs = get('secondsRemaining') === '' ? null : Number(get('secondsRemaining'));
      const minute = Number(get('minute'));
      if (!Number.isFinite(minute) || minute < 0) return fail(`Invalid minute "${get('minute')}"`);
      const teamId = get('teamId') || null;
      const playerId = get('playerId') || null;
      if (teamId && !ctx.teams.some((t) => t.id === teamId)) return fail('teamId is not a team in this match');
      if (playerId && !ctx.players.some((p) => p.id === playerId)) return fail('playerId is not a match player');
      return {
        ...row,
        event: { eventType, teamId, playerId, period, secondsRemaining: Number.isFinite(secs) ? secs : null, minute, description: get('description') || null, clientId },
      };
    }

    if (cells.length < 5) return fail('Expected: period, clock, team, jersey, action[, detail]');
    const [pRaw, cRaw, tRaw, jRaw, aRaw, ...rest] = cells;
    const period = parsePeriod(pRaw, ctx.rules);
    if (!period) return fail(`Unknown period "${pRaw}"`);
    const secs = parseClock(cRaw);
    if (secs === undefined) return fail(`Clock "${cRaw}" should be mm:ss`);
    if (secs !== null && secs > periodLength(period, ctx.rules)) return fail(`Clock ${cRaw} is longer than the period`);
    const team = findTeam(tRaw, ctx.teams, ctx.homeId, ctx.awayId);
    if (!team) return fail(`Unknown team "${tRaw}"`);
    const eventType = parseAction(aRaw);
    if (!eventType) return fail(`Unknown action "${aRaw}"`);

    let playerId: string | null = null;
    const jersey = jRaw.replace(/^#/, '').trim();
    if (TEAM_ONLY.has(eventType)) {
      if (jersey && jersey !== '-') return fail(`${aRaw} is a team action — leave jersey as "-"`);
    } else {
      if (!/^\d{1,3}$/.test(jersey)) return fail(`Jersey "${jRaw}" should be a number`);
      const matches = ctx.players.filter((p) => p.teamId === team.id && p.no === Number(jersey));
      if (!matches.length) return fail(`No #${jersey} listed for ${team.short}`);
      if (matches.length > 1) return fail(`#${jersey} is listed twice for ${team.short}`);
      playerId = matches[0].id;
    }

    return {
      ...row,
      event: {
        eventType,
        teamId: team.id,
        playerId,
        period,
        secondsRemaining: secs,
        minute: gameMinute(period, secs, ctx.rules),
        description: rest.join(', ') || null,
        clientId,
      },
    };
  });
}
