import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import {
	type LeagueFormValues,
	EMPTY_LEAGUE_FORM,
	isValid,
	slugify,
	toDateTimeLocal,
	toPayload,
	validateLeagueForm,
} from "@/features/leagues/domain/entities/league-form";
import type { LeagueSeasonSummary } from "@/features/leagues/domain/entities/league-detail";

interface LinkableSeason {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	leagueIds: string[];
}

/**
 * Owns the league editor: form state, validation, save, and the season
 * attachments. `leagueId` absent = create mode.
 */
export function useLeagueEditor(leagueId?: string) {
	const { can } = usePermissions();
	const isEdit = Boolean(leagueId);

	const [values, setValues] = useState<LeagueFormValues>(EMPTY_LEAGUE_FORM);
	const [seasons, setSeasons] = useState<LeagueSeasonSummary[]>([]);
	const [loading, setLoading] = useState(isEdit);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);
	const [touched, setTouched] = useState(false);

	const errors = useMemo(() => validateLeagueForm(values), [values]);
	const canSave = isValid(errors) && !saving;

	const set = useCallback(<K extends keyof LeagueFormValues>(key: K, value: LeagueFormValues[K]) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		setTouched(true);
		setSaved(false);
	}, []);

	/** The slug preview always shows what the server will actually store. */
	const slugPreview = values.slug.trim() || slugify(values.name) || "league-slug";

	const load = useCallback(async () => {
		if (!leagueId) return;
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/leagues/${leagueId}/overview`);
			if (res.status === 404) throw new Error("not-found");
			if (!res.ok) throw new Error("failed");

			const detail = await res.json();
			const l = detail.league;
			setValues({
				name: l.name ?? "",
				slug: l.slug ?? "",
				description: l.description ?? "",
				logo: l.logo ?? "",
				active: Boolean(l.active),
				registrationOpen: Boolean(l.registrationOpen),
				registrationOpensAt: toDateTimeLocal(l.registrationOpensAt),
				registrationClosesAt: toDateTimeLocal(l.registrationClosesAt),
			});
			setSeasons(detail.seasons ?? []);
			setTouched(false);
		} catch (err) {
			setError(
				err instanceof Error && err.message === "not-found"
					? "That league no longer exists."
					: "Could not load this league. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, [leagueId]);

	useEffect(() => {
		load();
	}, [load]);

	const save = useCallback(async () => {
		if (!isValid(validateLeagueForm(values))) {
			setTouched(true);
			return;
		}
		setSaving(true);
		setError("");
		try {
			const res = await fetch(isEdit ? `/api/leagues/${leagueId}` : "/api/leagues", {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(toPayload(values)),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error || "Could not save this league.");

			if (!isEdit && data?.id) {
				window.location.href = `/admin/leagues/${data.id}`;
				return;
			}
			setSaved(true);
			setTouched(false);
			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save this league.");
		} finally {
			setSaving(false);
		}
	}, [values, isEdit, leagueId, load]);

	// ── Season attachments ────────────────────────────────────────────────
	// `updateSeason` replaces a season's league links wholesale, so both link
	// and unlink must send the season's FULL new league list, not a delta.
	const setSeasonLeagues = useCallback(
		async (seasonId: string, nextLeagueIds: string[]) => {
			const res = await fetch(`/api/seasons/${seasonId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ leagueIds: nextLeagueIds }),
			});
			if (!res.ok) throw new Error("Could not update the season's leagues.");
			await load();
		},
		[load],
	);

	const currentLeagueIds = useCallback(async (seasonId: string): Promise<string[]> => {
		const res = await fetch(`/api/seasons/${seasonId}`);
		if (!res.ok) throw new Error("Could not read the season.");
		const season = await res.json();
		return (season.leagueSeasons ?? []).map((ls: { leagueId: string }) => ls.leagueId);
	}, []);

	const linkSeason = useCallback(
		async (seasonId: string) => {
			if (!leagueId) return;
			try {
				const ids = await currentLeagueIds(seasonId);
				if (ids.includes(leagueId)) return;
				await setSeasonLeagues(seasonId, [...ids, leagueId]);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Could not link that season.");
			}
		},
		[leagueId, currentLeagueIds, setSeasonLeagues],
	);

	const unlinkSeason = useCallback(
		async (seasonId: string, seasonName: string) => {
			if (!leagueId) return;
			if (!window.confirm(`Remove "${seasonName}" from this league?\n\nThe season itself is not deleted.`)) return;
			try {
				const ids = await currentLeagueIds(seasonId);
				await setSeasonLeagues(
					seasonId,
					ids.filter((id) => id !== leagueId),
				);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Could not unlink that season.");
			}
		},
		[leagueId, currentLeagueIds, setSeasonLeagues],
	);

	/** Seasons not yet attached to this league — the "Link existing" candidates. */
	const fetchLinkable = useCallback(async (): Promise<LinkableSeason[]> => {
		const res = await fetch("/api/seasons");
		if (!res.ok) throw new Error("Could not load seasons.");
		const all = await res.json();
		return (Array.isArray(all) ? all : [])
			.map((s: any) => ({
				id: s.id,
				name: s.name,
				startDate: s.startDate,
				endDate: s.endDate,
				leagueIds: (s.leagueSeasons ?? []).map((ls: { leagueId: string }) => ls.leagueId),
			}))
			.filter((s: LinkableSeason) => !s.leagueIds.includes(leagueId!));
	}, [leagueId]);

	return {
		values,
		set,
		errors,
		touched,
		slugPreview,
		seasons,
		loading,
		saving,
		saved,
		error,
		canSave,
		save,
		isEdit,
		linkSeason,
		unlinkSeason,
		fetchLinkable,
		canManageSeasons: can("seasons:update"),
		canCreateSeason: can("seasons:create"),
		refresh: load,
	};
}
