/**
 * Pure derivation of the three stat-leader cards (points / rebounds / assists)
 * shown on the admin match-detail view. Works off the already-computed box
 * score, so it never re-touches raw events.
 */
import type { BoxRow } from '../entities/match-detail-v2';

export type LeaderKey = 'pts' | 'reb' | 'ast';

export interface LeaderCard {
  key: LeaderKey;
  label: string;
  name: string;
  team: string;
  value: number;
}

interface Tagged {
  row: BoxRow;
  team: string;
}

const DEFS: { key: LeaderKey; label: string; pick: (r: BoxRow) => number }[] = [
  { key: 'pts', label: 'Points Leader', pick: (r) => r.pts },
  { key: 'reb', label: 'Rebounds Leader', pick: (r) => r.reb },
  { key: 'ast', label: 'Assists Leader', pick: (r) => r.ast },
];

/**
 * Returns one leader card per stat. Empty when there are no players at all, or
 * when the whole match recorded zero of every tracked stat (nothing to lead).
 */
export function computeLeaders(
  box: { home: BoxRow[]; away: BoxRow[] },
  homeTeam: string,
  awayTeam: string,
): LeaderCard[] {
  const all: Tagged[] = [
    ...box.home.map((row) => ({ row, team: homeTeam })),
    ...box.away.map((row) => ({ row, team: awayTeam })),
  ];
  if (all.length === 0) return [];

  const cards: LeaderCard[] = [];
  for (const def of DEFS) {
    const best = all.reduce((top, cur) => (def.pick(cur.row) > def.pick(top.row) ? cur : top));
    const value = def.pick(best.row);
    if (value <= 0) continue; // no one recorded this stat — skip the card
    cards.push({ key: def.key, label: def.label, name: best.row.name, team: best.team, value });
  }
  return cards;
}
