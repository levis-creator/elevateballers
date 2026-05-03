import { useState, useEffect, useRef, useMemo } from 'react';
import type { MatchWithFullDetails, MatchPlayerWithDetails } from '../../cms/types';
import {
  formatMatchDate,
  formatMatchTime,
  formatMatchDateTime,
  getMatchStatusLabel,
  getRelativeTimeDescription,
} from '../../lib/utils';
import { getTeam1Name, getTeam1Logo, getTeam2Name, getTeam2Logo, getTeam1Id, getTeam2Id, isWinner } from '../../lib/team-helpers';
import { getStageDisplayName } from '../../domain/usecases/stage-helpers';
import TeamLogo from './TeamLogo';
import { getLeagueName } from '../../lib/league-helpers';
import MatchImagesPublic from './MatchImagesPublic';

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

// Maps event type → semantic category for color-coding the play-by-play
function getEventCategory(eventType: string): 'made' | 'miss' | 'foul' | 'assist' | 'rebound' | 'sub' | 'neutral' {
  if (eventType.endsWith('_MADE')) return 'made';
  if (eventType.endsWith('_MISSED')) return 'miss';
  if (eventType.startsWith('FOUL') || eventType === 'TURNOVER') return 'foul';
  if (eventType === 'ASSIST' || eventType === 'STEAL' || eventType === 'BLOCK') return 'assist';
  if (eventType.startsWith('REBOUND')) return 'rebound';
  if (eventType.startsWith('SUBSTITUTION')) return 'sub';
  return 'neutral';
}

function getPeriodLabel(period: number): string {
  if (period <= 4) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = period % 10;
    const suffix = remainder <= 3 && Math.floor(period / 10) !== 1 ? suffixes[remainder] || 'th' : 'th';
    return `${period}${suffix} Qtr`;
  }
  return `OT${period - 4}`;
}

function formatClockTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

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

  const matchRef = useRef(match);
  matchRef.current = match;

  useEffect(() => {
    if (match.status === 'COMPLETED') return;
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

  useEffect(() => {
    if (match.status !== 'LIVE' || !match.clockRunning) return;
    if (!match.clockStartedAt || match.clockSecondsAtStart == null) return;
    const ticker = setInterval(() => {
      setLocalClock(computeRemainingFromTimestamp(matchRef.current));
    }, 1000);
    setLocalClock(computeRemainingFromTimestamp(match));
    return () => clearInterval(ticker);
  }, [match.status, match.clockRunning, match.clockStartedAt, match.clockSecondsAtStart]);

  useEffect(() => {
    setLocalClock(computeRemainingFromTimestamp(match));
  }, [match.clockSeconds, match.clockStartedAt, match.clockSecondsAtStart, match.clockRunning]);

  const statusLabel = getMatchStatusLabel(match.status);
  const hasScore = match.team1Score !== null && match.team2Score !== null;
  const relativeTime = getRelativeTimeDescription(match.date);
  const team1Name = getTeam1Name(match);
  const team1Logo = getTeam1Logo(match);
  const team2Name = getTeam2Name(match);
  const team2Logo = getTeam2Logo(match);
  const team1Id = getTeam1Id(match);
  const team2Id = getTeam2Id(match);
  const team1Slug = (match as any).team1?.slug as string | undefined;
  const team2Slug = (match as any).team2?.slug as string | undefined;
  const leagueName = getLeagueName(match);
  const stageLabel = match.stage ? getStageDisplayName(match.stage) : null;
  const seoHeading = match.date
    ? `${team1Name} vs ${team2Name} — ${leagueName}, ${formatMatchDate(match.date)}`
    : `${team1Name} vs ${team2Name} — ${leagueName}`;
  const team1IsWinner = isWinner(match, team1Id);
  const team2IsWinner = isWinner(match, team2Id);
  const isTie = match.status === 'COMPLETED' && match.team1Score !== null && match.team2Score !== null && match.team1Score === match.team2Score;
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isUpcoming = match.status === 'UPCOMING';
  const team1HasPossession = isLive && match.possessionTeamId === team1Id;
  const team2HasPossession = isLive && match.possessionTeamId === team2Id;

  const team1Players = useMemo(() => match.matchPlayers?.filter(mp => mp.teamId === team1Id) || [], [match.matchPlayers, team1Id]);
  const team2Players = useMemo(() => match.matchPlayers?.filter(mp => mp.teamId === team2Id) || [], [match.matchPlayers, team2Id]);
  const events = useMemo(
    () => [...(match.events || [])].sort((a, b) => b.minute - a.minute || (b.secondsRemaining || 0) - (a.secondsRemaining || 0)),
    [match.events],
  );

  const getActivePlayers = (players: MatchPlayerWithDetails[]) => {
    const explicitlyActive = players.filter(mp => mp.isActive);
    if (explicitlyActive.length > 0 || match.status !== 'LIVE') return explicitlyActive;
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

  const isPlayerActive = (mp: MatchPlayerWithDetails, activeIds: Set<string>) => activeIds.has(mp.id);

  const getPlayerSubInfo = (playerId: string, isActive: boolean) => {
    const subs = (match as any).substitutions;
    if (!subs || !Array.isArray(subs) || subs.length === 0) return null;
    if (isActive) {
      const subIn = subs.find((s: any) => s.playerInId === playerId);
      if (subIn && subIn.playerOut) return `for ${subIn.playerOut.firstName} ${subIn.playerOut.lastName}`;
    } else {
      const subOut = subs.find((s: any) => s.playerOutId === playerId);
      if (subOut && subOut.playerIn) return `for ${subOut.playerIn.firstName} ${subOut.playerIn.lastName}`;
    }
    return null;
  };

  const paginatedTeam1 = sortedTeam1.slice((page1 - 1) * itemsPerPage, page1 * itemsPerPage);
  const paginatedTeam2 = sortedTeam2.slice((page2 - 1) * itemsPerPage, page2 * itemsPerPage);
  const totalPages1 = Math.ceil(sortedTeam1.length / itemsPerPage);
  const totalPages2 = Math.ceil(sortedTeam2.length / itemsPerPage);

  const renderTeamBlock = (
    side: 'home' | 'away',
    name: string,
    logo: string | null,
    slug: string | undefined,
    score: number | null | undefined,
    isWinnerTeam: boolean,
    hasPossession: boolean,
  ) => (
    <div className={`md-team md-team--${side} ${isWinnerTeam ? 'is-winner' : ''}`}>
      <div className="md-team-tag">
        <span className="md-team-tag-bar" aria-hidden />
        {side === 'home' ? 'HOME' : 'AWAY'}
      </div>
      {hasPossession && (
        <div className="md-poss-flag" aria-label={`${name} has possession`}>
          <span className="md-poss-dot" /> POSS
        </div>
      )}
      <div className="md-team-logo-wrap">
        {slug ? (
          <a href={`/teams/${slug}/`} className="md-team-link" aria-label={`${name} team page`}>
            <TeamLogo logo={logo} name={name} size="xl" className="md-team-logo" />
          </a>
        ) : (
          <TeamLogo logo={logo} name={name} size="xl" className="md-team-logo" />
        )}
      </div>
      <h2 className="md-team-name">
        {slug ? <a href={`/teams/${slug}/`} className="md-team-link">{name}</a> : name}
      </h2>
      {score !== null && score !== undefined ? (
        <div className="md-team-score">{score}</div>
      ) : (
        <div className="md-team-score md-team-score--empty">—</div>
      )}
      {isWinnerTeam && <span className="md-win-tag">Winner</span>}
    </div>
  );

  return (
    <div className="match-detail">
      <h1 className="md-sr-h1">{seoHeading}</h1>

      <section className={`md-hero md-hero--${match.status.toLowerCase()}`}>
        <div className="md-hero-court" aria-hidden />
        <div className="md-hero-stripes" aria-hidden />

        <div className="md-hero-top">
          <div className="md-hero-top-left">
            <span className="md-pill md-pill--league">{leagueName}</span>
            {stageLabel && <span className="md-pill md-pill--stage">{stageLabel}</span>}
          </div>
          <div className={`md-status md-status--${match.status.toLowerCase()}`}>
            {isLive && <span className="md-status-dot" aria-hidden />}
            <span>{statusLabel}</span>
          </div>
          <div className="md-hero-top-right">
            <span className="md-date-chip">{formatMatchDate(match.date)}</span>
            <span className="md-time-chip">{formatMatchTime(match.date)}</span>
          </div>
        </div>

        <div className="md-scoreboard">
          {renderTeamBlock('home', team1Name, team1Logo, team1Slug, match.team1Score, team1IsWinner, team1HasPossession)}

          <div className="md-pylon">
            {isLive ? (
              <>
                <span className="md-pylon-period">{getPeriodLabel(match.currentPeriod)}</span>
                <span className={`md-pylon-clock ${!match.clockRunning ? 'paused' : ''}`}>
                  {formatClockTime(localClock)}
                </span>
                <span className="md-pylon-tag md-pylon-tag--live">
                  <span className="md-live-pulse" aria-hidden /> LIVE
                </span>
              </>
            ) : isCompleted ? (
              <>
                <span className="md-pylon-final">FINAL</span>
                <span className="md-pylon-divider" aria-hidden />
                {isTie ? (
                  <span className="md-pylon-tag md-pylon-tag--tie">Tied</span>
                ) : (
                  <span className="md-pylon-tag">Full-time</span>
                )}
              </>
            ) : (
              <>
                <span className="md-pylon-vs">VS</span>
                <span className="md-pylon-divider" aria-hidden />
                <span className="md-pylon-tip">Tip-off</span>
                <span className="md-pylon-tag">{relativeTime}</span>
              </>
            )}
          </div>

          {renderTeamBlock('away', team2Name, team2Logo, team2Slug, match.team2Score, team2IsWinner, team2HasPossession)}
        </div>

        {(isLive || isCompleted) && (
          <div className="md-stats-strip" aria-label="Team game stats">
            <div className="md-stats-side md-stats-side--home">
              <div className="md-stat">
                <span className="md-stat-value">{match.team1Fouls}</span>
                <span className="md-stat-label">Fouls</span>
              </div>
              <div className="md-stat">
                <span className="md-stat-value">{match.team1Timeouts}</span>
                <span className="md-stat-label">Timeouts</span>
              </div>
            </div>
            <div className="md-stats-divider" aria-hidden />
            <div className="md-stats-side md-stats-side--away">
              <div className="md-stat">
                <span className="md-stat-value">{match.team2Fouls}</span>
                <span className="md-stat-label">Fouls</span>
              </div>
              <div className="md-stat">
                <span className="md-stat-value">{match.team2Timeouts}</span>
                <span className="md-stat-label">Timeouts</span>
              </div>
            </div>
          </div>
        )}

        {isUpcoming && (
          <div className="md-tipoff-banner">
            <span className="md-tipoff-label">Tip-off</span>
            <span className="md-tipoff-value">{formatMatchDateTime(match.date)}</span>
            <span className="md-tipoff-rel">{relativeTime}</span>
          </div>
        )}
      </section>

      <section className="md-section">
        <header className="md-section-banner">
          <span className="md-section-bar" aria-hidden />
          <h2 className="md-section-title">Lineups</h2>
          <span className="md-section-sub">Starting Five & Bench</span>
        </header>

        <div className="md-rosters">
          {([
            { side: 'home', name: team1Name, list: paginatedTeam1, total: totalPages1, page: page1, setPage: setPage1, activeIds: activeTeam1Ids },
            { side: 'away', name: team2Name, list: paginatedTeam2, total: totalPages2, page: page2, setPage: setPage2, activeIds: activeTeam2Ids },
          ] as const).map(({ side, name, list, total, page, setPage, activeIds }) => (
            <div key={side} className={`md-roster md-roster--${side}`}>
              <div className="md-roster-head">
                <span className="md-roster-side">{side === 'home' ? 'HOME' : 'AWAY'}</span>
                <h3 className="md-roster-name">{name}</h3>
              </div>
              <div className="md-roster-list">
                {list.length > 0 ? (
                  <>
                    {list.map((mp) => {
                      const onFloor = isPlayerActive(mp, activeIds);
                      const subInfo = getPlayerSubInfo(mp.playerId, onFloor);
                      return (
                        <div key={mp.id} className={`md-player ${onFloor ? 'is-on' : ''}`}>
                          <span className="md-jersey">{mp.jerseyNumber ?? mp.player?.jerseyNumber ?? '·'}</span>
                          <div className="md-player-body">
                            <span className="md-player-name">{mp.player.firstName} {mp.player.lastName}</span>
                            {subInfo && (
                              <span className={`md-sub-info ${onFloor ? 'in' : 'out'}`}>{subInfo}</span>
                            )}
                          </div>
                          <div className="md-player-tags">
                            {mp.position && <span className="md-pos">{mp.position}</span>}
                            {onFloor ? (
                              <span className="md-tag md-tag--on">
                                <span className="md-tag-dot" /> ON
                              </span>
                            ) : mp.subOut ? (
                              <span className="md-tag md-tag--off">
                                <span className="md-tag-dot" /> OUT
                              </span>
                            ) : mp.started ? (
                              <span className="md-tag md-tag--start">START</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {total > 1 && (
                      <div className="md-pager">
                        <button
                          type="button"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="md-pager-btn"
                        >
                          ‹ Prev
                        </button>
                        <span className="md-pager-info">{page} / {total}</span>
                        <button
                          type="button"
                          onClick={() => setPage(p => Math.min(total, p + 1))}
                          disabled={page === total}
                          className="md-pager-btn"
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="md-empty">Roster not available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section className="md-section">
          <header className="md-section-banner">
            <span className="md-section-bar" aria-hidden />
            <h2 className="md-section-title">Play-by-Play</h2>
            <span className="md-section-sub">Most recent first</span>
          </header>

          <div className="md-timeline" role="list">
            <span className="md-timeline-spine" aria-hidden />
            {events.map((event) => {
              const isTeam1 = event.teamId === team1Id;
              const category = getEventCategory(event.eventType);
              const label = event.eventType === 'OTHER'
                ? (event.description || 'Other Event')
                : (EVENT_TYPE_LABELS[event.eventType] || event.eventType);
              return (
                <div
                  key={event.id}
                  role="listitem"
                  className={`md-event md-event--${isTeam1 ? 'home' : 'away'} md-event--${category}`}
                >
                  <span className="md-event-marker" aria-hidden />
                  <div className="md-event-card">
                    <div className="md-event-time">
                      {event.period ? getPeriodLabel(event.period) : ''}
                      {event.secondsRemaining !== null ? ` · ${formatClockTime(event.secondsRemaining)}` : ` · ${event.minute}'`}
                    </div>
                    <div className="md-event-headline">
                      <span className={`md-event-type md-event-type--${category}`}>{label}</span>
                      {event.player && (
                        <span className="md-event-player">
                          {event.player.firstName} {event.player.lastName}
                        </span>
                      )}
                    </div>
                    {event.description && event.eventType !== 'OTHER' && (
                      <p className="md-event-desc">{event.description}</p>
                    )}
                    {event.assistPlayer && (
                      <p className="md-event-assist">
                        Assist · {event.assistPlayer.firstName} {event.assistPlayer.lastName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <MatchImagesPublic matchId={match.id} matchSlug={(match as any).slug} />

      <style>{`
        .match-detail {
          color: #f1f5f9;
          position: relative;
        }

        .md-sr-h1 {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* ============ HERO SCOREBOARD ============ */
        .md-hero {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          padding: 1.5rem 1.75rem 2rem;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 186, 0, 0.14), transparent 60%),
            linear-gradient(135deg, rgba(59, 130, 246, 0.10) 0%, transparent 38%, transparent 62%, rgba(239, 68, 68, 0.10) 100%),
            linear-gradient(180deg, #1a1530 0%, #0f0d18 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        /* Faint basketball-court arc lines for sport vibe */
        .md-hero-court {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image:
            radial-gradient(circle at 50% 50%, transparent 70px, rgba(255, 186, 0, 0.6) 70px, rgba(255, 186, 0, 0.6) 71px, transparent 72px),
            radial-gradient(circle at 50% 50%, transparent 130px, rgba(255, 255, 255, 0.4) 130px, rgba(255, 255, 255, 0.4) 131px, transparent 132px);
          pointer-events: none;
        }

        /* Diagonal team-side wash (home=cyan, away=red) */
        .md-hero-stripes {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(110deg, rgba(56, 189, 248, 0.07) 0%, rgba(56, 189, 248, 0.03) 35%, transparent 50%),
            linear-gradient(290deg, rgba(248, 113, 113, 0.07) 0%, rgba(248, 113, 113, 0.03) 35%, transparent 50%);
        }

        .md-hero > *:not(.md-hero-court):not(.md-hero-stripes) { position: relative; z-index: 1; }

        .md-hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .md-hero-top-left,
        .md-hero-top-right {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .md-hero-top-right { justify-content: flex-end; }

        .md-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .md-pill--league {
          background: rgba(255, 186, 0, 0.12);
          color: #ffba00;
          border-color: rgba(255, 186, 0, 0.35);
        }
        .md-pill--stage {
          background: rgba(255, 255, 255, 0.04);
          color: #cbd5e1;
        }

        .md-date-chip,
        .md-time-chip {
          font-size: 0.7rem;
          font-weight: 700;
          color: #cbd5e1;
          padding: 0.35rem 0.7rem;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          letter-spacing: 0.06em;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        .md-time-chip { color: #f1f5f9; }

        .md-status {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        .md-status--live {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
        }
        .md-status--upcoming {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.4);
        }
        .md-status--completed {
          background: rgba(255, 255, 255, 0.06);
          color: #f1f5f9;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .md-status-dot {
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          animation: md-pulse 1.4s infinite;
        }

        @keyframes md-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        /* ============ SCOREBOARD ============ */
        .md-scoreboard {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1.25rem;
          padding: 0.5rem 0;
        }

        .md-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          position: relative;
          padding: 1rem 0.5rem;
          border-radius: 14px;
          transition: transform 0.25s ease;
        }

        .md-team-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.32em;
          text-transform: uppercase;
        }
        .md-team-tag-bar {
          display: inline-block;
          width: 18px;
          height: 3px;
          border-radius: 2px;
        }
        .md-team--home .md-team-tag { color: #38bdf8; }
        .md-team--home .md-team-tag-bar { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
        .md-team--away .md-team-tag { color: #f87171; }
        .md-team--away .md-team-tag-bar { background: linear-gradient(90deg, #ef4444, #f87171); }

        .md-team-logo-wrap {
          position: relative;
          padding: 0.5rem;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.06), transparent 70%);
        }

        .md-team-logo {
          object-fit: contain;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.55));
          transition: transform 0.25s ease;
        }

        .md-team-link {
          color: inherit;
          text-decoration: none;
          display: inline-block;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .md-team-link:hover { color: #ffba00; }
        a.md-team-link:hover .md-team-logo { transform: translateY(-3px) scale(1.04); }

        .md-team-name {
          font-family: 'Rubik', system-ui, sans-serif !important;
          font-size: 1.25rem !important;
          line-height: 1.15 !important;
          font-weight: 800;
          color: #f8fafc !important;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
        }
        .md-team-name .md-team-link { color: #f8fafc; }
        .md-team-name .md-team-link:hover { color: #ffba00; }

        .md-team-score {
          font-size: 4rem;
          font-weight: 900;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          line-height: 0.95;
          color: #f8fafc;
          letter-spacing: -0.04em;
          text-shadow: 0 0 24px rgba(255, 186, 0, 0.3);
        }
        .md-team--home .md-team-score { color: #f0f9ff; text-shadow: 0 0 24px rgba(56, 189, 248, 0.4); }
        .md-team--away .md-team-score { color: #fff5f5; text-shadow: 0 0 24px rgba(248, 113, 113, 0.4); }
        .md-team-score--empty {
          font-size: 3.2rem;
          color: #475569;
          text-shadow: none;
        }

        .md-team.is-winner .md-team-score {
          color: #ffba00;
          text-shadow: 0 0 30px rgba(255, 186, 0, 0.6);
        }

        .md-team.is-winner::after {
          content: '';
          position: absolute;
          inset: -6px;
          border: 2px solid rgba(255, 186, 0, 0.55);
          border-radius: 18px;
          animation: md-winner-glow 2.4s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes md-winner-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(255, 186, 0, 0.3); }
          50% { box-shadow: 0 0 32px rgba(255, 186, 0, 0.7); }
        }

        .md-win-tag {
          padding: 0.35rem 0.85rem;
          background: linear-gradient(135deg, #ffba00 0%, #f59e0b 100%);
          color: #1a1530;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          box-shadow: 0 8px 20px rgba(255, 186, 0, 0.4);
        }

        .md-poss-flag {
          position: absolute;
          top: -10px;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.7rem;
          background: linear-gradient(135deg, #ffba00 0%, #f59e0b 100%);
          color: #1a1530;
          border-radius: 9999px;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          box-shadow: 0 6px 14px rgba(255, 186, 0, 0.45);
          z-index: 5;
        }
        .md-poss-dot {
          width: 6px;
          height: 6px;
          background: #1a1530;
          border-radius: 50%;
          animation: md-pulse-dark 1.5s infinite;
        }
        @keyframes md-pulse-dark {
          0% { box-shadow: 0 0 0 0 rgba(26, 21, 48, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(26, 21, 48, 0); }
          100% { box-shadow: 0 0 0 0 rgba(26, 21, 48, 0); }
        }

        /* PYLON (center column) */
        .md-pylon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          min-width: 130px;
          padding: 1rem 1.25rem;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .md-pylon-period {
          font-size: 0.66rem;
          font-weight: 800;
          color: #ffba00;
          text-transform: uppercase;
          letter-spacing: 0.24em;
        }
        .md-pylon-clock {
          font-size: 1.85rem;
          font-weight: 900;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          color: #f8fafc;
          line-height: 1;
          text-shadow: 0 0 16px rgba(255, 186, 0, 0.4);
          letter-spacing: -0.02em;
        }
        .md-pylon-clock.paused {
          color: #64748b;
          text-shadow: none;
        }
        .md-pylon-final,
        .md-pylon-vs {
          font-size: 1.5rem;
          font-weight: 900;
          color: #ffba00;
          letter-spacing: 0.14em;
          font-family: 'Rubik', system-ui, sans-serif;
        }
        .md-pylon-vs { color: #475569; font-size: 1.25rem; letter-spacing: 0.28em; }
        .md-pylon-divider {
          width: 32px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 186, 0, 0.7), transparent);
          border-radius: 1px;
        }
        .md-pylon-tip {
          font-size: 0.6rem;
          color: #94a3b8;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .md-pylon-tag {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #cbd5e1;
        }
        .md-pylon-tag--live {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #fca5a5;
        }
        .md-pylon-tag--tie { color: #ffba00; }
        .md-live-pulse {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: md-pulse-red 1.4s infinite;
        }
        @keyframes md-pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* STATS STRIP */
        .md-stats-strip {
          margin-top: 1.5rem;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .md-stats-side {
          display: flex;
          gap: 1.5rem;
        }
        .md-stats-side--home { justify-content: flex-start; }
        .md-stats-side--away { justify-content: flex-end; }
        .md-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          align-items: center;
        }
        .md-stat-value {
          font-size: 1.1rem;
          font-weight: 900;
          color: #f8fafc;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          line-height: 1;
        }
        .md-stat-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }
        .md-stats-divider {
          width: 1px;
          height: 28px;
          background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.18), transparent);
        }

        /* TIPOFF banner (UPCOMING only) */
        .md-tipoff-banner {
          margin-top: 1.5rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.9rem;
          padding: 0.85rem 1.25rem;
          background: linear-gradient(90deg, rgba(56, 189, 248, 0.08), rgba(255, 186, 0, 0.06), rgba(248, 113, 113, 0.08));
          border: 1px solid rgba(255, 186, 0, 0.25);
          border-radius: 12px;
        }
        .md-tipoff-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #ffba00;
          text-transform: uppercase;
          letter-spacing: 0.24em;
        }
        .md-tipoff-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: #f1f5f9;
        }
        .md-tipoff-rel {
          font-size: 0.78rem;
          color: #94a3b8;
          font-style: italic;
        }

        /* ============ SECTIONS ============ */
        .md-section {
          margin-top: 2.5rem;
        }

        .md-section-banner {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.5rem;
        }
        .md-section-bar {
          width: 6px;
          height: 28px;
          border-radius: 3px;
          background: linear-gradient(180deg, #ffba00 0%, #f59e0b 100%);
          box-shadow: 0 0 12px rgba(255, 186, 0, 0.5);
        }
        .md-section-title {
          font-family: 'Rubik', system-ui, sans-serif !important;
          font-size: 1.1rem !important;
          line-height: 1 !important;
          font-weight: 900;
          color: #f8fafc !important;
          margin: 0 !important;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }
        .md-section-sub {
          margin-left: auto;
          font-size: 0.65rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-weight: 700;
        }

        /* ============ ROSTERS ============ */
        .md-rosters {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .md-roster {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }
        .md-roster::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }
        .md-roster--home::before { background: linear-gradient(90deg, #0ea5e9, #38bdf8, transparent); }
        .md-roster--away::before { background: linear-gradient(270deg, #ef4444, #f87171, transparent); }

        .md-roster-head {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          padding: 0.5rem 0.25rem 0.85rem;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          margin-bottom: 0.85rem;
        }
        .md-roster-side {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.32em;
          text-transform: uppercase;
        }
        .md-roster--home .md-roster-side { color: #38bdf8; }
        .md-roster--away .md-roster-side { color: #f87171; }

        .md-roster-name {
          font-family: 'Rubik', system-ui, sans-serif !important;
          font-size: 0.95rem !important;
          line-height: 1 !important;
          font-weight: 800;
          color: #f1f5f9 !important;
          margin: 0 !important;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .md-roster-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .md-player {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.55rem 0.7rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        }
        .md-player:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateX(2px);
        }
        .md-player.is-on {
          background: linear-gradient(90deg, rgba(34, 197, 94, 0.14), rgba(34, 197, 94, 0.04));
          border-color: rgba(34, 197, 94, 0.3);
          border-left: 3px solid #22c55e;
          padding-left: calc(0.7rem - 2px);
        }

        .md-jersey {
          flex-shrink: 0;
          min-width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.4rem;
          background: linear-gradient(180deg, rgba(255, 186, 0, 0.18), rgba(255, 186, 0, 0.06));
          border: 1px solid rgba(255, 186, 0, 0.35);
          border-radius: 8px;
          color: #ffba00;
          font-weight: 900;
          font-size: 1rem;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          letter-spacing: -0.02em;
        }

        .md-player-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
        .md-player-name {
          font-weight: 600;
          color: #f1f5f9;
          font-size: 0.92rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .md-sub-info {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .md-sub-info.in { color: #4ade80; }
        .md-sub-info.out { color: #f87171; }

        .md-player-tags {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }

        .md-pos {
          font-size: 0.62rem;
          color: #94a3b8;
          font-weight: 800;
          letter-spacing: 0.12em;
          background: rgba(255, 255, 255, 0.05);
          padding: 3px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .md-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 3px 7px;
          border-radius: 4px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .md-tag--on { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .md-tag--off { background: rgba(239, 68, 68, 0.18); color: #f87171; }
        .md-tag--start { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; }
        .md-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: md-pulse-color 2s infinite;
        }
        @keyframes md-pulse-color {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .md-pager {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          margin-top: 0.85rem;
          padding-top: 0.65rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .md-pager-btn {
          padding: 0.3rem 0.85rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.18s;
        }
        .md-pager-btn:hover:not(:disabled) {
          background: rgba(255, 186, 0, 0.12);
          border-color: rgba(255, 186, 0, 0.5);
          color: #ffba00;
        }
        .md-pager-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .md-pager-info {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .md-empty {
          text-align: center;
          color: #64748b;
          font-style: italic;
          padding: 1rem;
          margin: 0;
        }

        /* ============ TIMELINE ============ */
        .md-timeline {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 540px;
          overflow-y: auto;
          padding: 0.5rem 0.5rem 0.5rem 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 186, 0, 0.4) transparent;
          position: relative;
        }
        .md-timeline::-webkit-scrollbar { width: 6px; }
        .md-timeline::-webkit-scrollbar-thumb {
          background: rgba(255, 186, 0, 0.35);
          border-radius: 3px;
        }
        .md-timeline-spine {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, transparent, rgba(255, 186, 0, 0.25), transparent);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .md-event {
          position: relative;
          width: 50%;
          padding: 0 1.25rem;
          display: flex;
        }
        .md-event--home { padding-left: 0; padding-right: 1.25rem; justify-content: flex-end; }
        .md-event--away { margin-left: 50%; padding-right: 0; padding-left: 1.25rem; justify-content: flex-start; }

        .md-event-marker {
          position: absolute;
          top: 1.1rem;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffba00;
          border: 2px solid #1a1530;
          box-shadow: 0 0 0 2px rgba(255, 186, 0, 0.4);
          z-index: 2;
        }
        .md-event--home .md-event-marker { right: -7px; }
        .md-event--away .md-event-marker { left: -7px; }

        .md-event--made .md-event-marker { background: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.4); }
        .md-event--miss .md-event-marker { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.4); }
        .md-event--foul .md-event-marker { background: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4); }
        .md-event--assist .md-event-marker { background: #38bdf8; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4); }
        .md-event--rebound .md-event-marker { background: #a78bfa; box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.4); }
        .md-event--sub .md-event-marker { background: #94a3b8; box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.4); }

        .md-event-card {
          width: 100%;
          padding: 0.75rem 0.95rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .md-event-card:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 186, 0, 0.3);
        }
        .md-event--home .md-event-card {
          border-left: 3px solid #38bdf8;
          background: linear-gradient(90deg, rgba(56, 189, 248, 0.10), rgba(255, 255, 255, 0.02));
          text-align: right;
        }
        .md-event--away .md-event-card {
          border-right: 3px solid #f87171;
          background: linear-gradient(270deg, rgba(248, 113, 113, 0.10), rgba(255, 255, 255, 0.02));
          text-align: left;
        }

        .md-event-time {
          font-size: 0.62rem;
          font-weight: 900;
          color: #ffba00;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          margin-bottom: 0.35rem;
        }

        .md-event-headline {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .md-event--home .md-event-headline { flex-direction: row-reverse; }

        .md-event-type {
          font-weight: 800;
          font-size: 0.9rem;
          padding: 2px 8px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.06);
        }
        .md-event-type--made { color: #4ade80; background: rgba(34, 197, 94, 0.15); }
        .md-event-type--miss { color: #fbbf24; background: rgba(245, 158, 11, 0.15); }
        .md-event-type--foul { color: #f87171; background: rgba(239, 68, 68, 0.15); }
        .md-event-type--assist { color: #38bdf8; background: rgba(56, 189, 248, 0.15); }
        .md-event-type--rebound { color: #c4b5fd; background: rgba(167, 139, 250, 0.15); }
        .md-event-type--sub { color: #cbd5e1; }
        .md-event-type--neutral { color: #f1f5f9; }

        .md-event-player {
          font-weight: 700;
          color: #f1f5f9;
          font-size: 0.85rem;
        }
        .md-event-desc {
          margin: 0.4rem 0 0;
          font-size: 0.78rem;
          color: #94a3b8;
          font-style: italic;
        }
        .md-event-assist {
          margin: 0.3rem 0 0;
          font-size: 0.7rem;
          color: #60a5fa;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 768px) {
          .md-hero { padding: 1rem 1rem 1.25rem; }
          .md-hero-top { gap: 0.5rem; }
          .md-hero-top-left, .md-hero-top-right {
            flex: 1 0 100%;
            justify-content: center;
          }
          .md-status { order: -1; flex: 1 0 100%; justify-content: center; }
          .md-scoreboard {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .md-team { padding: 0.5rem 0; flex-direction: row; gap: 1rem; justify-content: space-between; }
          .md-team-tag { display: none; }
          .md-team-name { font-size: 1rem !important; flex: 1; text-align: left; }
          .md-team-score { font-size: 2.75rem; }
          .md-team-score--empty { font-size: 2rem; }
          .md-team-logo-wrap { padding: 0.25rem; }
          .md-team-logo { width: 56px !important; height: 56px !important; }
          .md-team.is-winner::after { inset: -3px; border-radius: 12px; }
          .md-poss-flag { top: -6px; right: 8px; left: auto; transform: none; font-size: 0.55rem; padding: 0.2rem 0.55rem; }
          .md-pylon { flex-direction: row; min-width: 0; padding: 0.6rem 0.85rem; gap: 0.85rem; flex-wrap: wrap; justify-content: center; }
          .md-pylon-divider { display: none; }
          .md-pylon-clock { font-size: 1.4rem; }

          .md-stats-strip { padding: 0.6rem 0.85rem; gap: 0.5rem; }
          .md-stats-side { gap: 0.85rem; }

          .md-rosters { grid-template-columns: 1fr; }
          .md-section-sub { display: none; }

          .md-timeline-spine { display: none; }
          .md-event { width: 100%; padding: 0; margin-left: 0 !important; }
          .md-event--home, .md-event--away { padding-left: 0; padding-right: 0; justify-content: stretch; }
          .md-event-marker { display: none; }
          .md-event--home .md-event-headline { flex-direction: row; }
          .md-event--home .md-event-card,
          .md-event--away .md-event-card { text-align: left; }
        }
      `}</style>
    </div>
  );
}
