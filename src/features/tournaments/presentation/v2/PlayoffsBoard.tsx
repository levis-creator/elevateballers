import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayoffsPageData } from '../../data/datasources/playoffs-v2';
import type { PlayoffRound, PlayoffSeries, SeriesTeam } from '../../domain/usecases/playoff-series';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';

/**
 * v2 playoffs: hero, season/league controls, bracket (desktop columns or one
 * round at a time on mobile), series detail, all-games list and the field.
 * The bracket itself is built on the server; this island only presents it.
 */

const C = { brand: '#e4002b', win: '#1f9d55', winText: '#177a41', ink: '#141009', ink2: '#1a1712', muted: '#6f665c', line: '#d6d0c7' };
const STRIPE = 'repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)';
const formatOf = (n: number) => (n === 1 ? 'Single game' : `Best of ${n}`);
const isForfeit = (a: number | null, b: number | null) => (a === 20 && b === 0) || (a === 0 && b === 20);
const sideName = (s: PlayoffSeries, side: 'a' | 'b') => s[side]?.short ?? `Winner ${s[`${side}From`] ?? 'TBD'}`;
const roundLabelFor = (key: string) => (key === 'CHAMPIONSHIP' ? 'Final' : null);

// Same output on the server and in every browser: fixed locale and timezone.
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: MATCH_TIMEZONE });
const formatDay = (iso: string) => dayFormat.format(new Date(iso));

type SeriesStatus = { text: string; color: string };

function remainingOf(s: PlayoffSeries) {
  if (s.done) return 0;
  const played = s.games.filter((g) => g.played).length;
  return Math.min(s.bestOf - played, s.need - s.wa + (s.need - s.wb) - 1);
}

/** The next unplayed game of a series, if one is scheduled. */
const nextGameOf = (s: PlayoffSeries) => s.games.find((g) => !g.played);

function statusOf(s: PlayoffSeries, now: number): SeriesStatus {
  if (!s.a || !s.b) return { text: `Awaiting ${[s.aFrom, s.bFrom].filter(Boolean).join(' & ')} winners`, color: C.muted };
  if (s.done) {
    const winner = s[s.winner!]!.short;
    if (s.bestOf === 1) return { text: `${winner} advance${s.games.some((g) => isForfeit(g.a, g.b)) ? ' · forfeit' : ''}`, color: C.muted };
    return { text: `${winner} win ${Math.max(s.wa, s.wb)}–${Math.min(s.wa, s.wb)}`, color: C.muted };
  }
  const played = s.games.filter((g) => g.played).length;
  const next = nextGameOf(s);
  if (played === 0) {
    if (next && Date.parse(next.date) < now) return { text: 'Awaiting result', color: C.brand };
    return { text: next ? `Upcoming · ${formatDay(next.date)}` : 'Upcoming · Date TBC', color: C.ink2 };
  }
  if (s.wa === s.wb) return { text: `Tied ${s.wa}–${s.wb}`, color: C.brand };
  const lead = s.wa > s.wb ? s.a : s.b;
  return { text: `${lead.short} lead ${Math.max(s.wa, s.wb)}–${Math.min(s.wa, s.wb)}`, color: C.brand };
}

function roundStatus(round: PlayoffRound): SeriesStatus {
  if (round.series.every((s) => s.done)) return { text: 'Complete', color: C.muted };
  if (round.series.some((s) => s.games.some((g) => g.played))) return { text: 'In progress', color: C.brand };
  return { text: 'Upcoming', color: C.ink2 };
}

type GameLine = {
  key: string;
  label: string;
  aName: string;
  bName: string;
  aFull: string;
  bFull: string;
  score: string;
  scoreMuted: boolean;
  aWon: boolean | null;
  tag: string;
  tagStyle: React.CSSProperties;
  href: string | null;
};

const TAG = {
  win: { background: 'rgba(31,157,85,0.12)', color: C.winText },
  ff: { background: '#efece5', color: C.muted },
  next: { background: C.brand, color: '#fff' },
  pending: { background: 'rgba(228,0,43,0.1)', color: C.brand },
  maybe: { background: 'transparent', color: C.muted, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)' },
} satisfies Record<string, React.CSSProperties>;

