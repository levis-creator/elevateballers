/**
 * Reports queries
 * Database read operations for report templates and generations
 */

import { prisma } from '../../../lib/prisma';
import type {
  ReportTemplate,
  ReportType,
  ReportFormat,
} from '@prisma/client';
import type {
  ReportGenerationWithRelations,
  EmailReportWithRelations,
} from '../types';

/**
 * Get all report templates
 */
export async function getAllReportTemplates(): Promise<ReportTemplate[]> {
  return await prisma.reportTemplate.findMany({
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

/**
 * Get report templates by type
 */
export async function getReportTemplatesByType(
  reportType: ReportType
): Promise<ReportTemplate[]> {
  return await prisma.reportTemplate.findMany({
    where: { reportType },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

/**
 * Get report template by ID
 */
export async function getReportTemplate(id: string): Promise<ReportTemplate | null> {
  return await prisma.reportTemplate.findUnique({
    where: { id },
  });
}

/**
 * Get default report template for a type and format
 */
export async function getDefaultReportTemplate(
  reportType: ReportType,
  format: ReportFormat
): Promise<ReportTemplate | null> {
  return await prisma.reportTemplate.findFirst({
    where: {
      reportType,
      format,
      isDefault: true,
    },
  });
}

/**
 * Get report generation by ID
 */
export async function getReportGeneration(id: string): Promise<ReportGenerationWithRelations | null> {
  return await prisma.reportGeneration.findUnique({
    where: { id },
    include: {
      template: true,
      emailReports: true,
    },
  });
}

/**
 * Get report generations with optional filters
 */
export async function getReportGenerations(filters?: {
  reportType?: ReportType;
  status?: string;
  limit?: number;
}): Promise<ReportGenerationWithRelations[]> {
  const where: any = {};
  
  if (filters?.reportType) {
    where.reportType = filters.reportType;
  }
  
  if (filters?.status) {
    where.status = filters.status;
  }

  return await prisma.reportGeneration.findMany({
    where,
    include: {
      template: true,
      emailReports: true,
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit,
  });
}

/**
 * Get email reports for a report generation
 */
export async function getEmailReports(
  reportGenerationId: string
): Promise<EmailReportWithRelations[]> {
  return await prisma.emailReport.findMany({
    where: { reportGenerationId },
    include: {
      reportGeneration: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
