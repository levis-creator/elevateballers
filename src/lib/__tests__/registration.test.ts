import { describe, it, expect } from 'vitest';
import {
  isRegistrationOpen,
  registrationClosedMessage,
  type RegistrationLeagueFields,
  type RegistrationSeasonFields,
} from '../registration';

const NOW = new Date('2026-07-02T12:00:00.000Z');
const PAST = new Date('2026-06-01T00:00:00.000Z');
const FUTURE = new Date('2026-08-01T00:00:00.000Z');

/** A fully-open league: master switch on, no window. */
const openLeague = (over: Partial<RegistrationLeagueFields> = {}): RegistrationLeagueFields => ({
  registrationOpen: true,
  registrationOpensAt: null,
  registrationClosesAt: null,
  ...over,
});

const season = (over: Partial<RegistrationSeasonFields> = {}): RegistrationSeasonFields => ({
  registrationOpensAt: null,
  registrationClosesAt: null,
  ...over,
});

describe('isRegistrationOpen — league master switch', () => {
  it('is open when the switch is on and no window is set', () => {
    expect(isRegistrationOpen(openLeague(), null, NOW).open).toBe(true);
  });

  it('is closed when the master switch is off, regardless of window', () => {
    const status = isRegistrationOpen(
      openLeague({ registrationOpen: false, registrationClosesAt: FUTURE }),
      null,
      NOW
    );
    expect(status.open).toBe(false);
    expect(status.reason).toBe('closed');
  });
});

describe('isRegistrationOpen — league window', () => {
  it('is closed before the league opensAt', () => {
    const status = isRegistrationOpen(openLeague({ registrationOpensAt: FUTURE }), null, NOW);
    expect(status).toMatchObject({ open: false, reason: 'league-not-yet-open' });
  });

  it('is closed after the league deadline', () => {
    const status = isRegistrationOpen(openLeague({ registrationClosesAt: PAST }), null, NOW);
    expect(status).toMatchObject({ open: false, reason: 'league-deadline-passed' });
  });

  it('is open inside the league window', () => {
    const status = isRegistrationOpen(
      openLeague({ registrationOpensAt: PAST, registrationClosesAt: FUTURE }),
      null,
      NOW
    );
    expect(status.open).toBe(true);
  });

  it('treats the deadline as inclusive (open exactly at closesAt)', () => {
    const status = isRegistrationOpen(openLeague({ registrationClosesAt: NOW }), null, NOW);
    expect(status.open).toBe(true);
  });
});

describe('isRegistrationOpen — season window narrows the league', () => {
  it('is closed after the season deadline even when the league is open', () => {
    const status = isRegistrationOpen(openLeague(), season({ registrationClosesAt: PAST }), NOW);
    expect(status).toMatchObject({ open: false, reason: 'season-deadline-passed' });
  });

  it('is closed before the season opens even when the league is open', () => {
    const status = isRegistrationOpen(openLeague(), season({ registrationOpensAt: FUTURE }), NOW);
    expect(status).toMatchObject({ open: false, reason: 'season-not-yet-open' });
  });

  it('is open when both league and season windows contain now', () => {
    const status = isRegistrationOpen(
      openLeague({ registrationClosesAt: FUTURE }),
      season({ registrationOpensAt: PAST, registrationClosesAt: FUTURE }),
      NOW
    );
    expect(status.open).toBe(true);
  });

  it('surfaces the earliest deadline as the effective closesAt', () => {
    const status = isRegistrationOpen(
      openLeague({ registrationClosesAt: FUTURE }),
      season({ registrationClosesAt: NOW }),
      NOW
    );
    expect(status.closesAt?.getTime()).toBe(NOW.getTime());
  });
});

describe('isRegistrationOpen — input coercion', () => {
  it('accepts ISO date strings (as delivered over JSON)', () => {
    const status = isRegistrationOpen(
      { registrationOpen: true, registrationOpensAt: PAST.toISOString(), registrationClosesAt: FUTURE.toISOString() },
      null,
      NOW
    );
    expect(status.open).toBe(true);
  });

  it('ignores invalid date values rather than throwing', () => {
    const status = isRegistrationOpen(
      { registrationOpen: true, registrationOpensAt: 'not-a-date', registrationClosesAt: null },
      null,
      NOW
    );
    expect(status.open).toBe(true);
  });
});

describe('registrationClosedMessage', () => {
  it('mentions the open date when not yet open', () => {
    const status = isRegistrationOpen(openLeague({ registrationOpensAt: FUTURE }), null, NOW);
    expect(registrationClosedMessage(status)).toContain('opens on');
  });

  it('mentions the deadline when it has passed', () => {
    const status = isRegistrationOpen(openLeague({ registrationClosesAt: PAST }), null, NOW);
    expect(registrationClosedMessage(status)).toContain('deadline');
  });

  it('gives a generic closed message when the switch is off', () => {
    const status = isRegistrationOpen(openLeague({ registrationOpen: false }), null, NOW);
    expect(registrationClosedMessage(status)).toContain('closed');
  });
});
