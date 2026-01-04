/**
 * CMS feature types
 * Exports Prisma-generated types and custom input types for mutations
 */

import type {
  User,
  NewsArticle,
  Match,
  Player,
  Team,
  Staff,
  TeamStaff,
  Media,
  PageContent,
  SiteSetting,
  Comment,
  League,
  Season,
  UserRole,
  NewsCategory,
  MatchStatus,
  MediaType,
  StaffRole,
  MatchPlayer,
  MatchEvent,
  MatchEventType,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  NewsArticle,
  Match,
  Player,
  Team,
  Staff,
  TeamStaff,
  Media,
  PageContent,
  SiteSetting,
  Comment,
  League,
  Season,
  UserRole,
  NewsCategory,
  MatchStatus,
  MediaType,
  StaffRole,
  MatchPlayer,
  MatchEvent,
  MatchEventType,
};

// Extended types with relations
export type NewsArticleWithAuthor = NewsArticle & {
  author: Pick<User, 'id' | 'name' | 'email'>;
};

export type LeagueWithMatchCount = League & {
  _count: {
    matches: number;
    seasons: number;
  };
};

export type SeasonWithCounts = Season & {
  league: League;
  _count: {
    matches: number;
  };
};

// DTO for API responses that include additional computed fields
export type NewsArticleDTO = NewsArticleWithAuthor & {
  commentsCount: number;
};

export type PlayerWithTeam = Player & {
  team: Team | null;
};

export type TeamWithPlayers = Team & {
  players: Player[];
  staff?: TeamStaffWithStaff[];
};

export type TeamWithPlayerCount = Team & {
  _count: {
    players: number;
  };
};

export type StaffWithTeams = Staff & {
  teams: TeamStaffWithTeam[];
};

export type TeamStaffWithStaff = TeamStaff & {
  staff: Staff;
};

export type TeamStaffWithTeam = TeamStaff & {
  team: Team;
};

export type CommentWithAuthor = Comment & {
  user: Pick<User, 'id' | 'name' | 'email'> | null;
  replies?: CommentWithAuthor[];
};

// Input types for mutations
export type CreateNewsArticleInput = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: NewsCategory;
  image?: string;
  published?: boolean;
  feature?: boolean;
  publishedAt?: Date;
  authorId: string;
};

export type UpdateNewsArticleInput = Partial<Omit<CreateNewsArticleInput, 'authorId'>>;

// Extended types with relations
export type MatchWithTeams = Match & {
  team1: Team | null;
  team2: Team | null;
};

export type MatchWithTeamsAndLeague = Match & {
  team1: Team | null;
  team2: Team | null;
  league: League | null;
};

export type MatchWithTeamsAndLeagueAndSeason = Match & {
  team1: Team | null;
  team2: Team | null;
  league: League | null;
  season: Season | null;
  leagueName: string | null; // Fallback field
};

export type MatchWithFullDetails = Match & {
  team1: Team | null;
  team2: Team | null;
  league: League | null;
  season: Season | null;
  matchPlayers: MatchPlayerWithDetails[];
  events: MatchEventWithDetails[];
};

export type MatchPlayerWithDetails = MatchPlayer & {
  player: Player;
  team: Team;
};

export type MatchEventWithDetails = MatchEvent & {
  player: Player | null;
  assistPlayer: Player | null;
  team: Team;
};

export type CreateMatchInput = {
  // Team relationships (preferred)
  team1Id?: string;
  team2Id?: string;
  // League relationship (preferred)
  leagueId?: string;
  // Season relationship (preferred)
  seasonId?: string;
  // Fallback fields for teams/leagues not in database
  team1Name?: string;
  team1Logo?: string;
  team2Name?: string;
  team2Logo?: string;
  league?: string; // Fallback league name
  date: Date;
  team1Score?: number;
  team2Score?: number;
  status?: MatchStatus;
  stage?: import('@prisma/client').MatchStage;
};

export type UpdateMatchInput = Partial<CreateMatchInput>;

