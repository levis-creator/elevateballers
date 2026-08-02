import type { SiteSetting } from '../domain/siteSetting';

export type HomeStatRailItem = { label: string; source: string };

export type PublicHomeSettings = {
  pill: string; heading: string; accentWord: string; body: string;
  ctaLabel: string; ctaHref: string; ctaLabel2: string; ctaHref2: string;
  heroMedia: 'Drone video' | 'Court pattern' | 'Still image'; heroVideo: string; heroDim: number; ghostWord: string;
  statRail: boolean; statRailItems: HomeStatRailItem[]; countUp: boolean;
  ticker: boolean; tickerLabel: string; tickerSource: 'Latest headlines' | 'Latest results' | 'Headlines and results'; tickerSpeed: number;
  fixturesBlock: boolean; fixturesHeading: string; resultsHeading: string; fixturesCount: number; emptyFixtures: string;
  potw: boolean;
  newsBlock: boolean; newsEyebrow: string; newsHeading: string; newsCount: number; newsFilters: boolean;
  leadersBlock: boolean; leadersHeading: string; numbersHeading: string; leadersRows: number;
  mediaBlock: boolean; mediaEyebrow: string; mediaHeading: string; mediaCount: number;
  aboutBlock: boolean; aboutEyebrow: string; aboutHeading: string; aboutBody: string;
  ctaBlock: boolean; ctaOpenEyebrow: string; ctaOpenHeading: string; ctaOpenBody: string;
  ctaClosedEyebrow: string; ctaClosedHeading: string; ctaClosedBody: string; ctaClosedLabel: string;
};

export const DEFAULT_PUBLIC_HOME_SETTINGS: PublicHomeSettings = {
  pill: 'Season 2026 · Live now', heading: 'Elevate\nyour game', accentWord: 'game',
  body: 'Nairobi’s own basketball league — born on the city’s courts, built for its players. Live matches, standings, and rising stars from Kenya’s capital, all season long.',
  ctaLabel: 'Register Team', ctaHref: '/register', ctaLabel2: 'View Standings', ctaHref2: '/standings',
  heroMedia: 'Drone video', heroVideo: '/media/general/nairobi-courts-loop.mp4', heroDim: 78, ghostWord: 'Nairobi',
  statRail: true, statRailItems: [
    { label: 'Teams', source: 'Registered teams' }, { label: 'Players', source: 'Registered players' }, { label: 'Matches Played', source: 'Matches marked final' },
  ], countUp: true,
  ticker: true, tickerLabel: 'Elevate News', tickerSource: 'Headlines and results', tickerSpeed: 40,
  fixturesBlock: true, fixturesHeading: 'Upcoming Matches', resultsHeading: 'Recent Results', fixturesCount: 4,
  emptyFixtures: 'No matches scheduled — the next round drops soon.', potw: true,
  newsBlock: true, newsEyebrow: 'From around the league', newsHeading: 'Latest News', newsCount: 6, newsFilters: true,
  leadersBlock: true, leadersHeading: 'League Leaders', numbersHeading: 'By The Numbers', leadersRows: 5,
  mediaBlock: true, mediaEyebrow: 'Visual highlights from across the league', mediaHeading: 'Featured Media', mediaCount: 6,
  aboutBlock: true, aboutEyebrow: 'Welcome to Elevate Ballers', aboutHeading: 'Your home for the game\nwe live for',
  aboutBody: 'The official home of Kenya’s premier basketball league. Follow every game, every team, and every player. Standings update after every match, and the Player of the Week highlights one standout performance.',
  ctaBlock: true, ctaOpenEyebrow: 'Registration Open', ctaOpenHeading: 'Register to\njoin the league',
  ctaOpenBody: 'Be part of Elevate Ballers. Tryouts run throughout the year for late entries — sign up your team or yourself today.',
  ctaClosedEyebrow: 'Registration Closed', ctaClosedHeading: '2026 entries\nare closed',
  ctaClosedBody: 'The season is underway. Tryouts still run year-round for late entries — join the waitlist and we’ll reach out the moment a spot or the 2027 window opens.',
  ctaClosedLabel: 'Join the Waitlist →',
};

const text = (value: string | undefined, fallback: string) => value === undefined ? fallback : value.trim();
const bool = (value: string | undefined, fallback: boolean) => value === 'true' ? true : value === 'false' ? false : fallback;
const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const list = <T>(value: string | undefined, fallback: T[]): T[] => {
  if (!value) return fallback;
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.length ? parsed as T[] : fallback; } catch { return fallback; }
};

