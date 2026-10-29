import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PUBLIC_BRAND_SETTINGS } from '../../../settings/application/brandSettings';
import {
  STAT_SHEET_FONT_FILES,
  buildStatSheetTheme,
  renderStatSheetPdf,
  type MatchStatSheetData,
  type PlayerStatRow,
  type TeamTotalsRow,
} from './statSheetPdf';

const fontDir = join(process.cwd(), 'src/assets/fonts/stat-sheet');
const font = async (file: string) => new Uint8Array(await readFile(join(fontDir, file)));

async function fonts() {
  const b = DEFAULT_PUBLIC_BRAND_SETTINGS;
  return {
    display: await font(STAT_SHEET_FONT_FILES.display[b.display]),
    body: await font(STAT_SHEET_FONT_FILES.body[b.body][0]),
    bodyBold: await font(STAT_SHEET_FONT_FILES.body[b.body][1]),
    label: await font(STAT_SHEET_FONT_FILES.label[b.label][0]),
    labelBold: await font(STAT_SHEET_FONT_FILES.label[b.label][1]),
  };
}

const totals = (team: string, points: number): TeamTotalsRow => ({
  team, points, minutes: '200',
  fieldGoals: '30/70', fieldGoalPercentage: '42.9%',
  threePointers: '8/24', threePointPercentage: '33.3%',
  freeThrows: '12/16', freeThrowPercentage: '75.0%',
  rebounds: 40, assists: 18, steals: 7, blocks: 4, turnovers: 12, fouls: 17,
});

const player = (team: string, i: number): PlayerStatRow => ({
  team, player: `Player ${i}`, jerseyNumber: String(i), starterLabel: i < 5 ? 'Starter' : 'Bench', minutes: '17',
  points: 8, fieldGoals: '3/7', threePointers: '1/3', freeThrows: '1/2',
  rebounds: 4, assists: 2, steals: 1, blocks: 0, turnovers: 1, fouls: 2,
});

const data = (over: Partial<MatchStatSheetData> = {}): MatchStatSheetData => ({
  fileName: 'x.pdf', matchTitle: 'Home Side vs Away Side', playedOn: 'Sat, Oct 25, 2026',
  leagueName: 'League', seasonName: '2026', resultLabel: 'Home Side won by 4',
  team1Name: 'Home Side', team2Name: 'Away Side', team1Score: 80, team2Score: 76, manualScore: false,
  team1Totals: totals('Home Side', 80), team2Totals: totals('Away Side', 76),
  team1Rows: Array.from({ length: 12 }, (_, i) => player('Home Side', i)),
  team2Rows: Array.from({ length: 12 }, (_, i) => player('Away Side', i)),
  ...over,
});

describe('renderStatSheetPdf', () => {
  const theme = buildStatSheetTheme(DEFAULT_PUBLIC_BRAND_SETTINGS);

  it('renders a full box score across pages', async () => {
    const bytes = await renderStatSheetPdf(data(), theme, await fonts());
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
    expect(doc.getTitle()).toContain('Home Side vs Away Side');
  });

  it('embeds a PNG logo and ignores a file that is not an image', async () => {
    const logo = new Uint8Array(await readFile(join(process.cwd(), 'public/logo/Elevate_Logo.png')));
    const withLogo = await renderStatSheetPdf(data(), theme, await fonts(), logo);
    const without = await renderStatSheetPdf(data(), theme, await fonts(), new Uint8Array([1, 2, 3, 4]));
    expect(withLogo.length).toBeGreaterThan(without.length);
  });

  it('leaves out turned-off sections', async () => {
    const full = await PDFDocument.load(await renderStatSheetPdf(data(), theme, await fonts()));
    const headerOnly = await PDFDocument.load(
      await renderStatSheetPdf(data(), theme, await fonts(), null, {
        comparison: false, shooting: false, boxScores: false, minutes: false, watermark: false, footerNote: 'Official result',
      }),
    );
    expect(full.getPageCount()).toBeGreaterThan(1);
    expect(headerOnly.getPageCount()).toBe(1);
  });

  it('renders a single result page for a manually entered score', async () => {
    const bytes = await renderStatSheetPdf(data({ manualScore: true }), theme, await fonts());
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});

describe('buildStatSheetTheme', () => {
  it('takes the brand colour from settings', () => {
    const theme = buildStatSheetTheme({ ...DEFAULT_PUBLIC_BRAND_SETTINGS, brand: '#00ff00' });
    expect(theme.brand).toMatchObject({ red: 0, green: 1, blue: 0 });
  });
});
