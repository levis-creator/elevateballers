/**
 * Season editor form rules. Pure — no framework, no I/O.
 */
import { SLUG_PATTERN, slugify, toDateInput, toDateTimeLocal } from "@/lib/form-fields";
import { type SeasonStatus, seasonStatus } from "./season";

export { slugify, toDateInput, toDateTimeLocal };

/**
 * A conference row on the season form. `id` is present for a conference that
 * already exists in the DB and absent for one the admin just added — the
 * mutation layer uses that distinction to reconcile by id (rename-safe) rather
 * than delete-and-recreate, which would drop team assignments on every rename.
 */
export interface SeasonConferenceInput {
	id?: string;
	name: string;
	/**
	 * Teams to place in this conference. Only meaningful when the season is
	 * linked to exactly one league (the league they get rostered under on save);
	 * left undefined otherwise, so a name-only edit never touches team rosters.
	 */
	teamIds?: string[];
}

export type LeagueSeasonFormStatus =
	| "DRAFT"
	| "REGISTRATION"
	| "SCHEDULED"
	| "ACTIVE"
	| "PLAYOFFS"
	| "COMPLETED";

export interface LeagueSeasonFormValues {
	id?: string;
	leagueId: string;
	leagueName: string;
	enabled: boolean;
	startDate: string;
	endDate: string;
	status: LeagueSeasonFormStatus;
	competitionStructure: "SINGLE_TABLE" | "CONFERENCES";
	bracketType: string;
	hasRegistrationWindow: boolean;
	registrationOpensAt: string;
	registrationClosesAt: string;
	teamIds: string[];
	conferences: SeasonConferenceInput[];
}

export interface SeasonFormValues {
	name: string;
	slug: string;
	description: string;
	/** Leagues this season runs in (many-to-many). May be empty — attach later. */
	leagueIds: string[];
	/** Sub-groups of the season's teams (e.g. East / West). May be empty. */
	conferences: SeasonConferenceInput[];
	active: boolean;
	/** `date` strings ("2026-01-01"). Both are required. */
	startDate: string;
	endDate: string;
	bracketType: string;
	/** Off = the season has no window of its own; the league's applies. */
	hasRegistrationWindow: boolean;
	/** `datetime-local` strings, or "" when unset. */
	registrationOpensAt: string;
	registrationClosesAt: string;
	/** Operational competition editions. Phase 5 authoritative form state. */
	leagueSeasons: LeagueSeasonFormValues[];
}

export const EMPTY_SEASON_FORM: SeasonFormValues = {
	name: "",
	slug: "",
	description: "",
	leagueIds: [],
	conferences: [],
	active: true,
	startDate: "",
	endDate: "",
	bracketType: "",
	hasRegistrationWindow: false,
	registrationOpensAt: "",
	registrationClosesAt: "",
	leagueSeasons: [],
};

/**
 * Only the brackets the tournament engine can actually generate.
 *
 * The mockup also offered "Round robin" and "Group stage + knockout", but
 * nothing in the codebase understands those — saving one would produce a season
 * whose bracket can never be built. They are left out until the engine supports
 * them. See `features/tournaments/domain/usecases/bracket-converter.ts`.
 */
export const BRACKET_TYPES = [
	{ value: "", label: "Not specified" },
	{ value: "single", label: "Single elimination" },
	{ value: "double", label: "Double elimination" },
] as const;

export type SeasonFormErrors = Partial<
	Record<
		| "name"
		| "slug"
		| "startDate"
		| "endDate"
		| "registrationClosesAt"
		| "conferences"
		| "leagueSeasons",
		string
	>
>;