/** Played games, then the games still to come (scheduled or not) up to the series length. */
function gamesOf(s: PlayoffSeries, now: number): GameLine[] {
  const played = s.games.filter((g) => g.played);
  const lines: GameLine[] = played.map((g, i) => {
    const aWon = (g.a ?? 0) > (g.b ?? 0);
    const winner = aWon ? s.a : s.b;
    const forfeit = isForfeit(g.a, g.b);
    return {
      key: g.id,
      label: s.bestOf === 1 ? 'Game' : `Game ${i + 1}`,
      aName: sideName(s, 'a'),
      bName: sideName(s, 'b'),
      aFull: s.a?.name ?? '',
      bFull: s.b?.name ?? '',
      score: `${g.a} – ${g.b}`,
      scoreMuted: false,
      aWon,
      tag: forfeit ? `${winner?.short} · forfeit` : `${winner?.short} +${Math.abs((g.a ?? 0) - (g.b ?? 0))}`,
      tagStyle: forfeit ? TAG.ff : TAG.win,
      href: g.slug ? `/matches/${g.slug}` : null,
    };
  });
  const scheduled = s.games.filter((g) => !g.played);
  const remaining = remainingOf(s);
  const toWin = s.need - Math.max(s.wa, s.wb);
  for (let j = 0; j < remaining; j += 1) {
    const game = scheduled[j];
    const both = Boolean(s.a && s.b);
    const late = game ? Date.parse(game.date) < now : false;
    const when = game ? formatDay(game.date) : 'Date TBC';
    let tag: string;
    let tagStyle: React.CSSProperties;
    if (j === 0 && both && late) [tag, tagStyle] = ['Awaiting result', TAG.pending];
    else if (j === 0 && both) [tag, tagStyle] = [`Next · ${when}`, TAG.next];
    else if (j < toWin) [tag, tagStyle] = [when, TAG.maybe];
    else [tag, tagStyle] = [game ? `If necessary · ${when}` : 'If necessary', TAG.maybe];
    lines.push({
      key: game?.id ?? `tbc-${j}`,
      label: s.bestOf === 1 ? 'Game' : `Game ${played.length + j + 1}`,
      aName: sideName(s, 'a'),
      bName: sideName(s, 'b'),
      aFull: s.a?.name ?? '',
      bFull: s.b?.name ?? '',
      score: 'vs',
      scoreMuted: true,
      aWon: null,
      tag,
      tagStyle,
      href: game?.slug ? `/matches/${game.slug}` : null,
    });
  }
  return lines;
}

function Trophy({ stroke, size }: { stroke: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 6h20v10a10 10 0 0 1-20 0V6Z" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 10H7v3a7 7 0 0 0 7 7M34 10h7v3a7 7 0 0 1-7 7" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 26v8M17 42h14M19 42l1-8h8l1 8" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Badge({ team, size, from }: { team: SeriesTeam | null; size: number; from?: string }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full font-mono text-ink"
      style={{
        width: size,
        height: size,
        fontSize: size >= 32 ? 10 : 9.5,
        ...(team ? { background: STRIPE } : { boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.18)', color: C.muted }),
      }}
      title={team ? team.name : from ? `Winner of ${from}` : undefined}
    >
      {team ? team.initials : '?'}
    </span>
  );
}

function SeriesCard({ s, selected, mobile, now, onSelect }: { s: PlayoffSeries; selected: boolean; mobile: boolean; now: number; onSelect: () => void }) {
  const st = statusOf(s, now);
  const remaining = remainingOf(s);
  const played = s.games.filter((g) => g.played);
  const aria = `${s.id}: ${s.a?.name ?? `Winner of ${s.aFrom}`} versus ${s.b?.name ?? `Winner of ${s.bFrom}`}, ${st.text}`;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={aria}
      className={`block w-full cursor-pointer overflow-hidden rounded-xl border bg-white p-0 text-left font-body transition-[transform,box-shadow] duration-100 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand ${mobile ? '' : 'h-[128px]'}`}
      style={
        selected
          ? { borderColor: C.brand, boxShadow: `0 0 0 2px ${C.brand},0 8px 24px rgba(228,0,43,0.14)` }
          : { borderColor: 'rgba(0,0,0,0.12)', boxShadow: '0 1px 2px rgba(20,16,9,0.05)' }
      }
    >
      <span className={`flex items-center justify-between gap-2 border-b border-black/[0.07] bg-paper2 ${mobile ? 'h-[32px] px-3.5' : 'h-[30px] px-3'}`}>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{s.id}</span>
        <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: st.color }}>{st.text}</span>
      </span>
      {(['a', 'b'] as const).map((side) => {
        const team = s[side];
        const won = s.done && s.winner === side;
        const lost = s.done && s.winner !== side;
        const dots: ('W' | 'L' | '')[] = played.map((g) => ((side === 'a' ? (g.a ?? 0) > (g.b ?? 0) : (g.b ?? 0) > (g.a ?? 0)) ? 'W' : 'L'));
        if (team) for (let j = 0; j < remaining; j += 1) dots.push('');
        return (
          <span key={side} className={`flex items-center ${mobile ? 'h-[54px] gap-3 px-3.5' : 'h-[48px] gap-2.5 px-3'}`} style={lost ? { opacity: 0.42 } : undefined}>
            <Badge team={team} size={mobile ? 32 : 28} from={s[`${side}From`]} />
            <span
              className={`min-w-0 flex-1 truncate uppercase tracking-[0.01em] ${mobile ? 'text-[14.5px]' : 'text-[13.5px]'}`}
              style={!team ? { fontWeight: 600, fontStyle: 'italic', color: C.muted, textTransform: 'none' } : { fontWeight: won ? 800 : 700, color: won ? C.ink : C.ink2 }}
              title={team?.name ?? `Winner of ${s[`${side}From`]}`}
            >
              {sideName(s, side)}
            </span>
            <span className="flex items-center gap-[3px]" aria-hidden="true">
              {dots.map((d, i) => (
                <span
                  key={i}
                  className={`inline-block rounded-[2px] ${mobile ? 'h-[9px] w-[9px]' : 'h-[8px] w-[8px]'}`}
                  style={d === 'W' ? { background: C.win } : d === 'L' ? { background: C.brand } : { boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.28)' }}
                />
              ))}
            </span>
            <span className={`text-right font-display leading-none ${mobile ? 'w-[24px] text-[24px]' : 'w-[22px] text-[22px]'}`} style={{ color: won ? C.brand : team ? C.ink : '#b3a99c' }}>
              {team ? (side === 'a' ? s.wa : s.wb) : '–'}
            </span>
          </span>
        );
      })}
    </button>
  );
}

