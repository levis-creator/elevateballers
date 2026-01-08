/**
 * Reports feature types
 * Types for report generation, templates, and email functionality
 */

import type {
  ReportTemplate,
  ReportGeneration,
  EmailReport,
  ReportType,
  ReportFormat,
} from '@prisma/client';

// Re-export Prisma types
export type {
  ReportTemplate,
  ReportGeneration,
  EmailReport,
  ReportType,
  ReportFormat,
};

// Extended types with relations
export type ReportTemplateWithGenerations = ReportTemplate & {
  generations: ReportGeneration[];
};

export type ReportGenerationWithRelations = ReportGeneration & {
  template?: ReportTemplate | null;
  emailReports: EmailReport[];
};

export type EmailReportWithRelations = EmailReport & {
  reportGeneration: ReportGeneration;
};

// Input types
export type CreateReportTemplateInput = {
  name: string;
  description?: string;
  reportType: ReportType;
  format?: ReportFormat;
  template: Record<string, any>;
  isDefault?: boolean;
};

export type UpdateReportTemplateInput = Partial<CreateReportTemplateInput>;

export type GenerateReportInput = {
  templateId?: string;
  reportType: ReportType;
  format: ReportFormat;
  parameters: Record<string, any>; // matchId, playerId, teamId, seasonId, etc.
};

export type EmailReportInput = {
  reportGenerationId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
};

// Report data types
export type GameStatisticsReportData = {
  match: any;
  team1Stats: any;
  team2Stats: any;
  playerStats: any[];
};

export type PlayerStatisticsReportData = {
  player: any;
  statistics: any;
  matches: any[];
};

export type TeamStatisticsReportData = {
  team: any;
  statistics: any;
  matches: any[];
};
