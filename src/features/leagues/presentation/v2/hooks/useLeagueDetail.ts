import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import { type LeagueDetail, type LeagueTab, LEAGUE_TABS, computeDetailStats } from "@/features/leagues/domain/entities/league-detail";

/**
 * Owns the league-detail state + actions (SRP). One fetch feeds every tab, so
 * the tabs are pure view state and switching them costs nothing.
 */
export function useLeagueDetail(leagueId: string) {
	const { can } = usePermissions();

	const [detail, setDetail] = useState<LeagueDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [tab, setTab] = useState<LeagueTab>("Overview");

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/leagues/${leagueId}/overview`);
			if (res.status === 404) throw new Error("not-found");
			if (!res.ok) throw new Error("failed");
			setDetail(await res.json());
		} catch (err) {
			setError(err instanceof Error && err.message === "not-found" ? "That league no longer exists." : "Could not load this league. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [leagueId]);

	useEffect(() => {
		load();
	}, [load]);

	const stats = useMemo(() => (detail ? computeDetailStats(detail) : null), [detail]);

	/** Archive / restore, applied optimistically and rolled back from the server on failure. */
	const setActive = useCallback(
		async (active: boolean) => {
			setDetail((prev) => (prev ? { ...prev, league: { ...prev.league, active } } : prev));
			try {
				const res = await fetch(`/api/leagues/${leagueId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ active }),
				});
				if (!res.ok) throw new Error("Update failed");
			} catch {
				load();
			}
		},
		[leagueId, load],
	);

	return {
		detail,
		stats,
		loading,
		error,
		tab,
		setTab,
		tabs: LEAGUE_TABS,
		setActive,
		canUpdate: can("leagues:update"),
		canCreateSeason: can("seasons:create"),
		refresh: load,
	};
}