function GameRow({ g, label, padding }: { g: GameLine; label: string; padding: string }) {
  const aStyle = g.aWon === null ? { fontWeight: 700, color: C.ink2 } : g.aWon ? { fontWeight: 800, color: C.ink } : { fontWeight: 600, color: C.muted };
  const bStyle = g.aWon === null ? { fontWeight: 700, color: C.ink2 } : !g.aWon ? { fontWeight: 800, color: C.ink } : { fontWeight: 600, color: C.muted };
  const score = (
    <span className="text-center font-display text-[24px] leading-none max-[760px]:text-[19px]" style={{ color: g.scoreMuted ? '#b3a99c' : C.ink }}>
      {g.score}
    </span>
  );
  return (
    <div className={`grid grid-cols-[110px_minmax(0,1fr)_150px_minmax(0,1fr)_170px] items-center gap-4 ${padding} max-[760px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-[760px]:gap-y-2`}>
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink2 max-[760px]:col-span-3">{label}</span>
      <span className="truncate text-[14px] uppercase max-[760px]:text-[13px]" style={aStyle} title={g.aFull}>{g.aName}</span>
      {g.href ? <a href={g.href} className="text-center no-underline hover:opacity-70" aria-label={`Match page: ${g.aName} vs ${g.bName}`}>{score}</a> : score}
      <span className="truncate text-right text-[14px] uppercase max-[760px]:text-[13px]" style={bStyle} title={g.bFull}>{g.bName}</span>
      <span className="flex justify-end max-[760px]:col-span-3 max-[760px]:justify-start">
        <span className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em]" style={g.tagStyle}>{g.tag}</span>
      </span>
    </div>
  );
}

const segClass = (on: boolean) =>
  `cursor-pointer whitespace-nowrap rounded-md border-none px-3.5 py-[7px] font-body text-[11.5px] uppercase tracking-[0.06em] ${on ? 'bg-ink font-bold text-cream' : 'bg-transparent font-semibold text-muted hover:text-ink2'}`;
const pillClass = (on: boolean) =>
  `cursor-pointer rounded-md border px-3.5 py-2 font-body text-[11.5px] uppercase tracking-[0.06em] ${on ? 'border-brand bg-brand font-bold text-white' : 'border-black/15 bg-white font-semibold text-muted hover:border-black/30 hover:text-ink2'}`;

