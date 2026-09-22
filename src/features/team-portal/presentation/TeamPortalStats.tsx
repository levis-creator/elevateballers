import { useEffect, useState } from 'react';
import { AlertCircle, ArrowDown, ChartNoAxesCombined } from 'lucide-react';

type PlayerLine = {
  id: string;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  gp: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  ftPct: number;
  threePct: number;
};
type StatsData = {
  season: { name: string } | null;
  leagueName: string | null;
  registered: boolean;
  record: {
    played: number;
    wins: number;
    losses: number;
    draws: number;
    winPct: number;
    ppg: number;
    oppPpg: number;
    pointDiff: number;
  };
  tablePosition: number | null;
  tableSize: number | null;
  form: Array<'W' | 'L' | 'D'>;
  players: PlayerLine[];
};
type SortKey = 'gp' | 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg' | 'fgPct';

const columns: Array<[SortKey, string]> = [
  ['gp', 'GP'],
  ['ppg', 'PPG'],
  ['rpg', 'RPG'],
  ['apg', 'APG'],
  ['spg', 'SPG'],
  ['bpg', 'BPG'],
  ['fgPct', 'FG%'],
];

const statsStyles = `.portal-stats-card{background:var(--portal-surface,#111010);border-color:var(--portal-border,rgba(255,255,255,.08))}.portal-stats-tile{border-color:var(--portal-border-muted,rgba(255,255,255,.06))}.portal-stats-row{border-color:var(--portal-border-muted,rgba(255,255,255,.06))}.portal-stats-row.portal-stats-link{cursor:pointer}.portal-stats-row.portal-stats-link:hover{background:var(--portal-surface-muted,rgba(255,255,255,.03))}.portal-stats-sort{display:inline-flex;align-items:center;gap:3px;min-height:32px;padding:0 4px;border:0;background:none;color:var(--portal-muted,#8a817a);font-family:'Space Mono',monospace;font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;cursor:pointer}.portal-stats-sort.stats-sort-active{color:#ff5a72}.portal-light .portal-stats-card{--portal-surface:#fff;--portal-border:#e6e1d8;--portal-border-muted:#ece7df;--portal-surface-muted:#f4f1ea;--portal-muted:#6f665c}.portal-light .portal-stats-card .text-cream{color:#141009!important}.portal-light .portal-stats-card .text-\\[\\#8a817a\\]{color:#6f665c!important}.portal-light .portal-stats-card .text-\\[\\#5f574e\\]{color:#9a9084!important}.portal-light .portal-stats-sort.stats-sort-active{color:#e4002b}`;

const formBadge = {
  W: 'border-[#4ea36a]/30 bg-[#4ea36a]/[0.12] text-[#4ea36a]',
  L: 'border-brand/30 bg-brand/[0.1] text-brandsoft',
  D: 'border-white/[0.12] bg-white/[0.06] text-[#b8afa6]',
} as const;

const fmt = (key: SortKey, value: number) =>
  key === 'gp' ? String(value) : key === 'fgPct' ? `${Math.round(value)}%` : value.toFixed(1);

