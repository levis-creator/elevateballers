import { useEffect, useMemo, useState } from 'react';
import {
  Check, CheckCircle2, ChevronDown, ChevronUp, Download, MoreHorizontal, Plus, Search,
  Shield, Trash2, Users, X,
} from 'lucide-react';
import type { TeamWithPlayerCount } from '../../types';
import { useTeams } from '../hooks/useTeams';

type Team = TeamWithPlayerCount & { nickname?: string | null };
type Season = ReturnType<typeof useTeams>['seasons'][number];

const iconSize = 15;

export default function TeamsPage() {
  const { teams, seasons, leagues, loading, error, refresh } = useTeams();
  const [seasonId, setSeasonId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [conference, setConference] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'players'>('name');
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuId, setMenuId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!seasonId && seasons[0]) setSeasonId(seasons[0].id);
  }, [seasonId, seasons]);

  const selectedSeason = seasons.find((season) => season.id === seasonId) as Season | undefined;
  const seasonLeagues = selectedSeason?.leagueSeasons?.map((entry) => entry.league) ?? leagues;
  const selectedLeagueSeason = selectedSeason?.leagueSeasons?.find((entry) => entry.leagueId === leagueId);
  const conferences = selectedSeason?.conferences ?? [];
  const approvedCount = teams.filter((team) => team.approved).length;
  const pendingCount = teams.length - approvedCount;
  const playerCount = teams.reduce((total, team) => total + (team._count?.players ?? 0), 0);

  useEffect(() => {
    if (!leagueId && seasonLeagues[0]) setLeagueId(seasonLeagues[0].id);
  }, [leagueId, seasonLeagues]);

  const visibleTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    const conferenceTeamIds = conference === 'All'
      ? null
      : new Set(conferences.find((item) => item.name === conference)?.seasonTeams.map((item) => item.teamId) ?? []);
    return (teams as Team[])
      .filter((team) => !query || team.name.toLowerCase().includes(query) || team.nickname?.toLowerCase().includes(query))
      .filter((team) => status === 'All' || (status === 'Approved' ? team.approved : !team.approved))
      .filter((team) => !conferenceTeamIds || conferenceTeamIds.has(team.id))
      .sort((a, b) => {
        const left = sort === 'name' ? a.name : (a._count?.players ?? 0);
        const right = sort === 'name' ? b.name : (b._count?.players ?? 0);
        const result = left < right ? -1 : left > right ? 1 : 0;
        return ascending ? result : -result;
      });
  }, [teams, search, status, conference, conferences, sort, ascending]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(visibleTeams.length / pageSize));
  const pagedTeams = visibleTeams.slice((page - 1) * pageSize, page * pageSize);
  const firstShown = visibleTeams.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, visibleTeams.length);

  useEffect(() => {
    setPage(1);
  }, [search, status, conference, seasonId, leagueId, sort, ascending]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const toggleSort = (key: 'name' | 'players') => {
    if (sort === key) setAscending((value) => !value);
    else { setSort(key); setAscending(true); }
  };
  const toggleOne = (id: string) => setSelected((current) => {
    const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const toggleAll = () => setSelected((current) => current.size === visibleTeams.length
    ? new Set() : new Set(visibleTeams.map((team) => team.id)));

  const runAction = async (url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Action failed'); }
      setSelected(new Set()); setMenuId(null); await refresh();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Action failed'); }
  };

  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selected.size} selected team${selected.size === 1 ? '' : 's'}?`)) return;
    void runAction('/api/teams/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selected] }) });
  };
  const deleteOne = (id: string) => {
    if (!window.confirm('Delete this team? This cannot be undone.')) return;
    void runAction(`/api/teams/${id}`, { method: 'DELETE' });
  };

  if (loading) return <div className="eb-teams-page"><div className="eb-teams-loading">Loading teams…</div></div>;
  if (error) return <div className="eb-teams-page"><div className="eb-teams-error"><strong>Couldn’t load teams</strong><span>{error}</span><button onClick={() => void refresh()}>Try again</button></div></div>;

  return (
    <section className="eb-teams-page" onClick={() => menuId && setMenuId(null)}>
      <div className="eb-teams-heading">
        <div><div className="eb-kicker">Competition</div><h1>Teams</h1><p>Teams registered into a competition edition. Pick a season and league below — conference controls appear only when that edition uses them.</p></div>
        <div className="eb-teams-heading-actions"><button className="eb-quiet-button" onClick={() => undefined}><Download size={iconSize} /> Export</button><a className="eb-primary-button" href="/admin/teams/new"><Plus size={iconSize} /> Create Team</a></div>
      </div>

      <div className="eb-context-bar"><span className="eb-context-label">Viewing</span><select value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setLeagueId(''); setConference('All'); }} aria-label="Season"><option value="">All seasons</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select><span className="eb-context-arrow">›</span><div className="eb-league-pills">{seasonLeagues.map((league) => <button key={league.id} className={leagueId === league.id ? 'is-active' : ''} onClick={() => { setLeagueId(league.id); setConference('All'); }}>{league.name}</button>)}</div><div className="eb-context-details"><span className="eb-context-status"><i />{selectedLeagueSeason?.status ? String(selectedLeagueSeason.status).replaceAll('_', ' ') : 'Active'}</span><span className="eb-context-structure">{selectedLeagueSeason?.competitionStructure ? String(selectedLeagueSeason.competitionStructure).replaceAll('_', ' ') : 'Competition'}</span>{selectedSeason && <span className="eb-context-dates">{new Date(selectedSeason.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>}</div></div>

      <div className="eb-kpi-grid"><div className="eb-kpi-card"><span className="eb-kpi-icon red"><Shield size={16} /></span><div><strong>{teams.length}</strong><small>Total teams</small></div></div><div className="eb-kpi-card"><span className="eb-kpi-icon blue"><Users size={16} /></span><div><strong>{playerCount}</strong><small>Registered players</small></div></div><div className="eb-kpi-card"><span className="eb-kpi-icon green"><CheckCircle2 size={16} /></span><div><strong>{approvedCount}</strong><small>Approved</small></div></div><div className="eb-kpi-card"><span className="eb-kpi-icon amber"><Users size={16} /></span><div><strong>{pendingCount}</strong><small>Pending review</small></div></div></div>

      {selected.size > 0 && <div className="eb-bulk-bar"><span><strong>{selected.size}</strong> teams selected</span><button onClick={() => void runAction('/api/teams/bulk-approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selected], approved: true }) })}><CheckCircle2 size={iconSize} /> Approve</button><button className="danger" onClick={bulkDelete}><Trash2 size={iconSize} /> Delete</button><button className="eb-bulk-clear" onClick={() => setSelected(new Set())}><X size={iconSize} /></button></div>}
      {actionError && <div className="eb-teams-error eb-teams-error-inline"><span>{actionError}</span><button onClick={() => setActionError('')}>Dismiss</button></div>}

      <div className="eb-teams-table-wrap"><div className="eb-table-toolbar"><label className="eb-team-search"><Search size={iconSize} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams or coaches…" aria-label="Search teams or coaches" /></label>{conferences.length > 0 && <div className="eb-conference-row"><button className={conference === 'All' ? 'is-active' : ''} onClick={() => setConference('All')}>All <b>{teams.length}</b></button>{conferences.map((item) => <button key={item.id} className={conference === item.name ? 'is-active' : ''} onClick={() => setConference(item.name)}>{item.name} <b>{item.seasonTeams.length}</b></button>)}</div>}<select className="eb-status-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Team status"><option value="All">All status</option><option value="Approved">Approved</option><option value="Pending">Pending</option></select><span className="eb-toolbar-count">{pagedTeams.length} of {visibleTeams.length}</span></div><div className="eb-table-scroll"><table className="eb-teams-table"><thead><tr><th className="eb-check-col"><button className={`eb-check ${selected.size === pagedTeams.length && pagedTeams.length ? 'is-checked' : ''}`} onClick={() => { const next = new Set(selected); if (pagedTeams.every((team) => next.has(team.id))) pagedTeams.forEach((team) => next.delete(team.id)); else pagedTeams.forEach((team) => next.add(team.id)); setSelected(next); }} aria-label="Select all teams">{pagedTeams.length > 0 && pagedTeams.every((team) => selected.has(team.id)) ? <Check size={12} /> : null}</button></th><th><button className="eb-sort-button" onClick={() => toggleSort('name')}>Team {sort === 'name' && (ascending ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</button></th><th><button className="eb-sort-button" onClick={() => toggleSort('players')}>Roster {sort === 'players' && (ascending ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</button></th><th className="eb-hide-medium">Coach</th><th className="eb-hide-small">Conference</th><th>Status</th><th>Actions</th></tr></thead><tbody>{pagedTeams.map((team) => <tr key={team.id}><td><button className={`eb-check ${selected.has(team.id) ? 'is-checked' : ''}`} onClick={() => toggleOne(team.id)} aria-label={`Select ${team.name}`}>{selected.has(team.id) ? <Check size={12} /> : null}</button></td><td><div className="eb-team-cell"><span className="eb-crest">{team.logo ? <img src={team.logo} alt="" /> : <Shield size={18} />}</span><div><strong>{team.name}</strong><small><span className="eb-league-chip">{selectedLeagueSeason?.league?.name || 'Team'}</span><span>{team.nickname || team.name.toLowerCase().replaceAll(' ', '_')}</span></small></div></div></td><td><div className="eb-roster-block"><div><strong>{team._count?.players ?? 0}</strong><span>/ 20</span></div><i><b style={{ width: `${Math.min(100, ((team._count?.players ?? 0) / 20) * 100)}%` }} /></i></div></td><td className="eb-coach eb-hide-medium">—</td><td className="eb-hide-small"><span className="eb-conference-value">{conference === 'All' ? '—' : conference}</span></td><td><span className={`eb-status ${team.approved ? 'approved' : 'pending'}`}><span />{team.approved ? 'Approved' : 'Pending'}</span></td><td className="eb-actions"><div className="eb-quick-actions"><a href={`/admin/teams/view/${team.id}`}>View</a><a href={`/admin/teams/${team.id}`}>Edit</a><button className="eb-menu-trigger" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === team.id ? null : team.id); }} aria-label={`Actions for ${team.name}`}><MoreHorizontal size={17} /></button></div>{menuId === team.id && <div className="eb-team-menu" onClick={(event) => event.stopPropagation()}><button onClick={() => deleteOne(team.id)}>Delete</button></div>}</td></tr>)}</tbody></table></div>{visibleTeams.length === 0 && <div className="eb-teams-empty"><Shield size={26} /><strong>No teams</strong><span>Nothing matches this filter or search.</span></div>}<div className="eb-table-footer"><span>Showing {firstShown}–{lastShown} of {visibleTeams.length} teams</span><span className="eb-pagination-buttons"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Prev</button><span>Page {page} of {pageCount}</span><button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>Next</button></span></div></div>
    </section>
  );
}
