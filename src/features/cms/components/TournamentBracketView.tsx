/**
 * Tournament Bracket View
 * Main container for bracket view mode in season matches
 */

import { useState, useEffect } from 'react';
import type { MatchWithTeamsAndLeagueAndSeason } from '../types';
import type { BracketMatch } from '../../tournaments/lib/bracket-converter';
import { convertMatchesToBracket } from '../../tournaments/lib/bracket-converter';
import TournamentBracket from '../../tournaments/components/TournamentBracket';
import BracketMatchDialog from '../../tournaments/components/BracketMatchDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Trophy } from 'lucide-react';

interface TournamentBracketViewProps {
  seasonId: string;
  leagueId?: string;
}

export default function TournamentBracketView({ seasonId, leagueId }: TournamentBracketViewProps) {
  const [matches, setMatches] = useState<MatchWithTeamsAndLeagueAndSeason[]>([]);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedBracketMatch, setSelectedBracketMatch] = useState<BracketMatch | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [seasonId]);

  useEffect(() => {
    if (matches.length > 0) {
      try {
        const converted = convertMatchesToBracket(matches);
        setBracketMatches(converted);
      } catch (err) {
        console.error('Error converting matches to bracket format:', err);
        setError('Failed to convert matches to bracket format');
        setBracketMatches([]);
      }
    } else {
      setBracketMatches([]);
    }
  }, [matches]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/matches?seasonId=${seasonId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch matches:', response.status, errorText);
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }
      const data = (await response.json()) as MatchWithTeamsAndLeagueAndSeason[];
      setMatches(data);
    } catch (err: any) {
      console.error('Error fetching matches:', err);
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (matchId: string | null, match: BracketMatch) => {
    setSelectedMatchId(matchId);
    setSelectedBracketMatch(match);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedMatchId(null);
    setSelectedBracketMatch(null);
  };

  const handleSave = () => {
    fetchMatches();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Bracket View
          </CardTitle>
          <CardDescription>
            Click on matches to edit or click empty slots to create new matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create matches to see them in the bracket view
                </p>
              </div>
            ) : bracketMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Unable to display bracket</h3>
                <p className="text-muted-foreground mb-4">
                  Found {matches.length} match(es) but couldn't convert to bracket format. Try the table view.
                </p>
              </div>
            ) : (
              <TournamentBracket
                matches={bracketMatches}
                isEditable={true}
                onMatchClick={handleMatchClick}
                seasonId={seasonId}
                leagueId={leagueId}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <BracketMatchDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleSave}
        matchId={selectedMatchId || undefined}
        bracketMatch={selectedBracketMatch}
        seasonId={seasonId}
        leagueId={leagueId}
        defaultStage={selectedBracketMatch?.stage || null}
      />
    </div>
  );
}
