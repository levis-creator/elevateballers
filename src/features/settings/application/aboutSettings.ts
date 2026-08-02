import type { SiteSetting } from '../domain/siteSetting';

export type AboutFigure = { value: string; label: string; accent: string };
export type AboutLeagueCard = { abbr: string; title: string; body: string; teams: string; players: string };
export type AboutValue = { num: string; title: string; body: string };
export type AboutItem = { title: string; body: string };
export type AboutMilestone = { year: string; title: string; body: string };
export type AboutButton = { label: string; path: string };

export type PublicAboutSettings = {
  eyebrow: string; title: string; accentWord: string; intro: string;
  statStrip: boolean; stats: AboutFigure[];
  storyBlock: boolean; storyEyebrow: string; storyHeading: string; storyImage: string; storyBody: string;
  leaguesBlock: boolean; leaguesEyebrow: string; leaguesHeading: string; leagueCards: AboutLeagueCard[];
  valuesBlock: boolean; valuesEyebrow: string; valuesHeading: string; values: AboutValue[];
  impactBlock: boolean; impactEyebrow: string; impactHeading: string; impactBody: string; impactStats: AboutFigure[]; impactItems: AboutItem[];
  partnerBlock: boolean; partnerEyebrow: string; partnerHeading: string; partnerBody: string; partnerCta: string;
  timeline: boolean; timelineEyebrow: string; timelineHeading: string; milestones: AboutMilestone[];
  staffGrid: boolean; staffEyebrow: string; staffHeading: string; staffBody: string; staffCta: string;
  venueBlock: boolean; venueEyebrow: string; venueHeading: string; venueBody: string; venueImage: string;
  ctaBlock: boolean; ctaHeading: string; ctaBody: string; ctaButtons: AboutButton[];
};

