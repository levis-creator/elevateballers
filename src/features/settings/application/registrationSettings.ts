import type { SiteSetting } from '../domain/siteSetting';

export type RegistrationHeroFact = { big: string; small: string };
export type RegistrationDeadline = { date: string; label: string };
export type RegistrationStep = { title: string; desc: string };

export type PublicRegistrationSettings = {
  eyebrow: string;
  title: string;
  intro: string;
  heroFacts: RegistrationHeroFact[];
  deadlines: RegistrationDeadline[];
  open: boolean;
  opens: string;
  closes: string;
  slots: number;
  fee: number;
  approval: boolean;
  playerMode: boolean;
  stepsHeading: string;
  steps: RegistrationStep[];
  successTitle: string;
  successBody: string;
  closedTitle: string;
  closedBody: string;
};

export const DEFAULT_PUBLIC_REGISTRATION_SETTINGS: PublicRegistrationSettings = {
  eyebrow: 'Season 2026 · Sign-up open',
  title: '2026 League\nRegistration',
  intro: 'Register your team or sign up as a player for the 2026 Elevate Ballers League season. Lock your spot on the Nairobi courts.',
  heroFacts: [
    { big: 'Feb 28', small: 'Registration closes' },
    { big: 'Mar 14', small: 'Season tip-off' },
    { big: '24', small: 'Team slots' },
  ],
  deadlines: [
    { date: 'Jan 20', label: 'Registration opens' },
    { date: 'Feb 28', label: 'Entry deadline' },
    { date: 'Mar 07', label: 'Fixtures released' },
    { date: 'Mar 14', label: 'Season tip-off' },
  ],
  open: true,
  opens: '2026-01-20',
  closes: '2026-02-28',
  slots: 24,
  fee: 25000,
  approval: true,
  playerMode: true,
  stepsHeading: 'How it works',
  steps: [
    { title: 'Submit', desc: 'Complete the team or player form with accurate contact details.' },
    { title: 'Review', desc: 'We verify eligibility and roster within 3 working days.' },
    { title: 'Confirm', desc: 'Pay the season fee and receive your fixtures and slot.' },
  ],
  successTitle: "You're in the queue",
  successBody: 'Thanks — your {mode} registration has been received. Our team reviews entries within 3 working days and will email you the outcome.',
  closedTitle: 'Registration is closed',
  closedBody: 'The 2026 window has closed. Join the waitlist and we’ll reach out the moment a spot or the 2027 window opens.',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (value === undefined) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicRegistrationSettings(settings: SiteSetting[]): PublicRegistrationSettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_REGISTRATION_SETTINGS;
  const legacyOpen = values.registration_showClosed === undefined
    ? undefined
    : values.registration_showClosed === 'true' ? 'false' : 'true';
  const heroFacts = list<RegistrationHeroFact>(values.registration_heroFacts, defaults.heroFacts)
    .map((item) => ({ big: String(item?.big ?? '').trim(), small: String(item?.small ?? '').trim() }))
    .filter((item) => item.big && item.small)
    .slice(0, 6);
  const deadlines = list<RegistrationDeadline>(values.registration_deadlines, defaults.deadlines)
    .map((item) => ({ date: String(item?.date ?? '').trim(), label: String(item?.label ?? '').trim() }))
    .filter((item) => item.date && item.label)
    .slice(0, 8);
  const steps = list<RegistrationStep>(values.registration_steps, defaults.steps)
    .map((item) => ({ title: String(item?.title ?? '').trim(), desc: String(item?.desc ?? '').trim() }))
    .filter((item) => item.title && item.desc)
    .slice(0, 8);
  return {
    eyebrow: text(values.registration_eyebrow, defaults.eyebrow),
    title: text(values.registration_title, defaults.title),
    intro: text(values.registration_intro, defaults.intro),
    heroFacts: heroFacts.length ? heroFacts : defaults.heroFacts,
    deadlines: deadlines.length ? deadlines : defaults.deadlines,
    open: bool(values.registration_open ?? values.registration_form_visible ?? legacyOpen, defaults.open),
    opens: text(values.registration_opens, defaults.opens),
    closes: text(values.registration_closes, defaults.closes),
    slots: integer(values.registration_slots, defaults.slots, 1, 10000),
    fee: integer(values.registration_fee, defaults.fee, 0, 100000000),
    approval: bool(values.registration_approval, defaults.approval),
    playerMode: bool(values.registration_playerMode, defaults.playerMode),
    stepsHeading: text(values.registration_stepsHeading, defaults.stepsHeading),
    steps: steps.length ? steps : defaults.steps,
    successTitle: text(values.registration_successTitle, defaults.successTitle),
    successBody: text(values.registration_successBody, defaults.successBody),
    closedTitle: text(values.registration_closedTitle ?? values.registration_closedLabel, defaults.closedTitle),
    closedBody: text(values.registration_closedBody, defaults.closedBody),
  };
}

const dateBoundary = (value: string, endOfDay: boolean): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+03:00`);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export function registrationWindow(settings: PublicRegistrationSettings, now = new Date()): { open: boolean; reason: 'open' | 'disabled' | 'not-started' | 'closed' } {
  if (!settings.open) return { open: false, reason: 'disabled' };
  const current = now.getTime();
  const opens = dateBoundary(settings.opens, false);
  const closes = dateBoundary(settings.closes, true);
  if (opens !== null && current < opens) return { open: false, reason: 'not-started' };
  if (closes !== null && current > closes) return { open: false, reason: 'closed' };
  return { open: true, reason: 'open' };
}

export const registrationToken = (template: string, mode: 'team' | 'player') => template.replaceAll('{mode}', mode);

export const shortRegistrationDate = (isoDate: string): string => {
  const timestamp = dateBoundary(isoDate, false);
  return timestamp === null ? isoDate : new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', timeZone: 'Africa/Nairobi' }).format(timestamp);
};

export function registrationHeroFacts(settings: PublicRegistrationSettings): RegistrationHeroFact[] {
  return settings.heroFacts.map((fact) => {
    const label = fact.small.toLowerCase();
    if (label.includes('registration closes') || label.includes('entry deadline')) return { ...fact, big: shortRegistrationDate(settings.closes) };
    if (label.includes('team slot')) return { ...fact, big: String(settings.slots) };
    return fact;
  });
}

export function registrationDeadlines(settings: PublicRegistrationSettings): RegistrationDeadline[] {
  return settings.deadlines.map((deadline) => {
    const label = deadline.label.toLowerCase();
    if (label.includes('registration opens')) return { ...deadline, date: shortRegistrationDate(settings.opens) };
    if (label.includes('entry deadline') || label.includes('registration closes')) return { ...deadline, date: shortRegistrationDate(settings.closes) };
    return deadline;
  });
}