export type CreateLeagueInput = {
  name: string;
  slug?: string; // Optional - will be auto-generated from name if not provided
  description?: string;
  logo?: string;
  active?: boolean;
};

export type UpdateLeagueInput = Partial<CreateLeagueInput>;

export type CreateSeasonInput = {
  name: string;
  slug?: string; // Optional - will be auto-generated from name if not provided
  description?: string;
  startDate: Date;
  endDate: Date;
  leagueId: string; // Required - Season must belong to a League
  active?: boolean;
};

export type UpdateSeasonInput = Partial<CreateSeasonInput>;

export type CreatePlayerInput = {
  firstName?: string;
  lastName?: string;
  height?: string; // Height in feet format (e.g., "6'2\"")
  weight?: string; // Weight in kilograms (e.g., "84 kg")
  image?: string;
  bio?: string;
  teamId?: string;
  position?: string;
  jerseyNumber?: number;
  stats?: Record<string, any>;
};

export type UpdatePlayerInput = Partial<CreatePlayerInput>;

export type CreateTeamInput = {
  name: string;
  slug?: string; // Optional - will be auto-generated from name if not provided
  logo?: string;
  description?: string;
};

export type UpdateTeamInput = Partial<CreateTeamInput>;

export type CreateStaffInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  bio?: string;
  image?: string;
};

export type UpdateStaffInput = Partial<CreateStaffInput>;

export type CreateTeamStaffInput = {
  teamId: string;
  staffId: string;
  role: StaffRole;
};

export type UpdateTeamStaffInput = Partial<Omit<CreateTeamStaffInput, 'teamId' | 'staffId'>>;

export type CreateMediaInput = {
  title: string;
  url: string;
  type: MediaType;
  thumbnail?: string;
  tags?: string[];
};

export type UpdateMediaInput = Partial<CreateMediaInput>;

// Category mapping for frontend (matches existing NewsFilter type)
export const categoryMap: Record<string, NewsCategory> = {
  'Interviews': 'INTERVIEWS',
  'Championships': 'CHAMPIONSHIPS',
  'Match report': 'MATCH_REPORT',
  'Analysis': 'ANALYSIS',
};

export const reverseCategoryMap: Record<NewsCategory, string> = {
  'INTERVIEWS': 'Interviews',
  'CHAMPIONSHIPS': 'Championships',
  'MATCH_REPORT': 'Match report',
  'ANALYSIS': 'Analysis',
};

export type CreatePageContentInput = {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
};

export type UpdatePageContentInput = Partial<Omit<CreatePageContentInput, 'slug'>>;

export type CreateSiteSettingInput = {
  key: string;
  value: string;
  type?: string;
  label: string;
  description?: string;
  category?: string;
};

export type UpdateSiteSettingInput = Partial<Omit<CreateSiteSettingInput, 'key'>>;

export type CreateCommentInput = {
  content: string;
  authorName?: string; // Optional - allows anonymous comments
  authorEmail?: string;
  authorUrl?: string;
  articleId: string;
  userId?: string;
  parentId?: string;
};

export type UpdateCommentInput = {
  content?: string;
  approved?: boolean;
};

// Match Player Input Types
export type CreateMatchPlayerInput = {
  matchId: string;
  playerId: string;
  teamId: string;
  started?: boolean;
  position?: string;
  jerseyNumber?: number;
  minutesPlayed?: number;
};

export type UpdateMatchPlayerInput = Partial<Omit<CreateMatchPlayerInput, 'matchId' | 'playerId' | 'teamId'>>;

// Match Event Input Types
export type CreateMatchEventInput = {
  matchId: string;
  eventType: MatchEventType;
  minute: number;
  teamId: string;
  playerId?: string;
  assistPlayerId?: string;
  description?: string;
  metadata?: Record<string, any>;
};

export type UpdateMatchEventInput = Partial<Omit<CreateMatchEventInput, 'matchId' | 'eventType'>>;
