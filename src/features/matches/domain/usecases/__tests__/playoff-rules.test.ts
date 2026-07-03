import { describe, expect, it } from 'vitest';
import { isPlayoffStage, validatePlayoffMatch } from '../playoff-rules';

describe('isPlayoffStage', () => {
  it('recognises bracket stages', () => {
    expect(isPlayoffStage('SEMI_FINALS')).toBe(true);
    expect(isPlayoffStage('CHAMPIONSHIP')).toBe(true);
    expect(isPlayoffStage('QUALIFIER')).toBe(true);
  });

  it('rejects non-bracket stages and empty values', () => {
    expect(isPlayoffStage('REGULAR_SEASON')).toBe(false);
    expect(isPlayoffStage('EXHIBITION')).toBe(false);
    expect(isPlayoffStage(null)).toBe(false);
    expect(isPlayoffStage(undefined)).toBe(false);
  });
});

describe('validatePlayoffMatch', () => {
  const valid = { stage: 'SEMI_FINALS', seasonId: 's1', team1Id: 't1', team2Id: 't2' };

  it('passes a complete playoff match', () => {
    expect(validatePlayoffMatch(valid)).toBeNull();
  });

  it('ignores non-playoff matches entirely', () => {
    expect(
      validatePlayoffMatch({ stage: 'REGULAR_SEASON', seasonId: null, team1Id: null, team2Id: null })
    ).toBeNull();
    expect(validatePlayoffMatch({ stage: null })).toBeNull();
  });

  it('flags a missing season', () => {
    const err = validatePlayoffMatch({ ...valid, seasonId: null });
    expect(err).toMatch(/season/i);
  });

  it('flags a missing team on either side', () => {
    expect(validatePlayoffMatch({ ...valid, team1Id: '' })).toMatch(/team 1/i);
    expect(validatePlayoffMatch({ ...valid, team2Id: null })).toMatch(/team 2/i);
  });

  it('lists every missing field at once', () => {
    const err = validatePlayoffMatch({ stage: 'CHAMPIONSHIP' });
    expect(err).toMatch(/season/i);
    expect(err).toMatch(/team 1/i);
    expect(err).toMatch(/team 2/i);
  });
});
