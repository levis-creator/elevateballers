import { useState, useEffect } from 'react';
import type { Player } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, User, FileText, AlertCircle, CheckCircle, XCircle, Trophy, Calendar, Clock } from 'lucide-react';
import { calculatePlayerStatistics, calculatePlayerMatchStats } from '../../player/lib/playerStats';

interface PlayerViewProps {
  playerId: string;
}

export default function PlayerView({ playerId }: PlayerViewProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [matchStats, setMatchStats] = useState<Record<string, any>>({});
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    totalMatches: 0,
    totalPoints: 0,
    pointsPerGame: 0,
    reboundsPerGame: 0,
    assistsPerGame: 0,
    stealsPerGame: 0,
    blocksPerGame: 0,
    fieldGoalPercentage: 0,
    threePointPercentage: 0,
    freeThrowPercentage: 0,
  });

  useEffect(() => {
    fetchPlayer();
  }, [playerId]);

  useEffect(() => {
    if (player) {
      fetchPlayerMatches();
    }
  }, [player?.id]);

  const fetchPlayer = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player');
      }
      const data = await response.json();
      setPlayer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load player');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerMatches = async () => {
    if (!player) return;
    try {
      setLoadingMatches(true);
      const response = await fetch(`/api/players/${player.id}/matches`);
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
        
        // Fetch events for each completed match and calculate stats
        const statsPromises = data
          .filter((match: any) => match.status === 'COMPLETED')
          .map(async (match: any) => {
            try {
              const eventsRes = await fetch(`/api/players/${player.id}/events?matchId=${match.id}`);
              if (eventsRes.ok) {
                const events = await eventsRes.json();
                const stats = calculatePlayerMatchStats(player.id, events);
                return { matchId: match.id, stats, events };
              }
            } catch (err) {
              console.error(`Error fetching stats for match ${match.id}:`, err);
            }
            return { matchId: match.id, stats: null, events: [] };
          });
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap: Record<string, any> = {};
        const matchesWithEvents: any[] = [];
        
        statsResults.forEach(({ matchId, stats, events }) => {
          if (stats) statsMap[matchId] = stats;
          const match = data.find((m: any) => m.id === matchId);
          if (match) {
            matchesWithEvents.push({ ...match, events });
          }
        });
        
        setMatchStats(statsMap);
        
        // Calculate aggregate player statistics
        const aggregateStats = calculatePlayerStatistics(matchesWithEvents, player.id);
        setPlayerStats(aggregateStats);
      }
    } catch (err) {
      console.error('Error fetching player matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Group matches by league and sort within each league
  const getMatchesByLeague = () => {
    const leagueMap = new Map<string, any[]>();
    
    matches.forEach((match) => {
      const leagueKey = match.league?.id || match.leagueId || 'no-league';
      const leagueName = match.league?.name || match.leagueName || 'No League';
      
      if (!leagueMap.has(leagueKey)) {
        leagueMap.set(leagueKey, {
          leagueId: leagueKey,
          leagueName,
          matches: [],
        });
      }
      
      leagueMap.get(leagueKey)!.matches.push(match);
    });
    
    // Sort matches within each league by date (most recent first)
    leagueMap.forEach((leagueData) => {
      leagueData.matches.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (most recent first)
      });
    });
    
    return Array.from(leagueMap.values());
  };

  const getPlayerTeamId = (match: any): string | null => {
    if (!player?.teamId) return null;
    if (match.team1Id === player.teamId) return match.team1Id;
    if (match.team2Id === player.teamId) return match.team2Id;
    return null;
  };

  const getOpponent = (match: any, playerTeamId: string | null): string => {
    if (!playerTeamId) return 'Unknown';
    if (match.team1Id === playerTeamId) {
      return match.team2?.name || match.team2Name || 'Unknown';
    }
    return match.team1?.name || match.team1Name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlayerName = (): string => {
    if (!player) return 'Unknown Player';
    const firstName = (player as any).firstName || '';
    const lastName = (player as any).lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unnamed Player';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Player not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const playerName = getPlayerName();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <a href="/admin/players" data-astro-prefetch>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Players
            </a>
          </Button>
          <h1 className="text-3xl font-heading font-semibold text-foreground">Player Details</h1>
        </div>
        <Button asChild>
          <a href={`/admin/players/${player.id}`} data-astro-prefetch>
            <Edit className="mr-2 h-4 w-4" />
            Edit Player
          </a>
        </Button>
      </div>

      {/* Player Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {player.image ? (
                <img
                  src={player.image}
                  alt={playerName}
                  className="w-32 h-32 rounded-xl object-cover border-4 border-border"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center border-4 border-border">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-4xl font-heading font-bold text-foreground">{playerName}</h2>
                <div className="flex items-center gap-2">
                  {(player as any).approved ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {(player as any).team && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <a 
                      href={`/admin/teams/view/${(player as any).team.id}`} 
                      className="hover:text-primary underline"
                      data-astro-prefetch
                    >
                      {(player as any).team.name}
                    </a>
                  </div>
                )}
                {player.position && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{player.position}</Badge>
                  </div>
                )}
                {player.jerseyNumber && (
                  <div className="text-muted-foreground">
                    Jersey: <span className="font-semibold">#{player.jerseyNumber}</span>
                  </div>
                )}
                {((player as any).height || (player as any).weight) && (
                  <div className="text-muted-foreground">
                    {(player as any).height && <span>{(player as any).height}</span>}
                    {(player as any).height && (player as any).weight && <span> • </span>}
                    {(player as any).weight && <span>{(player as any).weight}</span>}
                  </div>
                )}
              </div>
              {(player as any).bio && (
                <div className="flex gap-3 mt-4">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground leading-relaxed">{(player as any).bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Statistics Section */}
      {playerStats.totalMatches > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Career Statistics
            </CardTitle>
            <CardDescription>Statistics calculated from all completed matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Games</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.totalMatches}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Total Points</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.totalPoints}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Points Per Game</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.pointsPerGame.toFixed(1)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Rebounds Per Game</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.reboundsPerGame.toFixed(1)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Assists Per Game</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.assistsPerGame.toFixed(1)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Steals Per Game</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.stealsPerGame.toFixed(1)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Blocks Per Game</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.blocksPerGame.toFixed(1)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Field Goal %</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.fieldGoalPercentage > 0 ? `${playerStats.fieldGoalPercentage.toFixed(1)}%` : '-'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">3-Point %</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.threePointPercentage > 0 ? `${playerStats.threePointPercentage.toFixed(1)}%` : '-'}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-2 uppercase font-semibold">Free Throw %</div>
                <div className="text-3xl font-bold text-foreground">
                  {playerStats.freeThrowPercentage > 0 ? `${playerStats.freeThrowPercentage.toFixed(1)}%` : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Matches ({matches.length})
              </CardTitle>
              <CardDescription>All matches involving this player, organized by league</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMatches ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground">This player hasn't participated in any matches yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {getMatchesByLeague().map((leagueData) => (
                <div key={leagueData.leagueId} className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-xl font-semibold text-foreground">{leagueData.leagueName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {leagueData.matches.length} {leagueData.matches.length === 1 ? 'match' : 'matches'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {leagueData.matches.map((match: any) => {
                      const playerTeamId = getPlayerTeamId(match);
                      const opponent = getOpponent(match, playerTeamId);
                      const stats = matchStats[match.id];
                      const playerScore = stats?.points || null;
                      const opponentScore = playerTeamId === match.team1Id ? match.team2Score : match.team1Score;
                      
                      return (
                        <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Match Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-lg">{(player as any).team?.name || 'Team'}</span>
                                      {match.status === 'COMPLETED' && playerScore !== null && (
                                        <span className="text-2xl font-bold text-foreground">
                                          {playerScore}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-muted-foreground">vs</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-lg">{opponent}</span>
                                      {match.status === 'COMPLETED' && opponentScore !== null && (
                                        <span className="text-2xl font-bold text-muted-foreground">
                                          {opponentScore}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {formatDate(match.date)}
                                    </div>
                                    {match.stage && (
                                      <Badge variant="outline">{match.stage.replace(/_/g, ' ')}</Badge>
                                    )}
                                    <Badge
                                      variant={
                                        match.status === 'LIVE'
                                          ? 'destructive'
                                          : match.status === 'COMPLETED'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                    >
                                      {match.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={`/admin/matches/view/${match.id}`} data-astro-prefetch>
                                      View Details
                                    </a>
                                  </Button>
                                </div>
                              </div>

                              {/* Player Statistics Summary */}
                              {match.status === 'COMPLETED' && stats && (
                                <div className="pt-4 border-t">
                                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Player Statistics</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-muted-foreground">Points</div>
                                      <div className="font-semibold text-lg">{stats.points}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Rebounds</div>
                                      <div className="font-semibold text-lg">{stats.rebounds}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Assists</div>
                                      <div className="font-semibold text-lg">{stats.assists}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Steals</div>
                                      <div className="font-semibold text-lg">{stats.steals}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Blocks</div>
                                      <div className="font-semibold text-lg">{stats.blocks}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Turnovers</div>
                                      <div className="font-semibold text-lg">{stats.turnovers}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Fouls</div>
                                      <div className="font-semibold text-lg">{stats.fouls}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">FG</div>
                                      <div className="font-semibold">
                                        {stats.fieldGoalsMade}/{stats.fieldGoalsAttempted}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">3PT</div>
                                      <div className="font-semibold">
                                        {stats.threePointersMade}/{stats.threePointersAttempted}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">FT</div>
                                      <div className="font-semibold">
                                        {stats.freeThrowsMade}/{stats.freeThrowsAttempted}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
