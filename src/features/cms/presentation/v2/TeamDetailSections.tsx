import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Grid2X2, List, Plus, Search, Shield, Trophy, Users } from 'lucide-react';
import type { TeamStaffWithStaff, TeamWithPlayers } from '../../types';

function SectionHead({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="eb-detail-section-head">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className: string;
}) {
  return src ? (
    <img className={`${className} eb-avatar-image`} src={src} alt={name} />
  ) : (
    <span className={className}>{name.slice(0, 2).toUpperCase()}</span>
  );
}

export function RegistrationsSection({
  rows,
  teamId,
  seasons,
  autoOpen = false,
  onAutoOpened,
}: {
  rows: Array<{
    seasonId: string;
    leagueSeasonId: string;
    teamId: string;
    season: string;
    league: string;
    structure: string;
    conference: string;
    status: string;
  }>;
  teamId: string;
  seasons: any[];
  autoOpen?: boolean;
  onAutoOpened?: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeagueSeasonId, setSelectedLeagueSeasonId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const activeStatuses = new Set(['REGISTRATION', 'SCHEDULED', 'ACTIVE', 'PLAYOFFS']);
  const options = seasons.flatMap((season: any) => (season.leagueSeasons ?? []).map((leagueSeason: any) => ({ season, leagueSeason }))).filter(({ leagueSeason }: any) => activeStatuses.has(String(leagueSeason.status).toUpperCase()) && !rows.some((row: any) => row.leagueSeasonId === leagueSeason.id));
  const openDialog = () => { setError(''); setSelectedLeagueSeasonId(options[0]?.leagueSeason?.id ?? ''); setDialogOpen(true); };
  useEffect(() => { if (autoOpen) { openDialog(); onAutoOpened?.(); } }, [autoOpen]);
  const registerTeam = async () => {
    if (!selectedLeagueSeasonId) { setError('Select a league season first.'); return; }
    const option = options.find(({ leagueSeason }: any) => leagueSeason.id === selectedLeagueSeasonId);
    if (!option) return;
    setSaving(true); setError('');
    const response = await fetch(`/api/seasons/${option.season.id}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leagueSeasonId: selectedLeagueSeasonId, teamIds: [teamId] }) });
    if (!response.ok) { setError((await response.json().catch(() => ({}))).error || 'Unable to register team.'); setSaving(false); return; }
    window.location.reload();
  };
  return (
    <section>
      <SectionHead
        title="Registrations"
        description="One SeasonTeam record per competition edition this team plays in. The conference only applies where that LeagueSeason uses conferences."
        action={
          <button className="eb-detail-primary" onClick={openDialog}>
            <Plus size={14} /> Register in LeagueSeason
          </button>
        }
      />
      <div className="eb-detail-table-card">
        <div className="eb-detail-table-scroll">
          <table className="eb-detail-table">
            <thead>
              <tr>
                <th>Season</th>
                <th>League</th>
                <th>Structure</th>
                <th>Conference</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={`${row.season}-${row.league}`}>
                    <td>
                      <strong>{row.season}</strong>
                    </td>
                    <td>{row.league}</td>
                    <td>{row.structure}</td>
                    <td>{row.conference}</td>
                    <td>
                      <span className="eb-detail-status approved">
                        <i />
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button className="eb-detail-small-button">Open</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Shield size={23} />}
                      title="No registrations"
                      text="This team is not registered in a competition edition yet."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {dialogOpen && <div className="eb-detail-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}><div className="eb-detail-dialog"><div className="eb-detail-dialog-head"><div><small>Team registration</small><h3>Register team in LeagueSeason</h3></div><button onClick={() => setDialogOpen(false)} aria-label="Close">×</button></div><label>League season<select value={selectedLeagueSeasonId} onChange={(event) => setSelectedLeagueSeasonId(event.target.value)}><option value="">Select a league season</option>{options.map(({ season, leagueSeason }: any) => <option value={leagueSeason.id} key={leagueSeason.id}>{season.name} · {leagueSeason.league?.name ?? 'League'}</option>)}</select></label>{!options.length && <p>This team is already registered in all available league seasons.</p>}{error && <p className="eb-detail-dialog-error">{error}</p>}<div className="eb-detail-dialog-actions"><button onClick={() => setDialogOpen(false)}>Cancel</button><button className="eb-detail-primary" onClick={() => void registerTeam()} disabled={saving || !options.length}>{saving ? 'Registering…' : 'Register team'}</button></div></div></div>}
    </section>
  );
}

export function RosterSection({ team }: { team: TeamWithPlayers }) {
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('All');
  const [squad, setSquad] = useState('All');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rawPlayers = (team.players ?? []) as any[];
  const positions = [
    'All',
    ...new Set(rawPlayers.map((player) => player.position).filter(Boolean)),
  ];
  const squads = ['All', ...new Set(rawPlayers.map((player) => player.squad).filter(Boolean))];
  const filtered = useMemo(
    () =>
      rawPlayers.filter((player) => {
        const name = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim();
        return (
          (!search || name.toLowerCase().includes(search.toLowerCase())) &&
          (position === 'All' || player.position === position) &&
          (squad === 'All' || player.squad === squad)
        );
      }),
    [rawPlayers, search, position, squad]
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, filtered.length);
  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const togglePage = () => {
    const next = new Set(selected);
    if (pageRows.every((player) => next.has(player.id)))
      pageRows.forEach((player) => next.delete(player.id));
    else pageRows.forEach((player) => next.add(player.id));
    setSelected(next);
  };
  const nameOf = (player: any) =>
    `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim() || 'Unnamed Player';
  return (
    <section>
      <SectionHead
        title="Roster"
        description={`${rawPlayers.length} players on file. Squad assignment carries across LeagueSeasons; eligibility is per registration.`}
        action={
          <div className="eb-detail-action-group">
            <button className="eb-detail-quiet">Import CSV</button>
            <a className="eb-detail-primary" href={`/admin/players/new?teamId=${team.id}`}>
              <Plus size={14} /> Add Player
            </a>
          </div>
        }
      />
      <div className="eb-detail-table-card">
        <div className="eb-detail-toolbar">
          <label>
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setFilter(setSearch, event.target.value)}
              placeholder={`Search ${rawPlayers.length} players…`}
            />
          </label>
          <select
            value={position}
            onChange={(event) => setFilter(setPosition, event.target.value)}
            aria-label="Position filter"
          >
            {positions.map((item) => (
              <option key={String(item)} value={String(item)}>
                {item === 'All' ? 'All positions' : item}
              </option>
            ))}
          </select>
          <select
            value={squad}
            onChange={(event) => setFilter(setSquad, event.target.value)}
            aria-label="Squad filter"
          >
            {squads.map((item) => (
              <option key={String(item)} value={String(item)}>
                {item === 'All' ? 'All squads' : item}
              </option>
            ))}
          </select>
          <span className="eb-detail-toolbar-count">
            {rangeStart}–{rangeEnd} of {filtered.length}
          </span>
          <div className="eb-detail-view-toggle">
            <button
              className={view === 'table' ? 'active' : ''}
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <List size={15} />
            </button>
            <button
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
              aria-label="Card view"
            >
              <Grid2X2 size={15} />
            </button>
          </div>
        </div>
        {selected.size > 0 && (
          <div className="eb-detail-bulk">
            <strong>{selected.size} selected</strong>
            <button>Change squad</button>
            <button>Add to registration</button>
            <button className="danger">Remove</button>
            <button className="clear" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        )}
        {view === 'table' ? (
          <div className="eb-detail-table-scroll">
            <table className="eb-detail-table eb-roster-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className={`eb-detail-check ${pageRows.length > 0 && pageRows.every((player) => selected.has(player.id)) ? 'checked' : ''}`}
                      onClick={togglePage}
                      aria-label="Select page"
                    >
                      ✓
                    </button>
                  </th>
                  <th>No</th>
                  <th>Player</th>
                  <th className="roster-hide-medium">Position</th>
                  <th className="roster-hide-large">Squad</th>
                  <th className="roster-hide-large">Height</th>
                  <th>PPG</th>
                  <th className="roster-hide-medium">GP</th>
                  <th>Eligibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((player, index) => (
                  <tr key={player.id}>
                    <td>
                      <button
                        className={`eb-detail-check ${selected.has(player.id) ? 'checked' : ''}`}
                        onClick={() => {
                          const next = new Set(selected);
                          if (next.has(player.id)) next.delete(player.id);
                          else next.add(player.id);
                          setSelected(next);
                        }}
                        aria-label={`Select ${nameOf(player)}`}
                      >
                        ✓
                      </button>
                    </td>
                    <td>
                      {player.jerseyNumber ??
                        String((page - 1) * pageSize + index + 1).padStart(2, '0')}
                    </td>
                    <td>
                      <div className="eb-player-cell">
                        <Avatar
                          src={player.image ?? player.avatar ?? player.photo}
                          name={nameOf(player)}
                          className="eb-player-avatar"
                        />
                        <strong>{nameOf(player)}</strong>
                      </div>
                    </td>
                    <td className="roster-hide-medium">{player.position ?? '—'}</td>
                    <td className="roster-hide-large">{player.squad ?? 'First team'}</td>
                    <td className="roster-hide-large">{player.height ?? '—'}</td>
                    <td>—</td>
                    <td className="roster-hide-medium">—</td>
                    <td>
                      <span className="eb-detail-status approved">
                        <i />
                        Eligible
                      </span>
                    </td>
                    <td>
                      <a className="eb-detail-small-button" href={`/admin/players/${player.id}`}>
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <EmptyState
                icon={<Users size={23} />}
                title="No players"
                text="Nothing matches this search or filter."
              />
            )}
          </div>
        ) : (
          <div className="eb-roster-grid">
            {pageRows.map((player) => (
              <article className="eb-roster-card" key={player.id}>
                <div className="eb-roster-avatar">
                  <Avatar
                    src={player.image ?? player.avatar ?? player.photo}
                    name={nameOf(player)}
                    className="eb-roster-avatar-content"
                  />
                </div>
                <strong>{nameOf(player)}</strong>
                <span>
                  {player.position ?? 'Position not set'} · {player.height ?? 'Height —'}
                </span>
                <footer>
                  {player.ppg ?? '—'} ppg · {player.gp ?? '—'} gp{' '}
                  <a className="eb-detail-small-button" href={`/admin/players/${player.id}`}>
                    Edit
                  </a>
                </footer>
              </article>
            ))}
          </div>
        )}
        <div className="eb-detail-pagination">
          <span>
            Showing {rangeStart}–{rangeEnd} of {filtered.length} players
          </span>
          <div>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              aria-label="Players per page"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page === pageCount}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StaffSection({ staff }: { staff: TeamStaffWithStaff[] }) {
  return (
    <section>
      <SectionHead
        title="Staff"
        description="Coaches, managers and support shown on the public team page."
        action={
          <button className="eb-detail-primary">
            <Plus size={14} /> Add Staff
          </button>
        }
      />
      <div className="eb-staff-grid">
        {staff.map((item) => {
          const member: any = item.staff;
          const name =
            (member?.name ?? `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim()) ||
            'Staff member';
          return (
            <article className="eb-staff-card" key={item.id}>
              <Avatar
                src={member?.image ?? member?.avatar ?? member?.photo}
                name={name}
                className="eb-staff-avatar"
              />
              <strong>{name}</strong>
              <em>{String(item.role).replaceAll('_', ' ')}</em>
              <div>
                {member?.email ?? 'No email'}
                <br />
                {member?.phone ?? 'No phone'}
              </div>
              <div className="eb-detail-action-group">
                <button className="eb-detail-small-button">Edit</button>
                <button className="eb-detail-small-button danger">Remove</button>
              </div>
            </article>
          );
        })}
        <button className="eb-staff-add">
          <Plus size={22} />
          <strong>Add staff member</strong>
        </button>
      </div>
    </section>
  );
}

export function MatchesSection({ matches }: { matches: Array<Record<string, any>> }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMatch, setOpenMatch] = useState<string | null>(null);
  const pageSize = 4;
  const filtered = matches.filter((match) => {
    const status = String(match.status ?? '').toLowerCase();
    const text =
      `${match.team1?.name ?? ''} ${match.team2?.name ?? ''} ${match.venue ?? ''}`.toLowerCase();
    return (
      (!search || text.includes(search.toLowerCase())) &&
      (filter === 'All' ||
        (filter === 'Played'
          ? status.includes('completed') || status.includes('played')
          : !status.includes('completed') && !status.includes('played')))
    );
  });
  const playedCount = matches.filter((match) => {
    const status = String(match.status ?? '').toLowerCase();
    return status.includes('completed') || status.includes('played');
  }).length;
  const upcomingCount = matches.length - playedCount;
  const filterCount = (item: string) => item === 'All' ? matches.length : item === 'Played' ? playedCount : upcomingCount;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageNumbers = Array.from({ length: pages }, (_, index) => index + 1);
  const leagueGroups = new Map<string, Array<Record<string, any>>>();
  pageRows.forEach((match) => {
    const key = match.league?.name ?? match.leagueName ?? 'No League';
    leagueGroups.set(key, [...(leagueGroups.get(key) ?? []), match]);
  });
  return (
    <section>
      <SectionHead
        title="Fixtures & results"
        description={`${matches.length} matches in this edition.`}
        action={
          <div className="eb-detail-filter-pills">
            {['All', 'Played', 'Upcoming'].map((item) => (
              <button
                key={item}
                className={filter === item ? 'active' : ''}
                onClick={() => {
                  setFilter(item);
                  setPage(1);
                }}
              >
                {item} <b>{filterCount(item)}</b>
              </button>
            ))}
          </div>
        }
      />
      <div className="eb-detail-table-card">
        <div className="eb-detail-toolbar">
          <label>
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search opponent or venue…"
            />
          </label>
          <span>
            {filtered.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} matches` : '0 matches'}
          </span>
        </div>
        {pageRows.length ? (
          [...leagueGroups.entries()].map(([league, rows]) => (
            <div key={league}>
              <div className="eb-match-group-head">
                <span>{league}</span>
                <small>{rows.filter((match) => { const status = String(match.status ?? '').toLowerCase(); return status.includes('completed') || status.includes('played'); }).length ? `${rows.filter((match) => Number(match.team1Score ?? match.us ?? 0) > Number(match.team2Score ?? match.them ?? 0)).length}W · ${rows.filter((match) => Number(match.team1Score ?? match.us ?? 0) < Number(match.team2Score ?? match.them ?? 0)).length}L` : `${rows.length} scheduled`}</small>
              </div>
              {rows.map((match) => {
                const team1 = match.team1?.name ?? match.team1Name ?? 'Team';
                const team2 = match.team2?.name ?? match.team2Name ?? match.opponent ?? 'Opponent';
                const status = String(match.status ?? 'Upcoming').replaceAll('_', ' ');
                const played =
                  status.toLowerCase().includes('completed') ||
                  status.toLowerCase().includes('played');
                const statusLabel = played ? 'Played' : 'Upcoming';
                const opponent = match.opponent ?? team2;
                const conference = match.opponentConference ?? match.conference;
                const usScore = match.team1Score ?? match.us;
                const themScore = match.team2Score ?? match.them;
                const usWon = Number(usScore ?? 0) >= Number(themScore ?? 0);
                return (
                  <div className="eb-match-item" key={match.id}>
                    <button
                      className="eb-match-main"
                      onClick={() => setOpenMatch(openMatch === match.id ? null : match.id)}
                    >
                      <span className="eb-match-date">
                        {new Date(match.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        <small className={played ? 'played' : 'upcoming'}>{statusLabel}</small>
                      </span>
                      <span className="eb-match-opponent">
                        <span className="eb-match-venue">{match.venue ?? '—'}</span>
                        <strong>{opponent}</strong>
                        {conference && <span className="eb-match-conference">{conference}</span>}
                      </span>
                      <span className="eb-match-outcome">
                        {played ? (
                          <span className="eb-match-score">
                            <b className={usWon ? 'winning' : 'losing'}>{usScore ?? '—'}</b>
                            <i>–</i>
                            <b className={usWon ? 'losing' : 'winning'}>{themScore ?? '—'}</b>
                          </span>
                        ) : <span className="eb-match-tip">{match.tip ?? match.time ?? 'Scheduled'}</span>}
                      </span>
                      {played && <span className={`eb-match-result ${usWon ? 'win' : 'loss'}`}>{usWon ? 'W' : 'L'}</span>}
                      <span className="eb-match-actions">
                        <span className="eb-detail-small-button">Details</span>
                        {played && <span className="eb-match-caret">{openMatch === match.id ? '▴' : '▾'}</span>}
                      </span>
                    </button>
                    {openMatch === match.id && (
                      <div className="eb-match-details">
                        <strong>Team box score</strong>
                        <div>
                          <span>
                            Points <b>{match.points ?? usScore ?? '—'}</b>
                          </span>
                          <span>
                            FG% <b>—</b>
                          </span>
                          <span>
                            Rebounds <b>—</b>
                          </span>
                          <span>
                            Assists <b>—</b>
                          </span>
                          <span>3PT% <b>—</b></span>
                          <span>FT% <b>—</b></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Trophy size={23} />}
            title="No fixtures"
            text="Nothing in this edition matches the current filter."
          />
        )}
        <div className="eb-detail-pagination">
          <span>
            {filtered.length ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} matches` : 'Showing 0 matches'}
          </span>
          <div>
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            {pageNumbers.map((number) => (
              <button key={number} className={page === number ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>
            ))}
            <button
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              disabled={page === pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="eb-detail-empty">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
