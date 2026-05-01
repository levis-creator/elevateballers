import { describe, expect, it } from 'vitest';
import {
  formatMatchDate,
  formatMatchDateTime,
  formatMatchTime,
  getRelativeTimeDescription,
  MATCH_TIMEZONE,
} from '../utils';

// All assertions assume the default Africa/Nairobi (UTC+3) match timezone.
// They must hold regardless of the host's ICU/timezone-data support — that's
// the whole point of the module's offset-based formatting.

describe('match date formatting (Africa/Nairobi, UTC+3)', () => {
  it('uses Africa/Nairobi by default', () => {
    expect(MATCH_TIMEZONE).toBe('Africa/Nairobi');
  });

  it('formats time in Africa/Nairobi from a UTC instant', () => {
    // 15:00 UTC = 18:00 Nairobi
    expect(formatMatchTime('2026-05-15T15:00:00Z')).toBe('06:00 PM');
  });

  it('handles a UTC instant that crosses midnight into the next Nairobi day', () => {
    // 22:30 UTC May 14 = 01:30 May 15 Nairobi
    expect(formatMatchTime('2026-05-14T22:30:00Z')).toBe('01:30 AM');
    expect(formatMatchDate('2026-05-14T22:30:00Z')).toBe('May 15, 2026');
  });

  it('formats noon Nairobi correctly', () => {
    // 09:00 UTC = 12:00 Nairobi
    expect(formatMatchTime('2026-05-15T09:00:00Z')).toBe('12:00 PM');
  });

  it('formats midnight Nairobi correctly', () => {
    // 21:00 UTC May 14 = 00:00 May 15 Nairobi
    expect(formatMatchTime('2026-05-14T21:00:00Z')).toBe('12:00 AM');
    expect(formatMatchDate('2026-05-14T21:00:00Z')).toBe('May 15, 2026');
  });

  it('combines date and time consistently', () => {
    expect(formatMatchDateTime('2026-05-15T15:00:00Z')).toBe('May 15, 2026, 06:00 PM');
  });

  it('accepts Date objects as well as ISO strings', () => {
    expect(formatMatchTime(new Date('2026-05-15T15:00:00Z'))).toBe('06:00 PM');
  });
});

describe('getRelativeTimeDescription (Africa/Nairobi)', () => {
  it('reports "Today" for the same Nairobi day', () => {
    const now = new Date();
    expect(getRelativeTimeDescription(now)).toBe('Today');
  });

  it('reports "Tomorrow" for ~24h ahead', () => {
    const future = new Date(Date.now() + 36 * 60 * 60 * 1000);
    // ~36h ahead lands on tomorrow's Nairobi day regardless of current Nairobi hour
    const result = getRelativeTimeDescription(future);
    expect(['Tomorrow', 'in 2 days']).toContain(result);
  });

  it('reports "Yesterday" for ~24h ago', () => {
    const past = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const result = getRelativeTimeDescription(past);
    expect(['Yesterday', '2 days ago']).toContain(result);
  });
});
