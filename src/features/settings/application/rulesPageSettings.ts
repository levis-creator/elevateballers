import type { SiteSetting } from '../domain/siteSetting';
import { RULES_DEFAULTS, type QuickRefItem, type RuleItem } from '@/features/rules/lib/rules-content';

export type RulesSectionSetting = { title: string; id: string };
export type RulesClauseSetting = RuleItem & { section: string };
export type PublicRulesPageSettings = {
  eyebrow: string; title: string; intro: string; pdf: string; pdfLabel: string;
  quickRef: boolean; quickRefCards: QuickRefItem[];
  sections: RulesSectionSetting[]; clauseTags: boolean; clauses: RulesClauseSetting[];
  contents: boolean; contentsHeading: string; helpCard: boolean; helpHeading: string;
  helpBody: string; helpLinkLabel: string; helpLinkPath: string;
};

const defaultSections = RULES_DEFAULTS.sections.map(({ title, id }) => ({ title, id }));
const defaultClauses = RULES_DEFAULTS.sections.flatMap((section) => section.rules.map((rule) => ({ section: section.id, ...rule })));
export const DEFAULT_PUBLIC_RULES_PAGE_SETTINGS: PublicRulesPageSettings = {
  eyebrow: 'Official Rules & Regulations · 2026', title: 'Rules',
  intro: 'The official rules and regulations governing Elevate Ballers play. Valid as of 1 January 2026, based on FIBA Official Basketball Rules 2024 with league-specific amendments.',
  pdf: '/documents/elevate-ballers-league-rules-2026.pdf', pdfLabel: '↓ Download Full Rulebook',
  quickRef: true, quickRefCards: RULES_DEFAULTS.quickRef, sections: defaultSections, clauseTags: true, clauses: defaultClauses,
  contents: true, contentsHeading: 'On this page', helpCard: true, helpHeading: 'Questions?',
  helpBody: 'Reach the competitions desk for clarifications.', helpLinkLabel: 'Contact us →', helpLinkPath: '/contacts',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (value === undefined) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicRulesPageSettings(settings: SiteSetting[]): PublicRulesPageSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value])); const d = DEFAULT_PUBLIC_RULES_PAGE_SETTINGS;
  return {
    eyebrow: text(v.rules_eyebrow, d.eyebrow), title: text(v.rules_title ?? v.rules_page_title, d.title), intro: text(v.rules_intro ?? v.rules_page_intro ?? v.rules_body, d.intro),
    pdf: text(v.rules_pdf ?? v.rules_pdf_url, d.pdf), pdfLabel: text(v.rules_pdfLabel ?? v.rules_download_label, d.pdfLabel),
    quickRef: bool(v.rules_quickRef, d.quickRef), quickRefCards: list(v.rules_quickRefCards, d.quickRefCards), sections: list(v.rules_sections, d.sections),
    clauseTags: bool(v.rules_clauseTags, d.clauseTags), clauses: list(v.rules_clauses, d.clauses), contents: bool(v.rules_contents, d.contents),
    contentsHeading: text(v.rules_contentsHeading, d.contentsHeading), helpCard: bool(v.rules_helpCard, d.helpCard), helpHeading: text(v.rules_helpHeading, d.helpHeading),
    helpBody: text(v.rules_helpBody, d.helpBody), helpLinkLabel: text(v.rules_helpLinkLabel, d.helpLinkLabel), helpLinkPath: text(v.rules_helpLinkPath, d.helpLinkPath),
  };
}

export function publicRulesSections(settings: PublicRulesPageSettings) {
  return settings.sections.map((section, index) => ({
    id: section.id.trim() || `section-${index + 1}`, no: String(index + 1).padStart(2, '0'), title: section.title,
    rules: settings.clauses.filter((clause) => clause.section === section.id),
  }));
}
