import { describe, it, expect } from 'vitest';
import type { Player } from '@prisma/client';
import type { MatchPlayerWithDetails } from '../../../cms/types';
import { deriveRoster, type SubstitutionHistoryEntry } from '../roster';

// Minimal fixture helpers. We cast through `unknown` because the Prisma types
// include many fields irrelevant to the classifier — the helper only reads
// `id`, `playerId`, `isActive`, `subOut`, `started`.
function mp(overrides: {
  id: string;
  playerId: string;
  isActive?: boolean;
  subOut?: boolean;
  started?: boolean;
}): MatchPlayerWithDetails {
  return {
    id: overrides.id,
    playerId: overrides.playerId,
    isActive: overrides.isActive ?? false,
    subOut: overrides.subOut ?? false,
    started: overrides.started ?? false,
    player: { id: overrides.playerId } as Player,
  } as unknown as MatchPlayerWithDetails;
}

function player(id: string): Player {
  return { id } as Player;
}

describe('deriveRoster', () => {
  it('returns all-empty buckets when every input is empty', () => {
    expect(deriveRoster([], [], [])).toEqual({ onFloor: [], onBench: [], reserves: [] });
  });

  it('classifies an explicitly active player as on floor', () => {
    const a = mp({ id: 'mp1', playerId: 'p1', isActive: true });
    const result = deriveRoster([a], [], []);
    expect(result.onFloor).toEqual([a]);
    expect(result.onBench).toEqual([]);
  });

  it('treats subOut=true as NOT on floor even if started', () => {
    const starterSubbed = mp({ id: 'mp1', playerId: 'p1', started: true, subOut: true });
    const result = deriveRoster([starterSubbed], [], []);
    expect(result.onFloor).toEqual([]);
    expect(result.onBench).toEqual([starterSubbed]);
  });

  it('legacy fallback: starter without sub history is on floor', () => {
    const starter = mp({ id: 'mp1', playerId: 'p1', started: true });
    const result = deriveRoster([starter], [], []);
    expect(result.onFloor).toEqual([starter]);
    expect(result.onBench).toEqual([]);
  });

  it('legacy fallback: starter with a matching sub-history entry is on bench', () => {
    const starter = mp({ id: 'mp1', playerId: 'p1', started: true });
    const history: SubstitutionHistoryEntry[] = [{ playerOutId: 'p1' }];
    const result = deriveRoster([starter], [], history);
    expect(result.onFloor).toEqual([]);
    expect(result.onBench).toEqual([starter]);
  });

  it('non-starter, non-active, non-subbed row goes to bench', () => {
    const reserve = mp({ id: 'mp1', playerId: 'p1' });
    const result = deriveRoster([reserve], [], []);
    expect(result.onFloor).toEqual([]);
    expect(result.onBench).toEqual([reserve]);
  });

  it('isActive wins over subOut (explicit active takes precedence)', () => {
    // If the db is inconsistent and both flags are set, isActive wins.
    // This matches the original component's ordering.
    const weird = mp({ id: 'mp1', playerId: 'p1', isActive: true, subOut: true });
    const result = deriveRoster([weird], [], []);
    expect(result.onFloor).toEqual([weird]);
  });

  it('reserves = team roster players not in match roster', () => {
    const inMatch = mp({ id: 'mp1', playerId: 'p1', isActive: true });
    const teamRoster = [player('p1'), player('p2'), player('p3')];
    const result = deriveRoster([inMatch], teamRoster, []);
    expect(result.reserves.map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('bench and reserves are disjoint; bench draws from match rows, reserves from team rows', () => {
    const activeStarter = mp({ id: 'mp1', playerId: 'p1', started: true, isActive: true });
    const benchedSubOut = mp({ id: 'mp2', playerId: 'p2', started: true, subOut: true });
    const teamRoster = [player('p1'), player('p2'), player('p3')];

    const result = deriveRoster([activeStarter, benchedSubOut], teamRoster, []);

    expect(result.onFloor).toEqual([activeStarter]);
    expect(result.onBench).toEqual([benchedSubOut]);
    expect(result.reserves.map((p) => p.id)).toEqual(['p3']);
  });

  it('realistic scenario: 5 starters, 1 subbed out via history, bench & reserves correct', () => {
    const starters = ['p1', 'p2', 'p3', 'p4', 'p5'].map((pid, i) =>
      mp({ id: `mp${i + 1}`, playerId: pid, started: true }),
    );
    const rosterPlayer6 = mp({ id: 'mp6', playerId: 'p6' }); // non-starter on match roster
    const teamRoster = [
      player('p1'), player('p2'), player('p3'), player('p4'), player('p5'),
      player('p6'), player('p7'), player('p8'),
    ];
    const history: SubstitutionHistoryEntry[] = [{ playerOutId: 'p3' }];

    const result = deriveRoster([...starters, rosterPlayer6], teamRoster, history);

    expect(result.onFloor.map((m) => m.playerId)).toEqual(['p1', 'p2', 'p4', 'p5']);
    expect(result.onBench.map((m) => m.playerId)).toEqual(['p3', 'p6']);
    expect(result.reserves.map((p) => p.id)).toEqual(['p7', 'p8']);
  });
});
