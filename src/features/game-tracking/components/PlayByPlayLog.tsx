/**
 * Play-by-Play Log Component
 * Displays chronological list of game events
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatClockTime } from '../lib/utils';
import { getPeriodLabel } from '../lib/utils';
import { Undo2, AlertCircle } from 'lucide-react';
import type { PlayByPlayEvent, MatchPeriod } from '../types';

interface PlayByPlayLogProps {
  matchId: string;
  onRefresh?: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  TWO_POINT_MADE: '2-Point Made',
  TWO_POINT_MISSED: '2-Point Missed',
  THREE_POINT_MADE: '3-Point Made',
  THREE_POINT_MISSED: '3-Point Missed',
  FREE_THROW_MADE: 'Free Throw Made',
  FREE_THROW_MISSED: 'Free Throw Missed',
  ASSIST: 'Assist',
  REBOUND_OFFENSIVE: 'Offensive Rebound',
  REBOUND_DEFENSIVE: 'Defensive Rebound',
  STEAL: 'Steal',
  BLOCK: 'Block',
  TURNOVER: 'Turnover',
  FOUL_PERSONAL: 'Personal Foul',
  FOUL_TECHNICAL: 'Technical Foul',
  FOUL_FLAGRANT: 'Flagrant Foul',
  SUBSTITUTION_IN: 'Substitution In',
  SUBSTITUTION_OUT: 'Substitution Out',
  TIMEOUT: 'Timeout',
  INJURY: 'Injury',
  BREAK: 'Break',
  PLAY_RESUMED: 'Play Resumed',
  OTHER: 'Other',
};

export default function PlayByPlayLog({ matchId, onRefresh }: PlayByPlayLogProps) {
  const [events, setEvents] = useState<PlayByPlayEvent[]>([]);
  const [periods, setPeriods] = useState<MatchPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayByPlay();
  }, [matchId]);

  const fetchPlayByPlay = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/games/${matchId}/play-by-play`);
      if (!response.ok) {
        throw new Error('Failed to fetch play-by-play');
      }
      const data = await response.json();
      setEvents(data.events || []);
      setPeriods(data.periods || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load play-by-play');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPlayByPlay();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Play-by-Play</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Play-by-Play</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Play-by-Play</CardTitle>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No events recorded yet
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground">
                      {getPeriodLabel(event.period)} {event.secondsRemaining ? formatClockTime(event.secondsRemaining) : `${event.minute}'`}
                    </span>
                    <span className="font-medium">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</span>
                  </div>
                  {event.player && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.player.firstName} {event.player.lastName}
                      {event.team && ` (${event.team.name})`}
                    </div>
                  )}
                  {event.assistPlayer && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Assist: {event.assistPlayer.firstName} {event.assistPlayer.lastName}
                    </div>
                  )}
                  {event.description && (
                    <div className="text-sm text-muted-foreground mt-1">{event.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
