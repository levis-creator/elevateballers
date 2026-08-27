import { useEffect, useState } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';

type PlayerData = {
  status: 'APPROVED' | 'PENDING';
  jerseyNumber: number | null;
  position: string | null;
  season: { name: string } | null;
  player: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    dateOfBirth: string | null;
    email: string | null;
    phone: string | null;
    nationality: string | null;
    height: string | null;
    weight: string | null;
  };
  stats: { gp: number; ppg: number; reb: number; ast: number; stl: number; blk: number };
};

export default function TeamPortalPlayer({
  teamId,
  playerId,
  teamName,
}: {
  teamId: string;
  playerId: string;
  teamName: string;
}) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch(
      `/api/team-portal/player?teamId=${encodeURIComponent(teamId)}&playerId=${encodeURIComponent(playerId)}`,
      { cache: 'no-store' }
    )
      .then(async (r) => {
        const value = await r.json();
        if (!r.ok) throw new Error(value.error || 'Unable to load player.');
        return value;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load player.'));
  }, [teamId, playerId]);
  if (error)
    return (
      <section className="portal-roster-card mx-auto max-w-[1180px] rounded-2xl border p-6 text-brand">
        {error}
      </section>
    );
  if (!data)
    return (
      <section className="portal-roster-card mx-auto max-w-[1180px] rounded-2xl border p-6 text-[#8a817a]">
        Loading player…
      </section>
    );
  const name =
    `${data.player.firstName || ''} ${data.player.lastName || ''}`.trim() || 'Unnamed player';
  const metrics = [
    ['PPG', data.stats.ppg.toFixed(1)],
    ['REB', data.stats.reb.toFixed(1)],
    ['AST', data.stats.ast.toFixed(1)],
    ['STL', data.stats.stl.toFixed(1)],
    ['BLK', data.stats.blk.toFixed(1)],
    ['GP', String(data.stats.gp)],
  ];
  return (
    <div className="mx-auto grid max-w-[1180px] gap-4">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="flex w-fit items-center gap-2 border-none bg-transparent font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a] hover:text-brand"
      >
        <ArrowLeft size={14} /> Back to roster
      </button>
      <section className="portal-roster-card overflow-hidden rounded-2xl border">
        <div className="flex flex-wrap items-center gap-5 border-b border-white/[0.08] px-5 py-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-white/[0.1] bg-white/[0.04]">
            {data.player.image ? (
              <img src={data.player.image} alt={name} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="text-[#8a817a]" size={30} />
            )}
          </div>
          <div className="min-w-[220px] flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">
              {teamName} · {data.season?.name || 'Active season'}
            </p>
            <h1 className="mt-1 font-display text-[32px] uppercase leading-none text-cream">
              {name}
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[#8a817a]">
              {data.position || 'Position not set'} · #{data.jerseyNumber ?? '—'} ·{' '}
              {data.status === 'PENDING' ? 'Pending approval' : 'Cleared'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-white/[0.08] sm:grid-cols-6">
          {metrics.map(([label, value]) => (
            <div key={label} className="border-r border-white/[0.08] px-4 py-4 last:border-r-0">
              <div className="font-display text-[22px] leading-none text-cream">{value}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a817a]">
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <Info label="Email" value={data.player.email} />
          <Info label="Phone" value={data.player.phone} />
          <Info label="Nationality" value={data.player.nationality} />
          <Info label="Date of birth" value={data.player.dateOfBirth?.slice(0, 10)} />
          <Info label="Height" value={data.player.height} />
          <Info label="Weight" value={data.player.weight} />
        </div>
      </section>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a817a]">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-cream">{value || 'Not provided'}</div>
    </div>
  );
}
