/**
 * Report Templates
 * Default report template configurations
 */

import type { ReportType, ReportFormat, CreateReportTemplateInput } from '../types';

/**
 * Default report templates configuration
 */
export const DEFAULT_TEMPLATES: Omit<CreateReportTemplateInput, 'name' | 'description'>[] = [
  {
    reportType: 'GAME_STATISTICS',
    format: 'PDF',
    template: {
      sections: ['matchInfo', 'teamStats', 'playerStats'],
      includeHeaders: true,
      includeFooters: true,
    },
    isDefault: true,
  },
  {
    reportType: 'GAME_STATISTICS',
    format: 'CSV',
    template: {
      includeHeaders: true,
      flatten: true,
    },
    isDefault: true,
  },
  {
    reportType: 'PLAYER_STATISTICS',
    format: 'PDF',
    template: {
      sections: ['playerInfo', 'statisticsSummary', 'matchByMatch'],
    },
    isDefault: true,
  },
  {
    reportType: 'PLAYER_STATISTICS',
    format: 'CSV',
    template: {
      includeHeaders: true,
    },
    isDefault: true,
  },
  {
    reportType: 'PLAY_BY_PLAY',
    format: 'CSV',
    template: {
      columns: ['period', 'time', 'event', 'player', 'team', 'description'],
    },
    isDefault: true,
  },
];

/**
 * Initialize default report templates
 */
export async function initializeDefaultTemplates() {
  const { prisma } = await import('../../../lib/prisma');
  
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await prisma.reportTemplate.findFirst({
      where: {
        reportType: template.reportType,
        format: template.format,
        isDefault: true,
      },
    });

    if (!existing) {
      await prisma.reportTemplate.create({
        data: {
          name: `${template.reportType} - ${template.format} (Default)`,
          description: `Default template for ${template.reportType} reports in ${template.format} format`,
          reportType: template.reportType,
          format: template.format,
          template: template.template,
          isDefault: true,
        },
      });
    }
  }
}
