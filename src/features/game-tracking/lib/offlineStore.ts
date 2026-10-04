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
  assistPlayerId?: string | null;
  metadata?: Record<string, unknown> | null;
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

/**
 * One write from the live console, saved on the device before it is sent.
 * The outbox sends them one at a time in tap order and deletes each only
 * once the server confirms it.
 */
export interface OutboxItem {
  id?: number;
  matchId: string;
  kind: 'event' | 'patch' | 'state' | 'clock' | 'timeout' | 'subs';
  url: string;
  method: 'POST' | 'PUT';
  body: Record<string, unknown>;
  /** Client id of an event this item creates. */
  cid?: string | null;
  /** Client id of the event a patch targets, resolved to a server id on send. */
  refCid?: string | null;
  /** Server id of the patch target, once known. */
  refId?: string | null;
  /** Date.now() at the tap, for clock requests and ordering. */
  tappedAt: number;
  attempts: number;
  createdAt: number;
}

class ElevateOfflineStore extends Dexie {
  pendingEvents!: Table<PendingEvent, number>;
  pendingSubBatches!: Table<PendingSubBatch, number>;
  outbox!: Table<OutboxItem, number>;

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
    // v3 adds the live console outbox.
    this.version(3).stores({
      pendingEvents: '++id, matchId, createdAt',
      pendingSubBatches: '++id, matchId, clientBatchId, createdAt',
      outbox: '++id, matchId, createdAt',
    });
  }
}

// Singleton — safe to import from multiple components
export const offlineStore = new ElevateOfflineStore();
