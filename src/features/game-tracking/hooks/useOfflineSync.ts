/**
 * useOfflineSync — tracks online status and drains the IndexedDB pending-event
 * queue whenever the connection is restored.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { offlineStore, type PendingEvent } from '../lib/offlineStore';

interface UseOfflineSyncResult {
  isOnline: boolean;
  pendingCount: number;
  /** Enqueue an event locally (called by QuickEventButtons on network failure). */
  enqueue: (event: Omit<PendingEvent, 'id' | 'createdAt'>) => Promise<void>;
  /** Manually trigger a sync attempt. */
  syncNow: () => void;
}

export function useOfflineSync(
  matchId: string,
  onSynced?: () => void
): UseOfflineSyncResult {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const count = await offlineStore.pendingEvents
      .where('matchId')
      .equals(matchId)
      .count();
    setPendingCount(count);
  }, [matchId]);

  const enqueue = useCallback(
    async (event: Omit<PendingEvent, 'id' | 'createdAt'>) => {
      await offlineStore.pendingEvents.add({ ...event, createdAt: Date.now() });
      await refreshCount();
    },
    [refreshCount]
  );

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;

    try {
      const events = await offlineStore.pendingEvents
        .where('matchId')
        .equals(matchId)
        .sortBy('createdAt');

      for (const ev of events) {
        try {
          const res = await fetch(`/api/matches/${matchId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: ev.eventType,
              teamId: ev.teamId,
              playerId: ev.playerId,
              minute: ev.minute,
              period: ev.period,
              secondsRemaining: ev.secondsRemaining,
              description: ev.description,
            }),
          });

          if (res.ok) {
            await offlineStore.pendingEvents.delete(ev.id!);
          } else {
            // Server rejected — remove so we don't retry invalid events forever.
            // In the future a "dead-letter" table could be added here.
            await offlineStore.pendingEvents.delete(ev.id!);
          }
        } catch {
          // Network failure mid-sync — stop and retry next time.
          break;
        }
      }

      await refreshCount();
      onSynced?.();
    } finally {
      syncingRef.current = false;
    }
  }, [matchId, refreshCount, onSynced]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial count and attempt sync on mount
    refreshCount();
    if (navigator.onLine) sync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, refreshCount]);

  return { isOnline, pendingCount, enqueue, syncNow: sync };
}
