import { useCallback, useEffect, useMemo, useState } from 'react';
import { playerDirectoryApi } from '../../../data/datasources/player-directory-api';
import { getMissingProfileFields, getPlayerName, getPositionKey, sortPlayers, type PlayerDirectoryFilters, type PlayerDirectoryRow, type PlayerDirectoryScope, type PlayerSortKey, type SortDirection } from '../../../domain/entities/player-directory';

const pageSize = 10;
const emptyFilters: PlayerDirectoryFilters = { search: '', team: 'All teams', position: 'All', status: 'All', letter: 'All' };

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

  const load = useCallback(async () => { try { setLoading(true); setError(''); setPlayers(await playerDirectoryApi.list()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Failed to load players'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); playerDirectoryApi.seasons().then(setSeasons).catch(() => undefined); }, [load]);
  useEffect(() => { if (!seasonId || scope !== 'season') return; playerDirectoryApi.seasonTeams(seasonId, leagueSeasonId).then((rows) => setSeasonTeams(new Set(rows.map((row) => row.id)))).catch(() => setSeasonTeams(new Set())); }, [leagueSeasonId, scope, seasonId]);

  const currentSeason = seasons.find((season) => season.id === seasonId);
  const base = scope === 'season' && seasonId ? (seasonTeams.size ? players.filter((player) => player.teamId && seasonTeams.has(player.teamId)) : []) : players;
  const teamOptions = ['All teams', ...Array.from(new Set(base.map((player) => player.team?.name).filter(Boolean))).sort()];
  const filtered = useMemo(() => { const query = filters.search.trim().toLowerCase(); return sortPlayers(base.filter((player) => { const name = getPlayerName(player); const status = player.approved ? 'approved' : 'pending'; const missing = getMissingProfileFields(player).length > 0; return (!query || `${name} ${player.team?.name ?? ''} ${player.jerseyNumber ?? ''}`.toLowerCase().includes(query)) && (filters.team === 'All teams' || player.team?.name === filters.team) && (filters.position === 'All' || getPositionKey(player.position) === filters.position) && (filters.status === 'All' || (filters.status === 'incomplete' ? missing : status === filters.status)) && (filters.letter === 'All' || name.toUpperCase().startsWith(filters.letter)); }), sortKey, sortDirection); }, [base, filters, sortDirection, sortKey]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)); const currentPage = Math.min(page, pageCount); const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const updateFilter = (key: keyof PlayerDirectoryFilters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const resetFilters = () => { setFilters(emptyFilters); setPage(1); };
  const toggleSort = (key: PlayerSortKey) => { if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc'); } };
  const toggleSelection = (id: string) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelected((current) => { const next = new Set(current); const all = visible.length > 0 && visible.every((player) => next.has(player.id)); visible.forEach((player) => all ? next.delete(player.id) : next.add(player.id)); return next; });
  const approve = async (id: string) => { if (await playerDirectoryApi.setApproval(id, true).then(() => true).catch(() => false)) setPlayers((current) => current.map((player) => player.id === id ? { ...player, approved: true } : player)); };
  const toggleApproval = async (id: string, value: boolean) => { if (await playerDirectoryApi.setApproval(id, value).then(() => true).catch(() => false)) setPlayers((current) => current.map((player) => player.id === id ? { ...player, approved: value } : player)); };

  return { players, seasons, currentSeason, scope, setScope, seasonId, setSeasonId, leagueSeasonId, setLeagueSeasonId, editions: currentSeason?.leagueSeasons ?? [], filters, updateFilter, resetFilters, teamOptions, base, filtered, visible, page: currentPage, pageCount, setPage, selected, setSelected, toggleSelection, toggleAll, sortKey, sortDirection, toggleSort, approve, toggleApproval, loading, error, load };
}

