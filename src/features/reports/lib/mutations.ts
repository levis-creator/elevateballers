/**
 * Reports mutations
 * Database write operations for report templates and generations
 */

import { prisma } from '../../../lib/prisma';
import type {
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
  GenerateReportInput,
  EmailReportInput,
  ReportTemplate,
  ReportGeneration,
  EmailReport,
} from '../types';

/**
 * Create report template
 */
export async function createReportTemplate(
  data: CreateReportTemplateInput
): Promise<ReportTemplate> {
  return await prisma.reportTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      reportType: data.reportType,
      format: data.format || 'PDF',
      template: data.template,
      isDefault: data.isDefault || false,
    },
  });
}

/**
 * Update report template
 */
export async function updateReportTemplate(
  id: string,
  data: UpdateReportTemplateInput
): Promise<ReportTemplate | null> {
  try {
    return await prisma.reportTemplate.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating report template:', error);
    return null;
  }
}

/**
 * Delete report template
 */
export async function deleteReportTemplate(id: string): Promise<boolean> {
  try {
    await prisma.reportTemplate.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting report template:', error);
    return false;
  }
}

/**
 * Create report generation record
 */
export async function createReportGeneration(
  data: GenerateReportInput & {
    fileName: string;
    filePath?: string;
    fileUrl?: string;
    generatedBy?: string;
    status?: string;
  }
): Promise<ReportGeneration> {
  return await prisma.reportGeneration.create({
    data: {
      templateId: data.templateId,
      reportType: data.reportType,
      format: data.format,
      fileName: data.fileName,
      filePath: data.filePath,
      fileUrl: data.fileUrl,
      parameters: data.parameters,
      generatedBy: data.generatedBy,
      status: data.status || 'PENDING',
    },
  });
}

/**
 * Update report generation status
 */
export async function updateReportGeneration(
  id: string,
  data: {
    status?: string;
    filePath?: string;
    fileUrl?: string;
    errorMessage?: string;
  }
): Promise<ReportGeneration | null> {
  try {
    return await prisma.reportGeneration.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating report generation:', error);
    return null;
  }
}

/**
 * Create email report record
 */
export async function createEmailReport(data: EmailReportInput): Promise<EmailReport> {
  return await prisma.emailReport.create({
    data: {
      reportGenerationId: data.reportGenerationId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject: data.subject,
      status: 'PENDING',
    },
  });
}

/**
 * Update email report status
 */
export async function updateEmailReport(
  id: string,
  data: {
    status?: string;
    sentAt?: Date;
    errorMessage?: string;
  }
): Promise<EmailReport | null> {
  try {
    return await prisma.emailReport.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating email report:', error);
    return null;
  }
}