export default function TeamPortalStats({
  teamId,
  teamName,
  onOpenPlayer,
}: {
  teamId: string;
  teamName: string;
  onOpenPlayer: (playerId: string) => string;
}) {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('ppg');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/team-portal/stats?teamId=${encodeURIComponent(teamId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Unable to load team stats.');
        return value;
      })
      .then(setData)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load team stats.')
      )
      .finally(() => setLoading(false));
  }, [teamId]);

  const record = data?.record;
  const players = [...(data?.players ?? [])].sort(
    (a, b) => b[sortKey] - a[sortKey] || a.name.localeCompare(b.name)
  );
  const tiles: Array<[string, string]> = record
    ? [
        [
          'Record',
          record.draws
            ? `${record.wins}–${record.losses}–${record.draws}`
            : `${record.wins}–${record.losses}`,
        ],
        ['Win rate', record.played ? `${Math.round(record.winPct)}%` : '—'],
        ['Points for', record.played ? record.ppg.toFixed(1) : '—'],
        ['Points against', record.played ? record.oppPpg.toFixed(1) : '—'],
        [
          'Point diff',
          record.played ? `${record.pointDiff > 0 ? '+' : ''}${record.pointDiff}` : '—',
        ],
        [
          'Table',
          data?.tablePosition
            ? `#${data.tablePosition}${data.tableSize ? ` / ${data.tableSize}` : ''}`
            : '—',
        ],
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{statsStyles}</style>
      <div className="mb-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
          {[data?.season?.name, data?.leagueName].filter(Boolean).join(' · ') || 'Team stats'}
        </p>
        <h1 className="font-display text-[36px] uppercase leading-none text-cream min-[900px]:text-[44px]">
          Team stats
        </h1>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/[0.08] px-4 py-3 text-[13px] text-brandsoft"
        >
          <AlertCircle size={17} />
          {error}
        </div>
      )}
      {loading ? (
        <section className="portal-stats-card rounded-2xl border px-5 py-8 text-[13px] text-[#8a817a]">
          Loading team stats…
        </section>
      ) : data ? (
        <div className="grid gap-4">
          {!data.registered && (
            <p className="text-[12.5px] text-[#8a817a]">
              {teamName} is not registered for the active season, so all published results are
              counted.
            </p>
          )}
          <section
            aria-label="Season summary"
            className="portal-stats-card overflow-hidden rounded-2xl border"
          >
            <div className="grid grid-cols-2 min-[640px]:grid-cols-3 min-[1000px]:grid-cols-6">
              {tiles.map(([label, value]) => (
                <div key={label} className="portal-stats-tile border-b border-r px-5 py-4">
                  <div className="font-display text-[24px] leading-none text-cream">{value}</div>
                  <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a817a]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#8a817a]">
                Last {data.form.length || 0}
              </span>
              {data.form.length ? (
                <div className="flex gap-1.5" aria-label={`Recent form: ${data.form.join(' ')}`}>
                  {data.form.map((result, index) => (
                    <span
                      key={index}
                      className={`flex h-6 w-6 items-center justify-center rounded-md border font-mono text-[10px] font-bold ${formBadge[result]}`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-[#8a817a]">No results yet</span>
              )}
            </div>
          </section>
          <section
            aria-label={`${teamName} player stats`}
            className="portal-stats-card overflow-x-auto rounded-2xl border"
          >
            {players.length ? (
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="portal-stats-row border-b">
                    <th className="px-5 py-2.5 font-mono text-[9.5px] font-normal uppercase tracking-[0.08em] text-[#8a817a]">
                      Player
                    </th>
                    {columns.map(([key, label]) => (
                      <th key={key} className="px-2 py-1.5 text-right" aria-sort={sortKey === key ? 'descending' : 'none'}>
                        <button
                          type="button"
                          onClick={() => setSortKey(key)}
                          className={`portal-stats-sort ${sortKey === key ? 'stats-sort-active' : ''}`}
                        >
                          {label}
                          {sortKey === key && <ArrowDown size={10} strokeWidth={2} />}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((line) => {
                    // The portal player page only resolves active-season roster
                    // players, so unregistered teams get plain rows.
                    const linkable = data.registered;
                    const open = () => window.location.assign(onOpenPlayer(line.id));
                    return (
                      <tr
                        key={line.id}
                        className={`portal-stats-row border-b last:border-b-0 ${linkable ? 'portal-stats-link' : ''}`}
                        onClick={linkable ? open : undefined}
                        onKeyDown={
                          linkable
                            ? (event) => {
                                if (event.key === 'Enter') open();
                              }
                            : undefined
                        }
                        tabIndex={linkable ? 0 : undefined}
                        role={linkable ? 'link' : undefined}
                      >
                        <td className="px-5 py-3">
                          <div className="text-[13px] font-bold text-cream">{line.name}</div>
                          <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8a817a]">
                            {[line.jerseyNumber != null ? `#${line.jerseyNumber}` : null, line.position]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </div>
                        </td>
                        {columns.map(([key]) => (
                          <td
                            key={key}
                            className={`px-3 py-3 text-right font-display text-[15px] leading-none ${sortKey === key ? 'text-cream' : 'text-[#8a817a]'}`}
                          >
                            {line.gp ? fmt(key, line[key]) : key === 'gp' ? '0' : '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <ChartNoAxesCombined className="h-8 w-8 text-[#5f574e]" />
                <h3 className="font-display text-[19px] uppercase text-cream">No player stats yet</h3>
                <p className="max-w-[380px] text-[12.5px] text-[#8a817a]">
                  Player numbers appear once approved roster players feature in published results.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