export function validateSeasonForm(values: SeasonFormValues): SeasonFormErrors {
	const errors: SeasonFormErrors = {};
	const enabledCompetitions = values.leagueSeasons.filter((row) => row.enabled);

	if (!values.name.trim()) errors.name = "Season name is required.";

	if (values.slug && !SLUG_PATTERN.test(values.slug)) {
		errors.slug = "Use lowercase letters, numbers and hyphens only.";
	}

	if (!enabledCompetitions.length && !values.startDate) errors.startDate = "A start date is required.";
	if (!enabledCompetitions.length && !values.endDate) errors.endDate = "An end date is required.";

	// A season that ends before it starts would render as Completed the moment it
	// is saved, and its progress bar would be meaningless.
	const start = values.startDate ? new Date(values.startDate) : null;
	const end = values.endDate ? new Date(values.endDate) : null;
	if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
		errors.endDate = "The end date must be on or after the start date.";
	}

	if (values.hasRegistrationWindow) {
		const opens = values.registrationOpensAt ? new Date(values.registrationOpensAt) : null;
		const closes = values.registrationClosesAt ? new Date(values.registrationClosesAt) : null;
		if (opens && closes && !Number.isNaN(opens.getTime()) && !Number.isNaN(closes.getTime()) && closes <= opens) {
			errors.registrationClosesAt = "The deadline must be after the opening date.";
		}
	}

	// Conferences are optional, but any row that exists must have a non-blank,
	// case-insensitively unique name (mirrors the DB's @@unique([seasonId, name])).
	const conferenceError = validateConferences(values.conferences);
	if (conferenceError) errors.conferences = conferenceError;

	for (const competition of values.leagueSeasons.filter((row) => row.enabled)) {
		if (!competition.startDate || !competition.endDate) {
			errors.leagueSeasons = `${competition.leagueName} needs start and end dates.`;
			break;
		}
		if (new Date(competition.endDate) < new Date(competition.startDate)) {
			errors.leagueSeasons = `${competition.leagueName} must end on or after it starts.`;
			break;
		}
		if (
			competition.hasRegistrationWindow &&
			competition.registrationOpensAt &&
			competition.registrationClosesAt &&
			new Date(competition.registrationClosesAt) <=
				new Date(competition.registrationOpensAt)
		) {
			errors.leagueSeasons = `${competition.leagueName}'s registration deadline must follow its opening.`;
			break;
		}
		if (
			competition.competitionStructure === "CONFERENCES" &&
			competition.conferences.length === 0
		) {
			errors.leagueSeasons = `${competition.leagueName} needs at least one conference.`;
			break;
		}
		const nestedConferenceError = validateConferences(competition.conferences);
		if (nestedConferenceError) {
			errors.leagueSeasons = `${competition.leagueName}: ${nestedConferenceError}`;
			break;
		}
		const assigned = competition.conferences.flatMap((conference) => conference.teamIds ?? []);
		if (new Set(assigned).size !== assigned.length) {
			errors.leagueSeasons = `${competition.leagueName} has a team assigned to more than one conference.`;
			break;
		}
		if (
			competition.competitionStructure === "CONFERENCES" &&
			competition.teamIds.some((teamId) => !assigned.includes(teamId))
		) {
			errors.leagueSeasons = `${competition.leagueName} has participating teams without a conference.`;
			break;
		}
	}

	return errors;
}

/**
 * Returns the group-level error message for a conference list, or `null` when
 * the list is valid. Blank rows are the admin mid-edit; duplicate names would
 * violate the DB unique index, so both are caught before save.
 */
function validateConferences(conferences: SeasonConferenceInput[]): string | null {
	const seen = new Set<string>();
	for (const conference of conferences) {
		const name = conference.name.trim();
		if (!name) return "Every conference needs a name.";
		const key = name.toLowerCase();
		if (seen.has(key)) return "Conference names must be unique.";
		seen.add(key);
	}
	return null;
}

export function isValid(errors: SeasonFormErrors): boolean {
	return Object.keys(errors).length === 0;
}

export interface SeasonPayload {
	name: string;
	slug?: string;
	description?: string;
	leagueIds: string[];
	conferences: { id?: string; name: string; teamIds?: string[] }[];
	active: boolean;
	startDate: string;
	endDate: string;
	bracketType?: string;
	registrationOpensAt: string | null;
	registrationClosesAt: string | null;
	leagueSeasons?: {
		id?: string;
		leagueId: string;
		startDate: string;
		endDate: string;
		status: LeagueSeasonFormStatus;
		competitionStructure: "SINGLE_TABLE" | "CONFERENCES";
		bracketType?: string;
		registrationOpensAt: string | null;
		registrationClosesAt: string | null;
		teamIds: string[];
		conferences: { id?: string; name: string; teamIds?: string[] }[];
	}[];
}

/**
 * Blank optional text becomes `undefined` (leave alone); dates become `null`
 * (explicitly clear) — the mutation layer distinguishes the two. Turning the
 * registration window off clears both timestamps rather than leaving stale ones.
 */