export default function PlayoffsBoard({ data, now: nowIso }: { data: PlayoffsPageData; now: string }) {
  const now = Date.parse(nowIso);
  const [leagueSlug, setLeagueSlug] = useState(data.initialLeague);
  const [view, setView] = useState<'bracket' | 'games'>('bracket');
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileRound, setMobileRound] = useState<number | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const league = data.leagues.find((item) => item.slug === leagueSlug) ?? data.leagues[0];
  const { rounds } = league.bracket;

  // Keep ?league= in the address so the view can be shared.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (data.leagues.length > 1) url.searchParams.set('league', league.slug);
    window.history.replaceState(null, '', url);
  }, [league.slug, data.leagues.length]);

  const model = useMemo(() => {
    const flat = rounds.flatMap((round, ri) => round.series.map((s) => ({ s, round, ri })));
    const byId = new Map(flat.map((entry) => [entry.s.id, entry]));
    const record = new Map<string, { w: number; l: number }>();
    for (const { s } of flat)
      for (const g of s.games) {
        if (!g.played || !s.a || !s.b) continue;
        const ra = record.get(s.a.id + s.a.name) ?? { w: 0, l: 0 };
        const rb = record.get(s.b.id + s.b.name) ?? { w: 0, l: 0 };
        if ((g.a ?? 0) > (g.b ?? 0)) { ra.w += 1; rb.l += 1; } else { rb.w += 1; ra.l += 1; }
        record.set(s.a.id + s.a.name, ra);
        record.set(s.b.id + s.b.name, rb);
      }
    const finalSeries = rounds[rounds.length - 1]?.series[0];
    const champion = finalSeries?.done ? finalSeries[finalSeries.winner!] : null;

    const teams = new Map<string, SeriesTeam>();
    for (const { s } of flat) for (const team of [s.a, s.b]) if (team) teams.set(team.id + team.name, team);
    const outIn = new Map<string, string>();
    for (const { s, round } of flat) if (s.done) { const loser = s.winner === 'a' ? s.b : s.a; if (loser) outIn.set(loser.id + loser.name, round.short === 'F' ? 'Final' : round.short); }
    const deepest = (key: string) => {
      let stage = '';
      for (const { s, round } of flat) if ([s.a, s.b].some((t) => t && t.id + t.name === key)) stage = round.short === 'F' ? 'Final' : round.short;
      return stage;
    };
    const keyOf = (t: SeriesTeam) => t.id + t.name;
    const alive = [...teams.values()].filter((t) => !outIn.has(keyOf(t)))
      .map((t) => ({ t, w: record.get(keyOf(t))?.w ?? 0, stage: champion && keyOf(champion) === keyOf(t) ? 'Champion' : `In ${deepest(keyOf(t))}` }))
      .sort((x, y) => y.w - x.w);
    const out = [...teams.values()].filter((t) => outIn.has(keyOf(t))).map((t) => ({ t, stage: `Out in ${outIn.get(keyOf(t))}` }));

    const gamesPlayed = flat.reduce((total, { s }) => total + s.games.filter((g) => g.played).length, 0);
    let biggest: { margin: number; who: SeriesTeam } | null = null;
    for (const { s } of flat)
      for (const g of s.games) {
        if (!g.played || isForfeit(g.a, g.b)) continue;
        const margin = Math.abs((g.a ?? 0) - (g.b ?? 0));
        const who = (g.a ?? 0) > (g.b ?? 0) ? s.a : s.b;
        if (who && (!biggest || margin > biggest.margin)) biggest = { margin, who };
      }
    let current = rounds.findIndex((round) => round.series.some((s) => !s.done));
    if (current < 0) current = rounds.length - 1;
    const nextUp = flat.find(({ s }) => s.a && s.b && !s.done && s.games.some((g) => g.played)) ?? flat.find(({ s }) => s.a && s.b && !s.done);
    const live = nextUp ?? flat[flat.length - 1];
    return { flat, byId, record, finalSeries, champion, alive, out, teamCount: teams.size, gamesPlayed, biggest, current, nextUp, live, keyOf };
  }, [rounds]);

  if (!rounds.length) return null;
  const { flat, byId, record, finalSeries, champion, alive, out, teamCount, gamesPlayed, biggest, current, nextUp, live, keyOf } = model;
  const recordOf = (t: SeriesTeam | null) => {
    const r = t ? record.get(keyOf(t)) : undefined;
    return r ? `${r.w}–${r.l}` : '0–0';
  };
  const selectedId = selected && byId.has(selected) ? selected : live.s.id;
  const { s: S, round: SRound } = byId.get(selectedId)!;
  const mIdx = mobileRound != null && mobileRound >= 0 && mobileRound < rounds.length ? mobileRound : current;
  const currentRound = rounds[current];

  const heroLine = champion
    ? `${champion.name} are the ${data.season.name} ${league.name} champions.`
    : `${rounds.length} rounds, ${teamCount} teams, one trophy. The ${currentRound.label.toLowerCase()} ${currentRound.series.length === 1 ? 'is' : 'are'} ${currentRound.series.some((s) => s.games.some((g) => g.played)) ? 'underway' : 'up next'}.`;
  const heroStats: [string | number, string, string][] = [
    [alive.length, 'Teams alive', '#f3efe9'],
    [gamesPlayed, 'Games played', '#f3efe9'],
    [`${flat.filter(({ s }) => s.done).length}/${flat.length}`, 'Series decided', '#f3efe9'],
    biggest ? [`+${biggest.margin}`, `Biggest win · ${biggest.who.short}`, '#ff5a72'] : ['—', 'Biggest win', '#ff5a72'],
  ];
  const championBox = champion
    ? { name: champion.short, sub: `${data.season.name} champions`, color: C.ink, stroke: C.brand, style: { background: 'linear-gradient(180deg,rgba(228,0,43,0.08),rgba(228,0,43,0.02))', boxShadow: 'inset 0 0 0 1.5px rgba(228,0,43,0.4)' } }
    : { name: 'To be decided', sub: finalSeries?.a && finalSeries.b ? `${finalSeries.a.short} or ${finalSeries.b.short}` : 'Final pending', color: '#8a817a', stroke: '#c8c0b6', style: { background: '#faf8f4', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.1)' } };

  const select = (id: string, scroll: boolean) => {
    setSelected(id);
    if (scroll || window.matchMedia('(max-width: 760px)').matches)
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const switchLeague = (slug: string) => {
    setLeagueSlug(slug);
    setSelected(null);
    setMobileRound(null);
  };

  const seasonSelect = (
    <label className="flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Season</span>
      <span className="relative inline-flex">
        <select
          value={data.season.slug}
          onChange={(event) => { window.location.href = `/playoffs/${encodeURIComponent(event.target.value)}/`; }}
          className="cursor-pointer appearance-none rounded-md border border-black/[0.16] bg-white py-[9px] pl-[13px] pr-[34px] font-body text-[12.5px] font-bold tracking-[0.04em] text-ink2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand"
        >
          {data.seasons.map((season) => <option key={season.slug} value={season.slug}>{season.label}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-muted" aria-hidden="true">▼</span>
      </span>
    </label>
  );

  const H = Math.max(...rounds.map((round) => round.series.length)) * 150;
  const connectors = (count: number) =>
    count >= 2 ? (
      Array.from({ length: Math.floor(count / 2) }, (_, i) => (
        <span key={i} className="relative block" style={{ width: 20, height: `${100 / count}%`, borderTop: `2px solid ${C.line}`, borderRight: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}`, borderRadius: '0 8px 8px 0' }} aria-hidden="true">
          <span className="absolute left-full" style={{ top: 'calc(50% - 1px)', width: 20, borderTop: `2px solid ${C.line}` }} />
        </span>
      ))
    ) : (
      <span className="block" style={{ width: 40, height: 0, borderTop: `2px solid ${C.line}` }} aria-hidden="true" />
    );

  const nextS = S.next ? byId.get(S.next) : undefined;
  const sStatus = statusOf(S, now);
  const aColor = S.done && S.winner === 'b' ? '#6b635a' : '#f3efe9';
  const bColor = S.done && S.winner === 'a' ? '#6b635a' : '#f3efe9';
  const advance = nextS
    ? S.done
      ? `${S[S.winner!]!.short} advance to the ${nextS.round.key === 'CHAMPIONSHIP' ? 'Final' : nextS.s.id}`
      : `Winner advances to the ${nextS.round.key === 'CHAMPIONSHIP' ? 'Final' : nextS.s.id}`
    : S.done
      ? `${S[S.winner!]!.short} are ${data.season.name} ${league.name} champions`
      : `Winner is crowned ${data.season.name} champion`;
  const nextUpGame = nextUp ? nextGameOf(nextUp.s) : undefined;
  const nextUpWhen = nextUpGame ? (Date.parse(nextUpGame.date) < now ? 'Awaiting result' : formatDay(nextUpGame.date)) : 'Date TBC';
  const playedCount = (s: PlayoffSeries) => s.games.filter((g) => g.played).length;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-night text-cream">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(110% 120% at 88% -20%,rgba(228,0,43,0.32),transparent 60%)' }} />
        <div className="pointer-events-none absolute -bottom-[60px] right-[-20px] select-none font-display leading-none text-transparent max-[600px]:hidden" style={{ fontSize: 300, WebkitTextStroke: '1.5px rgba(243,239,233,0.07)' }} aria-hidden="true">
          {data.season.name}
        </div>
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_360px] items-end gap-10 px-8 pb-10 pt-12 max-[960px]:grid-cols-1 max-[960px]:gap-8 max-[960px]:px-6">
          <div>
            <div className="mb-3 flex items-center gap-[10px] font-mono text-[11px] uppercase tracking-[0.16em] text-brandsoft"><span className="h-px w-[26px] bg-brand" />Postseason · {league.name}</div>
            <h1 className="font-display text-[clamp(56px,8vw,108px)] uppercase leading-[0.84] tracking-[0.01em]">Playoffs</h1>
            <p className="mt-4 max-w-[480px] text-[15px] leading-[1.6] text-creamdim">{heroLine}</p>
            <div className="mt-7 flex flex-wrap gap-x-10 gap-y-5 max-[600px]:grid max-[600px]:grid-cols-2 max-[600px]:gap-x-6">
              {heroStats.map(([value, label, color]) => (
                <div key={label}>
                  <div className="font-display text-[34px] leading-none" style={{ color }}>{value}</div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted2">{label}</div>
                </div>
              ))}
            </div>
          </div>
          {nextUp && (
            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brandsoft"><span className="inline-block h-[7px] w-[7px] rounded-full bg-brand" />Next up</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">{nextUp.round.label} · {nextUp.s.id}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                {(['a', 'b'] as const).map((side) => (
                  <div key={side} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-mono text-[11px] text-cream">{nextUp.s[side]!.initials}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold uppercase">{nextUp.s[side]!.short}</span>
                    <span className="font-display text-[22px] leading-none text-cream">{side === 'a' ? nextUp.s.wa : nextUp.s.wb}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3.5">
                <span className="font-mono text-[11px] text-creamdim">{nextUp.s.bestOf === 1 ? 'Single game' : `Game ${playedCount(nextUp.s) + 1} of ${nextUp.s.bestOf}`} · {nextUpWhen}</span>
                <button
                  type="button"
                  onClick={() => { setView('bracket'); setMobileRound(nextUp.ri); select(nextUp.s.id, true); }}
                  className="cursor-pointer rounded-md border border-white/[0.16] bg-transparent px-3 py-1.5 font-body text-[11px] font-bold uppercase tracking-[0.06em] text-cream hover:border-brand hover:text-brandsoft"
                >
                  Series →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CONTROLS */}
      <section className="border-b border-black/[0.1] bg-panel">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-4 px-8 py-4 max-[960px]:px-6">
          {seasonSelect}
          {data.leagues.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">League</span>
              <div className="flex flex-wrap gap-1.5">
                {data.leagues.map((item) => (
                  <button key={item.slug} type="button" title={item.name} aria-pressed={item.slug === league.slug} onClick={() => switchLeague(item.slug)} className={pillClass(item.slug === league.slug)}>
                    {item.code}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-white p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] max-[600px]:ml-0">
            {(['bracket', 'games'] as const).map((key) => (
              <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={segClass(view === key)}>
                {key === 'bracket' ? 'Bracket' : 'All games'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {view === 'bracket' ? (
        <>
          <section className="mx-auto max-w-[1280px] px-8 pt-10 max-[960px]:px-6 max-[960px]:pt-8">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="font-display text-[22px] uppercase tracking-[0.02em] text-ink">The Bracket</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{league.name} · {data.season.name}</span>
            </div>

            {/* Desktop: every round side by side */}
            <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white p-6 shadow-[0_1px_2px_rgba(20,16,9,0.04)] max-[760px]:hidden">
              <div className="flex" style={{ minWidth: rounds.length * 280 + 190 }}>
                {rounds.map((round) => {
                  const rs = roundStatus(round);
                  return [
                    <div key={round.key} className="flex min-w-[220px] flex-1 flex-col">
                      <div className="mb-4 flex h-[44px] flex-col justify-end border-b border-black/[0.08] pb-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-[17px] uppercase tracking-[0.02em] text-ink">{roundLabelFor(round.key) ?? round.label}</span>
                          <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em]" style={{ color: rs.color }}>
                            <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ background: rs.color }} />{rs.text}
                          </span>
                        </div>
                        <span className="mt-0.5 font-mono text-[10px] text-muted">{formatOf(round.bestOf)}</span>
                      </div>
                      <div className="flex flex-col justify-around" style={{ height: H }}>
                        {round.series.map((s) => <SeriesCard key={s.id} s={s} selected={s.id === selectedId} mobile={false} now={now} onSelect={() => select(s.id, false)} />)}
                      </div>
                    </div>,
                    <div key={`${round.key}-c`} className="flex w-[40px] flex-none flex-col">
                      <div className="mb-4 h-[44px]" />
                      <div className="flex flex-col justify-around" style={{ height: H }}>{connectors(round.series.length)}</div>
                    </div>,
                  ];
                })}
                <div className="flex w-[190px] flex-none flex-col">
                  <div className="mb-4 flex h-[44px] flex-col justify-end border-b border-black/[0.08] pb-2.5">
                    <span className="font-display text-[17px] uppercase tracking-[0.02em] text-brand">Champion</span>
                    <span className="mt-0.5 font-mono text-[10px] text-muted">{data.season.name} · {league.code}</span>
                  </div>
                  <div className="flex flex-col justify-center" style={{ height: H }}>
                    <div className="flex flex-col items-center rounded-2xl px-4 py-6 text-center" style={championBox.style}>
                      <Trophy stroke={championBox.stroke} size={46} />
                      <div className="mt-3 font-display text-[19px] uppercase leading-[1.05]" style={{ color: championBox.color }}>{championBox.name}</div>
                      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{championBox.sub}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: one round at a time */}
            <div className="hidden max-[760px]:block">
              <div className="-mx-6 mb-4 overflow-x-auto px-6">
                <div className="flex w-max gap-1 rounded-lg bg-white p-1 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" role="group" aria-label="Round">
                  {rounds.map((round, i) => {
                    const rs = roundStatus(round);
                    return (
                      <button key={round.key} type="button" aria-pressed={i === mIdx} onClick={() => setMobileRound(i)} className={`${segClass(i === mIdx)} py-[9px]`}>
                        {roundLabelFor(round.key) ?? round.label}
                        <span className="ml-1.5 inline-block h-[6px] w-[6px] rounded-full align-middle" style={{ background: rs.color, opacity: rs.text === 'Complete' ? 0.5 : 1 }} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{formatOf(rounds[mIdx].bestOf)}</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: roundStatus(rounds[mIdx]).color }}>
                  <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ background: roundStatus(rounds[mIdx]).color }} />{roundStatus(rounds[mIdx]).text}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {rounds[mIdx].series.map((s) => <SeriesCard key={s.id} s={s} selected={s.id === selectedId} mobile now={now} onSelect={() => select(s.id, false)} />)}
              </div>
              {mIdx === rounds.length - 1 && (
                <div className="mt-3 flex items-center gap-4 rounded-xl px-4 py-4" style={championBox.style}>
                  <Trophy stroke={championBox.stroke} size={36} />
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand">Champion</div>
                    <div className="mt-0.5 font-display text-[19px] uppercase leading-[1.05]" style={{ color: championBox.color }}>{championBox.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{championBox.sub}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted">
              <span className="hidden items-center gap-2 max-[1100px]:flex max-[760px]:hidden">Swipe the bracket sideways →</span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: C.win }} />Game won
                <span className="ml-2 inline-block h-2 w-2 rounded-[2px] bg-brand" />Game lost
                <span className="ml-2 inline-block h-2 w-2 rounded-[2px] border border-dashed border-black/30" />To play
              </span>
              <span>Tap a matchup for game-by-game scores ↓</span>
            </div>
          </section>

          {/* SERIES DETAIL */}
          <section ref={detailRef} className="mx-auto max-w-[1280px] scroll-mt-[90px] px-8 pt-8 max-[960px]:px-6">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(20,16,9,0.04)]">
              <div className="relative bg-night px-6 py-5 text-cream max-[600px]:px-4">
                <div className="absolute left-0 top-0 h-full w-[4px] bg-brand" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brandsoft">{SRound.label} · {S.id} · {formatOf(S.bestOf)}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-creamdim">{sStatus.text}</span>
                </div>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 max-[600px]:items-start max-[600px]:gap-3">
                  {(['a', 'b'] as const).map((side, i) => {
                    const block = (
                      <div key={side} className={`min-w-0 ${i === 1 ? 'text-right' : ''}`}>
                        <div className="truncate font-display text-[clamp(20px,3vw,32px)] uppercase leading-none max-[600px]:whitespace-normal max-[600px]:text-[18px] max-[600px]:leading-[1.05]" style={{ color: side === 'a' ? aColor : bColor }}>
                          {sideName(S, side)}
                        </div>
                        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted2">{S[side] ? `${recordOf(S[side])} in playoffs` : 'To be decided'}</div>
                      </div>
                    );
                    return i === 0
                      ? [block, (
                        <div key="score" className="flex items-center gap-3 font-display text-[clamp(36px,5vw,56px)] leading-none max-[600px]:text-[34px]">
                          <span style={{ color: aColor }}>{S.wa}</span><span className="text-[#5a534c]">–</span><span style={{ color: bColor }}>{S.wb}</span>
                        </div>
                      )]
                      : block;
                  })}
                </div>
              </div>
              <div className="divide-y divide-black/[0.06]">
                {gamesOf(S, now).map((g) => <GameRow key={g.key} g={g} label={g.label} padding="px-6 py-4 max-[600px]:px-4" />)}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] bg-paper2 px-6 py-3.5 font-mono text-[11px] text-muted max-[600px]:px-4">
                <span>{advance}</span>
                <a href="/fixtures/" className="font-bold uppercase tracking-[0.06em] text-brand no-underline hover:text-brandlt">Full fixtures →</a>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="mx-auto max-w-[1280px] px-8 pt-10 max-[960px]:px-6 max-[960px]:pt-8">
          <div className="flex flex-col gap-8">
            {[...rounds].reverse().map((round) => (
              <div key={round.key}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="font-display text-[22px] uppercase tracking-[0.02em] text-ink">{roundLabelFor(round.key) ?? round.label}</h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{round.series.reduce((total, s) => total + playedCount(s), 0)} played · {formatOf(round.bestOf)}</span>
                </div>
                <div className="divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/10 bg-white">
                  {round.series.flatMap((s) => gamesOf(s, now).map((g) => <GameRow key={`${s.id}-${g.key}`} g={g} label={`${s.id} · ${g.label}`} padding="px-5 py-3.5" />))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* THE FIELD */}
      <section className="mx-auto max-w-[1280px] px-8 pb-16 pt-12 max-[960px]:px-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="font-display text-[22px] uppercase tracking-[0.02em] text-ink">The Field</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{teamCount} playoff teams · record is playoff games only</span>
        </div>
        <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
          {[
            { title: 'Still alive', rows: alive.map((row) => ({ ...row, isOut: false })), dot: C.win, box: 'bg-white', titleColor: C.win, countClass: 'text-ink' },
            { title: 'Eliminated', rows: out.map((row) => ({ ...row, isOut: true })), dot: '#8a817a', box: 'bg-paper2', titleColor: C.muted, countClass: 'text-muted' },
          ].map((group) => (
            <div key={group.title} className={`rounded-2xl border border-black/[0.09] p-5 ${group.box}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: group.titleColor }}>
                  <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: group.dot }} />{group.title}
                </span>
                <span className={`font-display text-[22px] leading-none ${group.countClass}`}>{group.rows.length}</span>
              </div>
              <div className="flex flex-col">
                {group.rows.length ? group.rows.map(({ t, stage, isOut }) => (
                  <div key={keyOf(t)} className="flex items-center gap-3 border-t border-black/[0.06] py-2.5">
                    <span className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${isOut ? 'bg-panel text-muted' : 'text-ink'}`} style={isOut ? undefined : { background: STRIPE }}>{t.initials}</span>
                    <span className={`min-w-0 flex-1 truncate text-[14px] uppercase max-[600px]:whitespace-normal max-[600px]:text-[13px] max-[600px]:leading-tight ${isOut ? 'font-semibold text-muted' : 'font-bold text-ink2'}`}>{t.name}</span>
                    <span className="font-mono text-[11px] text-muted">{stage}</span>
                    <span className={`w-[44px] text-right font-mono text-[12px] ${isOut ? 'text-muted' : 'font-bold text-ink2'}`}>{recordOf(t)}</span>
                  </div>
                )) : <p className="border-t border-black/[0.06] py-3 font-mono text-[11px] text-muted">No one yet.</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted">
          Teams outside the playoff places are listed on <a href="/standings/" className="font-bold text-brand no-underline hover:text-brandlt">Standings →</a>
        </p>
      </section>
    </>
  );
}
