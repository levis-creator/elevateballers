import { useState, useEffect, useRef, useMemo } from 'react';
import type { MatchWithFullDetails, MatchPlayerWithDetails, MatchEventWithDetails } from '../../cms/types';
import {
  formatMatchDate,
  formatMatchTime,
  formatMatchDateTime,
  getMatchStatusColor,
  getMatchStatusLabel,
  getRelativeTimeDescription,
} from '../../lib/utils';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id, isWinner, getTeamInitials } from '../../lib/team-helpers';
import TeamLogo from './TeamLogo';
import { getLeagueName } from '../../lib/league-helpers';
import MatchImagesPublic from './MatchImagesPublic';

// Helper labels for match events
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
  SUBSTITUTION_IN: 'Sub In',
  SUBSTITUTION_OUT: 'Sub Out',
  TIMEOUT: 'Timeout',
  INJURY: 'Injury',
  BREAK: 'Break',
  PLAY_RESUMED: 'Play Resumed',
  OTHER: 'Other',
};

// Helper for period labels
function getPeriodLabel(period: number): string {
  if (period <= 4) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = period % 10;
    const suffix = remainder <= 3 && Math.floor(period / 10) !== 1 ? suffixes[remainder] || 'th' : 'th';
    return `${period}${suffix} Qtr`;
  }
  return `OT${period - 4}`;
}

// Helper to format clock time
function formatClockTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/** Compute remaining seconds from server timestamp (shared source of truth). */
function computeRemainingFromTimestamp(m: {
  clockRunning: boolean;
  clockStartedAt: string | Date | null;
  clockSecondsAtStart: number | null;
  clockSeconds: number | null;
}): number | null {
  if (m.clockRunning && m.clockStartedAt && m.clockSecondsAtStart != null) {
    const elapsed = Math.floor((Date.now() - new Date(m.clockStartedAt).getTime()) / 1000);
    return Math.max(0, m.clockSecondsAtStart - elapsed);
  }
  return m.clockSeconds ?? null;
}

interface MatchDetailProps {
  match: MatchWithFullDetails;
}

