/**
 * Half-court geometry for shot locations, to FIBA dimensions.
 *
 * Locations are normalised: x 0–1 across the court (0 = the left sideline as
 * drawn, basket at the top), y 0–1 from the baseline to the half-court line.
 * Stored on the shot event as `metadata.shot = { x, y, zone }`.
 */

/** Half court in metres: 15 wide, 14 deep. */
export const COURT_W = 15;
export const COURT_D = 14;
/** Basket centre, metres from the left sideline and the baseline. */
export const BASKET = { x: 7.5, y: 1.575 };
export const THREE_R = 6.75;
/** The three-point line runs straight 0.9 m in from each sideline… */
export const CORNER_INSET = 0.9;
/** …until it meets the arc this far from the baseline. */
export const CORNER_DEPTH = BASKET.y + Math.sqrt(THREE_R ** 2 - (BASKET.x - CORNER_INSET) ** 2);
export const KEY_W = 4.9;
export const KEY_D = 5.8;

export type ShotZone =
  | 'LEFT_CORNER_3'
  | 'LEFT_WING_3'
  | 'TOP_3'
  | 'RIGHT_WING_3'
  | 'RIGHT_CORNER_3'
  | 'LEFT_MID'
  | 'TOP_MID'
  | 'RIGHT_MID'
  | 'PAINT';

export interface ShotLocation {
  x: number;
  y: number;
  zone: ShotZone;
}

/** Zones in keyboard order (1–9), each with the spot a key press records. */
export const SHOT_ZONES: Array<{ zone: ShotZone; label: string; three: boolean; x: number; y: number }> = [
  { zone: 'LEFT_CORNER_3', label: 'Left corner 3', three: true, x: 0.045, y: 0.09 },
  { zone: 'LEFT_WING_3', label: 'Left wing 3', three: true, x: 0.13, y: 0.5 },
  { zone: 'TOP_3', label: 'Top 3', three: true, x: 0.5, y: 0.72 },
  { zone: 'RIGHT_WING_3', label: 'Right wing 3', three: true, x: 0.87, y: 0.5 },
  { zone: 'RIGHT_CORNER_3', label: 'Right corner 3', three: true, x: 0.955, y: 0.09 },
  { zone: 'LEFT_MID', label: 'Left mid-range', three: false, x: 0.22, y: 0.16 },
  { zone: 'TOP_MID', label: 'Top mid-range', three: false, x: 0.5, y: 0.5 },
  { zone: 'RIGHT_MID', label: 'Right mid-range', three: false, x: 0.78, y: 0.16 },
  { zone: 'PAINT', label: 'Paint', three: false, x: 0.5, y: 0.27 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** True when the spot is behind the three-point line. */
export function isThreeAt(x: number, y: number): boolean {
  const mx = clamp01(x) * COURT_W;
  const my = clamp01(y) * COURT_D;
  if (my <= CORNER_DEPTH) return mx < CORNER_INSET || mx > COURT_W - CORNER_INSET;
  return Math.hypot(mx - BASKET.x, my - BASKET.y) > THREE_R;
}

/** Degrees from straight out of the basket; negative is the left side. */
function angleFromBasket(mx: number, my: number): number {
  return (Math.atan2(mx - BASKET.x, my - BASKET.y) * 180) / Math.PI;
}

export function zoneAt(x: number, y: number): ShotZone {
  const mx = clamp01(x) * COURT_W;
  const my = clamp01(y) * COURT_D;
  if (isThreeAt(x, y)) {
    if (my <= CORNER_DEPTH) return mx < BASKET.x ? 'LEFT_CORNER_3' : 'RIGHT_CORNER_3';
    const a = angleFromBasket(mx, my);
    return Math.abs(a) <= 22 ? 'TOP_3' : a < 0 ? 'LEFT_WING_3' : 'RIGHT_WING_3';
  }
  if (Math.abs(mx - BASKET.x) <= KEY_W / 2 && my <= KEY_D) return 'PAINT';
  const a = angleFromBasket(mx, my);
  return Math.abs(a) <= 30 ? 'TOP_MID' : a < 0 ? 'LEFT_MID' : 'RIGHT_MID';
}

/** A tapped spot, rounded to 3 decimals so stored metadata stays small. */
export function locationAt(x: number, y: number): ShotLocation {
  const r = (v: number) => Math.round(clamp01(v) * 1000) / 1000;
  return { x: r(x), y: r(y), zone: zoneAt(x, y) };
}

/** The recorded spot for keyboard zone 1–9. */
export function locationForZone(index: number): ShotLocation | null {
  const z = SHOT_ZONES[index];
  return z ? { x: z.x, y: z.y, zone: z.zone } : null;
}

/** Reads `metadata.shot` from an event, or null when it's missing or malformed. */
export function shotLocationOf(metadata: Record<string, unknown> | null | undefined): ShotLocation | null {
  const s = metadata?.shot as Partial<ShotLocation> | undefined;
  if (!s || typeof s.x !== 'number' || typeof s.y !== 'number') return null;
  return { x: clamp01(s.x), y: clamp01(s.y), zone: s.zone && SHOT_ZONES.some((z) => z.zone === s.zone) ? s.zone : zoneAt(s.x, s.y) };
}
