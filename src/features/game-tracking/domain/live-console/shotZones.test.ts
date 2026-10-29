import { describe, expect, it } from 'vitest';
import { SHOT_ZONES, isThreeAt, locationAt, locationForZone, shotLocationOf, zoneAt } from './shotZones';

describe('shot zones', () => {
  it('puts every keyboard zone spot inside its own zone and on the right side of the arc', () => {
    for (const z of SHOT_ZONES) {
      expect(zoneAt(z.x, z.y)).toBe(z.zone);
      expect(isThreeAt(z.x, z.y)).toBe(z.three);
    }
  });

  it('separates twos and threes at the arc and in the corners', () => {
    expect(isThreeAt(0.5, 0.1)).toBe(false); // under the basket
    expect(isThreeAt(0.5, 0.62)).toBe(true); // 8.7 m out at the top
    expect(isThreeAt(0.03, 0.1)).toBe(true); // corner, outside the 0.9 m line
    expect(isThreeAt(0.1, 0.1)).toBe(false); // corner, inside the line
  });

  it('rounds tapped spots and clamps them to the court', () => {
    expect(locationAt(0.12345, 1.4)).toEqual({ x: 0.123, y: 1, zone: 'LEFT_WING_3' });
    expect(locationAt(0.5, 1.4).zone).toBe('TOP_3');
  });

  it('maps keys 1–9 and rejects others', () => {
    expect(locationForZone(8)?.zone).toBe('PAINT');
    expect(locationForZone(9)).toBeNull();
  });

  it('reads stored locations defensively', () => {
    expect(shotLocationOf({ shot: { x: 0.5, y: 0.17, zone: 'PAINT' } })?.zone).toBe('PAINT');
    expect(shotLocationOf({ shot: { x: 0.5, y: 0.17, zone: 'NOPE' } })?.zone).toBe('PAINT');
    expect(shotLocationOf({ shot: { x: '1' } })).toBeNull();
    expect(shotLocationOf(null)).toBeNull();
  });
});
