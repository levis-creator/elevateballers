/**
 * Shot chart card for the match centre's box score tab. Shows once any field
 * goal has a location; one team at a time, optionally one player.
 */
import { useMemo, useState } from 'react';
import CourtShotChart from '../components/CourtShotChart';
import { collectShots, fieldGoalAttempts, summariseShots } from '../../domain/live-console/shotChart';
import { card } from './tone';
import { tag } from './roster';
import type { LiveConsole } from './useLiveConsole';

export default function ConsoleShotChart({ lc }: { lc: LiveConsole }) {
  const [teamId, setTeamId] = useState(lc.homeId);
  const [playerId, setPlayerId] = useState('');
  const byTeam = useMemo(
    () => ({ [lc.homeId]: collectShots(lc.events, lc.homeId), [lc.awayId]: collectShots(lc.events, lc.awayId) }),
    [lc.events, lc.homeId, lc.awayId],
  );
  const teamShots = byTeam[teamId] ?? [];
  const shown = playerId ? teamShots.filter((s) => s.playerId === playerId) : teamShots;
  const shooters = [...new Set(teamShots.map((s) => s.playerId).filter((id): id is string => !!id))];
  const zones = summariseShots(shown);
  const made = shown.filter((s) => s.made).length;
  const attempts = fieldGoalAttempts(lc.events, teamId);
  const color = teamId === lc.awayId ? 'var(--away)' : 'var(--home)';

  if (!byTeam[lc.homeId]?.length && !byTeam[lc.awayId]?.length) return null;

  const pickTeam = (id: string) => {
    setTeamId(id);
    setPlayerId('');
  };
  const tab = (on: boolean) =>
    `h-8 rounded-lg px-3 text-[12px] font-semibold ${on ? 'bg-[var(--tx)] text-[var(--bg)]' : 'border border-[var(--bord)] text-[var(--txd)] hover:text-[var(--tx)]'}`;

  return (
    <div className={`${card} mt-4`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--bord2)] px-4 py-3">
        <span className="mr-2 font-anton text-[16px] uppercase">Shot chart</span>
        {[lc.homeId, lc.awayId].map((id) => (
          <button key={id} type="button" onClick={() => pickTeam(id)} className={tab(teamId === id)}>
            {lc.teams[id]?.short}
          </button>
        ))}
        <select
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          aria-label="Filter shots by player"
          className="ml-auto h-8 rounded-lg border border-[var(--bord)] bg-[var(--surf2)] px-2 text-[12px] text-[var(--tx)]"
        >
          <option value="">All players</option>
          {shooters.map((id) => (
            <option key={id} value={id}>
              {tag(lc.players.get(id))}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-5 p-4 max-[760px]:grid-cols-1">
        <CourtShotChart
          shots={shown}
          color={color}
          line="var(--txm)"
          floor="var(--surf2)"
          paint="var(--chip)"
          className="block w-full rounded-lg border border-[var(--bord2)]"
          label={`${lc.teams[teamId]?.name ?? ''} shot chart`}
        />
        <div className="flex flex-col gap-3">
          <div>
            <div className="font-anton text-[30px] leading-none">
              {made}/{shown.length}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">
              Located field goals{shown.length ? ` · ${Math.round((made / shown.length) * 100)}%` : ''}
            </div>
          </div>
          {zones.map((z) => (
            <div key={z.group} className="flex items-baseline justify-between rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-2.5 py-2">
              <span className="text-[12px] text-[var(--txd)]">{z.group}</span>
              <span className="font-mono text-[13px] font-bold">
                {z.made}/{z.attempts}
                {z.pct != null && <span className="ml-1.5 font-normal text-[var(--txm)]">{z.pct}%</span>}
              </span>
            </div>
          ))}
          <div className="mt-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">
            ● made · ○ missed{!playerId && attempts > teamShots.length ? ` · ${teamShots.length} of ${attempts} located` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
