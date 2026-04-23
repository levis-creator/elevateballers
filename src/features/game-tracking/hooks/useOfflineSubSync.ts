/**
 * useOfflineSubSync — queues substitution batches in IndexedDB and drains the
 * queue whenever the connection returns. Idempotency is enforced server-side
 * via clientBatchId, so retrying a batch after a timed-out response never
 * creates duplicates.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { offlineStore, type PendingSubBatch } from '../lib/offlineStore';

const MAX_FAILURES = 3;

export interface EnqueueSubBatchInput {
  matchId: string;
  clientBatchId: string;
  teamId: string;
  period: number;
  secondsRemaining: number | null;
  pairs: Array<{ playerOutId: string; playerInId: string }>;
}

export interface UseOfflineSubSyncResult {
  isOnline: boolean;
  queuedBatches: PendingSubBatch[];
  enqueue: (input: EnqueueSubBatchInput) => Promise<void>;
  /** Manually trigger a sync attempt. */
  syncNow: () => Promise<void>;
}

export function useOfflineSubSync(
  matchId: string,
  onSynced?: () => void,
): UseOfflineSubSyncResult {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [queuedBatches, setQueuedBatches] = useState<PendingSubBatch[]>([]);
  const syncingRef = useRef(false);
  const onSyncedRef = useRef(onSynced);

  useEffect(() => {
    onSyncedRef.current = onSynced;
  }, [onSynced]);

  const refresh = useCallback(async () => {
    const rows = await offlineStore.pendingSubBatches
      .where('matchId')
      .equals(matchId)
      .sortBy('createdAt');
    setQueuedBatches(rows);
  }, [matchId]);

  const enqueue = useCallback(
    async (input: EnqueueSubBatchInput) => {
      await offlineStore.pendingSubBatches.add({
        ...input,
        failures: 0,
        lastError: null,
        createdAt: Date.now(),
      });
      await refresh();
    },
    [refresh],
  );

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;

    try {
      const batches = await offlineStore.pendingSubBatches
        .where('matchId')
        .equals(matchId)
        .sortBy('createdAt');

      let syncedSomething = false;

      for (const batch of batches) {
        try {
          const res = await fetch(`/api/games/${matchId}/substitutions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: batch.teamId,
              period: batch.period,
              secondsRemaining: batch.secondsRemaining,
              pairs: batch.pairs,
              clientBatchId: batch.clientBatchId,
            }),
          });

          if (res.ok) {
            // Server either committed the batch or returned the existing
            // rows (idempotent replay). Either way, we're done with this.
            await offlineStore.pendingSubBatches.delete(batch.id!);
            syncedSomething = true;
            continue;
          }

          // 4xx/5xx: bump failure count. After MAX_FAILURES drop it so we
          // don't jam the queue — caller can look at `queuedBatches` to
          // surface dead entries if desired.
          let serverMessage = `Server ${res.status}`;
          try {
            const data = await res.json();
            serverMessage = data?.error || serverMessage;
          } catch {
            /* non-JSON — keep status */
          }
          const nextFailures = (batch.failures ?? 0) + 1;
          if (nextFailures >= MAX_FAILURES) {
            await offlineStore.pendingSubBatches.delete(batch.id!);
          } else {
            await offlineStore.pendingSubBatches.update(batch.id!, {
              failures: nextFailures,
              lastError: serverMessage,
            });
          }
        } catch {
          // Network failure — stop draining; the next `online` event will retry.
          break;
        }
      }

      await refresh();
      if (syncedSomething) onSyncedRef.current?.();
    } finally {
      syncingRef.current = false;
    }
  }, [matchId, refresh]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refresh();
    if (navigator.onLine) sync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, refresh]);

  return { isOnline, queuedBatches, enqueue, syncNow: sync };
}
