/**
 * Turns a league's playoff games into a bracket of best-of-N series.
 *
 * Games are stored one row per game with only a stage (QUARTER_FINALS, …):
 * nothing links a game to its series or a series to the next round. So:
 *  - a series is every game in one stage between the same two teams;
 *  - a round's best-of is the most games scheduled in any of its series,
 *    rounded up to an odd number;
 *  - which series feeds which next-round slot is read from who advanced;
 *  - missing later rounds (e.g. no Final scheduled yet) are added as
 *    placeholders whose teams fill in once their feeders finish.
 */

export type PlayoffTeamRef = { id: string; name: string; short: string };

export type PlayoffGameInput = {
  id: string;
  slug?: string | null;
  stage: string;
  /** ISO date. */
  date: string;
  status: string;
  team1: PlayoffTeamRef | null;
  team2: PlayoffTeamRef | null;
  team1Score: number | null;
  team2Score: number | null;
};

export type SeriesTeam = PlayoffTeamRef & { initials: string };

export type SeriesGame = {
  id: string;
  slug: string | null;
  date: string;
  /** Scores oriented to the series' a/b sides; null until played. */
  a: number | null;
  b: number | null;
  played: boolean;
};

export type PlayoffSeries = {
  id: string;
  a: SeriesTeam | null;
  b: SeriesTeam | null;
  /** Feeder series id when a side is still to be decided. */
  aFrom?: string;
  bFrom?: string;
  bestOf: number;
  games: SeriesGame[];
  wa: number;
  wb: number;
  need: number;
  done: boolean;
  winner: 'a' | 'b' | null;
  /** Series the winner advances to. */
  next?: string;
};

export type PlayoffRound = {
  key: string;
  label: string;
  short: string;
  bestOf: number;
  series: PlayoffSeries[];
};

export type PlayoffBracket = { rounds: PlayoffRound[] };

const STAGE_ORDER = ['QUALIFIER', 'PLAYOFF', 'QUARTER_FINALS', 'SEMI_FINALS', 'CHAMPIONSHIP'];
const STAGE_LABELS: Record<string, { label: string; short: string }> = {
  QUALIFIER: { label: 'Qualifiers', short: 'Q' },
  PLAYOFF: { label: 'First round', short: 'R1' },
  QUARTER_FINALS: { label: 'Quarter-finals', short: 'QF' },
  SEMI_FINALS: { label: 'Semi-finals', short: 'SF' },
  CHAMPIONSHIP: { label: 'Final', short: 'F' },
};
/** Labels for placeholder rounds, by how many series they hold. */
const ROUND_BY_SIZE: Record<number, { key: string; label: string; short: string }> = {
  1: { key: 'CHAMPIONSHIP', label: 'Final', short: 'F' },
  2: { key: 'SEMI_FINALS', label: 'Semi-finals', short: 'SF' },
  4: { key: 'QUARTER_FINALS', label: 'Quarter-finals', short: 'QF' },
};

