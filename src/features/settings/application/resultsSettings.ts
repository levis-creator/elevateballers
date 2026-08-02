import type { SiteSetting } from '../domain/siteSetting';

export type ResultsGroupBy = 'Date' | 'Round' | 'Team';
export type PublicResultsSettings = {
  eyebrow: string; title: string; perPage: number; groupBy: ResultsGroupBy;
  boxLink: boolean; winnerHighlight: boolean; leadersStrip: boolean;
  emptyTitle: string; emptyBody: string; emptyBodyFiltered: string;
};

export const DEFAULT_PUBLIC_RESULTS_SETTINGS: PublicResultsSettings = {
  eyebrow: 'Final Scores · Season {season}', title: 'Results', perPage: 20, groupBy: 'Date',
  boxLink: true, winnerHighlight: true, leadersStrip: true,
  emptyTitle: 'No results yet', emptyBody: 'Completed matches will appear here once games have been played this season.',
  emptyBodyFiltered: 'No {league} results recorded yet for this season.',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};

export function resolvePublicResultsSettings(settings: SiteSetting[]): PublicResultsSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value])); const d = DEFAULT_PUBLIC_RESULTS_SETTINGS;
  const groupBy = ['Date', 'Round', 'Team'].includes(v.results_groupBy) ? v.results_groupBy as ResultsGroupBy : d.groupBy;
  return {
    eyebrow: text(v.results_eyebrow, d.eyebrow), title: text(v.results_title, d.title), perPage: integer(v.results_perPage, d.perPage, 1, 100), groupBy,
    boxLink: bool(v.results_boxLink, d.boxLink), winnerHighlight: bool(v.results_winnerHighlight, d.winnerHighlight), leadersStrip: bool(v.results_leadersStrip, d.leadersStrip),
    emptyTitle: text(v.results_emptyTitle, d.emptyTitle), emptyBody: text(v.results_emptyBody ?? v.results_empty, d.emptyBody), emptyBodyFiltered: text(v.results_emptyBodyFiltered, d.emptyBodyFiltered),
  };
}

export const resultsToken = (template: string, value: string) => template.replaceAll('{season}', value).replaceAll('{league}', value);
