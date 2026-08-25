import { useState } from 'react';

type Team = { id: string; name: string };

export default function TeamPortalShell({ name, teams, selectedTeamId }: { name: string; teams: Team[]; selectedTeamId: string }) {
  const [teamId, setTeamId] = useState(selectedTeamId);
  const selectTeam = (next: string) => {
    setTeamId(next);
    const url = new URL(window.location.href);
    url.searchParams.set('team', next);
    window.location.assign(url.toString());
  };

  return <div className="min-h-screen bg-[#f5f2ed] text-[#181818]">
    <header className="border-b border-black/10 bg-[#181818] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-4 sm:px-8">
        <a href="/team-portal" className="mr-auto font-display text-xl uppercase tracking-wide no-underline text-white">Team Portal</a>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">{name}</span>
        <a href="/api/auth/logout" className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 no-underline hover:text-white">Sign out</a>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e4002b]">Role-aware workspace</p><h1 className="mt-2 font-display text-4xl uppercase">Welcome back</h1><p className="mt-2 max-w-xl text-sm text-black/60">Your Team Portal workspace is scoped to the active team selected below.</p></div>
        <label className="flex min-w-[220px] flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-black/55">Active team<select value={teamId} onChange={(event) => selectTeam(event.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-2.5 font-body text-sm normal-case tracking-normal text-black outline-none focus:border-[#e4002b]">{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select></label>
      </div>
      <nav aria-label="Team Portal" className="mb-8 flex flex-wrap gap-2 border-b border-black/10 pb-4">{[['overview', 'Overview'], ['roster', 'Roster'], ['fixtures', 'Fixtures']].map(([view, label]) => <a key={view} href={`/team-portal?team=${encodeURIComponent(teamId)}&view=${view}`} className="rounded-full border border-black/10 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] no-underline text-black/65 hover:border-[#e4002b] hover:text-[#e4002b]">{label}</a>)}</nav>
      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#e4002b]">{teams.find((team) => team.id === teamId)?.name}</p><h2 className="mt-3 font-display text-3xl uppercase">Your team workspace is ready</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">The foundation is active. Team-scoped roster, fixtures, and match workflows will appear here as each module is enabled.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{['Roster', 'Fixtures', 'Team updates'].map((label) => <div key={label} className="rounded-xl border border-dashed border-black/15 bg-[#f8f6f2] p-4"><div className="font-body font-bold">{label}</div><div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-black/45">Coming next</div></div>)}</div></section>
    </main>
  </div>;
}
