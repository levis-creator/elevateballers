/**
 * Dexie (IndexedDB) store for offline event buffering.
 *
 * When the stats recorder is offline (or the network request fails),
 * events are written here first.  The useOfflineSync hook drains this
 * queue whenever the connection is restored.
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

class ElevateOfflineStore extends Dexie {
  pendingEvents!: Table<PendingEvent, number>;

  constructor() {
    super('elevateBallers_offline_v1');
    this.version(1).stores({
      pendingEvents: '++id, matchId, createdAt',
    });
  }
}

// Singleton — safe to import from multiple components
export const offlineStore = new ElevateOfflineStore();
