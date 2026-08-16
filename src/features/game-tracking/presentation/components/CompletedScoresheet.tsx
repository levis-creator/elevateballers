import { useMemo } from 'react';
import {
  ArenaPanel,
  ArenaPanelContent,
  ArenaPanelHeader,
  ArenaPanelTitle,
} from './ArenaPanel';
import type {
  MatchWithFullDetails,
  MatchPlayerWithDetails,
  MatchEventWithDetails,
} from '../../../cms/types';
import { ClipboardList } from 'lucide-react';

interface CompletedScoresheetProps {
  match: MatchWithFullDetails;
  team1Id: string | null;
  team2Id: string | null;
  team1Name: string;
  team2Name: string;
}

interface PlayerRow {
  key: string;
  jersey: number | null;
  name: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
}

const POINT_EVENTS: Record<string, number> = {
  TWO_POINT_MADE: 2,
  THREE_POINT_MADE: 3,
  FREE_THROW_MADE: 1,
};

function emptyRow(key: string, jersey: number | null, name: string): PlayerRow {
  return { key, jersey, name, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0 };
}

function applyEvent(row: PlayerRow, event: MatchEventWithDetails) {
  const type = event.eventType;
  if (POINT_EVENTS[type]) {
    row.pts += POINT_EVENTS[type];
    return;
  }
  if (type === 'REBOUND_OFFENSIVE' || type === 'REBOUND_DEFENSIVE') row.reb += 1;
  else if (type === 'ASSIST') row.ast += 1;
  else if (type === 'STEAL') row.stl += 1;
  else if (type === 'BLOCK') row.blk += 1;
  else if (type === 'TURNOVER') row.to += 1;
  else if (type === 'FOUL_PERSONAL' || type === 'FOUL_TECHNICAL' || type === 'FOUL_FLAGRANT') row.pf += 1;
}

const FOUL_SUBTYPE_LABELS: Record<string, string> = {
  PF1: 'PF1 (1 shot)',
  PF2: 'PF2 (2 shots)',
  PF3: 'PF3 (3 shots)',
};

const TURNOVER_SUBTYPE_LABELS: Record<string, string> = {
  TRAVEL: 'Travel',
  PASS: 'Bad pass',
  DOUBLE_DRIBBLE: 'Double dribble',
  CARRY: 'Carry',
  OUT_OF_BOUNDS: 'Out of bounds',
  BACKCOURT: 'Back-court',
  SHOT_CLOCK: 'Shot clock',
  THREE_SECOND: '3-sec violation',
  OFFENSIVE_FOUL: 'Charge / off. foul',
  ILLEGAL_SCREEN: 'Illegal screen',
};

function aggregateSubtypes(
  teamId: string,
  eventType: 'FOUL_PERSONAL' | 'TURNOVER',
  events: MatchEventWithDetails[],
): Array<{ subtype: string; count: number }> {
  const counts = new Map<string, number>();
  events
    .filter((e) => e.teamId === teamId && !e.isUndone && e.eventType === eventType)
    .forEach((e) => {
      const subtype = (e.metadata as { subtype?: string } | null)?.subtype;
      if (!subtype) return;
      counts.set(subtype, (counts.get(subtype) ?? 0) + 1);
    });
  return Array.from(counts.entries()).map(([subtype, count]) => ({ subtype, count }));
}

function SubtypeBreakdown({
  title,
  labels,
  breakdown,
}: {
  title: string;
  labels: Record<string, string>;
  breakdown: Array<{ subtype: string; count: number }>;
}) {
  if (breakdown.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2 text-xs text-slate-300">
      <span className="font-heading uppercase tracking-[0.14em] text-slate-500">{title}</span>
      {breakdown.map(({ subtype, count }) => (
        <span key={subtype} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
          {labels[subtype] ?? subtype} · {count}
        </span>
      ))}
    </div>
  );
}

function aggregateTeam(
  teamId: string,
  matchPlayers: MatchPlayerWithDetails[],
  events: MatchEventWithDetails[],
): { rows: PlayerRow[]; totals: PlayerRow } {
  const rows = matchPlayers
    .filter((mp) => mp.teamId === teamId && mp.player)
    .map((mp) =>
      emptyRow(
        mp.id,
        mp.jerseyNumber ?? null,
        `${mp.player.firstName} ${mp.player.lastName}`,
      ),
    );
  const byPlayerId = new Map<string, PlayerRow>();
  matchPlayers
    .filter((mp) => mp.teamId === teamId && mp.player)
    .forEach((mp, i) => byPlayerId.set(mp.playerId, rows[i]));

  events
    .filter((e) => e.teamId === teamId && !e.isUndone && e.playerId)
    .forEach((e) => {
      const row = byPlayerId.get(e.playerId!);
      if (row) applyEvent(row, e);
      // Secondary contribution: assist player credited on a made shot event
      if (e.assistPlayerId && POINT_EVENTS[e.eventType]) {
        const assistRow = byPlayerId.get(e.assistPlayerId);
        if (assistRow) assistRow.ast += 1;
      }
    });

  const totals = rows.reduce(
    (acc, r) => {
      acc.pts += r.pts;
      acc.reb += r.reb;
      acc.ast += r.ast;
      acc.stl += r.stl;
      acc.blk += r.blk;
      acc.to += r.to;
      acc.pf += r.pf;
      return acc;
    },
    emptyRow('totals', null, 'TOTALS'),
  );

  const sorted = [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const aj = a.jersey ?? Number.POSITIVE_INFINITY;
    const bj = b.jersey ?? Number.POSITIVE_INFINITY;
    return aj - bj;
  });

  return { rows: sorted, totals };
}

