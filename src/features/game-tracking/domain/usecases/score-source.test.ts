import { describe, expect, it, vi } from 'vitest';
import {
  classifyScoreSource,
  scoreSourceAfterManualEdit,
  updateMatchScoresFromEvents,
  type ScoreSourceEvidence,
} from './score-calculation';

describe('scoreSourceAfterManualEdit', () => {
  it('marks a typed-in score as manual', () => {
    expect(scoreSourceAfterManualEdit('NONE', 70, 65)).toBe('MANUAL');
    expect(scoreSourceAfterManualEdit(undefined, 0, null)).toBe('MANUAL');
  });

  it('resets to none when both scores are cleared', () => {
    expect(scoreSourceAfterManualEdit('MANUAL', null, null)).toBe('NONE');
  });

  it('keeps play-by-play matches play-by-play', () => {
    expect(scoreSourceAfterManualEdit('PLAY_BY_PLAY', 80, 72)).toBe('PLAY_BY_PLAY');
    expect(scoreSourceAfterManualEdit('PLAY_BY_PLAY', null, null)).toBe('PLAY_BY_PLAY');
  });
});

const evidence = (over: Partial<ScoreSourceEvidence> = {}): ScoreSourceEvidence => ({
  status: 'COMPLETED',
  team1Score: null,
  team2Score: null,
  scoringEvents: 0,
  otherEvents: 0,
  eventTeam1Score: 0,
  eventTeam2Score: 0,
  ...over,
});

describe('classifyScoreSource', () => {
  it('treats any made shot as play-by-play', () => {
    expect(
      classifyScoreSource(evidence({ team1Score: 4, team2Score: 3, scoringEvents: 3, eventTeam1Score: 4, eventTeam2Score: 3 })),
    ).toEqual({ source: 'PLAY_BY_PLAY', review: null });
  });

  it('flags play-by-play matches whose stored score differs from the events', () => {
    const r = classifyScoreSource(evidence({ team1Score: 60, team2Score: 58, scoringEvents: 40, eventTeam1Score: 52, eventTeam2Score: 58 }));
    expect(r.source).toBe('PLAY_BY_PLAY');
    expect(r.review).toContain('52–58');
  });

  it('treats a stored score without made shots as manual', () => {
    expect(classifyScoreSource(evidence({ team1Score: 70, team2Score: 65 }))).toEqual({ source: 'MANUAL', review: null });
  });

  it('flags manual scores that still have other events logged', () => {
    const r = classifyScoreSource(evidence({ team1Score: 70, team2Score: 65, otherEvents: 4 }));
    expect(r.source).toBe('MANUAL');
    expect(r.review).toContain('4 other events');
  });

  it('leaves unscored matches as none and flags completed ones', () => {
    expect(classifyScoreSource(evidence({ status: 'UPCOMING' }))).toEqual({ source: 'NONE', review: null });
    expect(classifyScoreSource(evidence()).review).toContain('no score');
  });
});

describe('updateMatchScoresFromEvents', () => {
  it('never overwrites a manual score', async () => {
    const db = {
      match: {
        findUnique: vi.fn().mockResolvedValue({ status: 'COMPLETED', team1Score: 70, team2Score: 65, scoreSource: 'MANUAL' }),
        update: vi.fn(),
      },
      matchEvent: { findMany: vi.fn() },
    };
    await expect(updateMatchScoresFromEvents('m1', db)).resolves.toBe(true);
    expect(db.match.update).not.toHaveBeenCalled();
    expect(db.matchEvent.findMany).not.toHaveBeenCalled();
  });
});
