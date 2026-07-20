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
	Record<"name" | "slug" | "startDate" | "endDate" | "registrationClosesAt" | "conferences", string>
>;

export function validateSeasonForm(values: SeasonFormValues): SeasonFormErrors {
	const errors: SeasonFormErrors = {};

	if (!values.name.trim()) errors.name = "Season name is required.";

	if (values.slug && !SLUG_PATTERN.test(values.slug)) {
		errors.slug = "Use lowercase letters, numbers and hyphens only.";
	}

	if (!values.startDate) errors.startDate = "A start date is required.";
	if (!values.endDate) errors.endDate = "An end date is required.";

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
}

/**
 * Blank optional text becomes `undefined` (leave alone); dates become `null`
 * (explicitly clear) — the mutation layer distinguishes the two. Turning the
 * registration window off clears both timestamps rather than leaving stale ones.
 */
export function toPayload(values: SeasonFormValues): SeasonPayload {
	return {
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
}

/**
 * The status the season will read as once saved. There is no status column —
 * the dates decide the lifecycle and `active` is the "mark completed" override —
 * so the form previews the same rule the seasons board renders.
 */
export function previewStatus(values: SeasonFormValues, now: Date = new Date()): SeasonStatus {
	return seasonStatus(
		{
			// An unset date must not read as "1970"; fall back to a wide-open window
			// so a half-filled form previews as Live rather than Completed.
			startDate: values.startDate || "0000-01-01",
			endDate: values.endDate || "9999-12-31",
			active: values.active,
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
	return [
		{ label: "Season name", done: Boolean(values.name.trim()) },
		{ label: "Start and end dates", done: Boolean(values.startDate && values.endDate) },
		{ label: "At least one league linked", done: values.leagueIds.length > 0 },
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
	const start = pretty(values.startDate);
	const end = pretty(values.endDate);
	if (start && end) return `${start} – ${end}`;
	if (start) return `From ${start}`;
	if (end) return `Until ${end}`;
	return "Dates not set";
}
