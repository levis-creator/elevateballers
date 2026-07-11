/**
 * Single source of truth for admin password rules. Pure + framework-free so it
 * can back the reset form's validation, its live strength meter, and be unit
 * tested in isolation. Mirrors the rules the original reset form enforced.
 */
export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRequirement {
	label: string;
	ok: boolean;
}

/** The four checklist items shown under the password field. */
export function passwordRequirements(pw: string): PasswordRequirement[] {
	return [
		{ label: `${MIN_PASSWORD_LENGTH}+ characters`, ok: pw.length >= MIN_PASSWORD_LENGTH },
		{ label: "Upper & lower", ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw) },
		{ label: "A number", ok: /\d/.test(pw) },
		{ label: "A symbol", ok: /[^A-Za-z0-9]/.test(pw) },
	];
}

/** 0–4 strength score = number of satisfied requirements. */
export function passwordScore(pw: string): number {
	if (!pw) return 0;
	return passwordRequirements(pw).filter((r) => r.ok).length;
}

/**
 * Validate a candidate password. Returns an error message, or null when valid.
 * Keeps the exact rules (and messages) the legacy reset form used so behaviour
 * is unchanged — only the presentation is redesigned.
 */
export function validateNewPassword(pw: string): string | null {
	if (pw.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
	if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
	if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
	if (!/\d/.test(pw)) return "Password must contain at least one number.";
	if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain at least one special character.";
	return null;
}
