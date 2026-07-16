import { describe, it, expect } from 'vitest';
import type { MatchStatus, MatchStage } from '@prisma/client';
import { validateMatchForm, matchChecklist, scoresUnlocked, stageLabel, type MatchFormData } from '../match-form';

function form(o: Partial<MatchFormData> = {}): MatchFormData {
  return {
    team1Id: '', team1Name: '', team2Id: '', team2Name: '',
    leagueId: '', seasonId: '', date: '',
    status: 'UPCOMING' as MatchStatus, stage: '' as MatchStage | '',
    team1Score: '', team2Score: '', duration: '',
    ...o,
  };
}

// A complete, valid upcoming fixture in the future.
const valid = form({
  team1Id: 't1', team1Name: 'Home', team2Id: 't2', team2Name: 'Away',
  leagueId: 'l1', seasonId: 's1', stage: 'REGULAR_SEASON', date: '2999-01-01T18:00',
});

describe('validateMatchForm', () => {
  it('passes a complete future fixture', () => {
    expect(validateMatchForm(valid)).toEqual([]);
  });

  it('flags every missing required field', () => {
    const errs = validateMatchForm(form());
    expect(errs).toEqual(expect.arrayContaining([
      'Home team is required', 'Away team is required',
      'League is required', 'Season is required',
      'Match stage is required', 'Date & time is required',
    ]));
  });

  it('rejects an upcoming match scheduled in the past', () => {
    const errs = validateMatchForm({ ...valid, date: '2000-01-01T10:00' });
    expect(errs).toContain('Upcoming matches must be scheduled in the future');
  });

  it('allows a past date when the match is completed', () => {
    expect(validateMatchForm({ ...valid, status: 'COMPLETED', date: '2000-01-01T10:00' })).toEqual([]);
  });

  it('rejects identical home/away teams and out-of-range scores', () => {
    const errs = validateMatchForm({ ...valid, team2Id: 't1', team1Score: '1000' });
    expect(errs).toContain('Home and away team must differ');
    expect(errs).toContain('Home score must be between 0 and 999');
  });

  it('accepts a typed custom team name (no id)', () => {
    const errs = validateMatchForm({ ...valid, team1Id: '', team1Name: 'Walk-on Squad' });
    expect(errs).toEqual([]);
  });
});

describe('matchChecklist', () => {
  it('tracks each requirement independently', () => {
    expect(matchChecklist(form())).toEqual({ teams: false, date: false, league: false, season: false });
    expect(matchChecklist(valid)).toEqual({ teams: true, date: true, league: true, season: true });
  });
});

describe('scoresUnlocked', () => {
  it('unlocks only for live/completed', () => {
    expect(scoresUnlocked('UPCOMING')).toBe(false);
    expect(scoresUnlocked('LIVE')).toBe(true);
    expect(scoresUnlocked('COMPLETED')).toBe(true);
  });
});

describe('stageLabel', () => {
  it('title-cases the enum', () => {
    expect(stageLabel('REGULAR_SEASON')).toBe('Regular Season');
    expect(stageLabel('QUARTER_FINALS')).toBe('Quarter Finals');
  });
});
