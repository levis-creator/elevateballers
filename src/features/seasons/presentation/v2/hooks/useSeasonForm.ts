import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import {
	type SeasonFormValues,
	EMPTY_SEASON_FORM,
	checklist,
	isValid,
	previewRange,
	previewStatus,
	isStatusLocked,
	slugify,
	toDateInput,
	toDateTimeLocal,
	toPayload,
	validateSeasonForm,
} from "@/features/seasons/domain/entities/season-form";

/** Long enough to read the "Season created" confirmation, short enough not to feel stuck. */
const CREATED_REDIRECT_MS = 900;

export interface FormLeague {
	id: string;
	name: string;
	teamCount: number;
}

/**
 * Owns the season editor: form state, validation, the league links, and save.
 * `seasonId` absent = create mode.
 */
export function useSeasonForm(seasonId?: string) {
	const { can } = usePermissions();
	const isEdit = Boolean(seasonId);

	const [values, setValues] = useState<SeasonFormValues>(EMPTY_SEASON_FORM);
	const [leagues, setLeagues] = useState<FormLeague[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);
	const [touched, setTouched] = useState(false);
	// True between a successful create and the navigation that follows it, so a
	// second click during the pause cannot create a duplicate season.
	const [redirecting, setRedirecting] = useState(false);

	const errors = useMemo(() => validateSeasonForm(values), [values]);
	const canSave = isValid(errors) && !saving && !redirecting;

	const set = useCallback(<K extends keyof SeasonFormValues>(key: K, value: SeasonFormValues[K]) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		setTouched(true);
		setSaved(false);
	}, []);

	const toggleLeague = useCallback(
		(leagueId: string) => {
			set(
				"leagueIds",
				values.leagueIds.includes(leagueId)
					? values.leagueIds.filter((id) => id !== leagueId)
					: [...values.leagueIds, leagueId],
			);
		},
		[values.leagueIds, set],
	);

	/** The slug preview always shows what the server will actually store. */
	const slugPreview = values.slug.trim() || slugify(values.name) || "your-season";

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			// `?counts=teams` gives each league its distinct team count for the picker.
			const leaguesRes = await fetch("/api/leagues?counts=teams");
			if (!leaguesRes.ok) throw new Error("failed");
			const leagueRows = await leaguesRes.json();
			setLeagues(
				(Array.isArray(leagueRows) ? leagueRows : []).map((l: any) => ({
					id: l.id,
					name: l.name,
					teamCount: l.teamCount ?? 0,
				})),
			);

			if (!seasonId) {
				setValues(EMPTY_SEASON_FORM);
				setTouched(false);
				return;
			}

			const res = await fetch(`/api/seasons/${seasonId}`);
			if (res.status === 404) throw new Error("not-found");
			if (!res.ok) throw new Error("failed");

			const season = await res.json();
			const opensAt = toDateTimeLocal(season.registrationOpensAt);
			const closesAt = toDateTimeLocal(season.registrationClosesAt);

			setValues({
				name: season.name ?? "",
				slug: season.slug ?? "",
				description: season.description ?? "",
				leagueIds: (season.leagueSeasons ?? []).map((ls: { leagueId: string }) => ls.leagueId),
				active: Boolean(season.active),
				startDate: toDateInput(season.startDate),
				endDate: toDateInput(season.endDate),
				bracketType: season.bracketType ?? "",
				// The window is "on" only if the season actually has one stored.
				hasRegistrationWindow: Boolean(opensAt || closesAt),
				registrationOpensAt: opensAt,
				registrationClosesAt: closesAt,
			});
			setTouched(false);
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

	const save = useCallback(async () => {
		if (!isValid(validateSeasonForm(values))) {
			setTouched(true);
			return;
		}
		setSaving(true);
		setError("");
		try {
			const res = await fetch(isEdit ? `/api/seasons/${seasonId}` : "/api/seasons", {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(toPayload(values)),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error || "Could not save this season.");

			setSaved(true);
			setTouched(false);

			// After creating, hand the user to the new season's detail page. The
			// brief pause lets the "Season created" confirmation land first.
			if (!isEdit && data?.id) {
				setRedirecting(true);
				setTimeout(() => {
					window.location.href = `/admin/seasons/${data.id}/view`;
				}, CREATED_REDIRECT_MS);
				return;
			}

			await load();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save this season.");
		} finally {
			setSaving(false);
		}
	}, [values, isEdit, seasonId, load]);

	return {
		values,
		set,
		toggleLeague,
		errors,
		touched,
		slugPreview,
		leagues,
		loading,
		saving: saving || redirecting,
		saved,
		error,
		canSave,
		save,
		isEdit,
		status: previewStatus(values),
		statusLocked: isStatusLocked(values),
		range: previewRange(values),
		checklist: checklist(values),
		canCreateLeague: can("leagues:create"),
		refresh: load,
	};
}