export function resolvePublicHomeSettings(settings: SiteSetting[]): PublicHomeSettings {
  const v = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const d = DEFAULT_PUBLIC_HOME_SETTINGS;
  const media = ['Drone video', 'Court pattern', 'Still image'].includes(v.home_heroMedia) ? v.home_heroMedia as PublicHomeSettings['heroMedia'] : d.heroMedia;
  const tickerSource = ['Latest headlines', 'Latest results', 'Headlines and results'].includes(v.home_tickerSource) ? v.home_tickerSource as PublicHomeSettings['tickerSource'] : d.tickerSource;
  return {
    pill: text(v.home_pill, d.pill), heading: text(v.home_heading, d.heading), accentWord: text(v.home_accentWord, d.accentWord), body: text(v.home_body, d.body),
    ctaLabel: text(v.home_ctaLabel, d.ctaLabel), ctaHref: text(v.home_ctaHref, d.ctaHref), ctaLabel2: text(v.home_ctaLabel2, d.ctaLabel2), ctaHref2: text(v.home_ctaHref2, d.ctaHref2),
    heroMedia: media, heroVideo: text(v.home_heroVideo, d.heroVideo), heroDim: integer(v.home_heroDim, d.heroDim, 0, 95), ghostWord: text(v.home_ghostWord, d.ghostWord),
    statRail: bool(v.home_statRail, d.statRail), statRailItems: list<HomeStatRailItem>(v.home_statRailItems, d.statRailItems), countUp: bool(v.home_countUp, d.countUp),
    ticker: bool(v.home_ticker, d.ticker), tickerLabel: text(v.home_tickerLabel, d.tickerLabel), tickerSource, tickerSpeed: integer(v.home_tickerSpeed, d.tickerSpeed, 5, 180),
    fixturesBlock: bool(v.home_fixturesBlock, d.fixturesBlock), fixturesHeading: text(v.home_fixturesHeading, d.fixturesHeading), resultsHeading: text(v.home_resultsHeading, d.resultsHeading), fixturesCount: integer(v.home_fixturesCount, d.fixturesCount, 1, 12), emptyFixtures: text(v.home_emptyFixtures, d.emptyFixtures),
    potw: bool(v.home_potw, d.potw), newsBlock: bool(v.home_newsBlock, d.newsBlock), newsEyebrow: text(v.home_newsEyebrow, d.newsEyebrow), newsHeading: text(v.home_newsHeading, d.newsHeading), newsCount: integer(v.home_newsCount, d.newsCount, 1, 24), newsFilters: bool(v.home_newsFilters, d.newsFilters),
    leadersBlock: bool(v.home_leadersBlock, d.leadersBlock), leadersHeading: text(v.home_leadersHeading, d.leadersHeading), numbersHeading: text(v.home_numbersHeading, d.numbersHeading), leadersRows: integer(v.home_leadersRows, d.leadersRows, 1, 20),
    mediaBlock: bool(v.home_mediaBlock, d.mediaBlock), mediaEyebrow: text(v.home_mediaEyebrow, d.mediaEyebrow), mediaHeading: text(v.home_mediaHeading, d.mediaHeading), mediaCount: integer(v.home_mediaCount, d.mediaCount, 1, 24),
    aboutBlock: bool(v.home_aboutBlock, d.aboutBlock), aboutEyebrow: text(v.home_aboutEyebrow, d.aboutEyebrow), aboutHeading: text(v.home_aboutHeading, d.aboutHeading), aboutBody: text(v.home_aboutBody, d.aboutBody),
    ctaBlock: bool(v.home_ctaBlock, d.ctaBlock), ctaOpenEyebrow: text(v.home_ctaOpenEyebrow, d.ctaOpenEyebrow), ctaOpenHeading: text(v.home_ctaOpenHeading, d.ctaOpenHeading), ctaOpenBody: text(v.home_ctaOpenBody, d.ctaOpenBody),
    ctaClosedEyebrow: text(v.home_ctaClosedEyebrow, d.ctaClosedEyebrow), ctaClosedHeading: text(v.home_ctaClosedHeading, d.ctaClosedHeading), ctaClosedBody: text(v.home_ctaClosedBody, d.ctaClosedBody), ctaClosedLabel: text(v.home_ctaClosedLabel, d.ctaClosedLabel),
  };
}
