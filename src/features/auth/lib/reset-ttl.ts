/**
 * Password-reset / invite link lifetimes. Read from the environment at RUNTIME
 * (process.env, not import.meta.env) so operators can change them via .env
 * without a rebuild — and shared by the forgot-password API and the "check your
 * email" page so the issued expiry and the displayed expiry can never diverge.
 */
const DEFAULT_RESET_TTL_MINUTES = 60;
const DEFAULT_INVITE_TTL_MINUTES = 1440;

function readTtl(raw: string | undefined, fallback: number): number {
	const parsed = raw ? Number.parseInt(raw, 10) : fallback;
	if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
	return parsed;
}

/** Reset-link lifetime in minutes (env: PASSWORD_RESET_TTL_MINUTES, default 60). */
export function getResetTtlMinutes(): number {
	return readTtl(process.env.PASSWORD_RESET_TTL_MINUTES, DEFAULT_RESET_TTL_MINUTES);
}

/** Invite (welcome set-password) lifetime in minutes (env: INVITE_TTL_MINUTES, default 1440). */
export function getInviteTtlMinutes(): number {
	return readTtl(process.env.INVITE_TTL_MINUTES, DEFAULT_INVITE_TTL_MINUTES);
}

/** Human ("1 hour", "90 minutes") + compact ("1h", "90m") renderings of a minute span. */
export function formatTtl(minutes: number): { human: string; short: string } {
	const wholeHours = minutes % 60 === 0;
	const hours = minutes / 60;
	return {
		human: wholeHours ? `${hours} hour${hours === 1 ? "" : "s"}` : `${minutes} minutes`,
		short: wholeHours ? `${hours}h` : `${minutes}m`,
	};
}
