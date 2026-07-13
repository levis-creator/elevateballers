import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import {
	type AdminSeason,
	type SeasonFilter,
	SEASON_FILTERS,
	computeStats,
	countByFilter,
	matchesFilter,
	matchesSearch,
} from "@/features/seasons/domain/entities/season";

/** The `/api/seasons` row shape. Mapped to `AdminSeason` so the UI never sees Prisma's. */
interface SeasonResponse {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	startDate: string;
	endDate: string;
	active: boolean;
	bracketType: string | null;
	leagueSeasons?: { league: { id: string; name: string } }[];
	_count?: { matches: number };
	completedMatches?: number;
}

function toAdminSeason(row: SeasonResponse): AdminSeason {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		description: row.description,
		startDate: row.startDate,
		endDate: row.endDate,
		active: row.active,
		bracketType: row.bracketType,
		leagues: (row.leagueSeasons ?? []).map((ls) => ({ id: ls.league.id, name: ls.league.name })),
		matches: row._count?.matches ?? 0,
		completed: row.completedMatches ?? 0,
	};
}

/**
 * Owns the seasons board state + actions (SRP). Presentation renders what this
 * returns and never touches the API. Mutations apply optimistically and reload
 * from the server on failure, so the UI can never drift silently.
 */
export function useSeasons() {
	const { can } = usePermissions();
	const canCreate = can("seasons:create");
	const canUpdate = can("seasons:update");
	const canDelete = can("seasons:delete");

	const [seasons, setSeasons] = useState<AdminSeason[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<SeasonFilter>("All");
	const [checked, setChecked] = useState<Set<string>>(new Set());

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/seasons?counts=matches");
			if (!res.ok) throw new Error("Failed to load");
			const data = await res.json();
			setSeasons(Array.isArray(data) ? data.map(toAdminSeason) : []);
		} catch {
			setError("Could not load seasons. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const stats = useMemo(() => computeStats(seasons), [seasons]);
	const counts = useMemo(() => countByFilter(seasons), [seasons]);

	const filtered = useMemo(
		() => seasons.filter((s) => matchesFilter(s, filter) && matchesSearch(s, search)),
		[seasons, filter, search],
	);

	// ── Row mutations ─────────────────────────────────────────────────────
	/**
	 * There is no status column: `active` is what "Mark completed" writes. A
	 * season in its date window reads as Live when active and Completed when not.
	 */
	const setActive = useCallback(
		async (id: string, active: boolean) => {
			setSeasons((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
			try {
				const res = await fetch(`/api/seasons/${id}`, {
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
			const season = seasons.find((s) => s.id === id);
			const warning = season?.matches
				? `\n\n${season.matches} match(es) belong to this season and will be deleted with it.`
				: "";
			if (!window.confirm(`Permanently delete "${season?.name ?? "this season"}"?${warning}`)) return;

			setSeasons((prev) => prev.filter((s) => s.id !== id));
			try {
				const res = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
				if (!res.ok) throw new Error("Delete failed");
			} catch {
				load();
			}
		},
		[seasons, load],
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

	const bulkComplete = useCallback(async () => {
		const ids = [...checked];
		if (!ids.length) return;

		setSeasons((prev) => prev.map((s) => (checked.has(s.id) ? { ...s, active: false } : s)));
		clearChecked();
		await Promise.allSettled(
			ids.map((id) =>
				fetch(`/api/seasons/${id}`, {
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
		if (!window.confirm(`Permanently delete ${ids.length} season${ids.length === 1 ? "" : "s"}?`)) return;

		setSeasons((prev) => prev.filter((s) => !checked.has(s.id)));
		clearChecked();
		try {
			const res = await fetch("/api/seasons/bulk-delete", {
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
		seasons,
		filtered,
		loading,
		error,
		stats,
		counts,
		filters: SEASON_FILTERS,
		filter,
		setFilter,
		search,
		setSearch,
		checked,
		toggleCheck,
		clearChecked,
		setActive,
		remove,
		bulkComplete,
		bulkDelete,
		canCreate,
		canUpdate,
		canDelete,
		refresh: load,
	};
}
