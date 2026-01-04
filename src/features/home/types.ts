/**
 * Home feature types
 */

export interface Match {
  id: string;
  team1: {
    name: string;
    logo: string;
    logoAlt?: string;
  };
  team2: {
    name: string;
    logo: string;
    logoAlt?: string;
  };
  date: string;
  league: string;
  eventUrl: string;
}

export interface PlayerOfTheWeek {
  name: string;
  image: string;
  imageAlt?: string;
  description: string;
  signature?: string;
}

export interface Stat {
  id: string;
  value: number;
  label: string;
  icon: string;
  iconAlt?: string;
}

export interface PostSlide {
  id: string;
  image: string;
  category: string;
  title: string;
  excerpt: string;
  url: string;
  shareUrl?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  image: string;
  excerpt?: string;
  url: string;
  commentsCount: number;
  format?: 'standard' | 'video';
  feature?: boolean;
}

export type NewsFilter = 'All' | 'Interviews' | 'Championships' | 'Match report' | 'Analysis';

export interface TickerItem {
  id: number;
  title: string;
  date: string;
  url: string;
}
