# Reports Feature

Comprehensive reporting system for generating PDF/CSV reports, email reports, and MaxPreps integration.

## Overview

The reports feature provides:
- Report template management
- PDF and CSV report generation
- Email report delivery
- MaxPreps integration for syncing match data

## Architecture

```
src/features/reports/
├── lib/
│   ├── queries.ts          # Database read operations
│   ├── mutations.ts        # Database write operations
│   ├── reportGenerator.ts  # Main report generation service
│   ├── csvGenerator.ts     # CSV generation utilities
│   ├── pdfGenerator.ts     # PDF generation utilities (placeholder)
│   ├── reportTemplates.ts  # Default report templates
│   ├── emailService.ts     # Email sending service (placeholder)
│   └── maxpreps.ts         # MaxPreps integration (placeholder)
├── components/
│   ├── ReportGenerator.tsx
│   └── ReportTemplateSelector.tsx
├── types.ts                # TypeScript type definitions
└── README.md               # This file
```

## Database Models

### ReportTemplate
Report template definitions:
- Report type (GAME_STATISTICS, PLAYER_STATISTICS, etc.)
- Format (PDF, CSV)
- Template configuration (JSON)
- Default template flag

### ReportGeneration
Report generation history:
- Template reference
- Report type and format
- File name, path, URL
- Generation parameters
- Status (PENDING, COMPLETED, FAILED)

### EmailReport
Email report tracking:
- Recipient information
- Status (PENDING, SENT, FAILED)
- Sent timestamp
- Error messages

## Report Types

- GAME_STATISTICS - Full game statistics
- KEY_GAME_STATISTICS - Key game statistics (coach report)
- PLAYER_STATISTICS - Player statistics (by game, season)
- TEAM_STATISTICS - Team statistics (by game, season)
- PLAY_BY_PLAY - Play-by-play report
- SHOT_CHART - Shot chart report
- TURNOVER_TYPES - Turnover types report
- FOUL_TYPES - Foul types report

## API Routes

- `GET /api/reports/templates` - Get report templates
- `POST /api/reports/generate` - Generate report
- `POST /api/reports/email` - Email report
- `GET /api/reports/[id]/download` - Download generated report
- `POST /api/integrations/maxpreps/sync` - Sync to MaxPreps

## Notes

- PDF generation is currently a placeholder - integrate with pdfkit, @react-pdf/renderer, or puppeteer for production
- Email service is a placeholder - integrate with SendGrid, AWS SES, Resend, or Nodemailer for production
- MaxPreps integration is a placeholder - requires MaxPreps API credentials and implementation