export function initialsOf(name: string): string {
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

const teamKey = (team: PlayoffTeamRef) => team.id || team.name.trim().toLowerCase();
const withInitials = (team: PlayoffTeamRef): SeriesTeam => ({ ...team, initials: initialsOf(team.name) });
const oddUp = (n: number) => Math.max(1, n % 2 === 0 ? n + 1 : n);
const sameTeam = (x: SeriesTeam | null, y: SeriesTeam | null) => Boolean(x && y && teamKey(x) === teamKey(y));

function finish(series: PlayoffSeries) {
  series.wa = series.games.filter((g) => g.played && (g.a ?? 0) > (g.b ?? 0)).length;
  series.wb = series.games.filter((g) => g.played && (g.b ?? 0) > (g.a ?? 0)).length;
  series.need = Math.ceil(series.bestOf / 2);
  series.done = series.wa >= series.need || series.wb >= series.need;
  series.winner = series.done ? (series.wa > series.wb ? 'a' : 'b') : null;
  // Once decided, any games still scheduled will not be played.
  if (series.done) series.games = series.games.filter((g) => g.played);
}

const winnerOf = (series: PlayoffSeries | undefined) =>
  series?.done && series.winner ? series[series.winner] : null;

function seriesFromGames(games: PlayoffGameInput[]): PlayoffSeries[] {
  const byPair = new Map<string, PlayoffGameInput[]>();
  for (const game of [...games].sort((x, y) => x.date.localeCompare(y.date))) {
    if (!game.team1 || !game.team2) continue;
    const key = [teamKey(game.team1), teamKey(game.team2)].sort().join('|');
    byPair.set(key, [...(byPair.get(key) ?? []), game]);
  }
  return [...byPair.values()].map((pairGames) => {
    const a = pairGames[0].team1!;
    const b = pairGames[0].team2!;
    return {
      id: '',
      a: withInitials(a),
      b: withInitials(b),
      bestOf: 1,
      wa: 0,
      wb: 0,
      need: 1,
      done: false,
      winner: null,
      games: pairGames.map((game) => {
        const flipped = teamKey(game.team1!) !== teamKey(a);
        const played = game.status === 'COMPLETED' && game.team1Score != null && game.team2Score != null;
        return {
          id: game.id,
          slug: game.slug ?? null,
          date: game.date,
          a: played ? (flipped ? game.team2Score : game.team1Score) : null,
          b: played ? (flipped ? game.team1Score : game.team2Score) : null,
          played,
        };
      }),
    };
  });
}

export function buildPlayoffBracket(games: PlayoffGameInput[]): PlayoffBracket {
  const rounds: PlayoffRound[] = [];
  for (const stage of STAGE_ORDER) {
    const stageGames = games.filter((game) => game.stage === stage);
    if (!stageGames.length) continue;
    const series = seriesFromGames(stageGames);
    if (!series.length) continue;
    const bestOf = oddUp(Math.max(...series.map((s) => s.games.length)));
    series.forEach((s) => {
      s.bestOf = bestOf;
      finish(s);
    });
    rounds.push({ key: stage, ...STAGE_LABELS[stage], bestOf, series });
  }
  if (!rounds.length) return { rounds };

  // Add rounds that are not scheduled yet, down to a single Final.
  let last = rounds[rounds.length - 1];
  while (last.key !== 'CHAMPIONSHIP' && last.series.length > 1) {
    const size = Math.ceil(last.series.length / 2);
    const meta = ROUND_BY_SIZE[size] ?? { key: `ROUND_${size}`, label: `Round of ${size * 2}`, short: `R${size * 2}` };
    const series: PlayoffSeries[] = Array.from({ length: size }, () => ({
      id: '', a: null, b: null, bestOf: last.bestOf, games: [], wa: 0, wb: 0, need: Math.ceil(last.bestOf / 2), done: false, winner: null,
    }));
    last = { ...meta, bestOf: last.bestOf, series };
    rounds.push(last);
  }

  // Order each round to line up with the next one, working back from the Final.
  const targetOf = new Map<PlayoffSeries, PlayoffSeries>();
  const feedersOf = new Map<PlayoffSeries, { a?: PlayoffSeries; b?: PlayoffSeries }>();
  const byFirstGame = (x: PlayoffSeries, y: PlayoffSeries) =>
    (x.games[0]?.date ?? '').localeCompare(y.games[0]?.date ?? '');
  rounds[rounds.length - 1].series.sort(byFirstGame);
  for (let r = rounds.length - 2; r >= 0; r -= 1) {
    const pool = [...rounds[r].series].sort(byFirstGame);
    const take = (pick: (s: PlayoffSeries) => boolean) => {
      const index = pool.findIndex(pick);
      return index >= 0 ? pool.splice(index, 1)[0] : undefined;
    };
    const slots: { target: PlayoffSeries; side: 'a' | 'b'; feeder?: PlayoffSeries }[] = [];
    for (const target of rounds[r + 1].series)
      for (const side of ['a', 'b'] as const) {
        const team = target[side];
        // Prefer the series that team won; fall back to any series it played in.
        const feeder = team
          ? take((s) => sameTeam(winnerOf(s), team)) ?? take((s) => sameTeam(s.a, team) || sameTeam(s.b, team))
          : undefined;
        slots.push({ target, side, feeder });
      }
    // Open slots (placeholder rounds) take the remaining series in date order.
    for (const slot of slots) if (!slot.feeder) slot.feeder = pool.shift();
    rounds[r].series = [...slots.flatMap((slot) => (slot.feeder ? [slot.feeder] : [])), ...pool];
    for (const { target, side, feeder } of slots) {
      if (!feeder) continue;
      targetOf.set(feeder, target);
      feedersOf.set(target, { ...feedersOf.get(target), [side]: feeder });
    }
  }

  // Name series in bracket order, then link feeders and fill decided slots.
  for (const round of rounds)
    round.series.forEach((s, i) => {
      s.id = round.series.length === 1 && round.key === 'CHAMPIONSHIP' ? 'Final' : `${round.short}${i + 1}`;
    });
  for (const round of rounds)
    for (const s of round.series) {
      const target = targetOf.get(s);
      if (target) s.next = target.id;
      const feeders = feedersOf.get(s);
      for (const side of ['a', 'b'] as const) {
        const feeder = feeders?.[side];
        if (!feeder || s[side]) continue;
        s[side] = winnerOf(feeder);
        if (!s[side]) s[`${side}From`] = feeder.id;
      }
    }
  return { rounds };
}
