import { describe, expect, it } from 'vitest';
import type { PublicCompetitionOption } from '@/features/seasons/domain/entities/public-competition';
import { buildPotwSlots, currentPotwSlots, leagueShortName, potwSlotKey } from '../potw-slots';

const competition = (overrides: Partial<PublicCompetitionOption>): PublicCompetitionOption => ({
  id: 'ls',
  seasonId: 's',
  seasonLabel: '2026 Season',
  leagueId: 'l',
  leagueLabel: 'League',
  structure: 'SINGLE_TABLE',
  startDate: '2026-01-01T00:00:00.000Z',
  conferences: [],
  ...overrides,
});

const ebl2026 = competition({
  id: 'ebl-26', seasonId: 's26', leagueId: 'ebl', leagueLabel: 'Elevate Ballers League (EBL)',
  structure: 'CONFERENCES', conferences: [{ id: 'clutch', name: 'Clutch' }, { id: 'grind', name: 'Grind' }],
});
const ewbl2026 = competition({
  id: 'ewbl-26', seasonId: 's26', leagueId: 'ewbl', leagueLabel: "Elevate Women's Basketball League",
});
const ebl2025 = competition({
  id: 'ebl-25', seasonId: 's25', leagueId: 'ebl', leagueLabel: 'Elevate Ballers League (EBL)',
  startDate: '2025-01-01T00:00:00.000Z', structure: 'CONFERENCES', conferences: [{ id: 'old', name: 'East' }],
});

describe('leagueShortName', () => {
  it('prefers a bracketed code, otherwise uses initials', () => {
    expect(leagueShortName('Elevate Ballers League (EBL)')).toBe('EBL');
    expect(leagueShortName("Elevate Women's Basketball League")).toBe('EWBL');
  });
});

describe('buildPotwSlots', () => {
  it('gives a conference league one slot per conference and a single-table league one slot', () => {
    const slots = buildPotwSlots([ebl2026, ewbl2026]);
    expect(slots.map((slot) => [slot.leagueSeasonId, slot.conferenceId, slot.label])).toEqual([
      ['ebl-26', 'clutch', 'Clutch'],
      ['ebl-26', 'grind', 'Grind'],
      ['ewbl-26', null, 'EWBL'],
    ]);
  });

  it('treats a conference league with no conferences configured as one league-wide slot', () => {
    const slots = buildPotwSlots([competition({ id: 'x', structure: 'CONFERENCES', leagueLabel: 'Open League' })]);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ conferenceId: null, label: 'OL' });
  });
});

describe('currentPotwSlots', () => {
  it('keeps only the latest edition of each league', () => {
    const slots = currentPotwSlots([ebl2025, ebl2026, ewbl2026]);
    expect(slots.map((slot) => slot.key)).toEqual([
      potwSlotKey('ebl-26', 'clutch'),
      potwSlotKey('ebl-26', 'grind'),
      potwSlotKey('ewbl-26', null),
    ]);
  });
});
