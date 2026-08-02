import type { SiteSetting } from '../domain/siteSetting';

export type TeamSquadLayout = 'Card grid' | 'Table';
export type TeamSquadStat = 'Points per game' | 'Jersey number' | 'Position' | 'None';

export type PublicTeamPageSettings = {
  leagueLine: boolean; coachLine: boolean; crest: boolean; heroStats: boolean;
  aboutBlock: boolean; aboutEyebrow: string; aboutFallback: string;
  recentHeading: string; upcomingHeading: string; matchRows: number; seasonPicker: boolean;
  squadHeading: string; squadLayout: TeamSquadLayout; positionFilter: boolean; squadStat: TeamSquadStat; staffHeading: string;
};

export const DEFAULT_PUBLIC_TEAM_PAGE_SETTINGS: PublicTeamPageSettings = {
  leagueLine: true, coachLine: true, crest: true, heroStats: true,
  aboutBlock: true, aboutEyebrow: 'About the Team',
  aboutFallback: '{team} compete in the Elevate Ballers League. Squad, results and stats for the current season are below.',
  recentHeading: 'Recent Matches', upcomingHeading: 'Upcoming Matches', matchRows: 5, seasonPicker: true,
  squadHeading: 'Squad', squadLayout: 'Card grid', positionFilter: true, squadStat: 'Points per game', staffHeading: 'Coaching Staff',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.round(parsed))) : fallback; };
const choice = <T extends string>(value: string | undefined, values: readonly T[], fallback: T): T => values.includes(value as T) ? value as T : fallback;

export function resolvePublicTeamPageSettings(settings: SiteSetting[]): PublicTeamPageSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const d = DEFAULT_PUBLIC_TEAM_PAGE_SETTINGS;
  return {
    leagueLine: bool(v.team_leagueLine, d.leagueLine), coachLine: bool(v.team_coachLine, d.coachLine), crest: bool(v.team_crest, d.crest), heroStats: bool(v.team_heroStats, d.heroStats),
    aboutBlock: bool(v.team_aboutBlock, d.aboutBlock), aboutEyebrow: text(v.team_aboutEyebrow, d.aboutEyebrow), aboutFallback: text(v.team_aboutFallback, d.aboutFallback),
    recentHeading: text(v.team_recentHeading, d.recentHeading), upcomingHeading: text(v.team_upcomingHeading, d.upcomingHeading), matchRows: integer(v.team_matchRows, d.matchRows), seasonPicker: bool(v.team_seasonPicker, d.seasonPicker),
    squadHeading: text(v.team_squadHeading, d.squadHeading), squadLayout: choice(v.team_squadLayout, ['Card grid', 'Table'] as const, d.squadLayout), positionFilter: bool(v.team_positionFilter, d.positionFilter), squadStat: choice(v.team_squadStat, ['Points per game', 'Jersey number', 'Position', 'None'] as const, d.squadStat), staffHeading: text(v.team_staffHeading, d.staffHeading),
  };
}

export const teamPageToken = (template: string, team: string) => template.replaceAll('{team}', team);
