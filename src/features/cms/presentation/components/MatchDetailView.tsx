import { useState, useEffect } from 'react';
import type { MatchWithFullDetails } from '../../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCenter from '../../../game-tracking/presentation/live-console/MatchCenter';

interface MatchDetailViewProps {
  matchId: string;
  initialMatch?: MatchWithFullDetails | null;
}

/**
 * Loads a match and renders the v2 Match Center, which shows the pre-match,
 * live console or post-match view for the match's status.
 */
export default function MatchDetailView({ matchId, initialMatch }: MatchDetailViewProps) {
  const [match, setMatch] = useState<MatchWithFullDetails | null>(
    initialMatch ? { ...initialMatch, matchPlayers: [], events: [] } : null
  );
  const [loading, setLoading] = useState(!initialMatch);
  const [error, setError] = useState('');

  const fetchMatchDetails = async () => {
    try {
      // Skip the edge cache — this runs after mutations and needs fresh data.
      const [playersRes, eventsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/players`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/matches/${matchId}/events`, { cache: 'no-store' }).catch(() => null),
      ]);
      const players = playersRes?.ok ? await playersRes.json() : [];
      const events = eventsRes?.ok ? await eventsRes.json() : [];
      setMatch((prev) => (prev ? { ...prev, matchPlayers: players || [], events: events || [] } : prev));
    } catch (err) {
      console.warn('Failed to fetch match details:', err);
    }
  };

  // Refetches keep the Match Center mounted; only the first load shows a skeleton.
  const fetchMatch = async () => {
    try {
      setError('');
      const response = await fetch(`/api/matches/${matchId}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch match' }));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      const data = await response.json();
      if (!data?.id) throw new Error('Invalid match data received');
      setMatch((prev) => ({
        ...data,
        matchPlayers: data.matchPlayers || prev?.matchPlayers || [],
        events: data.events || prev?.events || [],
      }));
      await fetchMatchDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) fetchMatch();
    else {
      setError('Match ID is required');
      setLoading(false);
    }
  }, [matchId]);

  if (loading || (!match && !error)) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Match not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <MatchCenter match={match} onRosterChanged={fetchMatchDetails} onMatchChanged={fetchMatch} />;
}
