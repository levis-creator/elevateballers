import { describe, expect, it } from 'vitest';
import { activityLabel, rosterActionLabel } from './history-labels';

describe('rosterActionLabel', () => {
  it('names dropouts, reinstatements and transfers', () => {
    expect(rosterActionLabel('ROSTER_DROPPED_OUT')).toBe('Dropped out of the league');
    expect(rosterActionLabel('ROSTER_REINSTATED')).toBe('Reinstated');
    expect(rosterActionLabel('TRANSFER_OUT')).toBe('Transferred out');
  });

  it('falls back to readable text for codes it does not know', () => {
    expect(rosterActionLabel('ROSTER_SOMETHING_NEW')).toBe('Roster something new');
    expect(rosterActionLabel(null)).toBe('');
  });
});

describe('activityLabel', () => {
  it('describes review-queue decisions by request type', () => {
    expect(activityLabel({ action: 'ROSTER_REQUEST_APPROVED', metadata: { type: 'DROPOUT' } })).toBe(
      "approved the coach's dropout report"
    );
    expect(activityLabel({ action: 'ROSTER_REQUEST_REJECTED', metadata: { type: 'REMOVAL' } })).toBe(
      "declined the coach's removal"
    );
  });

  it('includes the reason and suspension length', () => {
    expect(activityLabel({ action: 'PLAYER_DROPPED_OUT', metadata: { reason: 'Relocated' } })).toBe(
      'marked this player as dropped out — “Relocated”'
    );
    expect(activityLabel({ action: 'PLAYER_SUSPENDED', metadata: { matchCount: 2 } })).toBe(
      'suspended this player for 2 matches'
    );
  });

  it('humanizes unknown codes', () => {
    expect(activityLabel({ action: 'SOME_OTHER_THING' })).toBe('some other thing');
  });
});
