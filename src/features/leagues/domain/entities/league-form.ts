/**
 * League editor form rules. Pure — no framework, no I/O.
 */

export interface LeagueFormValues {
	name: string;
	slug: string;
	description: string;
	logo: string;
	active: boolean;
	registrationOpen: boolean;
	/** `datetime-local` strings ("2026-07-12T09:00") or "" when unset. */
	registrationOpensAt: string;
	registrationClosesAt: string;
}

export const EMPTY_LEAGUE_FORM: LeagueFormValues = {
	name: "",
	slug: "",
	description: "",
	logo: "",
	active: true,
	registrationOpen: true,
	registrationOpensAt: "",
	registrationClosesAt: "",
};

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export type LeagueFormErrors = Partial<Record<"name" | "slug" | "registrationClosesAt", string>>;

/**
 * Mirrors what the server accepts. The closing-date check is the one rule the
 * API does not enforce, so catching it here stops a league being saved with a
 * registration window that can never open.
 */
export function validateLeagueForm(values: LeagueFormValues): LeagueFormErrors {
	const errors: LeagueFormErrors = {};

	if (!values.name.trim()) {
		errors.name = "League name is required.";
	}

	if (values.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
		errors.slug = "Use lowercase letters, numbers and hyphens only.";
	}

	const opens = values.registrationOpensAt ? new Date(values.registrationOpensAt) : null;
	const closes = values.registrationClosesAt ? new Date(values.registrationClosesAt) : null;
	if (opens && closes && !Number.isNaN(opens.getTime()) && !Number.isNaN(closes.getTime()) && closes <= opens) {
		errors.registrationClosesAt = "The deadline must be after the opening date.";
	}

	return errors;
}

export function isValid(errors: LeagueFormErrors): boolean {
	return Object.keys(errors).length === 0;
}

export interface LeaguePayload {
	name: string;
	slug?: string;
	description?: string;
	logo?: string;
	active: boolean;
	registrationOpen: boolean;
	registrationOpensAt: string | null;
	registrationClosesAt: string | null;
}

/**
 * Blank optional text becomes `undefined` (leave alone), blank dates become
 * `null` (explicitly clear) — the mutation layer distinguishes the two.
 */
export function toPayload(values: LeagueFormValues): LeaguePayload {
	return {
		name: values.name.trim(),
		slug: values.slug.trim() || undefined,
		description: values.description.trim() || undefined,
		logo: values.logo.trim() || undefined,
		active: values.active,
		registrationOpen: values.registrationOpen,
		registrationOpensAt: values.registrationOpensAt || null,
		registrationClosesAt: values.registrationClosesAt || null,
	};
}

/** ISO (or Date) → the "YYYY-MM-DDTHH:mm" a `datetime-local` input expects, in local time. */
export function toDateTimeLocal(value: string | Date | null | undefined): string {
	if (!value) return "";
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";

	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
