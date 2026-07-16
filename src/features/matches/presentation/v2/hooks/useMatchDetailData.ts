import { useCallback, useEffect, useRef, useState } from 'react';
import type { MatchView } from '../../../domain/entities/match-detail-v2';

const LIVE_POLL_MS = 15_000;

interface State {
  view: MatchView | null;
  loading: boolean;
  error: string;
}

/**
 * Loads the computed match view model from the shared read-only endpoint
 * (`/api/matches/[id]/view`) and, while the match is LIVE, re-polls in place so
 * the admin box score / play-by-play stay current. Visibility-aware: polling
 * pauses when the tab is hidden.
 */
export function useMatchDetailData(matchId: string) {
  const [state, setState] = useState<State>({ view: null, loading: true, error: '' });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!matchId) return;
      if (!opts.silent) setState((s) => ({ ...s, loading: true, error: '' }));
      try {
        const res = await fetch(`/api/matches/${matchId}/view`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Match not found' : 'Failed to load match');
        const view = (await res.json()) as MatchView;
        setState({ view, loading: false, error: '' });
      } catch (err: any) {
        // A failed background refresh shouldn't blank an already-rendered page.
        setState((s) => (opts.silent ? s : { ...s, loading: false, error: err?.message || 'Failed to load match' }));
      }
    },
    [matchId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Live polling — only while the match is live and the tab is visible.
  const isLive = state.view?.state === 'live';
  useEffect(() => {
    if (!isLive) return;
    const tick = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    timer.current = setInterval(tick, LIVE_POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isLive, load]);

  return { ...state, refetch: () => load() };
}
