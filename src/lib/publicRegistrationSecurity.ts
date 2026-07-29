import { createHash } from 'node:crypto';
import { checkRateLimit } from './rateLimit';

export const PUBLIC_REGISTRATION_LIMITS = {
  teamName: 120,
  personName: 120,
  email: 254,
  phone: 32,
  position: 40,
  measurement: 40,
  additionalInfo: 2_000,
  id: 80,
} as const;

export type PublicRegistrationKind = 'team' | 'player';

export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

export function normalizePhone(value: unknown): string {
  return normalizeText(value).replace(/[\s()\-]/g, '');
}

export function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

export function normalizeId(value: unknown): string | undefined {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

export function isHoneypotTriggered(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

export function getIdempotencyKey(request: Request, body: Record<string, unknown>): string | null {
  const key = normalizeText(request.headers.get('idempotency-key') ?? body.idempotencyKey);
  return key && key.length <= 128 ? key : null;
}

function tooLong(value: string | undefined, limit: number): boolean {
  return Boolean(value && value.length > limit);
}

export function validateTeamRegistration(data: {
  name: string;
  coachName: string;
  contactEmail: string;
  contactPhone: string;
  additionalInfo?: string;
  leagueId?: string;
  seasonId?: string;
  leagueSeasonId?: string;
}): string | null {
  if (!data.name || !data.coachName || !data.contactEmail || !data.contactPhone) {
    return 'Team name, coach name, contact email, and contact phone are required';
  }
  if (!/^\S+@\S+\.\S+$/.test(data.contactEmail)) return 'Enter a valid contact email';
  if (!/^\+?[0-9]{7,15}$/.test(data.contactPhone)) return 'Enter a valid contact phone';
  if (tooLong(data.name, PUBLIC_REGISTRATION_LIMITS.teamName) || tooLong(data.coachName, PUBLIC_REGISTRATION_LIMITS.personName) || tooLong(data.contactEmail, PUBLIC_REGISTRATION_LIMITS.email) || tooLong(data.contactPhone, PUBLIC_REGISTRATION_LIMITS.phone) || tooLong(data.additionalInfo, PUBLIC_REGISTRATION_LIMITS.additionalInfo)) return 'One or more fields exceed the allowed length';
  if (data.seasonId && !data.leagueSeasonId) return 'Please select a competition edition';
  for (const id of [data.leagueId, data.seasonId, data.leagueSeasonId]) if (id && id.length > PUBLIC_REGISTRATION_LIMITS.id) return 'Invalid registration selection';
  return null;
}

export function validatePlayerRegistration(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  jerseyNumber?: number;
  height?: string;
  weight?: string;
  teamName?: string;
  additionalInfo?: string;
}): string | null {
  if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.position) {
    return 'First name, last name, email, phone, and position are required';
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return 'Enter a valid email';
  if (!/^\+?[0-9]{7,15}$/.test(data.phone)) return 'Enter a valid phone';
  if (data.jerseyNumber !== undefined && (!Number.isInteger(data.jerseyNumber) || data.jerseyNumber < 0 || data.jerseyNumber > 99)) return 'Jersey number must be between 0 and 99';
  if (tooLong(data.firstName, PUBLIC_REGISTRATION_LIMITS.personName) || tooLong(data.lastName, PUBLIC_REGISTRATION_LIMITS.personName) || tooLong(data.email, PUBLIC_REGISTRATION_LIMITS.email) || tooLong(data.phone, PUBLIC_REGISTRATION_LIMITS.phone) || tooLong(data.position, PUBLIC_REGISTRATION_LIMITS.position) || tooLong(data.height, PUBLIC_REGISTRATION_LIMITS.measurement) || tooLong(data.weight, PUBLIC_REGISTRATION_LIMITS.measurement) || tooLong(data.teamName, PUBLIC_REGISTRATION_LIMITS.teamName) || tooLong(data.additionalInfo, PUBLIC_REGISTRATION_LIMITS.additionalInfo)) return 'One or more fields exceed the allowed length';
  return null;
}

function emailKey(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 24);
}

export async function allowPublicRegistration(kind: PublicRegistrationKind, ip: string, email: string): Promise<boolean> {
  const prefix = `public-registration:${kind}`;
  const ipAllowed = await checkRateLimit(`${prefix}:ip:${ip || 'unknown'}`, 5, 60 * 60 * 1000);
  if (!ipAllowed) return false;
  return checkRateLimit(`${prefix}:email:${emailKey(email)}`, 3, 24 * 60 * 60 * 1000);
}

export function genericRegistrationResponse(status = 400): Response {
  return new Response(JSON.stringify({ error: 'We could not process this registration. Please check your details and try again later.' }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
