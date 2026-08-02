import type { SiteSetting } from '../domain/siteSetting';
import type { PublicContactSettings } from './contactSettings';

export type ContactQuickCard = { icon: string; label: string; value: string; action: string; href: string };
export type ContactTopic = { topic: string; desk: string };
export type PublicContactPageSettings = {
  eyebrow: string; title: string; intro: string; quickCards: boolean; quickCardList: ContactQuickCard[];
  form: boolean; formTitle: string; formBlurb: string; topics: ContactTopic[]; teamField: boolean; requirePhone: boolean;
  submitLabel: string; successMsg: string; autoReply: string; visitCard: boolean; visitHeading: string;
  socialCard: boolean; map: boolean; departments: boolean; departmentsEyebrow: string; departmentsHeading: string;
};

export const DEFAULT_PUBLIC_CONTACT_PAGE_SETTINGS: PublicContactPageSettings = {
  eyebrow: 'Get in Touch', title: 'Contacts', intro: 'Questions about fixtures, registration, transfers, or officiating? Reach the right desk below, or send us a message and we’ll get back to you.',
  quickCards: true, quickCardList: [
    { icon: '✆', label: 'Call us', value: '{phone}', action: 'Call now', href: 'tel:+254703913923' },
    { icon: '✉', label: 'Email', value: '{email}', action: 'Send email', href: 'mailto:ballers@elevateballers.com' },
    { icon: '⌂', label: 'Visit', value: '{address}', action: 'Get directions', href: '' },
  ],
  form: true, formTitle: 'Send a message', formBlurb: 'Fill in the form and the right team will get back to you, usually {response}.',
  topics: [{ topic: 'General enquiry', desk: 'General' }, { topic: 'Team registration', desk: 'Registration' }, { topic: 'Player transfer', desk: 'Transfers' }, { topic: 'Fixtures & scheduling', desk: 'Fixtures & Results' }, { topic: 'Officiating & protests', desk: 'Officiating' }, { topic: 'Media & partnerships', desk: 'Media & Partnerships' }],
  teamField: true, requirePhone: false, submitLabel: 'Send Message', successMsg: 'Message received. We’ll be in touch {response}.',
  autoReply: 'Thanks — we’ve got your message and will come back to you {response}.', visitCard: true, visitHeading: 'Visit Us', socialCard: true, map: true,
  departments: true, departmentsEyebrow: 'Reach the Right Desk', departmentsHeading: 'Departments',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const list = <T>(value: string | undefined, fallback: T[]): T[] => { if (value === undefined) return fallback; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; } catch { return fallback; } };

export function resolvePublicContactPageSettings(settings: SiteSetting[]): PublicContactPageSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value])); const d = DEFAULT_PUBLIC_CONTACT_PAGE_SETTINGS;
  return {
    eyebrow: text(v.contactPage_eyebrow, d.eyebrow), title: text(v.contactPage_title, d.title), intro: text(v.contactPage_intro, d.intro),
    quickCards: bool(v.contactPage_quickCards, d.quickCards), quickCardList: list(v.contactPage_quickCardList, d.quickCardList),
    form: bool(v.contactPage_form, d.form), formTitle: text(v.contactPage_formTitle, d.formTitle), formBlurb: text(v.contactPage_formBlurb, d.formBlurb), topics: list(v.contactPage_topics, d.topics),
    teamField: bool(v.contactPage_teamField, d.teamField), requirePhone: bool(v.contactPage_requirePhone, d.requirePhone), submitLabel: text(v.contactPage_submitLabel, d.submitLabel),
    successMsg: text(v.contactPage_successMsg, d.successMsg), autoReply: text(v.contactPage_autoReply, d.autoReply), visitCard: bool(v.contactPage_visitCard, d.visitCard),
    visitHeading: text(v.contactPage_visitHeading, d.visitHeading), socialCard: bool(v.contactPage_socialCard, d.socialCard), map: bool(v.contactPage_map, d.map),
    departments: bool(v.contactPage_departments, d.departments), departmentsEyebrow: text(v.contactPage_departmentsEyebrow, d.departmentsEyebrow), departmentsHeading: text(v.contactPage_departmentsHeading, d.departmentsHeading),
  };
}

export const replaceContactTokens = (value: string, contact: PublicContactSettings) => value
  .replaceAll('{phone}', contact.phones).replaceAll('{email}', contact.email).replaceAll('{address}', contact.address).replaceAll('{response}', contact.responseTarget);
