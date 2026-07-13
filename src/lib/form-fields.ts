/**
 * Form-field helpers shared by the admin editors (leagues, seasons…).
 * Pure — no framework, no I/O.
 *
 * These lived in the leagues feature until seasons needed the same three; they
 * are generic, so they belong here rather than being copied a second time.
 */

/** "Women's League" → "women-s-league". Matches the slug the server derives. */
export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

/** The shape a slug must have once given: lowercase words joined by single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** ISO (or Date) → the "YYYY-MM-DDTHH:mm" a `datetime-local` input expects, in local time. */
export function toDateTimeLocal(value: string | Date | null | undefined): string {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO (or Date) → the "YYYY-MM-DD" a `date` input expects, in local time. */
export function toDateInput(value: string | Date | null | undefined): string {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
