/**
 * ParticipatingTeams — the "who's in, who's through" breakdown that sits above
 * the bracket: summary stats, the champion (if crowned), and the split of teams
 * still advancing vs. eliminated.
 */
import React from 'react';
import TeamLogo from '../../../matches/presentation/components/TeamLogo';
import type { PlayoffStats, PlayoffTeamVM } from '../../lib/playoff-view-model';
import styles from './ParticipatingTeams.module.css';

interface ParticipatingTeamsProps {
  all: PlayoffTeamVM[];
  alive: PlayoffTeamVM[];
  eliminated: PlayoffTeamVM[];
  champion: PlayoffTeamVM | null;
  stats: PlayoffStats;
}

function record(team: PlayoffTeamVM): string {
  return `${team.wins}–${team.losses}`;
}

function TeamRow({ team, eliminated }: { team: PlayoffTeamVM; eliminated?: boolean }) {
  return (
    <li className={`${styles.teamRow} ${eliminated ? styles.eliminated : ''}`}>
      <TeamLogo logo={team.logo} name={team.name} size="sm" />
      <span className={styles.teamName}>{team.name}</span>
      <span className={styles.record}>{record(team)}</span>
    </li>
  );
}

export default function ParticipatingTeams({
  all,
  alive,
  eliminated,
  champion,
  stats,
}: ParticipatingTeamsProps) {
  // The champion is shown in its own banner, not in the "advancing" list.
  const advancing = alive;

  return (
    <div className={styles.panel}>
      <div className={styles.statsStrip}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.teamCount}</div>
          <div className={styles.statLabel}>Teams</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.rounds}</div>
          <div className={styles.statLabel}>Rounds</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{stats.byes}</div>
          <div className={styles.statLabel}>Byes</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {stats.matchesPlayed}/{stats.totalMatches}
          </div>
          <div className={styles.statLabel}>Games Played</div>
        </div>
      </div>

      {champion && (
        <div className={styles.championBanner}>
          <TeamLogo logo={champion.logo} name={champion.name} size="lg" />
          <div>
            <div className={styles.championLabel}>Champion</div>
            <div className={styles.championName}>{champion.name}</div>
          </div>
        </div>
      )}

      <div className={styles.columns}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>
            <span className={`${styles.dot} ${styles.dotAlive}`} />
            {champion ? 'Still Advancing' : 'In Contention'}
            <span className={styles.count}>({advancing.length})</span>
          </h3>
          {advancing.length > 0 ? (
            <ul className={styles.teamList}>
              {advancing.map((team) => (
                <TeamRow key={team.id} team={team} />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyNote}>No teams remaining.</p>
          )}
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>
            <span className={`${styles.dot} ${styles.dotOut}`} />
            Eliminated
            <span className={styles.count}>({eliminated.length})</span>
          </h3>
          {eliminated.length > 0 ? (
            <ul className={styles.teamList}>
              {eliminated.map((team) => (
                <TeamRow key={team.id} team={team} eliminated />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyNote}>No teams eliminated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