export function toPayload(values: SeasonFormValues): SeasonPayload {
	const enabledCompetitions = values.leagueSeasons.filter((row) => row.enabled);
	const payload: SeasonPayload = {
		name: values.name.trim(),
		slug: values.slug.trim() || undefined,
		description: values.description.trim() || undefined,
		leagueIds: values.leagueIds,
		// Trim names and drop blank rows; keep `id` so the server can reconcile
		// renames against existing conferences instead of recreating them.
		// `teamIds` rides along only when set, so a name-only edit stays name-only.
		conferences: values.conferences
			.map((conference) => ({
				id: conference.id,
				name: conference.name.trim(),
				...(conference.teamIds !== undefined ? { teamIds: conference.teamIds } : {}),
			}))
			.filter((conference) => conference.name.length > 0),
		active: values.active,
		startDate: values.startDate,
		endDate: values.endDate,
		bracketType: values.bracketType || undefined,
		registrationOpensAt: values.hasRegistrationWindow ? values.registrationOpensAt || null : null,
		registrationClosesAt: values.hasRegistrationWindow ? values.registrationClosesAt || null : null,
	};
	if (enabledCompetitions.length) {
		const starts = enabledCompetitions.map((row) => row.startDate).filter(Boolean).sort();
		const ends = enabledCompetitions.map((row) => row.endDate).filter(Boolean).sort();
		payload.leagueIds = enabledCompetitions.map((row) => row.leagueId);
		if (starts.length) payload.startDate = starts[0];
		if (ends.length) payload.endDate = ends[ends.length - 1];
		payload.active = enabledCompetitions.some((row) => row.status !== "COMPLETED");
		payload.leagueSeasons = enabledCompetitions.map((row) => ({
			id: row.id,
			leagueId: row.leagueId,
			startDate: row.startDate,
			endDate: row.endDate,
			status: row.status,
			competitionStructure: row.competitionStructure,
			bracketType: row.bracketType || undefined,
			registrationOpensAt: row.hasRegistrationWindow
				? row.registrationOpensAt || null
				: null,
			registrationClosesAt: row.hasRegistrationWindow
				? row.registrationClosesAt || null
				: null,
			teamIds: row.teamIds,
			conferences:
				row.competitionStructure === "CONFERENCES"
					? row.conferences.map((conference) => ({
							id: conference.id,
							name: conference.name.trim(),
							teamIds: conference.teamIds ?? [],
						}))
					: [],
		}));
	}
	return payload;
}

/**
 * The status the season will read as once saved. There is no status column —
 * the dates decide the lifecycle and `active` is the "mark completed" override —
 * so the form previews the same rule the seasons board renders.
 */
export function previewStatus(values: SeasonFormValues, now: Date = new Date()): SeasonStatus {
	const enabled = values.leagueSeasons.filter((competition) => competition.enabled);
	const starts = enabled.map((competition) => competition.startDate).filter(Boolean).sort();
	const ends = enabled.map((competition) => competition.endDate).filter(Boolean).sort();
	return seasonStatus(
		{
			// An unset date must not read as "1970"; fall back to a wide-open window
			// so a half-filled form previews as Live rather than Completed.
			startDate: starts[0] || values.startDate || "0000-01-01",
			endDate: ends[ends.length - 1] || values.endDate || "9999-12-31",
			active: enabled.length
				? enabled.some((competition) => competition.status !== "COMPLETED")
				: values.active,
		},
		now,
	);
}

/** "Upcoming" is settled by the start date, so it is never a choice the admin makes. */
export function isStatusLocked(values: SeasonFormValues, now: Date = new Date()): boolean {
	return previewStatus(values, now) === "Upcoming";
}

export interface ChecklistItem {
	label: string;
	done: boolean;
}

/** The "Before you save" rail. Linking a league is encouraged, not required. */
export function checklist(values: SeasonFormValues): ChecklistItem[] {
	const enabledCompetitions = values.leagueSeasons.filter((competition) => competition.enabled);
	return [
		{ label: "Season name", done: Boolean(values.name.trim()) },
		{
			label: "Competition dates",
			done: enabledCompetitions.length
				? enabledCompetitions.every((competition) => competition.startDate && competition.endDate)
				: Boolean(values.startDate && values.endDate),
		},
		{
			label: "At least one league linked",
			done:
				values.leagueSeasons.some((competition) => competition.enabled) ||
				values.leagueIds.length > 0,
		},
	];
}

const RANGE_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

function pretty(value: string): string | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-US", RANGE_FORMAT);
}

/** The preview card's date line, tolerant of a half-filled form. */
export function previewRange(values: SeasonFormValues): string {
	const enabled = values.leagueSeasons.filter((competition) => competition.enabled);
	const starts = enabled.map((competition) => competition.startDate).filter(Boolean).sort();
	const ends = enabled.map((competition) => competition.endDate).filter(Boolean).sort();
	const start = pretty(starts[0] || values.startDate);
	const end = pretty(ends[ends.length - 1] || values.endDate);
	if (start && end) return `${start} – ${end}`;
	if (start) return `From ${start}`;
	if (end) return `Until ${end}`;
	return "Dates not set";
}
