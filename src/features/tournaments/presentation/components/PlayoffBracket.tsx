/**
 * PlayoffBracket — a lightweight, dependency-free bracket for the public
 * playoffs page. React 19 compatible. Renders single- or double-elimination
 * brackets from the shared BracketMatch shape, with CSS connector rails.
 */
import React from 'react';
import TeamLogo from '../../../matches/presentation/components/TeamLogo';
import type { BracketMatch } from '../../lib/bracket-converter';
import type { MatchStage } from '@prisma/client';
import styles from './PlayoffBracket.module.css';

type SingleBracket = BracketMatch[];
type DoubleBracket = {
  upper: BracketMatch[];
  lower: BracketMatch[];
  grandFinal?: BracketMatch[];
};

interface PlayoffBracketProps {
  bracket: SingleBracket | DoubleBracket;
  bracketType: 'single' | 'double';
}

// Chronological order of rounds within a bracket, left to right.
const STAGE_RANK: Record<MatchStage, number> = {
  QUALIFIER: 0,
  PLAYOFF: 1,
  QUARTER_FINALS: 2,
  SEMI_FINALS: 3,
  CHAMPIONSHIP: 4,
  REGULAR_SEASON: 5,
  PRESEASON: 6,
  EXHIBITION: 7,
  OTHER: 8,
};

interface Round {
  title: string;
  games: BracketMatch[];
}

/** Group matches into ordered rounds keyed by their round label. */
function groupIntoRounds(matches: BracketMatch[]): Round[] {
  const byTitle = new Map<string, BracketMatch[]>();
  for (const m of matches) {
    const title = m.tournamentRoundText || 'Round';
    if (!byTitle.has(title)) byTitle.set(title, []);
    byTitle.get(title)!.push(m);
  }

  const rankOf = (games: BracketMatch[]): number => {
    const stage = games[0]?.stage;
    return stage ? (STAGE_RANK[stage] ?? 99) : 99;
  };

  return Array.from(byTitle.entries())
    .map(([title, games]) => ({ title, games }))
    .sort((a, b) => rankOf(a.games) - rankOf(b.games));
}

function ParticipantRow({
  participant,
}: {
  participant: BracketMatch['participants'][number] | undefined;
}) {
  const isTbd = !participant || participant.name === 'TBD' || !participant.name;
  const name = isTbd ? 'TBD' : participant!.name;
  const rowClass = participant?.isWinner ? `${styles.row} ${styles.winner}` : styles.row;

  return (
    <div className={rowClass}>
      {!isTbd && <TeamLogo logo={participant!.logo} name={name} size="sm" />}
      <span className={`${styles.name} ${isTbd ? styles.tbd : ''}`}>{name}</span>
      <span className={styles.score}>
        {participant?.resultText != null && participant.resultText !== '' ? participant.resultText : '—'}
      </span>
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div className={styles.card}>
      <ParticipantRow participant={match.participants[0]} />
      <ParticipantRow participant={match.participants[1]} />
    </div>
  );
}

function RoundColumns({ matches }: { matches: BracketMatch[] }) {
  const rounds = groupIntoRounds(matches);
  return (
    <div className={styles.rounds}>
      {rounds.map((round) => (
        <div className={styles.round} key={round.title}>
          <div className={styles.roundHeading}>{round.title}</div>
          <div className={styles.games}>
            {round.games.map((game) => (
              <div className={styles.game} key={game.id}>
                <MatchCard match={game} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlayoffBracket({ bracket, bracketType }: PlayoffBracketProps) {
  if (bracketType === 'double' && !Array.isArray(bracket)) {
    const { upper, lower, grandFinal } = bracket;
    return (
      <div className={styles.wrapper}>
        {upper.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Winners Bracket</h3>
            <RoundColumns matches={upper} />
          </section>
        )}
        {lower.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Elimination Bracket</h3>
            <RoundColumns matches={lower} />
          </section>
        )}
        {grandFinal && grandFinal.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Grand Final</h3>
            <RoundColumns matches={grandFinal} />
          </section>
        )}
      </div>
    );
  }

  const matches = Array.isArray(bracket) ? bracket : bracket.upper;
  if (matches.length === 0) {
    return <div className={styles.empty}>The bracket has not been set yet. Check back soon.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <RoundColumns matches={matches} />
    </div>
  );
}
