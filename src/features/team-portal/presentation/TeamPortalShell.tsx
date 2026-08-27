import { useEffect, useState } from 'react';
import { ArrowLeftRight, CalendarDays, ChartNoAxesCombined, ChevronDown, Circle, ClipboardList, Home, ListChecks, LogOut, Moon, Sun, UserRound, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTeamPortalThemeStore } from './stores/useTeamPortalThemeStore';
import TeamSeasonRegistration from './TeamSeasonRegistration';

type Team = { id: string; name: string };
type PortalView = 'overview' | 'register' | 'roster' | 'lineup' | 'stats' | 'fixtures';

const navigation: Array<[PortalView, string, LucideIcon]> = [
  ['overview', 'Home', Home],
  ['register', 'Registration', ClipboardList],
  ['roster', 'Roster', Users],
  ['lineup', 'Lineup', ListChecks],
  ['stats', 'Team stats', ChartNoAxesCombined],
  ['fixtures', 'Fixtures', CalendarDays],
];

export default function TeamPortalShell({ name, teams, selectedTeamId, view }: { name: string; teams: Team[]; selectedTeamId: string; view: PortalView }) {
  const [teamId, setTeamId] = useState(selectedTeamId);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const theme = useTeamPortalThemeStore((state) => state.theme);
  const systemTheme = useTeamPortalThemeStore((state) => state.systemTheme);
  const syncSystemTheme = useTeamPortalThemeStore((state) => state.syncSystemTheme);
  const toggleTheme = useTeamPortalThemeStore((state) => state.toggleTheme);
  const lightMode = (theme === 'system' ? systemTheme : theme) === 'light';

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const updateSystemTheme = () => syncSystemTheme(media.matches ? 'light' : 'dark');
    updateSystemTheme();
    media.addEventListener('change', updateSystemTheme);

    return () => media.removeEventListener('change', updateSystemTheme);
  }, [syncSystemTheme]);

  useEffect(() => {
    try {
      document.documentElement.dataset.teamPortalTheme = lightMode ? 'light' : 'dark';
    } catch {
      // The theme store remains the source of truth if the DOM is unavailable.
    }
  }, [lightMode]);

  const activeTeam = teams.find((team) => team.id === teamId) ?? teams[0];
  const selectTeam = (next: string) => {
    setTeamId(next);
    const url = new URL(window.location.href);
    url.searchParams.set('team', next);
    window.location.assign(url.toString());
  };
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.replace('/login?returnTo=%2Fteam-portal');
    }
  };
  const go = (next: PortalView) => `/team-portal?team=${encodeURIComponent(teamId)}&view=${next}`;
  const initials = activeTeam?.name.slice(0, 2).toUpperCase() || 'TM';

  return <div className={`team-portal-root min-h-screen w-full bg-night font-body text-cream ${lightMode ? 'portal-light' : ''}`}>
    <div className="flex min-h-screen w-full pb-[78px] min-[900px]:pb-0">
      <aside className="hidden w-[236px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0908] min-[900px]:flex">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-4">
          <span className="rounded-xl bg-white p-1.5"><img src="/images/Elevate_Icon.png" alt="Elevate Ballers Team Portal" className="block h-8 w-8 object-contain" /></span>
          <span className="font-display text-[14px] uppercase tracking-[0.06em] text-cream">Team <span className="text-brand">Portal</span></span>
        </div>
        <nav className="flex-1 px-3 py-4" aria-label="Team Portal navigation">
          <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5f574e]">My team</div>
          {navigation.map(([route, label, Icon]) => <a key={route} href={go(route)} aria-current={view === route ? 'page' : undefined} className={`portal-nav-item ${view === route ? 'portal-nav-active' : ''}`}><span className="flex w-[17px] items-center justify-center"><Icon size={16} strokeWidth={1.8} /></span><span className="flex-1 text-left">{label}</span>{route !== 'overview' && route !== 'register' && <span className="rounded-full bg-brand px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-white">Soon</span>}</a>)}
        </nav>
        <div className="border-t border-white/[0.06] px-3 py-3.5">
          <a href="/admin/profile" className="mb-2 block rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 no-underline transition hover:border-brand/50 hover:bg-brand/[0.08]"><span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-[#5f574e]">Signed in as</span><span className="mt-1 block text-[12.5px] font-bold text-cream">{name}</span><span className="block font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a817a]">Team Coach</span></a>
          <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/[0.12] py-2.5 text-[11px] font-bold uppercase tracking-[0.04em] text-brand hover:bg-brand/[0.2]"><LogOut size={14} strokeWidth={1.8} />Log out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#111010] px-4 py-3 min-[900px]:px-7 min-[900px]:py-4">
          <div className="mx-auto flex max-w-[1180px] items-center gap-3">
            <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] font-display text-[15px] text-brand">{initials}</span>
            <div className="min-w-0 flex-1"><div className="truncate font-display text-[16px] uppercase leading-none tracking-[0.03em] text-cream min-[900px]:text-[19px]">{activeTeam?.name || 'Team'}</div>{teams.length > 1 && <label className="mt-1.5 flex w-fit max-w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-1.5 pl-2.5 pr-2"><span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand"></span><select value={teamId} onChange={(event) => selectTeam(event.target.value)} aria-label="Active team" className="max-w-[220px] truncate rounded-lg bg-transparent font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#b8afa6] outline-none"><option className="bg-[#111010]" value={teamId}>{activeTeam?.name} · Active assignment</option>{teams.filter((team) => team.id !== teamId).map((team) => <option className="bg-[#111010]" value={team.id} key={team.id}>{team.name}</option>)}</select><span className="scope-switch"><ArrowLeftRight size={11} strokeWidth={1.8} />Switch</span></label>}</div>
            <button type="button" aria-label="Toggle light or dark mode" aria-pressed={lightMode} onClick={toggleTheme} className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#b8afa6] min-[900px]:flex">{lightMode ? <Moon size={15} strokeWidth={1.8} /> : <Sun size={15} strokeWidth={1.8} />}</button>
            <div className="relative min-[900px]:hidden"><button type="button" aria-label="Open account menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)} className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#b8afa6]"><UserRound size={15} strokeWidth={1.8} /><ChevronDown size={13} strokeWidth={1.8} /></button>{accountMenuOpen && <div className="portal-account-dropdown absolute right-0 top-11 z-50 min-w-[150px] rounded-xl border border-white/[0.1] bg-[#171514] p-1.5 shadow-xl"><a href="/admin/profile" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold text-[#b8afa6] no-underline hover:bg-white/[0.08] hover:text-cream"><UserRound size={14} strokeWidth={1.8} />View profile</a><button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold text-brand hover:bg-brand/[0.12]"><LogOut size={14} strokeWidth={1.8} />Log out</button></div>}</div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 min-[900px]:px-7 min-[900px]:py-6">
          {view === 'register' ? <TeamSeasonRegistration teamId={teamId} teamName={activeTeam?.name || 'Team'} /> : <div className="mx-auto max-w-[1180px]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">Role-aware workspace</p><h1 className="font-display text-[36px] uppercase leading-none text-cream min-[900px]:text-[44px]">{view === 'overview' ? 'Welcome back' : navigation.find(([route]) => route === view)?.[1]}</h1><p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#8a817a]">Your Team Portal workspace is scoped to the active team selected above.</p></div><div className="portal-team-role rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a817a]">{activeTeam?.name} · Team Coach</div></div>
            <section className="portal-panel overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111010]"><div className="flex flex-wrap items-stretch"><div className="min-w-[290px] flex-1 px-5 py-5"><div className="mb-3 flex flex-wrap items-center gap-2.5"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brandsoft">Next fixture</span><span className="rounded border border-white/[0.08] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8a817a]">{activeTeam?.name}</span></div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] font-display text-[14px] text-[#b8afa6]">—</span><span className="font-display text-[26px] uppercase leading-none text-cream">Schedule coming soon</span></div><p className="mt-3 text-[13px] text-[#b8afa6]">Fixtures for this active team assignment will appear here when the module is released.</p><span className="team-scoped-badge mt-4 inline-flex rounded-full bg-white/[0.08] px-3 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-cream">Team scoped</span></div><div className="flex min-w-[290px] flex-1 flex-col justify-center gap-3 border-l border-white/[0.06] px-5 py-5 max-[860px]:border-l-0 max-[860px]:border-t"><div className="flex items-center gap-2.5"><span className="flex h-[30px] w-[30px] items-center justify-center rounded-xl bg-[#d99a2b]/[0.16] text-[#d99a2b]"><Circle size={15} strokeWidth={1.8} /></span><div><div className="text-[13.5px] font-bold text-cream">Team Portal foundation</div><div className="font-mono text-[10.5px] text-[#8a817a]">Modules are being prepared for launch</div></div></div><div className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full w-1/4 rounded-full bg-[#d99a2b]"></div></div><span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">Coming soon</span></div></div></section>
            <section className="portal-panel mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111010]"><div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4"><div className="min-w-[200px] flex-1"><h2 className="font-display text-[17px] uppercase leading-none text-cream">Needs you</h2><p className="mt-1 text-[12px] text-[#8a817a]">Actions for your team will appear here.</p></div><span className="needs-clear rounded-xl border border-white/[0.1] bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a817a]">Clear</span></div><div className="flex flex-col items-center gap-2 px-5 py-9 text-center"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4ea36a]/[0.14] text-[#4ea36a]"><Circle size={16} strokeWidth={1.8} /></span><div className="text-[13.5px] font-bold text-cream">Nothing waiting on you</div><div className="max-w-[380px] text-[12px] text-[#8a817a]">Your team-scoped action queue will be available when the module launches.</div></div></section>
            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#5f574e]">Team-scoped access · managed by System Admins</p>
          </div>}
        </main>
      </div>
    </div>
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[78px] items-center justify-around border-t border-white/[0.08] bg-[#0a0908] px-2 min-[900px]:hidden" aria-label="Mobile Team Portal navigation">{navigation.slice(0, 5).map(([route, label, Icon]) => <a key={route} href={go(route)} aria-current={view === route ? 'page' : undefined} className={`mobile-nav-item ${view === route ? 'mobile-nav-active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label === 'Fixtures & results' ? 'Fixtures' : label}</span></a>)}</nav>
    <style>{` .team-portal-root{--portal-border:rgba(255,255,255,.08)} .team-portal-root button,.team-portal-root select{border-radius:10px}.team-portal-root header>div>span{border-radius:12px}.team-portal-root aside>div:last-child>div:first-child{border-radius:12px}.portal-team-role,.needs-clear,.team-scoped-badge{border-radius:12px}.scope-switch{display:inline-flex;align-items:center;gap:4px;border-radius:7px;background:rgba(255,255,255,.08);padding:4px 6px;color:#8a817a;font-family:'Space Mono',monospace;font-size:8.5px;text-transform:uppercase;white-space:nowrap}.portal-nav-item{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:0 12px;border-radius:10px;color:#8a817a;text-decoration:none;font-family:Archivo,sans-serif;font-size:12.5px;font-weight:700}.portal-nav-item:hover{background:rgba(255,255,255,.06);color:#f3efe9}.portal-nav-active{background:rgba(228,0,43,.12);color:#ff5a72}.portal-module-card{min-height:148px;padding:18px 20px;border-right:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);border-radius:12px;text-decoration:none}.portal-module-card:hover{background:rgba(255,255,255,.04)}.mobile-nav-item{display:flex;min-width:62px;height:60px;align-items:center;justify-content:center;gap:3px;flex-direction:column;color:#8a817a;text-decoration:none;font-family:Space Mono,monospace;font-size:8px;text-transform:uppercase}.mobile-nav-active{color:#ff5a72}.portal-panel{box-shadow:0 14px 40px rgba(0,0,0,.14)}.portal-account-dropdown{background:#171514}.portal-light{background:#f5f3ef!important;color:#141009!important}.portal-light aside,.portal-light nav{background:#fff!important;border-color:#e6e1d8!important}.portal-light header,.portal-light .portal-panel{background:#fff!important;border-color:#e6e1d8!important}.portal-light [class*="border-white"]{border-color:#e6e1d8!important}.portal-light main{background:#f5f3ef!important}.portal-light .text-cream,.portal-light .text-tx{color:#141009!important}.portal-light .text-cream\/80,.portal-light .text-\[\#b8afa6\],.portal-light .text-\[\#8a817a\]{color:#6f665c!important}.portal-light .bg-white\/\[0\.03\],.portal-light .bg-white\/\[0\.04\]{background:#f4f1ea!important}.portal-light .border-white\/\[0\.08\],.portal-light .border-white\/\[0\.06\]{border-color:#e6e1d8!important}.portal-light .portal-nav-active,.portal-light .portal-nav-item.portal-nav-active{background:#fbe7eb!important;color:#e4002b!important}.portal-light .portal-nav-active svg{color:#e4002b!important}.portal-light .portal-nav-item:hover{background:#f0ece5!important;color:#141009!important}.portal-light .portal-nav-active:hover,.portal-light .portal-nav-item.portal-nav-active:hover{background:#fbe7eb!important;color:#e4002b!important}.portal-light .portal-module-card:hover{background:#f0ece5!important}.portal-light .portal-team-role,.portal-light .needs-clear{background:#fff!important;border-color:#d6d0c5!important;color:#4a443d!important}.portal-light div.team-portal-root.portal-light span.team-scoped-badge{background-color:#eceae3!important;border-color:#d6d0c5!important;color:#4a443d!important}.portal-light .scope-switch{background:#eceae3;color:#6f665c}.portal-light .portal-account-dropdown{background:#fff!important;border-color:#d6d0c5!important}.portal-light select{color:#4a443d!important}.portal-light .portal-panel{box-shadow:0 14px 40px rgba(20,16,9,.08)} `}</style>
  </div>;
}
