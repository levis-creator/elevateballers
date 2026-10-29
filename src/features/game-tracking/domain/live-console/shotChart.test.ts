import { describe, expect, it } from 'vitest';
import { chartPoint, collectShots, courtPaths, fieldGoalAttempts, summariseShots } from './shotChart';

const ev = (eventType: string, metadata: unknown, extra: Record<string, unknown> = {}) => ({
  eventType,
  teamId: 'h',
  playerId: 'p1',
  metadata,
  ...extra,
});

const events = [
  ev('TWO_POINT_MADE', { shot: { x: 0.5, y: 0.27, zone: 'PAINT' } }),
  ev('TWO_POINT_MISSED', { shot: { x: 0.22, y: 0.16, zone: 'LEFT_MID' } }),
  ev('THREE_POINT_MADE', { shot: { x: 0.5, y: 0.72, zone: 'TOP_3' } }),
  ev('THREE_POINT_MISSED', {}), // no location
  ev('TWO_POINT_MADE', { shot: { x: 0.5, y: 0.27 } }, { isUndone: true }),
  ev('TWO_POINT_MADE', { shot: { x: 0.5, y: 0.27 } }, { teamId: 'a' }),
  ev('FREE_THROW_MADE', { shot: { x: 0.5, y: 0.4 } }),
];

describe('shot chart data', () => {
  it('collects located, live field goals for one team', () => {
    const shots = collectShots(events, 'h');
    expect(shots.map((s) => [s.zone, s.made, s.three])).toEqual([
      ['PAINT', true, false],
      ['LEFT_MID', false, false],
      ['TOP_3', true, true],
    ]);
    expect(collectShots(events, 'a')).toHaveLength(1);
    expect(collectShots(events, null)).toEqual([]);
  });

  it('counts all field goal attempts, located or not', () => {
    expect(fieldGoalAttempts(events, 'h')).toBe(4);
  });

  it('summarises by area', () => {
    expect(summariseShots(collectShots(events, 'h'))).toEqual([
      { group: 'Paint', made: 1, attempts: 1, pct: 100 },
      { group: 'Mid-range', made: 0, attempts: 1, pct: 0 },
      { group: '3PT', made: 1, attempts: 1, pct: 100 },
    ]);
    expect(summariseShots([])[0].pct).toBeNull();
  });

  it('maps shots and court lines into the 150 × 140 viewBox', () => {
    expect(chartPoint({ x: 1, y: 0.5 })).toEqual({ cx: 150, cy: 70 });
    expect(courtPaths().three.startsWith('M 9 0')).toBe(true);
  });
});