export const DEFAULT_PUBLIC_ABOUT_SETTINGS: PublicAboutSettings = {
  eyebrow: 'About the Club', title: 'Built for the\nlove of the game', accentWord: 'game',
  intro: 'Elevate Ballers is Kenya’s home for competitive basketball — a community league in Nairobi where clubs, players, and fans come together every week to compete, grow, and celebrate the game.',
  statStrip: true, stats: [
    { value: '24', label: 'Teams', accent: 'yes' }, { value: '370+', label: 'Players', accent: 'no' }, { value: '2', label: 'Leagues', accent: 'no' }, { value: '2024', label: 'Founded', accent: 'yes' },
  ],
  storyBlock: true, storyEyebrow: 'Our Story', storyHeading: 'From a weekend\nrun to a league', storyImage: '',
  storyBody: "What started as a handful of friends looking for organised, competitive hoops has grown into one of Nairobi's most active basketball communities. Elevate Ballers was founded to give players a real stage — proper fixtures, standings that matter, and the structure to turn casual runs into a genuine season.\n\nToday the league runs two competitions side by side — the Elevate Basketball League (EBL) and the Elevate Women's Basketball League (EWBL) — bringing together school teams, academies, corporate sides, and community teams from across the city.\n\nEvery week, standings update after each game, a Player of the Week is crowned, and the next generation of Kenyan talent gets the reps, the competition, and the spotlight they deserve.",
  leaguesBlock: true, leaguesEyebrow: 'Two Leagues, One Community', leaguesHeading: 'Where everyone plays', leagueCards: [
    { abbr: 'EBL', title: "Men's League", body: "The Elevate Basketball League brings together the city's top men's teams, academies, and community sides in weekly competitive play.", teams: '16', players: '240+' },
    { abbr: 'EWBL', title: "Women's League", body: "The Elevate Women's Basketball League gives women's teams a dedicated, competitive stage — from school programs to established teams.", teams: '8', players: '130+' },
  ],
  valuesBlock: true, valuesEyebrow: 'What We Stand For', valuesHeading: 'Our values', values: [
    { num: '01', title: 'Community', body: 'It starts with belonging — a welcoming home in Nairobi for players, families, and fans of every level.' },
    { num: '02', title: 'Development', body: 'From that community we build players — competition, coaching, and reps that turn raw potential into real growth.' },
    { num: '03', title: 'Excellence', body: 'Real fixtures, real standings, real stakes — a relentless commitment to raising the standard of Kenyan basketball.' },
    { num: '04', title: 'Integrity', body: 'Clear rules, consistent officiating, and respect on and off the court — earned every single game.' },
  ],
  impactBlock: true, impactEyebrow: 'More Than a League', impactHeading: 'Community impact', impactBody: 'Basketball is the reason we gather, but the impact runs deeper. Elevate Ballers exists to open doors — giving young players across Nairobi a safe, structured, and inspiring place to grow, on and off the court.',
  impactStats: [{ value: '1,200+', label: 'Youth reached', accent: 'yes' }, { value: '18', label: 'Partner schools', accent: 'no' }, { value: '100%', label: 'Free to attend', accent: 'no' }, { value: '3', label: 'Courts refurbished', accent: 'yes' }],
  impactItems: [
    { title: 'Youth Clinics', body: 'Free weekend skills clinics run by our coaches and players, bringing structured training to neighbourhoods that rarely get it.' },
    { title: 'Girls in the Game', body: 'The EWBL and our schools program create a dedicated pathway for young women to compete, lead, and be seen on a real stage.' },
    { title: 'Courts for the City', body: 'We partner with local groups to refurbish public courts — leaving every community we play in with a better place to hoop.' },
  ],
  partnerBlock: true, partnerEyebrow: 'Partner With Us', partnerHeading: 'Grow the game together', partnerBody: 'Brands, schools, and community organisations power what we do. If you want to reach Nairobi’s basketball community and invest in the game, let’s talk.', partnerCta: 'Become a Partner →',
  timeline: true, timelineEyebrow: 'The Journey', timelineHeading: 'How we got here', milestones: [
    { year: '2024', title: 'The First Tip-Off', body: 'Elevate Ballers launches with a handful of clubs and a shared love of the game.' },
    { year: '2025', title: "The Women's League Arrives", body: 'The EWBL is founded, opening a dedicated stage for women’s basketball.' },
    { year: '2025', title: 'Standings Go Live', body: 'Weekly standings, Player of the Week, and league stats become part of every matchday.' },
    { year: '2026', title: 'A Growing Community', body: 'Two leagues, 24 clubs, and 370+ players competing across Nairobi.' },
  ],
  staffGrid: true, staffEyebrow: 'The People', staffHeading: 'Leadership', staffBody: 'Meet the directors, operations leads, officials, and volunteers who run Elevate Ballers every match day — from tip-off to final buzzer.', staffCta: 'Meet the Team →',
  venueBlock: true, venueEyebrow: 'Home Court', venueHeading: 'Come support\nlocal talent', venueBody: 'Come support local talent and be part of the community. Our home base sits off Dagoretti Road in Nairobi, with fixtures across the city each weekend.', venueImage: '',
  ctaBlock: true, ctaHeading: 'Be part of it', ctaBody: 'Register a team, join as a player, or just come support. There’s a place for everyone at Elevate Ballers.', ctaButtons: [{ label: 'Register →', path: '/#register' }, { label: 'Browse Teams', path: '/teams' }],
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (!value) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.length ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicAboutSettings(settings: SiteSetting[]): PublicAboutSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const d = DEFAULT_PUBLIC_ABOUT_SETTINGS;
  return {
    eyebrow: text(v.about_eyebrow, d.eyebrow), title: text(v.about_title, d.title), accentWord: text(v.about_accentWord, d.accentWord), intro: text(v.about_intro, d.intro),
    statStrip: bool(v.about_statStrip, d.statStrip), stats: list(v.about_stats, d.stats),
    storyBlock: bool(v.about_storyBlock, d.storyBlock), storyEyebrow: text(v.about_storyEyebrow, d.storyEyebrow), storyHeading: text(v.about_storyHeading, d.storyHeading), storyImage: text(v.about_storyImage, d.storyImage), storyBody: text(v.about_storyBody, d.storyBody),
    leaguesBlock: bool(v.about_leaguesBlock, d.leaguesBlock), leaguesEyebrow: text(v.about_leaguesEyebrow, d.leaguesEyebrow), leaguesHeading: text(v.about_leaguesHeading, d.leaguesHeading), leagueCards: list(v.about_leagueCards, d.leagueCards),
    valuesBlock: bool(v.about_valuesBlock, d.valuesBlock), valuesEyebrow: text(v.about_valuesEyebrow, d.valuesEyebrow), valuesHeading: text(v.about_valuesHeading, d.valuesHeading), values: list(v.about_values, d.values),
    impactBlock: bool(v.about_impactBlock, d.impactBlock), impactEyebrow: text(v.about_impactEyebrow, d.impactEyebrow), impactHeading: text(v.about_impactHeading, d.impactHeading), impactBody: text(v.about_impactBody, d.impactBody), impactStats: list(v.about_impactStats, d.impactStats), impactItems: list(v.about_impactItems, d.impactItems),
    partnerBlock: bool(v.about_partnerBlock, d.partnerBlock), partnerEyebrow: text(v.about_partnerEyebrow, d.partnerEyebrow), partnerHeading: text(v.about_partnerHeading, d.partnerHeading), partnerBody: text(v.about_partnerBody, d.partnerBody), partnerCta: text(v.about_partnerCta, d.partnerCta),
    timeline: bool(v.about_timeline, d.timeline), timelineEyebrow: text(v.about_timelineEyebrow, d.timelineEyebrow), timelineHeading: text(v.about_timelineHeading, d.timelineHeading), milestones: list(v.about_milestones, d.milestones),
    staffGrid: bool(v.about_staffGrid, d.staffGrid), staffEyebrow: text(v.about_staffEyebrow, d.staffEyebrow), staffHeading: text(v.about_staffHeading, d.staffHeading), staffBody: text(v.about_staffBody, d.staffBody), staffCta: text(v.about_staffCta, d.staffCta),
    venueBlock: bool(v.about_venueBlock, d.venueBlock), venueEyebrow: text(v.about_venueEyebrow, d.venueEyebrow), venueHeading: text(v.about_venueHeading, d.venueHeading), venueBody: text(v.about_venueBody, d.venueBody), venueImage: text(v.about_venueImage, d.venueImage),
    ctaBlock: bool(v.about_ctaBlock, d.ctaBlock), ctaHeading: text(v.about_ctaHeading, d.ctaHeading), ctaBody: text(v.about_ctaBody, d.ctaBody), ctaButtons: list(v.about_ctaButtons, d.ctaButtons),
  };
}
