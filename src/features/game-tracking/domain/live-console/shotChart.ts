/**
 * Shot chart data shared by the public match page, the match centre and the
 * stat sheet PDF: the located field goals from an event log, per-zone
 * summaries, and the half-court lines as SVG paths (150 × 140 viewBox,
 * decimetres, basket at the top) so every chart draws the same court.
 */
import {
  BASKET,
  CORNER_DEPTH,
  CORNER_INSET,
  COURT_D,
  COURT_W,
  KEY_D,
  KEY_W,
  THREE_R,
  shotLocationOf,
  type ShotZone,
} from './shotZones';

export const CHART_W = COURT_W * 10;
export const CHART_H = COURT_D * 10;

export interface ChartShot {
  /** 0–1 across, 0–1 from the baseline (see shotZones). */
  x: number;
  y: number;
  zone: ShotZone;
  made: boolean;
  three: boolean;
  playerId: string | null;
}

type ShotEventLike = {
  eventType: string;
  teamId?: string | null;
  playerId?: string | null;
  isUndone?: boolean;
  metadata?: unknown;
};

const FIELD_GOALS: Record<string, { made: boolean; three: boolean }> = {
  TWO_POINT_MADE: { made: true, three: false },
  TWO_POINT_MISSED: { made: false, three: false },
  THREE_POINT_MADE: { made: true, three: true },
  THREE_POINT_MISSED: { made: false, three: true },
};

/** Located field goals for one team, in event order. */
export function collectShots(events: ShotEventLike[], teamId: string | null | undefined): ChartShot[] {
  const shots: ChartShot[] = [];
  for (const e of events) {
    const fg = FIELD_GOALS[e.eventType];
    if (!fg || e.isUndone || !teamId || e.teamId !== teamId) continue;
    const loc = shotLocationOf(e.metadata as Record<string, unknown> | null);
    if (loc) shots.push({ ...loc, ...fg, playerId: e.playerId ?? null });
  }
  return shots;
}

/** Field goals attempted by a team, located or not — for "x of y located". */
export function fieldGoalAttempts(events: ShotEventLike[], teamId: string | null | undefined): number {
  return events.filter((e) => FIELD_GOALS[e.eventType] && !e.isUndone && teamId && e.teamId === teamId).length;
}

export type ZoneGroup = 'Paint' | 'Mid-range' | '3PT';

export interface ZoneSummary {
  group: ZoneGroup;
  made: number;
  attempts: number;
  /** Whole percent, or null with no attempts. */
  pct: number | null;
}

const GROUP_OF: Record<ShotZone, ZoneGroup> = {
  PAINT: 'Paint',
  LEFT_MID: 'Mid-range',
  TOP_MID: 'Mid-range',
  RIGHT_MID: 'Mid-range',
  LEFT_CORNER_3: '3PT',
  LEFT_WING_3: '3PT',
  TOP_3: '3PT',
  RIGHT_WING_3: '3PT',
  RIGHT_CORNER_3: '3PT',
};

/** Made / attempted by area: paint, mid-range and three. */
export function summariseShots(shots: ChartShot[]): ZoneSummary[] {
  return (['Paint', 'Mid-range', '3PT'] as ZoneGroup[]).map((group) => {
    const inGroup = shots.filter((s) => GROUP_OF[s.zone] === group);
    const made = inGroup.filter((s) => s.made).length;
    return { group, made, attempts: inGroup.length, pct: inGroup.length ? Math.round((made / inGroup.length) * 100) : null };
  });
}

/** Chart coordinates (viewBox units, y down) for a shot. */
export function chartPoint(s: { x: number; y: number }): { cx: number; cy: number } {
  return { cx: s.x * CHART_W, cy: s.y * CHART_H };
}

/** The half-court lines as SVG path data in the 150 × 140 viewBox. */
export function courtPaths(): { key: string; ftCircle: string; three: string; restricted: string; backboard: string; rim: string; outline: string } {
  const bx = BASKET.x * 10;
  const by = BASKET.y * 10;
  const kw = KEY_W * 10;
  const kd = KEY_D * 10;
  const r3 = THREE_R * 10;
  const ci = CORNER_INSET * 10;
  const cd = CORNER_DEPTH * 10;
  const circle = (cx: number, cy: number, r: number) =>
    `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  return {
    outline: `M 0 0 H ${CHART_W} V ${CHART_H} H 0 Z`,
    key: `M ${bx - kw / 2} 0 V ${kd} H ${bx + kw / 2} V 0`,
    ftCircle: circle(bx, kd, 18),
    three: `M ${ci} 0 V ${cd} A ${r3} ${r3} 0 0 0 ${CHART_W - ci} ${cd} V 0`,
    restricted: `M ${bx - 12.5} ${by} A 12.5 12.5 0 0 0 ${bx + 12.5} ${by}`,
    backboard: `M ${bx - 9} 12 H ${bx + 9}`,
    rim: circle(bx, by, 2.3),
  };
}