function TeamStatTable({
  teamName,
  rows,
  totals,
  foulBreakdown,
  turnoverBreakdown,
}: {
  teamName: string;
  rows: PlayerRow[];
  totals: PlayerRow;
  foulBreakdown: Array<{ subtype: string; count: number }>;
  turnoverBreakdown: Array<{ subtype: string; count: number }>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
      <table className="w-full text-sm">
        <caption className="border-b border-white/10 bg-brand-gold/10 px-3 py-2 text-left font-heading text-sm uppercase tracking-[0.16em] text-brand-gold">
          {teamName}
        </caption>
        <thead>
          <tr className="text-left font-heading text-[0.7rem] uppercase tracking-[0.18em] text-slate-400">
            <th className="py-2 pl-3 pr-2">#</th>
            <th className="py-2 pr-2">Player</th>
            <th className="py-2 pr-2 text-right tabular-nums">PTS</th>
            <th className="py-2 pr-2 text-right tabular-nums">REB</th>
            <th className="py-2 pr-2 text-right tabular-nums">AST</th>
            <th className="py-2 pr-2 text-right tabular-nums">STL</th>
            <th className="py-2 pr-2 text-right tabular-nums">BLK</th>
            <th className="py-2 pr-2 text-right tabular-nums">TO</th>
            <th className="py-2 pr-3 text-right tabular-nums">PF</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-4 text-center text-slate-400">
                No roster recorded for this team
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.key} className="border-t border-white/5 text-slate-200 hover:bg-white/[0.03]">
                <td className="py-1.5 pl-3 pr-2 font-mono text-xs text-slate-400">
                  {r.jersey ?? '—'}
                </td>
                <td className="py-1.5 pr-2">{r.name}</td>
                <td className="py-1.5 pr-2 text-right font-heading tabular-nums">{r.pts}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{r.reb}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{r.ast}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{r.stl}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{r.blk}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{r.to}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{r.pf}</td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="border-t border-white/10 bg-white/[0.04] font-heading uppercase tracking-[0.12em] text-white">
              <td />
              <td className="py-2 pr-2">Totals</td>
              <td className="py-2 pr-2 text-right tabular-nums text-brand-gold">{totals.pts}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{totals.reb}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{totals.ast}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{totals.stl}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{totals.blk}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{totals.to}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{totals.pf}</td>
            </tr>
          </tfoot>
        )}
      </table>
      <SubtypeBreakdown title="Fouls" labels={FOUL_SUBTYPE_LABELS} breakdown={foulBreakdown} />
      <SubtypeBreakdown title="Turnovers" labels={TURNOVER_SUBTYPE_LABELS} breakdown={turnoverBreakdown} />
    </div>
  );
}

export default function CompletedScoresheet({
  match,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
}: CompletedScoresheetProps) {
  const matchPlayers = match.matchPlayers ?? [];
  const events = match.events ?? [];

  const team1 = useMemo(
    () => (team1Id ? aggregateTeam(team1Id, matchPlayers, events) : null),
    [team1Id, matchPlayers, events],
  );
  const team2 = useMemo(
    () => (team2Id ? aggregateTeam(team2Id, matchPlayers, events) : null),
    [team2Id, matchPlayers, events],
  );

  if (!team1 && !team2) return null;

  return (
    <ArenaPanel>
      <ArenaPanelHeader>
        <ArenaPanelTitle className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-brand-gold" />
          Scoresheet
          <span className="text-sm font-normal text-slate-400">
            (final)
          </span>
        </ArenaPanelTitle>
      </ArenaPanelHeader>
      <ArenaPanelContent>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {team1 && team1Id && (
            <TeamStatTable
              teamName={team1Name}
              rows={team1.rows}
              totals={team1.totals}
              foulBreakdown={aggregateSubtypes(team1Id, 'FOUL_PERSONAL', events)}
              turnoverBreakdown={aggregateSubtypes(team1Id, 'TURNOVER', events)}
            />
          )}
          {team2 && team2Id && (
            <TeamStatTable
              teamName={team2Name}
              rows={team2.rows}
              totals={team2.totals}
              foulBreakdown={aggregateSubtypes(team2Id, 'FOUL_PERSONAL', events)}
              turnoverBreakdown={aggregateSubtypes(team2Id, 'TURNOVER', events)}
            />
          )}
        </div>
      </ArenaPanelContent>
    </ArenaPanel>
  );
}
