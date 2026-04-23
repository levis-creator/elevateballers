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
  onBatchSynced?: (batch: PendingSubBatch) => void,
): UseOfflineSubSyncResult {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [queuedBatches, setQueuedBatches] = useState<PendingSubBatch[]>([]);
  const syncingRef = useRef(false);
  const onBatchSyncedRef = useRef(onBatchSynced);

  useEffect(() => {
    onBatchSyncedRef.current = onBatchSynced;
  }, [onBatchSynced]);

  const refresh = useCallback(async () => {
    const rows = await offlineStore.pendingSubBatches
      .where('matchId')
      .equals(matchId)
      .sortBy('createdAt');
    setQueuedBatches(rows);
  }, [matchId]);

  const enqueue = useCallback(
    async (input: EnqueueSubBatchInput) => {
      // Synchronous state update so the optimistic projection renders in the
      // same frame as the user's tap. Persisting to IndexedDB happens in
      // parallel; if it fails (private-browsing quota, etc.) we still have
      // the in-memory entry and the subsequent sync will drive it to the
      // server anyway.
      const entry: PendingSubBatch = {
        ...input,
        failures: 0,
        lastError: null,
        createdAt: Date.now(),
      };
      setQueuedBatches((prev) => [...prev, entry]);
      void offlineStore.pendingSubBatches
        .add(entry)
        .then((id) => {
          // Patch the id back in so `sync()` can delete by primary key later.
          setQueuedBatches((prev) =>
            prev.map((b) =>
              b === entry || b.clientBatchId === entry.clientBatchId
                ? { ...b, id }
                : b,
            ),
          );
        })
        .catch((err) => {
          console.warn('[offlineSubSync] failed to persist batch', err);
        });
    },
    [],
  );

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;

    try {
      // Read from state (not IDB) so a freshly-enqueued batch whose IDB write
      // is still in flight is still synced immediately. Filter by matchId in
      // case a stale batch from a previous match slipped in.
      const batches = [...queuedBatches].filter((b) => b.matchId === matchId);

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
            // Hand the synced batch to the caller FIRST so it can keep the
            // optimistic overlay alive in its own state until the parent
            // refetch arrives. Only then drop our copy — otherwise the tiles
            // flicker back to the pre-sub layout for a frame.
            onBatchSyncedRef.current?.(batch);
            setQueuedBatches((prev) =>
              prev.filter((b) => b.clientBatchId !== batch.clientBatchId),
            );
            if (batch.id !== undefined) {
              void offlineStore.pendingSubBatches.delete(batch.id);
            }
            continue;
          }

          // 4xx/5xx: bump failure count. After MAX_FAILURES drop the batch so
          // it doesn't jam the queue.
          let serverMessage = `Server ${res.status}`;
          try {
            const data = await res.json();
            serverMessage = data?.error || serverMessage;
          } catch {
            /* non-JSON — keep status */
          }
          const nextFailures = (batch.failures ?? 0) + 1;
          if (nextFailures >= MAX_FAILURES) {
            setQueuedBatches((prev) =>
              prev.filter((b) => b.clientBatchId !== batch.clientBatchId),
            );
            if (batch.id !== undefined) {
              void offlineStore.pendingSubBatches.delete(batch.id);
            }
          } else {
            setQueuedBatches((prev) =>
              prev.map((b) =>
                b.clientBatchId === batch.clientBatchId
                  ? { ...b, failures: nextFailures, lastError: serverMessage }
                  : b,
              ),
            );
            if (batch.id !== undefined) {
              void offlineStore.pendingSubBatches.update(batch.id, {
                failures: nextFailures,
                lastError: serverMessage,
              });
            }
          }
        } catch {
          // Network failure — stop draining; the `online` listener retries.
          break;
        }
      }
    } finally {
      syncingRef.current = false;
    }
  }, [matchId, queuedBatches]);

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
