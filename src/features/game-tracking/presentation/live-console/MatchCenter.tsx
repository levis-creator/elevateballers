/**
 * Match Center: header, scoreboard and tabs for every match phase.
 * UPCOMING shows the pre-match checklist, LIVE the court console with clock
 * controls, COMPLETED the wrap-up. Score, fouls and timeouts come from the
 * event log.
 */
import { useEffect, useState } from 'react';
import './live-console.css';
import type { MatchWithFullDetails } from '../../../cms/types';
import { getLeagueName } from '../../../matches/lib/league-helpers';
import { getTeam1Logo, getTeam2Logo } from '../../../matches/lib/team-helpers';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';
import { periodLabel, rulesShort } from '../../domain/live-console/rules';
import { teamFoulsNow } from '../../domain/live-console/derive';
import { useLiveConsole } from './useLiveConsole';
import { useScorer } from './useScorer';
import { ClockText } from './useConsoleClock';
import { teamMonogram } from './roster';
import { TONE, kbdOnDark, pipCls } from './tone';
import CourtConsole from './CourtConsole';
import ConsoleLog from './ConsoleLog';
import { BoxScoreTab, TimelineTab } from './ConsoleTabs';
import EventsTab from './EventsTab';
import ImagesTab from './ImagesTab';
import PreMatch, { canStartGame } from './PreMatch';
import PostMatch from './PostMatch';
import PlayersTab from './PlayersTab';

type Tab = 'console' | 'players' | 'events' | 'timeline' | 'images' | 'sheet';

interface Props {
  match: MatchWithFullDetails;
  /** Refetch match players and events (after substitutions or roster edits). */
  onRosterChanged: () => unknown;
  /** Refetch the whole match (after start, end, publish or reopen). */
  onMatchChanged: () => unknown;
}

