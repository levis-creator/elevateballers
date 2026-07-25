import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/features/rbac/usePermissions";
import {
	type SeasonFormValues,
	type LeagueSeasonFormValues,
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

export interface FormTeam {
	id: string;
	name: string;
	logo: string | null;
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
	const [teams, setTeams] = useState<FormTeam[]>([]);
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

	const addConference = useCallback(
		(name: string, teamIds?: string[]) => {
			set("conferences", [...values.conferences, { name, ...(teamIds !== undefined ? { teamIds } : {}) }]);
		},
		[values.conferences, set],
	);

	const updateConference = useCallback(
		(index: number, name: string, teamIds?: string[]) => {
			set(
				"conferences",
				values.conferences.map((conference, i) =>
					i === index ? { ...conference, name, ...(teamIds !== undefined ? { teamIds } : {}) } : conference,
				),
			);
		},
		[values.conferences, set],
	);

	const removeConference = useCallback(
		(index: number) => {
			set(
				"conferences",
				values.conferences.filter((_, i) => i !== index),
			);
		},
		[values.conferences, set],
	);

	const updateLeagueSeason = useCallback(
		(leagueId: string, patch: Partial<LeagueSeasonFormValues>) => {
			setValues((prev) => {
				const leagueSeasons = prev.leagueSeasons.map((row) =>
					row.leagueId === leagueId ? { ...row, ...patch } : row,
				);
				return {
					...prev,
					leagueSeasons,
					leagueIds: leagueSeasons.filter((row) => row.enabled).map((row) => row.leagueId),
				};
			});
			setTouched(true);
			setSaved(false);
		},
		[],
	);

	const addLeagueConference = useCallback(
		(leagueId: string, name: string, teamIds: string[] = []) => {
			setValues((prev) => ({
				...prev,
				leagueSeasons: prev.leagueSeasons.map((row) =>
					row.leagueId === leagueId
						? {
								...row,
								teamIds: [...new Set([...row.teamIds, ...teamIds])],
								conferences: [...row.conferences, { name, teamIds }],
							}
						: row,
				),
			}));
			setTouched(true);
			setSaved(false);
		},
		[],
	);

	const updateLeagueConference = useCallback(
		(leagueId: string, index: number, name: string, teamIds: string[] = []) => {
			setValues((prev) => ({
				...prev,
				leagueSeasons: prev.leagueSeasons.map((row) =>
					row.leagueId === leagueId
						? {
								...row,
								teamIds: [...new Set([...row.teamIds, ...teamIds])],
								conferences: row.conferences.map((conference, i) =>
									i === index ? { ...conference, name, teamIds } : conference,
								),
							}
						: row,
				),
			}));
			setTouched(true);
			setSaved(false);
		},
		[],
	);

	const removeLeagueConference = useCallback(
		(leagueId: string, index: number) => {
			setValues((prev) => ({
				...prev,
				leagueSeasons: prev.leagueSeasons.map((row) =>
					row.leagueId === leagueId
						? { ...row, conferences: row.conferences.filter((_, i) => i !== index) }
						: row,
				),
			}));
			setTouched(true);
			setSaved(false);
		},
		[],
	);

	/** The slug preview always shows what the server will actually store. */
	const slugPreview = values.slug.trim() || slugify(values.name) || "your-season";

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			// `?counts=teams` gives each league its distinct team count for the picker.
			// Teams are fetched in parallel — they're the pool for the conference modal
			// (a team isn't tied to a league until it's rostered under one).
			const [leaguesRes, teamsRes] = await Promise.all([
				fetch("/api/leagues?counts=teams"),
				fetch("/api/teams"),
			]);
			if (!leaguesRes.ok) throw new Error("failed");
			const leagueRows = await leaguesRes.json();
			const availableLeagues: FormLeague[] = (Array.isArray(leagueRows) ? leagueRows : []).map((l: any) => ({
					id: l.id,
					name: l.name,
					teamCount: l.teamCount ?? 0,
				}));
			setLeagues(availableLeagues);

			const teamRows = teamsRes.ok ? await teamsRes.json() : [];
			setTeams(
				(Array.isArray(teamRows) ? teamRows : []).map((t: any) => ({
					id: t.id,
					name: t.name,
					logo: t.logo ?? null,
				})),
			);

			if (!seasonId) {
				setValues({
					...EMPTY_SEASON_FORM,
					leagueSeasons: availableLeagues.map((league) => ({
						leagueId: league.id,
						leagueName: league.name,
						enabled: false,
						startDate: "",
						endDate: "",
						status: "DRAFT",
						competitionStructure: "SINGLE_TABLE",
						bracketType: "",
						hasRegistrationWindow: false,
						registrationOpensAt: "",
						registrationClosesAt: "",
						teamIds: [],
						conferences: [],
					})),
				});
				setTouched(false);
				return;
			}

			const res = await fetch(`/api/seasons/${seasonId}`);
			if (res.status === 404) throw new Error("not-found");
			if (!res.ok) throw new Error("failed");

			const season = await res.json();
			const opensAt = toDateTimeLocal(season.registrationOpensAt);
			const closesAt = toDateTimeLocal(season.registrationClosesAt);

			const storedLeagueSeasons = season.leagueSeasons ?? [];
			const leagueSeasons: LeagueSeasonFormValues[] = availableLeagues.map((league) => {
				const row = storedLeagueSeasons.find((candidate: any) => candidate.leagueId === league.id);
				const rowOpensAt = toDateTimeLocal(row?.registrationOpensAt);
				const rowClosesAt = toDateTimeLocal(row?.registrationClosesAt);
				return {
					id: row?.id ?? undefined,
					leagueId: league.id,
					leagueName: league.name,
					enabled: Boolean(row),
					startDate: toDateInput(row?.startDate ?? season.startDate),
					endDate: toDateInput(row?.endDate ?? season.endDate),
					status: row?.status ?? "DRAFT",
					competitionStructure:
						row?.competitionStructure ??
						(row?.conferences?.length ? "CONFERENCES" : "SINGLE_TABLE"),
					bracketType: row?.bracketType ?? "",
					hasRegistrationWindow: Boolean(rowOpensAt || rowClosesAt),
					registrationOpensAt: rowOpensAt,
					registrationClosesAt: rowClosesAt,
					teamIds: (row?.seasonTeams ?? []).map((team: any) => team.teamId),
					conferences: (row?.conferences ?? []).map((conference: any) => ({
						id: conference.id,
						name: conference.name,
						teamIds: (conference.seasonTeams ?? []).map((team: any) => team.teamId),
					})),
				};
			});

			setValues({
				name: season.name ?? "",
				slug: season.slug ?? "",
				description: season.description ?? "",
				leagueIds: (season.leagueSeasons ?? []).map((ls: { leagueId: string }) => ls.leagueId),
				conferences: (season.conferences ?? []).map(
					(c: { id: string; name: string; seasonTeams?: { teamId: string }[] }) => ({
						id: c.id,
						name: c.name,
						// Prefill membership so an edit doesn't wipe existing team assignments.
						teamIds: (c.seasonTeams ?? []).map((st) => st.teamId),
					}),
				),
				active: Boolean(season.active),
				startDate: toDateInput(season.startDate),
				endDate: toDateInput(season.endDate),
				bracketType: season.bracketType ?? "",
				// The window is "on" only if the season actually has one stored.
				hasRegistrationWindow: Boolean(opensAt || closesAt),
				registrationOpensAt: opensAt,
				registrationClosesAt: closesAt,
				leagueSeasons,
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
		addConference,
		updateConference,
		removeConference,
		updateLeagueSeason,
		addLeagueConference,
		updateLeagueConference,
		removeLeagueConference,
		errors,
		touched,
		slugPreview,
		leagues,
		teams,
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
