/**
 * Game Tracking feature types
 * Types for game state, rules, and tracking functionality
 */

import type {
  Match,
  GameRules,
  GameState,
  MatchPeriod,
  Timeout,
  Substitution,
  MatchEvent,
  Team,
  Player,
  GameTrackingMode,
  TimeoutType,
  JumpBall,
} from '@prisma/client';

// Re-export Prisma types
export type {
  GameRules,
  GameState,
  MatchPeriod,
  Timeout,
  Substitution,
  GameTrackingMode,
  TimeoutType,
};

// Extended types with relations
export type GameRulesWithRelations = GameRules;

export type GameStateWithMatch = GameState & {
  match: Match;
};

export type MatchPeriodWithMatch = MatchPeriod & {
  match: Match;
};

export type TimeoutWithRelations = Timeout & {
  match: Match;
  team: Team;
};

export type SubstitutionWithRelations = Substitution & {
  match: Match;
  team: Team;
  playerIn: Player;
  playerOut: Player;
};

export type MatchWithGameState = Match & {
  gameRules?: GameRules | null;
  periods: MatchPeriod[];
  timeouts: Timeout[];
  substitutions: Substitution[];
};

// Game state types
export type GameClockState = {
  clockSeconds: number | null;
  clockRunning: boolean;
  period: number;
};

export type GameScoreState = {
  team1Score: number;
  team2Score: number;
  team1Fouls: number;
  team2Fouls: number;
  team1Timeouts: number;
  team2Timeouts: number;
};

export type GameStateData = GameClockState &
  GameScoreState & {
    possessionTeamId: string | null;
    matchId: string;
  };

// Input types for mutations
export type CreateGameRulesInput = {
  name: string;
  description?: string;
  numberOfPeriods?: number;
  minutesPerPeriod?: number;
  overtimeLength?: number;
  halftimePeriod?: number;
  halftimeDurationMinutes?: number;
  timeouts60Second?: number;
  timeouts30Second?: number;
  timeoutsPerOvertime?: number;
  resetTimeoutsPerPeriod?: boolean;
  foulsForBonus?: number;
  foulsForDoubleBonus?: number;
  enableThreePointShots?: boolean;
  foulsToFoulOut?: number;
  displayGameClock?: boolean;
  trackTurnoverTypes?: boolean;
  trackFoulTypes?: boolean;
  trackPlayingTime?: boolean;
  recordShotLocations?: boolean;
};

export type UpdateGameRulesInput = Partial<CreateGameRulesInput>;

export type UpdateGameStateInput = {
  clockSeconds?: number | null;
  clockRunning?: boolean;
  currentPeriod?: number;
  team1Score?: number;
  team2Score?: number;
  team1Fouls?: number;
  team2Fouls?: number;
  team1Timeouts?: number;
  team2Timeouts?: number;
  possessionTeamId?: string | null;
};

export type CreateTimeoutInput = {
  matchId: string;
  teamId: string;
  period: number;
  timeoutType: TimeoutType;
  secondsRemaining?: number | null;
};

export type CreateSubstitutionInput = {
  matchId: string;
  teamId: string;
  playerInId: string;
  playerOutId: string;
  period: number;
  secondsRemaining?: number | null;
};

export type CreateMatchPeriodInput = {
  matchId: string;
  periodNumber: number;
  startTime: Date;
  team1Score?: number;
  team2Score?: number;
  team1Fouls?: number;
  team2Fouls?: number;
};

export type UpdateMatchPeriodInput = {
  endTime?: Date | null;
  team1Score?: number;
  team2Score?: number;
  team1Fouls?: number;
  team2Fouls?: number;
};

// Play-by-play types
export type PlayByPlayEvent = MatchEvent & {
  player?: Player | null;
  assistPlayer?: Player | null;
  team: Team;
};

export type PlayByPlayData = {
  events: PlayByPlayEvent[];
  periods: MatchPeriod[];
};

export type JumpBallWithRelations = JumpBall & {
  match: Match;
  player1: Player;
  player2: Player;
  possessionTeam: Team | null;
};

export type CreateJumpBallInput = {
  matchId: string;
  period: number;
  player1Id: string;
  player2Id: string;
  possessionTeamId?: string | null;
  secondsRemaining?: number | null;
};