/** Team logo in the side-coloured ring, or the monogram when there's no logo. */
function TeamBadge({ name, logo, side }: { name: string; logo: string | null | undefined; side: 'home' | 'away' }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-[var(--surf2)] font-anton text-[18px] ${
        side === 'home' ? 'border-[var(--home)] text-[var(--home)]' : 'border-[var(--away)] text-[var(--away)]'
      }`}
    >
      {logo && !broken ? (
        <img src={logo} alt={name} className="h-full w-full object-contain p-1.5" onError={() => setBroken(true)} />
      ) : (
        teamMonogram(name)
      )}
    </span>
  );
}

async function postAction(url: string): Promise<string | null> {
  const res = await fetch(url, { method: 'POST' }).catch(() => null);
  if (res?.ok) return null;
  const data = await res?.json().catch(() => null);
  return data?.error || 'Something went wrong — try again';
}

export default function MatchCenter(props: Props) {
  const { match } = props;
  const live = match.status === 'LIVE';
  const upcoming = match.status === 'UPCOMING';
  const done = match.status === 'COMPLETED';
  const lc = useLiveConsole(match, props.onRosterChanged, props.onMatchChanged);
  const [tab, setTab] = useState<Tab>('console');
  const sc = useScorer(lc, tab === 'console', live);
  const [setVal, setSetVal] = useState('');
  const [endConfirm, setEndConfirm] = useState(false);
  const [busy, setBusy] = useState<'start' | 'publish' | 'reopen' | null>(null);

  // Reopened for corrections: remembered across the status change so the
  // live console can show the banner.
  const reopenKey = `mc-reopened-${match.id}`;
  const [reopened, setReopened] = useState<string | null>(null);
  useEffect(() => {
    try {
      setReopened(live ? sessionStorage.getItem(reopenKey) : null);
    } catch {
      /* storage blocked */
    }
  }, [live, reopenKey]);

  // Keep the tip-off countdown fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!upcoming) return;
    const id = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [upcoming]);

  const run = async (kind: 'start' | 'publish' | 'reopen', url: string, after?: () => void) => {
    setBusy(kind);
    const error = await postAction(url);
    setBusy(null);
    if (error) {
      lc.flash(error);
      return;
    }
    after?.();
    setTab('console');
    await props.onMatchChanged();
  };
  const published = !!match.resultPublishedAt;
  const startGame = () => run('start', `/api/games/${match.id}/start`);
  const publish = () => run('publish', `/api/matches/${match.id}/publish-final`, () => lc.flash('Final result published'));
  const reopen = () =>
    run('reopen', `/api/games/${match.id}/reopen`, () => {
      try {
        sessionStorage.setItem(reopenKey, published ? 'unpublished' : 'reopened');
      } catch {
        /* storage blocked */
      }
      lc.flash(published ? 'Result unpublished · standings recalculated' : 'Tracking reopened');
    });
  const endGame = async () => {
    try {
      sessionStorage.removeItem(reopenKey);
    } catch {
      /* storage blocked */
    }
    await lc.endGame();
  };

  const home = lc.d.teams.get(lc.homeId)!;
  const away = lc.d.teams.get(lc.awayId)!;
  // A completed match shows its stored final, which the server can keep above
  // the event total when events were lost offline.
  const hScore = done && match.team1Score != null ? match.team1Score : lc.eventsLoaded ? home.score : (lc.gameState?.team1Score ?? match.team1Score ?? 0);
  const aScore = done && match.team2Score != null ? match.team2Score : lc.eventsLoaded ? away.score : (lc.gameState?.team2Score ?? match.team2Score ?? 0);
  const FB = lc.rules.foulsForBonus;
  const hFouls = teamFoulsNow(home, lc.period, lc.rules);
  const aFouls = teamFoulsNow(away, lc.period, lc.rules);
  const homeName = lc.teams[lc.homeId]?.name ?? 'Home';
  const awayName = lc.teams[lc.awayId]?.name ?? 'Away';
  const homeShort = lc.teams[lc.homeId]?.short ?? '';
  const awayShort = lc.teams[lc.awayId]?.short ?? '';

  const date = new Date(match.date);
  const dateLine = `${date.toLocaleDateString('en-GB', { timeZone: MATCH_TIMEZONE, weekday: 'short', day: 'numeric', month: 'short' })} · ${date.toLocaleTimeString('en-US', { timeZone: MATCH_TIMEZONE, hour: 'numeric', minute: '2-digit' })}`;
  const leagueName = getLeagueName(match);
  const crumbs = [match.season?.name, leagueName, match.stage ? match.stage.replace(/_/g, ' ').toLowerCase() : null].filter(Boolean);

  // Normal saves finish in the background and never show here; the chip
  // only changes when the connection is slow or down.
  const connOk = lc.syncState === 'ok';
  const connLabel =
    lc.syncState === 'offline' ? `Offline · ${lc.queuedCount} saved on device` : lc.syncState === 'syncing' ? `Syncing ${lc.queuedCount}…` : 'Connected';

  const tipIn = (() => {
    const min = Math.round((date.getTime() - Date.now()) / 60000);
    if (min > 2 * 24 * 60) return `in ${Math.round(min / (24 * 60))} days`;
    if (min > 90) return `in ${Math.floor(min / 60)}h ${min % 60}m`;
    if (min > 0) return `in ${min} min`;
    if (min > -5) return 'due now';
    return `scheduled · ${-min > 90 ? `${Math.floor(-min / 60)}h` : `${-min} min`} ago`;
  })();
  const tipTime = date.toLocaleTimeString('en-GB', { timeZone: MATCH_TIMEZONE, hour: '2-digit', minute: '2-digit' });
  const tipDay = date.toLocaleDateString('en-GB', { timeZone: MATCH_TIMEZONE, weekday: 'short', day: 'numeric', month: 'short' });
  const canStart = canStartGame(lc);
  const winner = hScore === aScore ? 'Tied' : `${hScore > aScore ? homeShort : awayShort} win`;
  const lineShort = Array.from({ length: Math.max(lc.rules.periods, ...lc.events.map((e) => e.period)) }, (_, i) =>
    `${home.byPeriod[i + 1] ?? 0}–${away.byPeriod[i + 1] ?? 0}`,
  ).join(' · ');

  const tabs: Array<[Tab, string, number | null]> = [
    ['console', upcoming ? 'Pre-match' : done ? 'Post-match' : 'Court console', null],
    ['players', 'Match players', null],
    ['events', 'Match events', lc.events.length],
    ['timeline', 'Timeline', null],
    ['images', 'Images', null],
    ['sheet', done ? 'Scoresheet' : 'Box score', null],
  ];


  const TeamMeta = ({ fouls, bonus, toLeft, align }: { fouls: number; bonus: boolean; toLeft: number; align: 'left' | 'right' }) => {
    const pips = (
      <span className="flex gap-[3px]">
        {Array.from({ length: FB }, (_, i) => (
          <span key={i} className={pipCls(i < Math.min(FB, fouls))} />
        ))}
      </span>
    );
    const bonusEl = bonus && <span className="rounded bg-[var(--tx)] px-1.5 py-[1px] font-bold text-[var(--bg)]">Bonus</span>;
    return (
      <div
        className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--txm)] ${
          align === 'right' ? 'justify-end' : ''
        }`}
      >
        {align === 'left' ? (
          <>
            <span className="flex items-center gap-1.5 whitespace-nowrap">Fouls{pips}</span>
            {bonusEl}
            <span className="whitespace-nowrap">TO left {toLeft}</span>
          </>
        ) : (
          <>
            <span className="whitespace-nowrap">TO left {toLeft}</span>
            {bonusEl}
            <span className="flex items-center gap-1.5 whitespace-nowrap">{pips}Fouls</span>
          </>
        )}
      </div>
    );
  };

  const possCls = (on: boolean, side: 'home' | 'away') =>
    `h-7 rounded-full px-2.5 font-mono text-[10px] font-bold ${on ? `${TONE[side].bg} text-[var(--bg)]` : 'text-[var(--txm)] hover:text-[var(--tx)]'}`;

  return (
    <div className="mc-root mx-auto w-full max-w-[1480px] pb-20">
      <header className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <a
          href="/admin/matches"
          className="flex h-10 items-center rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-3 text-[13px] font-semibold text-[var(--txd)] no-underline hover:border-[var(--brand)] hover:text-[var(--tx)]"
        >
          ← Matches
        </a>
        <div className="min-w-0">
          {crumbs.length > 0 && (
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--txm)]">{crumbs.join(' / ')}</div>
          )}
          <h1 className="font-anton text-[28px] uppercase leading-none tracking-[0.02em]">
            Match <span className="text-[var(--brand)]">Center</span>
          </h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`flex h-10 items-center gap-2 rounded-lg border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
              connOk ? 'border-[var(--bord)] text-[var(--txd)]' : 'border-[var(--warn)] text-[var(--warn)]'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${connOk ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`} />
            {connLabel}
          </span>
          <a
            href={`/admin/matches/${match.id}`}
            className="flex h-10 items-center rounded-lg border border-[var(--bord)] bg-[var(--surf)] px-4 text-[13px] font-semibold text-[var(--txd)] no-underline hover:text-[var(--tx)]"
          >
            Edit match
          </a>
          {upcoming && (
            <button
              type="button"
              disabled={!canStart || busy === 'start'}
              onClick={startGame}
              className={`h-11 rounded-lg px-5 text-[13px] font-bold ${
                canStart ? 'bg-[var(--brand)] text-white hover:bg-[var(--brandlt)]' : 'bg-[var(--chip)] text-[var(--faint)]'
              }`}
            >
              {busy === 'start' ? 'Starting…' : 'Start game'}
            </button>
          )}
          {done && (
            <a
              href={`/api/matches/${match.id}/stat-sheet`}
              download
              data-astro-reload
              className="flex h-10 items-center rounded-lg bg-[var(--brand)] px-4 text-[13px] font-bold text-white no-underline hover:bg-[var(--brandlt)] hover:text-white"
            >
              Download stat sheet
            </a>
          )}
        </div>
      </header>

      {live && reopened && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[var(--warn)] bg-[var(--surf)] px-4 py-3">
          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--warn)]" />
          <span className="text-[13px] leading-[1.45] text-[var(--txd)]">
            <b className="text-[var(--tx)]">Reopened for corrections</b> —{' '}
            {reopened === 'unpublished'
              ? 'the result was unpublished and standings recalculated. End the game and publish again when done.'
              : 'end the game again when your corrections are in.'}
          </span>
        </div>
      )}

      {/* SCOREBOARD */}
      <section className="mb-4 overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--surf)]">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[var(--bord2)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--txm)]">
          {leagueName && (
            <>
              <span>{leagueName}</span>
              <span className="text-[var(--faint)]">·</span>
            </>
          )}
          <span>{dateLine}</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 px-6 py-5 max-[1110px]:gap-2 max-[1110px]:px-3">
          <div className="flex min-w-0 items-center gap-4 max-[1110px]:flex-col max-[1110px]:items-start max-[1110px]:gap-2">
            <TeamBadge name={homeName} logo={getTeam1Logo(match)} side="home" />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--home)]">Home</div>
              <div className="truncate font-anton text-[24px] uppercase leading-tight max-[1110px]:text-[16px]">{homeName}</div>
              {live && <TeamMeta fouls={hFouls} bonus={hFouls >= FB} toLeft={lc.timeoutsLeft(lc.homeId).left} align="left" />}
            </div>
            {!upcoming && <span className="font-anton text-[80px] leading-none tabular-nums max-[1110px]:text-[48px]">{hScore}</span>}
          </div>

          <div className="flex min-w-[220px] flex-col items-center gap-2 max-[1110px]:min-w-[120px]">
            {upcoming && (
              <>
                <span className="rounded-full border border-[var(--bord)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--txd)]">
                  Upcoming
                </span>
                <span className="font-anton text-[44px] leading-none">{tipTime}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">Tip-off · {rulesShort(lc.rules)}</span>
              </>
            )}
            {done && (
              <>
                <span className="rounded-full bg-[var(--tx)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--bg)]">
                  Final
                </span>
                <span className="font-anton text-[30px] uppercase leading-none">{winner}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">{lineShort}</span>
              </>
            )}
            {live && (
              <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              <span className="mc-pulse h-1.5 w-1.5 rounded-full bg-white" />
              Live · {lc.half ? 'Halftime' : periodLabel(lc.period, lc.rules)}
            </span>
            <ClockText
              half={lc.half}
              className={`font-mono text-[56px] font-bold leading-none tabular-nums max-[1110px]:text-[34px] ${
                lc.running ? 'text-[var(--tx)]' : 'text-[var(--txd)]'
              }`}
            />
            <button
              type="button"
              onClick={lc.toggleClock}
              className={`flex h-11 min-w-[150px] flex-shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-bold ${
                lc.running
                  ? 'border border-[var(--bord)] bg-[var(--surf2)] text-[var(--tx)]'
                  : 'bg-[var(--brand)] text-white hover:bg-[var(--brandlt)]'
              }`}
            >
              {lc.running ? 'Pause' : 'Start clock'}
              <kbd className={kbdOnDark}>Space</kbd>
            </button>
            <div className="mt-1 flex items-center gap-1 rounded-full border border-[var(--bord)] bg-[var(--surf2)] p-1">
              <button type="button" onClick={() => lc.setPossession(lc.homeId)} className={possCls(lc.possession === lc.homeId, 'home')}>
                ◀ {homeShort}
              </button>
              <span className="px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--txm)]">Ball</span>
              <button type="button" onClick={() => lc.setPossession(lc.awayId)} className={possCls(lc.possession === lc.awayId, 'away')}>
                {awayShort} ▶
              </button>
            </div>
              </>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-4 max-[1110px]:flex-col-reverse max-[1110px]:items-end max-[1110px]:gap-2">
            {!upcoming && <span className="font-anton text-[80px] leading-none tabular-nums max-[1110px]:text-[48px]">{aScore}</span>}
            <div className="w-full min-w-0 flex-1 text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--away)]">Away</div>
              <div className="line-clamp-2 break-words font-anton text-[24px] uppercase leading-tight max-[1110px]:text-[16px]">{awayName}</div>
              {live && <TeamMeta fouls={aFouls} bonus={aFouls >= FB} toLeft={lc.timeoutsLeft(lc.awayId).left} align="right" />}
            </div>
            <TeamBadge name={awayName} logo={getTeam2Logo(match)} side="away" />
          </div>
        </div>

        {live && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--bord2)] bg-[var(--surf3)] px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--txm)]">Rules · {rulesShort(lc.rules)}</span>
          <div className="flex flex-wrap items-center gap-1.5 min-[1000px]:ml-auto">
            {(
              [
                ['−10', -10],
                ['−1', -1],
                ['+1', 1],
                ['+10', 10],
              ] as const
            ).map(([label, v]) => (
              <button
                key={label}
                type="button"
                onClick={() => lc.adjustClock(v)}
                className="h-8 min-w-[42px] rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2 font-mono text-[11px] font-bold text-[var(--txd)] hover:text-[var(--tx)]"
              >
                {label}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                value={setVal}
                onChange={(e) => setSetVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && lc.applySet(setVal)) setSetVal('');
                }}
                placeholder="mm:ss"
                className="mc-inp h-8 w-[76px] py-1 font-mono text-[12px]"
              />
              <button
                type="button"
                onClick={() => lc.applySet(setVal) && setSetVal('')}
                className="h-8 rounded-md border border-[var(--bord)] bg-[var(--surf)] px-2.5 text-[12px] font-semibold text-[var(--txd)] hover:text-[var(--tx)]"
              >
                Set
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={lc.nextPeriod}
              className="h-8 rounded-md border border-[var(--bord)] bg-[var(--surf)] px-3 text-[12px] font-bold text-[var(--tx)] hover:border-[var(--tx)]"
            >
              {lc.nextLabel} →
            </button>
            {!endConfirm ? (
              <button
                type="button"
                onClick={() => setEndConfirm(true)}
                className="h-8 rounded-md border border-[var(--brand)] px-3 text-[12px] font-bold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
              >
                End game
              </button>
            ) : (
              <>
                <span className="text-[12px] font-semibold text-[var(--txd)]">
                  End at {hScore}–{aScore}?
                  {lc.queuedCount > 0 && <span className="text-[var(--warn)]"> {lc.queuedCount} still queued.</span>}
                </span>
                <button
                  type="button"
                  disabled={lc.ending}
                  onClick={async () => {
                    await endGame();
                    setEndConfirm(false);
                  }}
                  className="h-8 rounded-md bg-[var(--brand)] px-3 text-[12px] font-bold text-white hover:bg-[var(--brandlt)] disabled:opacity-60"
                >
                  {lc.ending ? 'Ending…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setEndConfirm(false)}
                  className="h-8 rounded-md border border-[var(--bord)] px-3 text-[12px] font-semibold text-[var(--txd)]"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        )}
      </section>

      {/* TABS */}
      <nav className="mc-scroll mb-4 flex gap-1 overflow-x-auto border-b border-[var(--bord)]">
        {tabs.map(([k, label, count]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex h-11 flex-shrink-0 items-center gap-2 border-b-2 px-3.5 text-[13px] font-semibold ${
              tab === k ? 'border-[var(--brand)] text-[var(--tx)]' : 'border-transparent text-[var(--txm)] hover:text-[var(--tx)]'
            }`}
          >
            {label}
            {!!count && <span className="rounded-full bg-[var(--chip)] px-1.5 py-[1px] font-mono text-[10px] text-[var(--txd)]">{count}</span>}
          </button>
        ))}
      </nav>

      {tab === 'console' && upcoming && (
        <PreMatch
          lc={lc}
          tipTime={tipTime}
          tipIn={tipIn}
          tipDay={tipDay}
          starting={busy === 'start'}
          onStart={startGame}
          onReviewPlayers={() => setTab('players')}
        />
      )}
      {tab === 'console' && live && (
        <>
          <CourtConsole lc={lc} sc={sc} />
          <ConsoleLog lc={lc} sc={sc} onAllEvents={() => setTab('events')} />
        </>
      )}
      {tab === 'console' && done && (
        <PostMatch
          lc={lc}
          published={published}
          publishing={busy === 'publish'}
          onPublish={publish}
          reopening={busy === 'reopen'}
          onReopen={reopen}
          onManageImages={() => setTab('images')}
        />
      )}
      {tab === 'players' && <PlayersTab lc={lc} upcoming={upcoming} onChanged={props.onRosterChanged} />}
      {tab === 'events' && (
        <EventsTab lc={lc} />
      )}
      {tab === 'timeline' && <TimelineTab lc={lc} />}
      {tab === 'images' && <ImagesTab matchId={match.id} flash={lc.flash} />}
      {tab === 'sheet' && done && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${published ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`} />
          <span className="min-w-0 flex-1 text-[13px] text-[var(--txd)]">
            {published ? 'Published with standings.' : 'Not public yet — publish the final result from Post-match.'}
          </span>
          {!published && (
            <button type="button" onClick={() => setTab('console')} className="text-[13px] font-bold text-[var(--brand)] hover:text-[var(--brandlt)]">
              Go to Post-match →
            </button>
          )}
        </div>
      )}
      {tab === 'sheet' && <BoxScoreTab lc={lc} final={done} />}

      {lc.toast && (
        <div className="mc-in fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[var(--bord)] bg-[var(--surf)] px-4 py-3 text-[13px] font-semibold shadow-2xl">
          <span>{lc.toast.msg}</span>
          {lc.toast.action && (
            <button
              type="button"
              onClick={lc.toast.action.run}
              className="h-8 rounded-md bg-[var(--tx)] px-3 text-[12px] font-bold text-[var(--bg)] hover:opacity-90"
            >
              {lc.toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
