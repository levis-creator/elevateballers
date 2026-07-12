import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import {
	type AdminLeague,
	type LeagueFilter,
	LEAGUE_FILTERS,
	computeStats,
	matchesFilter,
	matchesSearch,
} from "@/features/leagues/domain/entities/league";

/**
 * Owns the leagues board state + actions (SRP). Presentation renders what this
 * returns and never touches the API. Mutations apply optimistically and reload
 * from the server on failure, so the UI can never drift silently.
 */
export function useLeagues() {
	const { can } = usePermissions();
	const canCreate = can("leagues:create");
	const canUpdate = can("leagues:update");
	const canDelete = can("leagues:delete");

	const [leagues, setLeagues] = useState<AdminLeague[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<LeagueFilter>("All");
	const [checked, setChecked] = useState<Set<string>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/leagues?counts=teams");
			if (!res.ok) throw new Error("Failed to load");
			const data = await res.json();
			setLeagues(Array.isArray(data) ? data : []);
		} catch {
			setError("Could not load leagues. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const stats = useMemo(() => computeStats(leagues), [leagues]);

	const counts = useMemo(
		() =>
			({
				All: leagues.length,
				Active: stats.active,
				Archived: leagues.length - stats.active,
			}) as Record<LeagueFilter, number>,
		[leagues.length, stats.active],
	);

	const filtered = useMemo(
		() => leagues.filter((l) => matchesFilter(l, filter) && matchesSearch(l, search)),
		[leagues, filter, search],
	);

	// ── Row mutations ─────────────────────────────────────────────────────
	const setActive = useCallback(
		async (id: string, active: boolean) => {
			setLeagues((prev) => prev.map((l) => (l.id === id ? { ...l, active } : l)));
			try {
				const res = await fetch(`/api/leagues/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ active }),
				});
				if (!res.ok) throw new Error("Update failed");
			} catch {
				load();
			}
		},
		[load],
	);

	const remove = useCallback(
		async (id: string) => {
			const league = leagues.find((l) => l.id === id);
			const warning = league?._count.matches
				? `\n\n${league._count.matches} match(es) reference this league and will lose that reference.`
				: "";
			if (!window.confirm(`Permanently delete "${league?.name ?? "this league"}"?${warning}`)) return;

			setLeagues((prev) => prev.filter((l) => l.id !== id));
			try {
				const res = await fetch(`/api/leagues/${id}`, { method: "DELETE" });
				if (!res.ok) throw new Error("Delete failed");
			} catch {
				load();
			}
		},
		[leagues, load],
	);

	// ── Selection + bulk ──────────────────────────────────────────────────
	const toggleCheck = useCallback((id: string) => {
		setChecked((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const clearChecked = useCallback(() => setChecked(new Set()), []);

	const bulkArchive = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;

		setLeagues((prev) => prev.map((l) => (checked.has(l.id) ? { ...l, active: false } : l)));
		clearChecked();
		await Promise.allSettled(
			ids.map((id) =>
				fetch(`/api/leagues/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ active: false }),
				}),
			),
		);
		load();
	}, [checked, clearChecked, load]);

	const bulkDelete = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;
		if (!window.confirm(`Permanently delete ${ids.length} league${ids.length === 1 ? "" : "s"}?`)) return;

		setLeagues((prev) => prev.filter((l) => !checked.has(l.id)));
		clearChecked();
		try {
			const res = await fetch("/api/leagues/bulk-delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids }),
			});
			if (!res.ok) throw new Error("Bulk delete failed");
		} catch {
			load();
		}
	}, [checked, clearChecked, load]);

	return {
		leagues,
		filtered,
		loading,
		error,
		stats,
		counts,
		filters: LEAGUE_FILTERS,
		filter,
		setFilter,
		search,
		setSearch,
		checked,
		toggleCheck,
		clearChecked,
		setActive,
		remove,
		bulkArchive,
		bulkDelete,
		canCreate,
		canUpdate,
		canDelete,
		refresh: load,
	};
}
