import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import {
	type SeasonDetail,
	type SeasonTab,
	SEASON_TABS,
	computeSeasonStats,
} from "@/features/seasons/domain/entities/season-detail";

/**
 * Owns the season-detail page: one fetch of `/overview` feeds every tab, so
 * switching tabs costs nothing and the counts can't disagree between them.
 */
export function useSeasonDetail(seasonId: string) {
	const { can } = usePermissions();

	const [detail, setDetail] = useState<SeasonDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [tab, setTab] = useState<SeasonTab>("Schedule");

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/seasons/${seasonId}/overview`);
			if (res.status === 404) throw new Error("not-found");
			if (!res.ok) throw new Error("failed");
			setDetail(await res.json());
		} catch (err) {
			setError(
				err instanceof Error && err.message === "not-found"
					? "That season no longer exists."
					: "Could not load this season. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, [seasonId]);

	useEffect(() => {
		load();
	}, [load]);

	const stats = useMemo(() => (detail ? computeSeasonStats(detail) : null), [detail]);

	return {
		detail,
		stats,
		loading,
		error,
		tab,
		setTab,
		tabs: SEASON_TABS,
		canUpdate: can("seasons:update"),
		canCreateMatch: can("matches:create"),
		refresh: load,
	};
}