export default function MatchDetail({ match: initialMatch }: MatchDetailProps) {
  const [match, setMatch] = useState(initialMatch);
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [localClock, setLocalClock] = useState<number | null>(match.clockSeconds);
  const itemsPerPage = 5;

  // Keep a ref to the latest match so interval callbacks never use stale state
  const matchRef = useRef(match);
  matchRef.current = match;

  // Polling for match updates — runs for both UPCOMING (slow) and LIVE (fast)
  useEffect(() => {
    if (match.status === 'COMPLETED') return;

    // Poll every 5s when LIVE, every 30s when UPCOMING (to detect game start)
    const interval = match.status === 'LIVE' ? 5000 : 30000;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/matches/${matchRef.current.id}?includeDetails=true`);
        if (response.ok) {
          const updatedMatch = await response.json();
          setMatch(updatedMatch);
          setLocalClock(computeRemainingFromTimestamp(updatedMatch));
        }
      } catch (error) {
        console.error('Error polling for match updates:', error);
      }
    }, interval);

    return () => clearInterval(pollInterval);
  }, [match.id, match.status]);

  // Timestamp-based clock ticker — uses ref to always read fresh match state
  useEffect(() => {
    if (match.status !== 'LIVE' || !match.clockRunning) return;
    if (!match.clockStartedAt || match.clockSecondsAtStart == null) return;

    const ticker = setInterval(() => {
      setLocalClock(computeRemainingFromTimestamp(matchRef.current));
    }, 1000);

    // Compute immediately so there's no 1s delay on start
    setLocalClock(computeRemainingFromTimestamp(match));

    return () => clearInterval(ticker);
  }, [match.status, match.clockRunning, match.clockStartedAt, match.clockSecondsAtStart]);

  // Sync clock when match data changes (pause/resume/period change)
  useEffect(() => {
    setLocalClock(computeRemainingFromTimestamp(match));
  }, [match.clockSeconds, match.clockStartedAt, match.clockSecondsAtStart, match.clockRunning]);

  // Memoize derived values so they don't recompute on every clock tick
  const statusColor = getMatchStatusColor(match.status);
  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const relativeTime = getRelativeTimeDescription(match.date);
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  const team1Id = getTeam1Id(match);
  const team2Id = getTeam2Id(match);
  const team1IsWinner = isWinner(match, team1Id);
  const team2IsWinner = isWinner(match, team2Id);
  const isTie = match.status === 'COMPLETED' && match.team1Score !== null && match.team2Score !== null && match.team1Score === match.team2Score;

  const team1Players = useMemo(() => match.matchPlayers?.filter(mp => mp.teamId === team1Id) || [], [match.matchPlayers, team1Id]);
  const team2Players = useMemo(() => match.matchPlayers?.filter(mp => mp.teamId === team2Id) || [], [match.matchPlayers, team2Id]);
  const events = useMemo(
    () => [...(match.events || [])].sort((a, b) => b.minute - a.minute || (b.secondsRemaining || 0) - (a.secondsRemaining || 0)),
    [match.events],
  );

  // Determine active players with fallback to starters if no one is explicitly marked as active
  const getActivePlayers = (players: MatchPlayerWithDetails[]) => {
    const explicitlyActive = players.filter(mp => mp.isActive);
    if (explicitlyActive.length > 0 || match.status !== 'LIVE') {
      return explicitlyActive;
    }
    // Fallback: If live but no active players found, show starters as active
    return players.filter(mp => mp.started);
  };

  const activeTeam1 = getActivePlayers(team1Players);
  const activeTeam1Ids = new Set(activeTeam1.map(p => p.id));
  const benchTeam1 = team1Players.filter(mp => !activeTeam1Ids.has(mp.id));
  const sortedTeam1 = [...activeTeam1, ...benchTeam1];
  
  const activeTeam2 = getActivePlayers(team2Players);
  const activeTeam2Ids = new Set(activeTeam2.map(p => p.id));
  const benchTeam2 = team2Players.filter(mp => !activeTeam2Ids.has(mp.id));
  const sortedTeam2 = [...activeTeam2, ...benchTeam2];

  // Update mp.isActive virtual property for rendering the badges
  const isPlayerActive = (mp: MatchPlayerWithDetails, activeIds: Set<string>) => {
    return activeIds.has(mp.id);
  };

  // Helper to get latest substitution info
  const getPlayerSubInfo = (playerId: string, isActive: boolean) => {
    // Check if substitutions exist on the match object (casted as any to avoid strict type checks if type definition isn't updated everywhere yet)
    const subs = (match as any).substitutions;
    if (!subs || !Array.isArray(subs) || subs.length === 0) return null;
    
    // Substitutions are ordered by createdAt desc in the query
    if (isActive) {
      // Find the last time this player was subbed IN
      const subIn = subs.find((s: any) => s.playerInId === playerId);
      if (subIn && subIn.playerOut) {
         return `for ${subIn.playerOut.firstName} ${subIn.playerOut.lastName}`;
      }
    } else {
      // Find the last time this player was subbed OUT
      const subOut = subs.find((s: any) => s.playerOutId === playerId);
      if (subOut && subOut.playerIn) {
        return `for ${subOut.playerIn.firstName} ${subOut.playerIn.lastName}`;
      }
    }
    return null;
  };

  const paginatedTeam1 = sortedTeam1.slice((page1 - 1) * itemsPerPage, page1 * itemsPerPage);
  const paginatedTeam2 = sortedTeam2.slice((page2 - 1) * itemsPerPage, page2 * itemsPerPage);
  const totalPages1 = Math.ceil(sortedTeam1.length / itemsPerPage);
  const totalPages2 = Math.ceil(sortedTeam2.length / itemsPerPage);

  return (
    <div className="match-detail">
      <div className="match-detail-header">
        <div className="match-detail-meta">
          <span className="match-league">{getLeagueName(match)}</span>
          <div className="status-container">
            <span
              className="match-status-badge"
              style={{ backgroundColor: statusColor, color: 'white' }}
            >
              {statusLabel}
            </span>
            {match.status === 'LIVE' && <span className="live-indicator-pulse"></span>}
          </div>
        </div>

        {match.status === 'LIVE' && (
          <div className="match-live-info">
            <div className="current-period">{getPeriodLabel(match.currentPeriod)}</div>
            <div className={`match-clock ${!match.clockRunning ? 'paused' : ''}`}>
              {formatClockTime(localClock)}
            </div>
          </div>
        )}

        <div className="match-detail-date">
          <span className="date-label">Match Date</span>
          <span className="date-value">{formatMatchDateTime(match.date)}</span>
          <span className="date-relative">({relativeTime})</span>
        </div>
      </div>

      <div className="match-detail-teams">
        <div className={`match-team-detail ${team1IsWinner ? 'winner' : ''}`}>
          {match.status === 'LIVE' && match.possessionTeamId === team1Id && (
            <div className="possession-indicator left">
              <span className="possession-dot"></span>
              POSS
            </div>
          )}
          <TeamLogo 
            logo={team1Logo} 
            name={team1Name} 
            size="xl" 
            className="team-logo-large" 
          />
          <h3 className="team-name-large">{team1Name}</h3>
          {hasScore && (
            <div className="team-score-large">{match.team1Score}</div>
          )}
          {team1IsWinner && (
            <div className="winner-badge">
              <span>🏆 Winner</span>
            </div>
          )}
        </div>

        <div className="match-vs">
          <span className="vs-text">VS</span>
          {hasScore && (
            <span className="score-separator">-</span>
          )}
          {isTie && (
            <span className="tie-indicator">Tie</span>
          )}
        </div>

        <div className={`match-team-detail ${team2IsWinner ? 'winner' : ''}`}>
          {match.status === 'LIVE' && match.possessionTeamId === team2Id && (
            <div className="possession-indicator right">
              <span className="possession-dot"></span>
              POSS
            </div>
          )}
          <TeamLogo 
            logo={team2Logo} 
            name={team2Name} 
            size="xl" 
            className="team-logo-large" 
          />
          <h3 className="team-name-large">{team2Name}</h3>
          {hasScore && (
            <div className="team-score-large">{match.team2Score}</div>
          )}
          {team2IsWinner && (
            <div className="winner-badge">
              <span>🏆 Winner</span>
            </div>
          )}
        </div>
      </div>

      {!hasScore && match.status === 'UPCOMING' && (
        <div className="match-detail-upcoming">
          <p>Match scheduled for {formatMatchDateTime(match.date)}</p>
        </div>
      )}

      {/* Roster Section */}
      <div className="match-section">
        <h2 className="section-title">Lineups</h2>
        <div className="roster-grid">
          <div className="roster-column">
            <h3 className="roster-team-name">{team1Name}</h3>
            <div className="roster-list">
              {paginatedTeam1.length > 0 ? (
                <>
                  {paginatedTeam1.map((mp) => (
                    <div key={mp.id} className={`roster-item ${isPlayerActive(mp, activeTeam1Ids) ? 'on-floor' : ''}`}>
                      <span className="player-num">{mp.jerseyNumber || '#'}</span>
                      <span className="player-name">{mp.player.firstName} {mp.player.lastName}</span>
                      {isPlayerActive(mp, activeTeam1Ids) ? (
                         <div className="flex flex-col items-end">
                            <span className="on-floor-badge pulse-dot-container">
                              <span className="pulse-dot"></span> In
                            </span>
                            {(() => {
                                const subInfo = getPlayerSubInfo(mp.playerId, true);
                                if (subInfo) return <span className="text-[10px] text-green-600 font-medium whitespace-nowrap">{subInfo}</span>
                             })()}
                         </div>
                       ) : (
                         <div className="flex flex-col items-end">
                            {mp.started && <span className="starter-badge">S</span>}
                             {(() => {
                                const subInfo = getPlayerSubInfo(mp.playerId, false);
                                if (mp.subOut) {
                                  return (
                                    <div className="flex flex-col items-end">
                                      <span className="pulse-dot-container-red">
                                        <span className="pulse-dot-red"></span> Out
                                      </span>
                                      {subInfo && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">{subInfo}</span>}
                                    </div>
                                  );
                                }
                             })()}
                         </div>
                      )}
                      {mp.position && <span className="player-pos">{mp.position}</span>}
                    </div>
                  ))}
                  {totalPages1 > 1 && (
                    <div className="roster-pagination">
                      <button 
                        onClick={() => setPage1(p => Math.max(1, p - 1))}
                        disabled={page1 === 1}
                        className="pagi-btn"
                      >
                        Prev
                      </button>
                      <span className="pagi-info">{page1} / {totalPages1}</span>
                      <button 
                        onClick={() => setPage1(p => Math.min(totalPages1, p + 1))}
                        disabled={page1 === totalPages1}
                        className="pagi-btn"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="no-data">Roster not available</p>
              )}
            </div>
          </div>
          <div className="roster-column">
            <h3 className="roster-team-name">{team2Name}</h3>
            <div className="roster-list">
              {paginatedTeam2.length > 0 ? (
                <>
                  {paginatedTeam2.map((mp) => (
                    <div key={mp.id} className={`roster-item ${isPlayerActive(mp, activeTeam2Ids) ? 'on-floor' : ''}`}>
                      <span className="player-num">{mp.jerseyNumber || '#'}</span>
                      <span className="player-name">{mp.player.firstName} {mp.player.lastName}</span>
                      {isPlayerActive(mp, activeTeam2Ids) ? (
                         <div className="flex flex-col items-end">
                            <span className="on-floor-badge pulse-dot-container">
                              <span className="pulse-dot"></span> In
                            </span>
                            {(() => {
                                const subInfo = getPlayerSubInfo(mp.playerId, true);
                                if (subInfo) return <span className="text-[10px] text-green-600 font-medium whitespace-nowrap">{subInfo}</span>
                             })()}
                         </div>
                       ) : (
                         <div className="flex flex-col items-end">
                            {mp.started && <span className="starter-badge">S</span>}
                             {(() => {
                                const subInfo = getPlayerSubInfo(mp.playerId, false);
                                if (mp.subOut) {
                                  return (
                                    <div className="flex flex-col items-end">
                                      <span className="pulse-dot-container-red">
                                        <span className="pulse-dot-red"></span> Out
                                      </span>
                                      {subInfo && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">{subInfo}</span>}
                                    </div>
                                  );
                                }
                             })()}
                         </div>
                      )}
                      {mp.position && <span className="player-pos">{mp.position}</span>}
                    </div>
                  ))}
                  {totalPages2 > 1 && (
                    <div className="roster-pagination">
                      <button 
                        onClick={() => setPage2(p => Math.max(1, p - 1))}
                        disabled={page2 === 1}
                        className="pagi-btn"
                      >
                        Prev
                      </button>
                      <span className="pagi-info">{page2} / {totalPages2}</span>
                      <button 
                        onClick={() => setPage2(p => Math.min(totalPages2, p + 1))}
                        disabled={page2 === totalPages2}
                        className="pagi-btn"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="no-data">Roster not available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Play by Play Section */}
      {events.length > 0 && (
        <div className="match-section">
          <h2 className="section-title">Play-by-Play</h2>
          <div className="timeline">
            {events.map((event) => {
              const isTeam1 = event.teamId === team1Id;
              return (
                <div key={event.id} className={`timeline-event ${isTeam1 ? 'left' : 'right'}`}>
                  <div className="event-time">
                    {event.period ? getPeriodLabel(event.period) : ''} 
                    {event.secondsRemaining !== null ? ` ${formatClockTime(event.secondsRemaining)}` : ` ${event.minute}'`}
                  </div>
                  <div className="event-content">
                    <div className="event-header">
                      <span className="event-type">
                        {event.eventType === 'OTHER' 
                          ? (event.description || 'Other Event') 
                          : (EVENT_TYPE_LABELS[event.eventType] || event.eventType)}
                      </span>
                      <span className="event-player">
                        {event.player ? `${event.player.firstName} ${event.player.lastName}` : ''}
                      </span>
                    </div>
                    {event.description && event.eventType !== 'OTHER' && <p className="event-desc">{event.description}</p>}
                    {event.assistPlayer && (
                      <p className="event-assist">Assist by {event.assistPlayer.firstName} {event.assistPlayer.lastName}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Photos - public gallery */}
      <MatchImagesPublic matchId={match.id} />

      <style>{`
        .match-detail {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .match-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .match-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .status-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .live-indicator-pulse {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
          animation: status-pulse 1.5s infinite;
        }

        @keyframes status-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .match-live-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          background: #f8fafc;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          min-width: 120px;
        }

        .current-period {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .match-clock {
          font-size: 1.5rem;
          font-weight: 800;
          font-family: monospace;
          color: #1e293b;
        }

        .match-clock.paused {
          color: #94a3b8;
        }

        .match-league {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .match-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          width: fit-content;
        }

        .match-detail-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .date-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .date-relative {
          font-size: 0.875rem;
          color: #64748b;
        }

        .match-detail-teams {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .match-team-detail {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          flex: 1;
          position: relative;
        }

        .match-team-detail.winner::before {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border: 3px solid #fbbf24;
          border-radius: 16px;
          z-index: -1;
          animation: winner-glow 2s ease-in-out infinite;
        }

        @keyframes winner-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
          }
        }

        .winner-badge {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }

        .tie-indicator {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .team-logo-large {
          object-fit: contain;
        }

        .team-name-large {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          margin: 0;
        }

        .team-score-large {
          font-size: 3rem;
          font-weight: 800;
          color: #1e293b;
        }

        .match-vs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .vs-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .score-separator {
          font-size: 2rem;
          font-weight: 700;
          color: #94a3b8;
        }
        
        .possession-indicator {
          position: absolute;
          top: -10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #1e293b;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }

        .possession-indicator.left { left: 50%; transform: translateX(-50%); }
        .possession-indicator.right { right: 50%; transform: translateX(50%); }

        .possession-dot {
          width: 8px;
          height: 8px;
          background: #fbbf24;
          border-radius: 50%;
          animation: pulse-possession 1.5s infinite;
        }

        @keyframes pulse-possession {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
          70% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 0 6px rgba(251, 191, 36, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }

        /* Sections */
        .match-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #f1f5f9;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        /* Rosters */
        .roster-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .roster-team-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }

        .roster-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .roster-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 6px;
          background: #f8fafc;
        }

        .player-num {
          font-weight: 700;
          color: #3b82f6;
          width: 25px;
        }

        .player-name {
          flex: 1;
          font-weight: 500;
        }

        .starter-badge {
          background: #10b981;
          color: white;
          font-size: 0.625rem;
          font-weight: 800;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .player-pos {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
        }

        .roster-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
        }

        .pagi-btn {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagi-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .pagi-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagi-info {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Play by Play Timeline */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 1rem;
        }

        .roster-item.on-floor {
          background: rgba(34, 197, 94, 0.08);
          border-left: 3px solid #22c55e;
          padding-left: 0.825rem;
        }

        .on-floor-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: #22c55e;
          text-transform: uppercase;
          background: rgba(34, 197, 94, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pulse-dot-container {
          display: inline-flex;
          align-items: center;
          margin-left: auto;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        .timeline-event {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          max-width: 80%;
        }

        .timeline-event.left {
          align-self: flex-start;
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
        }

        .pulse-dot-container-red {
          display: inline-flex;
          align-items: center;
          margin-left: auto;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .pulse-dot-red {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          margin-right: 4px;
        }

        .pulse-dot-container-red {
          display: inline-flex;
          align-items: center;
          margin-left: auto;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .pulse-dot-red {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          margin-right: 4px;
        }

        .timeline-event.right {
          align-self: flex-end;
          border-right: 4px solid #ef4444;
          background: #fef2f2;
          text-align: right;
        }

        .event-time {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .event-header {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .timeline-event.right .event-header {
          flex-direction: row-reverse;
        }

        .event-type {
          font-weight: 700;
          color: #1e293b;
        }

        .event-player {
          font-weight: 600;
          color: #475569;
        }

        .event-desc {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          font-style: italic;
          color: #64748b;
        }

        .event-assist {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #3b82f6;
          font-weight: 600;
        }

        .no-data {
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          padding: 1rem;
        }

        @media (max-width: 768px) {
          .match-detail { padding: 1.5rem; }
          .match-detail-header { flex-direction: column; gap: 1rem; }
          .match-detail-date { align-items: flex-start; }
          .match-detail-teams { flex-direction: column; gap: 2rem; }
          .team-logo-large { width: 80px; height: 80px; }
          .roster-grid { grid-template-columns: 1fr; }
          .timeline-event { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}

