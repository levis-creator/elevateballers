/**
 * Tournament Bracket View
 * Main container for bracket view mode in season matches
 */

import { useState, useEffect } from 'react';
import type { MatchWithTeamsAndLeagueAndSeason } from '../types';
import type { BracketMatch } from '../../tournaments/lib/bracket-converter';
import { 
  convertMatchesToBracket, 
  convertMatchesToDoubleEliminationBracket,
  detectBracketType 
} from '../../tournaments/lib/bracket-converter';
import TournamentBracket from '../../tournaments/components/TournamentBracket';
import BracketMatchDialog from '../../tournaments/components/BracketMatchDialog';
import BracketGeneratorDialog from '../../tournaments/components/BracketGeneratorDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trophy } from 'lucide-react';

interface TournamentBracketViewProps {
  seasonId: string;
  leagueId?: string;
}

export default function TournamentBracketView({ seasonId, leagueId }: TournamentBracketViewProps) {
  const [matches, setMatches] = useState<MatchWithTeamsAndLeagueAndSeason[]>([]);
  const [bracketMatches, setBracketMatches] = useState<BracketMatch[] | { upper: BracketMatch[]; lower: BracketMatch[] }>([]);
  const [isDoubleElimination, setIsDoubleElimination] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatorDialogOpen, setGeneratorDialogOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedBracketMatch, setSelectedBracketMatch] = useState<BracketMatch | null>(null);
  const [seasonBracketType, setSeasonBracketType] = useState<'single' | 'double' | null>(null);
  const [automatchingEnabled, setAutomatchingEnabled] = useState(true);

  useEffect(() => {
    fetchMatches();
    fetchSeason();
    fetchAutomatchingStatus();
  }, [seasonId]);

  const fetchAutomatchingStatus = async () => {
    try {
      const response = await fetch('/api/automatching');
      if (response.ok) {
        const data = await response.json();
        setAutomatchingEnabled(data.enabled ?? true);
      }
    } catch (err) {
      console.error('Failed to fetch automatching status:', err);
      // Default to enabled on error
      setAutomatchingEnabled(true);
    }
  };

  const fetchSeason = async () => {
    if (!seasonId) return;
    try {
      const response = await fetch(`/api/seasons/${seasonId}`);
      if (response.ok) {
        const season = await response.json();
        if (season.bracketType && (season.bracketType === 'single' || season.bracketType === 'double')) {
          setSeasonBracketType(season.bracketType);
        } else {
          setSeasonBracketType(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch season:', err);
    }
  };

  useEffect(() => {
    if (matches.length > 0) {
      try {
        console.log('Converting matches to bracket format:', {
          matchCount: matches.length,
          matchesWithStages: matches.filter(m => m.stage).length,
          stages: [...new Set(matches.map(m => m.stage).filter(Boolean))],
          matchesWithBracketType: matches.filter(m => m.bracketType).length,
          bracketTypes: [...new Set(matches.map(m => m.bracketType).filter(Boolean))],
        });

        // Priority 1: Use season's bracketType if set (most reliable)
        // Priority 2: Check if matches have bracketType field set (new brackets with explicit bracketType)
        // Priority 3: Use heuristics for old brackets without bracketType field
        let isDoubleElim = false;
        
        // Declare variables outside if/else so they're available later
        let hasDoubleElimBracketType = false;
        let heuristicBracketType: 'single' | 'double' = 'single';
        
        if (seasonBracketType) {
          // Use season's bracketType (most reliable source)
          isDoubleElim = seasonBracketType === 'double';
          console.log('Using season bracketType:', seasonBracketType);
        } else {
          // Fallback to match-based detection
          hasDoubleElimBracketType = matches.some(m => 
            m.bracketType === 'lower' || m.bracketType === 'upper' || m.bracketType === 'grand-final'
          );
          
          heuristicBracketType = detectBracketType(matches);
          isDoubleElim = hasDoubleElimBracketType || heuristicBracketType === 'double';
          
          console.log('Bracket type detection (fallback):', {
            hasDoubleElimBracketType,
            heuristicBracketType,
            isDoubleElim,
            bracketTypeBreakdown: {
              upper: matches.filter(m => m.bracketType === 'upper').length,
              lower: matches.filter(m => m.bracketType === 'lower').length,
              grandFinal: matches.filter(m => m.bracketType === 'grand-final').length,
            },
          });
        }
        
        setIsDoubleElimination(isDoubleElim);
        
        if (isDoubleElim) {
          // Use season bracketType if available, otherwise use match-based detection
          const bracketType = seasonBracketType || (hasDoubleElimBracketType ? 'double' : heuristicBracketType);

          if (bracketType === 'double') {
            // Convert to double elimination format
            const converted = convertMatchesToDoubleEliminationBracket(matches);
            // Validate the converted structure
            if (converted && typeof converted === 'object' && 'upper' in converted && 'lower' in converted) {
              // Ensure both are arrays and include grand final in upper bracket
              const upperWithGrandFinal = Array.isArray(converted.upper) ? converted.upper : [];
              const lower = Array.isArray(converted.lower) ? converted.lower : [];
              
              // Add grand final to upper bracket if it exists
              if (converted.grandFinal && Array.isArray(converted.grandFinal) && converted.grandFinal.length > 0) {
                // Grand final should be at the end of upper bracket
                upperWithGrandFinal.push(...converted.grandFinal);
              }
              
              const validated = {
                upper: upperWithGrandFinal,
                lower: lower,
              };
              
              // Only use double elimination if we have matches in at least one bracket
              // The library might fail if both are empty or structure is invalid
              if (validated.upper.length > 0 || validated.lower.length > 0) {
                setBracketMatches(validated);
              } else {
                console.warn('Double elimination detected but no valid matches found, falling back to single elimination');
                // Fallback to single elimination
                const singleConverted = convertMatchesToBracket(matches);
                setBracketMatches(Array.isArray(singleConverted) ? singleConverted : []);
                setIsDoubleElimination(false);
              }
            } else {
              console.error('Invalid double elimination format:', converted);
              // Fallback to single elimination
              const singleConverted = convertMatchesToBracket(matches);
              setBracketMatches(Array.isArray(singleConverted) ? singleConverted : []);
              setIsDoubleElimination(false);
            }
          } else {
            // Convert to single elimination format
            const converted = convertMatchesToBracket(matches);
            console.log('Single elimination conversion result:', {
              convertedCount: Array.isArray(converted) ? converted.length : 0,
              converted: Array.isArray(converted) ? converted : 'Not an array',
            });
            setBracketMatches(Array.isArray(converted) ? converted : []);
          }
        } else {
          // Always use single elimination for now
          setIsDoubleElimination(false);
          const converted = convertMatchesToBracket(matches);
          console.log('Single elimination conversion result:', {
            convertedCount: Array.isArray(converted) ? converted.length : 0,
            converted: Array.isArray(converted) ? converted : 'Not an array',
            firstMatch: Array.isArray(converted) && converted.length > 0 ? converted[0] : null,
          });
          setBracketMatches(Array.isArray(converted) ? converted : []);
        }
      } catch (err) {
        console.error('Error converting matches to bracket format:', err);
        setError('Failed to convert matches to bracket format');
        setBracketMatches([]);
        setIsDoubleElimination(false);
      }
    } else {
      setBracketMatches([]);
      setIsDoubleElimination(false);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <Trophy className="h-5 w-5" />
                Tournament Bracket View
                {seasonBracketType && (
                  <span className={`ml-2 px-2 py-1 text-xs font-normal rounded ${
                    seasonBracketType === 'double' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {seasonBracketType === 'double' ? 'Double' : 'Single'} Elimination
                    <span className="ml-1 text-xs opacity-75">(from season)</span>
                  </span>
                )}
                {!seasonBracketType && isDoubleElimination && (
                  <span className="ml-2 px-2 py-1 text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    Double Elimination
                  </span>
                )}
                {!seasonBracketType && !isDoubleElimination && bracketMatches.length > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs font-normal bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                    Single Elimination
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Click on matches to edit or click empty slots to create new matches
                {isDoubleElimination && (
                  <span className="block mt-1 text-xs">
                    Winners advance in upper bracket, losers drop to lower bracket
                  </span>
                )}
              </CardDescription>
            </div>
            {automatchingEnabled && (
              <Button onClick={() => setGeneratorDialogOpen(true)}>
                <Trophy className="mr-2 h-4 w-4" />
                Generate Bracket
              </Button>
            )}
          </div>
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
            ) : (isDoubleElimination 
              ? (typeof bracketMatches === 'object' && 'upper' in bracketMatches && 'lower' in bracketMatches
                  ? (bracketMatches.upper.length === 0 && bracketMatches.lower.length === 0)
                  : true)
              : (Array.isArray(bracketMatches) && bracketMatches.length === 0)
            ) ? (
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
                isDoubleElimination={isDoubleElimination}
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

      <BracketGeneratorDialog
        isOpen={generatorDialogOpen}
        onClose={() => setGeneratorDialogOpen(false)}
        onSuccess={() => {
          fetchMatches();
        }}
        seasonId={seasonId}
        leagueId={leagueId}
      />
    </div>
  );
}
