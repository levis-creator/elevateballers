/**
 * Dexie (IndexedDB) store for offline event buffering.
 *
 * When the stats recorder is offline (or the network request fails), events
 * and substitution batches are written here first. The useOfflineSync /
 * useOfflineSubSync hooks drain these queues when the connection returns.
 */
import Dexie, { type Table } from 'dexie';

export interface PendingEvent {
  id?: number;          // auto-increment primary key
  matchId: string;
  eventType: string;
  teamId: string;
  playerId?: string | null;
  minute: number;
  period: number;
  secondsRemaining: number | null;
  description?: string | null;
  createdAt: number;    // Date.now() — used for ordering during sync
}

export interface PendingSubBatch {
  id?: number;
  matchId: string;
  // Minted client-side (crypto.randomUUID). Server keys idempotency off this
  // so a retry after a timed-out response never creates duplicates.
  clientBatchId: string;
  teamId: string;
  period: number;
  secondsRemaining: number | null;
  pairs: Array<{ playerOutId: string; playerInId: string }>;
  // Number of failed sync attempts. Mostly informational; the hook drops a
  // batch after too many 4xx/5xx rejections so it doesn't jam the queue.
  failures: number;
  lastError?: string | null;
  createdAt: number;
}

class ElevateOfflineStore extends Dexie {
  pendingEvents!: Table<PendingEvent, number>;
  pendingSubBatches!: Table<PendingSubBatch, number>;

  constructor() {
    super('elevateBallers_offline_v1');
    this.version(1).stores({
      pendingEvents: '++id, matchId, createdAt',
    });
    // v2 adds the substitution batch queue. Dexie migrates additively, so
    // existing pendingEvents entries survive.
    this.version(2).stores({
      pendingEvents: '++id, matchId, createdAt',
      pendingSubBatches: '++id, matchId, clientBatchId, createdAt',
    });
  }
}

// Singleton — safe to import from multiple components
export const offlineStore = new ElevateOfflineStore();
