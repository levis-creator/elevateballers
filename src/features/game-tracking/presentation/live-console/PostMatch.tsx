import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { TONE, card, cardHead, cardTitle, type Side } from './tone';
import { CheckList, type Check } from './PreMatch';
import { periodLabel } from '../../domain/live-console/rules';
import { lineOf, type PlayerLine } from '../../domain/live-console/derive';
import { INCIDENTS } from '../../domain/live-console/model';
import { mmss } from './useConsoleClock';
import { tag } from './roster';
import type { LiveConsole } from './useLiveConsole';

interface PostMatchProps {
  lc: LiveConsole;
  published: boolean;
  publishing: boolean;
  onPublish: () => void;
  reopening: boolean;
  onReopen: () => void;
  onManageImages: () => void;
}

const LEADER_CATS: Array<[string, (l: PlayerLine) => number]> = [
  ['Points', (l) => l.pts],
  ['Rebounds', (l) => l.oreb + l.dreb],
  ['Assists', (l) => l.ast],
];

export default function PostMatch({ lc, published, publishing, onPublish, reopening, onReopen, onManageImages }: PostMatchProps) {
  const [photos, setPhotos] = useState<number | null>(null);
  const [reopenAsk, setReopenAsk] = useState(false);

  useEffect(() => {
    fetch(`/api/matches/${lc.matchId}/images?limit=1`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPhotos(typeof d?.total === 'number' ? d.total : null))
      .catch(() => setPhotos(null));
  }, [lc.matchId]);

  const incidents = lc.events.filter((e) => INCIDENTS.has(e.eventType));
  const checks: Check[] = [
    {
      ok: lc.queuedCount === 0,
      title: 'All events synced',
      detail: lc.queuedCount ? `${lc.queuedCount} events still queued on this device` : `${lc.events.length} events saved to the server`,
    },
    {
      ok: !!photos,
      title: 'Match photos',
      detail: photos ? `${photos} photo${photos === 1 ? '' : 's'} attached` : 'No photos yet',
      action: { label: 'Manage', run: onManageImages },
    },
    {
      ok: published,
      title: 'Final result public',
      detail: published ? 'Published with standings' : 'Waiting for Publish final',
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-4 max-[1250px]:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-4">
        <CheckList title="Wrap-up" checks={checks} countLabel="done" />

        <div className={card}>
          <div className={cardHead}>
            <span className={cardTitle}>Game leaders</span>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[var(--bord2)] max-[700px]:grid-cols-1">
            {[lc.homeId, lc.awayId].map((t) => {
              const side: Side = t === lc.homeId ? 'home' : 'away';
              const squad = lc.teamRoster(t);
              return (
                <div key={t} className="bg-[var(--surf)] px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${TONE[side].bg}`} />
                    <span className="font-anton text-[14px] uppercase">{lc.teams[t]?.name}</span>
                  </div>
                  {LEADER_CATS.map(([cat, f]) => {
                    let best = squad[0];
                    let bv = -1;
                    for (const p of squad) {
                      const v = f(lineOf(lc.d, p.id));
                      if (v > bv) {
                        bv = v;
                        best = p;
                      }
                    }
                    return (
                      <div key={cat} className="flex items-center gap-3 border-b border-[var(--bord2)] py-2 last:border-b-0">
                        <span className="w-[78px] font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txm)]">{cat}</span>
                        {best && <Avatar player={best} side={side} size="h-8 w-8 text-[11px]" />}
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                          {best ? `#${best.no ?? '—'} ${best.name}` : '—'}
                        </span>
                        <span className="font-anton text-[22px] leading-none">{Math.max(0, bv)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <div className={cardHead}>
            <span className={cardTitle}>Incidents</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{incidents.length} recorded</span>
          </div>
          <div>
            {incidents.map((e) => {
              const x = lc.describe(e, lc.players);
              const side: Side = e.teamId === lc.awayId ? 'away' : 'home';
              const who = e.playerId
                ? `${tag(lc.players.get(e.playerId))} · ${lc.teams[e.teamId ?? '']?.short ?? ''}`
                : lc.teams[e.teamId ?? '']?.name ?? '';
              return (
                <div key={e.key} className="flex items-center gap-3 border-b border-[var(--bord2)] px-4 py-2.5 last:border-b-0">
                  <span className="w-[70px] font-mono text-[11px] text-[var(--txm)]">
                    {periodLabel(e.period, lc.rules)} {mmss(e.secondsRemaining)}
                  </span>
                  <span className={`h-6 w-1 flex-shrink-0 rounded-full ${TONE[side].bg}`} />
                  <span className="min-w-0 flex-1 text-[13px]">
                    <span className="font-semibold">{x.action}</span> <span className="text-[var(--txd)]">{who}</span>
                  </span>
                </div>
              );
            })}
            {incidents.length === 0 && (
              <div className="px-4 py-4 text-[13px] text-[var(--txm)]">No technicals, unsportsmanlike fouls or ejections.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 min-[1251px]:sticky min-[1251px]:top-[76px]">
        <div className={card}>
          <div className={cardHead}>
            <span className={cardTitle}>Publish</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-start gap-2.5">
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${published ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`} />
              <p className="min-w-0 flex-1 text-[13px] leading-[1.45] text-[var(--txd)]">
                {published
                  ? 'Published with standings — the result and table are live on the site.'
                  : 'Not public yet. Publish the final result to update the site and the standings table.'}
              </p>
            </div>
            {!published && (
              <>
                <div className="h-4" />
                <button
                  type="button"
                  disabled={publishing}
                  onClick={onPublish}
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-[var(--brand)] text-[13px] font-bold text-white hover:bg-[var(--brandlt)] disabled:opacity-60"
                >
                  {publishing ? 'Publishing…' : 'Publish final result'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className={card}>
          <div className={cardHead}>
            <span className={cardTitle}>Downloads</span>
          </div>
          <div className="flex flex-col gap-1.5 p-3">
            <a
              href={`/api/matches/${lc.matchId}/stat-sheet`}
              download
              data-astro-reload
              className="flex h-10 items-center justify-between rounded-lg border border-[var(--bord2)] bg-[var(--surf2)] px-3 text-[13px] font-semibold text-[var(--tx)] no-underline hover:border-[var(--tx)] hover:text-[var(--tx)]"
            >
              <span>Stat sheet</span>
              <span className="font-mono text-[10px] uppercase text-[var(--txm)]">PDF</span>
            </a>
          </div>
        </div>

        <div className={`${card} px-4 py-3`}>
          <div className="text-[13px] font-semibold">Need to fix the record?</div>
          <div className="mt-0.5 text-[12px] text-[var(--txd)]">
            Completed matches are locked. Reopen live tracking to correct events, then end the game again.
          </div>
          {!reopenAsk ? (
            <button
              type="button"
              onClick={() => setReopenAsk(true)}
              className="mt-2.5 h-9 rounded-lg border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)] hover:border-[var(--tx)] hover:text-[var(--tx)]"
            >
              Reopen live tracking
            </button>
          ) : (
            <div className="mt-3 rounded-xl border border-[var(--warn)] bg-[var(--surf2)] p-3">
              <div className="text-[12px] leading-[1.45] text-[var(--tx)]">
                {published
                  ? 'This result is public. Reopening unpublishes the final score and recalculates the standings table — the public site shows the match as live until you publish again.'
                  : 'The result isn’t public yet, so nothing changes on the site. Publish once your corrections are in.'}
              </div>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  disabled={reopening}
                  onClick={onReopen}
                  className="h-9 rounded-lg bg-[var(--brand)] px-3 text-[12px] font-bold text-white hover:bg-[var(--brandlt)] disabled:opacity-60"
                >
                  {reopening ? 'Reopening…' : published ? 'Unpublish & reopen' : 'Reopen tracking'}
                </button>
                <button
                  type="button"
                  onClick={() => setReopenAsk(false)}
                  className="h-9 rounded-lg border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
