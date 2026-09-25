import { useCallback, useEffect, useMemo, useState } from 'react';
import { playerDirectoryApi } from '../../../data/datasources/player-directory-api';
import { getMissingProfileFields, getPlayerName, getPositionKey, matchesParticipation, sortPlayers, toPlayersCsv, type PlayerDirectoryFilters, type PlayerDirectoryRow, type PlayerDirectoryScope, type PlayerSortKey, type SortDirection } from '../../../domain/entities/player-directory';

const pageSize = 10;
const emptyFilters: PlayerDirectoryFilters = { search: '', team: 'All teams', position: 'All', status: 'All', letter: 'All', participation: 'all' };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function usePlayersDirectory() {
  const [players, setPlayers] = useState<PlayerDirectoryRow[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [seasonTeams, setSeasonTeams] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<PlayerDirectoryScope>('directory');
  const [seasonId, setSeasonId] = useState('');
  const [leagueSeasonId, setLeagueSeasonId] = useState('');
  const [filters, setFilters] = useState<PlayerDirectoryFilters>(emptyFilters);
  const [sortKey, setSortKey] = useState<PlayerSortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  const load = useCallback(async () => { try { setLoading(true); setError(''); setPlayers(await playerDirectoryApi.list()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to load players'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); playerDirectoryApi.seasons().then(setSeasons).catch(() => undefined); }, [load]);
  useEffect(() => { if (!seasonId || scope !== 'season') return; playerDirectoryApi.seasonTeams(seasonId, leagueSeasonId).then((rows) => setSeasonTeams(new Set(rows.map((row) => row.id)))).catch(() => setSeasonTeams(new Set())); }, [leagueSeasonId, scope, seasonId]);

  const currentSeason = seasons.find((season) => season.id === seasonId);
  const base = scope === 'season' && seasonId ? (seasonTeams.size ? players.filter((player) => player.teamId && seasonTeams.has(player.teamId)) : []) : players;
  const teamOptions = ['All teams', ...Array.from(new Set(base.map((player) => player.team?.name).filter(Boolean))).sort()];
  const filtered = useMemo(() => { const query = filters.search.trim().toLowerCase(); return sortPlayers(base.filter((player) => { const name = getPlayerName(player); const status = player.approved ? 'approved' : 'pending'; const missing = getMissingProfileFields(player).length > 0; return (!query || `${name} ${player.team?.name ?? ''} ${player.jerseyNumber ?? ''}`.toLowerCase().includes(query)) && (filters.team === 'All teams' || player.team?.name === filters.team) && (filters.position === 'All' || getPositionKey(player.position) === filters.position) && (filters.status === 'All' || (filters.status === 'incomplete' ? missing : status === filters.status)) && matchesParticipation(player, filters.participation) && (filters.letter === 'All' || name.toUpperCase().startsWith(filters.letter)); }), sortKey, sortDirection); }, [base, filters, sortDirection, sortKey]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)); const currentPage = Math.min(page, pageCount); const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const updateFilter = (key: keyof PlayerDirectoryFilters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const resetFilters = () => { setFilters(emptyFilters); setPage(1); };
  const toggleSort = (key: PlayerSortKey) => { if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc'); } };
  const toggleSelection = (id: string) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelected((current) => { const next = new Set(current); const all = visible.length > 0 && visible.every((player) => next.has(player.id)); visible.forEach((player) => all ? next.delete(player.id) : next.add(player.id)); return next; });
  const approve = async (id: string) => { if (await playerDirectoryApi.setApproval(id, true).then(() => true).catch(() => false)) setPlayers((current) => current.map((player) => player.id === id ? { ...player, approved: true } : player)); };
  const toggleApproval = async (id: string, value: boolean) => { if (await playerDirectoryApi.setApproval(id, value).then(() => true).catch(() => false)) setPlayers((current) => current.map((player) => player.id === id ? { ...player, approved: value } : player)); };

  const droppedCount = base.filter((player) => player.dropout).length;
  const nameOf = (id: string) => { const player = players.find((row) => row.id === id); return player ? getPlayerName(player) : 'A player'; };
  // Reload after a write without the full-page loading state.
  const refresh = async () => { try { setPlayers(await playerDirectoryApi.list()); } catch { /* the next load will retry */ } };
  const run = async (task: () => Promise<{ tone: 'ok' | 'warn'; text: string } | null>) => {
    setBusy(true); setNotice(null);
    try { const result = await task(); if (result) setNotice(result); await refresh(); }
    catch (cause) { setNotice({ tone: 'warn', text: cause instanceof Error ? cause.message : 'Something went wrong.' }); }
    finally { setBusy(false); }
  };

  /** Drop out (asks for a reason) or reinstate players; reports any that could not change. */
  const setDropout = (ids: string[], action: 'DROP_OUT' | 'REINSTATE') => {
    if (!ids.length) return;
    const who = ids.length === 1 ? nameOf(ids[0]) : plural(ids.length, 'player');
    let reason: string | undefined;
    if (action === 'DROP_OUT') {
      const answer = window.prompt(`Mark ${who} as dropped out of the league?

They come off their active rosters (freeing the spots) and leave upcoming lineups. You can reinstate them later.

Reason (optional, admins only):`, '');
      if (answer === null) return;
      reason = answer.trim() || undefined;
    } else if (!window.confirm(`Reinstate ${who} on the roster${ids.length === 1 ? '' : 's'} they left?`)) return;
    return run(async () => {
      const { done, skipped } = await playerDirectoryApi.dropout(ids, action, reason);
      setSelected((current) => { const next = new Set(current); done.forEach((id) => next.delete(id)); return next; });
      const verb = action === 'DROP_OUT' ? 'marked as dropped out' : 'reinstated';
      const skippedText = skipped.map((item) => `${nameOf(item.id)}: ${item.error}`).join(' ');
      return { tone: skipped.length ? 'warn' : 'ok', text: [done.length ? `${plural(done.length, 'player')} ${verb}.` : '', skippedText].filter(Boolean).join(' ') };
    });
  };
  const bulkApprove = (ids: string[]) => run(async () => { await playerDirectoryApi.bulkApprove(ids); setSelected(new Set()); return { tone: 'ok', text: `${plural(ids.length, 'player')} approved.` }; });
  const bulkDelete = (ids: string[]) => {
    if (!window.confirm(`Permanently delete ${ids.length === 1 ? nameOf(ids[0]) : plural(ids.length, 'player')}? Their profiles and stats are removed and this cannot be undone.

If they have only left the league, use "Mark dropped out" instead.`)) return;
    return run(async () => { await playerDirectoryApi.bulkDelete(ids); setSelected(new Set()); return { tone: 'ok', text: `${plural(ids.length, 'player')} deleted.` }; });
  };
  const exportCsv = (ids: string[]) => {
    const rows = players.filter((player) => ids.includes(player.id));
    const url = URL.createObjectURL(new Blob([toPlayersCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `players-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return { busy, notice, setNotice, droppedCount, setDropout, bulkApprove, bulkDelete, exportCsv, players, seasons, currentSeason, scope, setScope, seasonId, setSeasonId, leagueSeasonId, setLeagueSeasonId, editions: currentSeason?.leagueSeasons ?? [], filters, updateFilter, resetFilters, teamOptions, base, filtered, visible, page: currentPage, pageCount, setPage, selected, setSelected, toggleSelection, toggleAll, sortKey, sortDirection, toggleSort, approve, toggleApproval, loading, error, load };
}

