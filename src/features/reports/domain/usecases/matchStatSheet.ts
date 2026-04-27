import { getMatchWithFullDetails } from '../../../cms/lib/queries';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';
import { calculatePlayerMatchStats, type PlayerMatchStatistics } from '../../../player/lib/playerStats';

type PlayerStatRow = {
  team: string;
  player: string;
  jerseyNumber: string;
  starterLabel: string;
  points: number;
  fieldGoals: string;
  threePointers: string;
  freeThrows: string;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
};

type TeamTotalsRow = {
  team: string;
  points: number;
  fieldGoals: string;
  fieldGoalPercentage: string;
  threePointers: string;
  threePointPercentage: string;
  freeThrows: string;
  freeThrowPercentage: string;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
};

type MatchStatSheetData = {
  fileName: string;
  matchTitle: string;
  playedOn: string;
  leagueName: string;
  seasonName: string;
  resultLabel: string;
  team1Name: string;
  team2Name: string;
  team1Initials: string;
  team2Initials: string;
  team1Score: number;
  team2Score: number;
  team1Totals: TeamTotalsRow;
  team2Totals: TeamTotalsRow;
  team1Rows: PlayerStatRow[];
  team2Rows: PlayerStatRow[];
};

type Page = {
  commands: string[];
};

// A4 Portrait (595 × 842 pt)
const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PAGE_MARGIN = 36;
const CONTENT_WIDTH = PDF_PAGE_WIDTH - PAGE_MARGIN * 2; // 523

// Color palette — matches the site's design tokens
// #dd3333 primary red, #ffba00 gold, #552085 purple, #301e48 dark purple
const PRIMARY_COLOR = [0.867, 0.200, 0.200] as const; // #dd3333 red
const ACCENT_COLOR  = [1.000, 0.729, 0.000] as const; // #ffba00 gold
const TEAM2_COLOR   = [0.333, 0.125, 0.522] as const; // #552085 purple
const HEADER_BG     = [0.188, 0.118, 0.282] as const; // #301e48 dark purple
const SUCCESS_COLOR = [0.063, 0.725, 0.506] as const; // #10b981 green
const LIGHT_PANEL   = [0.953, 0.957, 0.965] as const; // #f3f4f6
const ALT_ROW       = [0.937, 0.941, 0.949] as const; // #eeeff2
const LIGHT_BORDER  = [0.820, 0.835, 0.859] as const; // #d1d5db
const TOTALS_BG     = [0.99,  0.94,  0.94 ] as const; // very light red tint
const TEXT_DARK     = [0.122, 0.161, 0.216] as const; // #1f2937
const TEXT_MUTED    = [0.420, 0.447, 0.502] as const; // #6b7280
const TEXT_LIGHT    = [0.90,  0.86,  0.97 ] as const; // light lavender on dark bg
const WHITE = [1, 1, 1] as const;

// Player table column widths — must sum to CONTENT_WIDTH (523)
const ROSTER_COLS = [
  { key: 'player', label: 'Player',  width: 150, align: 'left'   },
  { key: 'number', label: '#',       width: 24,  align: 'center' },
  { key: 'role',   label: 'GS',      width: 24,  align: 'center' },
  { key: 'pts',    label: 'PTS',     width: 33,  align: 'right'  },
  { key: 'fg',     label: 'FG',      width: 42,  align: 'center' },
  { key: 'tp',     label: '3PT',     width: 40,  align: 'center' },
  { key: 'ft',     label: 'FT',      width: 38,  align: 'center' },
  { key: 'reb',    label: 'REB',     width: 30,  align: 'right'  },
  { key: 'ast',    label: 'AST',     width: 30,  align: 'right'  },
  { key: 'stl',    label: 'STL',     width: 30,  align: 'right'  },
  { key: 'blk',    label: 'BLK',     width: 30,  align: 'right'  },
  { key: 'tov',    label: 'TO',      width: 28,  align: 'right'  },
  { key: 'pf',     label: 'PF',      width: 24,  align: 'right'  },
] as const;

// ---------- helpers ----------

function formatPercentage(made: number, attempted: number): string {
  if (attempted === 0) return '0.0%';
  return `${((made / attempted) * 100).toFixed(1)}%`;
}

function sumStats(rows: PlayerMatchStatistics[]): PlayerMatchStatistics {
  return rows.reduce<PlayerMatchStatistics>(
    (totals, row) => ({
      points: totals.points + row.points,
      fieldGoalsMade: totals.fieldGoalsMade + row.fieldGoalsMade,
      fieldGoalsAttempted: totals.fieldGoalsAttempted + row.fieldGoalsAttempted,
      threePointersMade: totals.threePointersMade + row.threePointersMade,
      threePointersAttempted: totals.threePointersAttempted + row.threePointersAttempted,
      freeThrowsMade: totals.freeThrowsMade + row.freeThrowsMade,
      freeThrowsAttempted: totals.freeThrowsAttempted + row.freeThrowsAttempted,
      rebounds: totals.rebounds + row.rebounds,
      assists: totals.assists + row.assists,
      steals: totals.steals + row.steals,
      blocks: totals.blocks + row.blocks,
      turnovers: totals.turnovers + row.turnovers,
      fouls: totals.fouls + row.fouls,
    }),
    {
      points: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0,
      threePointersMade: 0, threePointersAttempted: 0,
      freeThrowsMade: 0, freeThrowsAttempted: 0,
      rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
    }
  );
}

function sortPlayers<T extends {
  started: boolean;
  jerseyNumber: number | null;
  player: { firstName?: string | null; lastName?: string | null };
}>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    if (a.started !== b.started) return a.started ? -1 : 1;
    if (a.jerseyNumber !== null && b.jerseyNumber !== null) return a.jerseyNumber - b.jerseyNumber;
    if (a.jerseyNumber !== null) return -1;
    if (b.jerseyNumber !== null) return 1;
    const aName = `${a.player.firstName || ''} ${a.player.lastName || ''}`.trim();
    const bName = `${b.player.firstName || ''} ${b.player.lastName || ''}`.trim();
    return aName.localeCompare(bName);
  });
}

function sanitizeFileSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatRgb(color: readonly [number, number, number]): string {
  return `${color[0]} ${color[1]} ${color[2]}`;
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}

function estimateChars(width: number, fontSize: number): number {
  return Math.max(1, Math.floor(width / (fontSize * 0.54)));
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else if (!current) {
      lines.push(truncateText(word, maxChars));
    } else {
      lines.push(current);
      current = word.length > maxChars ? truncateText(word, maxChars) : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ---------- layout engine ----------

class PdfLayout {
  private pages: Page[] = [];
  private currentPage!: Page;
  private y = 0;

  constructor() {
    this.startPage();
  }

  startPage() {
    this.currentPage = { commands: [] };
    this.pages.push(this.currentPage);
    this.y = PDF_PAGE_HEIGHT - PAGE_MARGIN;
  }

  get currentY() { return this.y; }
  getPageCount() { return this.pages.length; }

  /** Draw on any page without moving the cursor. */
  drawOnPage(pageIndex: number, fn: (page: Page) => void) {
    fn(this.pages[pageIndex]);
  }

  ensureSpace(height: number) {
    if (this.y - height < PAGE_MARGIN + 20) this.startPage();
  }

  drawRectOnPage(page: Page, x: number, y: number, w: number, h: number, fill: readonly [number, number, number], stroke?: readonly [number, number, number], lw = 1) {
    const cmds: string[] = [];
    cmds.push(`${formatRgb(fill)} rg`);
    if (stroke) { cmds.push(`${formatRgb(stroke)} RG`); cmds.push(`${lw} w`); }
    cmds.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${stroke ? 'B' : 'f'}`);
    page.commands.push(cmds.join('\n'));
  }

  drawRect(x: number, y: number, w: number, h: number, fill: readonly [number, number, number], stroke?: readonly [number, number, number], lw = 1) {
    this.drawRectOnPage(this.currentPage, x, y, w, h, fill, stroke, lw);
  }

  drawLineOnPage(page: Page, x1: number, y1: number, x2: number, y2: number, color: readonly [number, number, number], lw = 1) {
    page.commands.push(`${formatRgb(color)} RG\n${lw} w\n${x1.toFixed(2)} ${y1.toFixed(2)} m\n${x2.toFixed(2)} ${y2.toFixed(2)} l\nS`);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: readonly [number, number, number], lw = 1) {
    this.drawLineOnPage(this.currentPage, x1, y1, x2, y2, color, lw);
  }

  drawTextOnPage(page: Page, text: string, x: number, y: number, opts?: { size?: number; font?: 'F1' | 'F2'; color?: readonly [number, number, number] }) {
    const size = opts?.size ?? 9;
    const font = opts?.font ?? 'F1';
    const color = opts?.color ?? TEXT_DARK;
    page.commands.push(`BT\n/${font} ${size} Tf\n${formatRgb(color)} rg\n1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm\n(${escapePdfText(text)}) Tj\nET`);
  }

  drawText(text: string, x: number, y: number, opts?: { size?: number; font?: 'F1' | 'F2'; color?: readonly [number, number, number] }) {
    this.drawTextOnPage(this.currentPage, text, x, y, opts);
  }

  advance(space: number) { this.y -= space; }

  /** Inserts a raw PDF command at the start of a page so it renders behind all content. */
  prependOnPage(pageIndex: number, cmd: string) {
    this.pages[pageIndex].commands.unshift(cmd);
  }

  build(): Uint8Array {
    const objects: string[] = [];
    const pageObjectNumbers: number[] = [];
    const fontRegularNumber = 1;
    const fontBoldNumber = 2;
    const pagesObjectNumber = 3;
    // ExtGState for watermark transparency (18% fill opacity)
    const extGStateObjectNumber = 4;

    for (const page of this.pages) {
      const contentStream = page.commands.join('\n');
      const contentObjectNumber = objects.length + 5;
      const pageObjectNumber = contentObjectNumber + 1;
      objects.push(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
      objects.push(
        `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularNumber} 0 R /F2 ${fontBoldNumber} 0 R >> /ExtGState << /WMgs ${extGStateObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
      );
      pageObjectNumbers.push(pageObjectNumber);
    }

    const allObjects = [
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`,
      '<< /Type /ExtGState /ca 0.18 /CA 0.18 >>',
      ...objects,
    ];

    const catalogObjectNumber = allObjects.length + 1;
    allObjects.push(`<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`);

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    allObjects.forEach((obj, i) => {
      offsets.push(pdf.length);
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${allObjects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${allObjects.length + 1} /Root ${catalogObjectNumber} 0 R >>\n`;
    pdf += `startxref\n${xrefStart}\n%%EOF`;

    return new TextEncoder().encode(pdf);
  }
}

// ---------- section components ----------

function drawHeader(layout: PdfLayout, data: MatchStatSheetData) {
  const HEADER_H = 148;
  const baseY = PDF_PAGE_HEIGHT - HEADER_H;

  // Full-bleed dark-purple banner
  layout.drawRect(0, baseY, PDF_PAGE_WIDTH, HEADER_H, HEADER_BG);

  // Thin gold accent stripe at the very top
  layout.drawRect(0, PDF_PAGE_HEIGHT - 5, PDF_PAGE_WIDTH, 5, ACCENT_COLOR);

  // ── Team identity panels ──
  // Left panel: Team 1 (red)
  const PANEL_W = 190;
  const PANEL_H = 72;
  const panelY = baseY + HEADER_H - 18 - PANEL_H;

  // Team 1 badge (red)
  layout.drawRect(PAGE_MARGIN, panelY, PANEL_W, PANEL_H, PRIMARY_COLOR);
  // Initials box
  layout.drawRect(PAGE_MARGIN, panelY, 46, PANEL_H, [0.78, 0.12, 0.12]);
  layout.drawText(data.team1Initials, PAGE_MARGIN + 8, panelY + (PANEL_H / 2) - 10, { size: 20, font: 'F2', color: WHITE });
  // Team 1 name (wrap to 2 lines if needed)
  const t1Chars = estimateChars(PANEL_W - 58, 10);
  const t1Lines = wrapText(data.team1Name.toUpperCase(), t1Chars);
  t1Lines.slice(0, 2).forEach((line, i) => {
    layout.drawText(line, PAGE_MARGIN + 52, panelY + PANEL_H - 18 - i * 14, { size: 10, font: 'F2', color: WHITE });
  });

  // Team 2 badge (purple) — right-aligned
  const t2PanelX = PDF_PAGE_WIDTH - PAGE_MARGIN - PANEL_W;
  layout.drawRect(t2PanelX, panelY, PANEL_W, PANEL_H, TEAM2_COLOR);
  // Initials box (right side of the badge)
  layout.drawRect(t2PanelX + PANEL_W - 46, panelY, 46, PANEL_H, [0.24, 0.08, 0.40]);
  layout.drawText(data.team2Initials, t2PanelX + PANEL_W - 38, panelY + (PANEL_H / 2) - 10, { size: 20, font: 'F2', color: WHITE });
  // Team 2 name
  const t2Chars = estimateChars(PANEL_W - 58, 10);
  const t2Lines = wrapText(data.team2Name.toUpperCase(), t2Chars);
  t2Lines.slice(0, 2).forEach((line, i) => {
    layout.drawText(line, t2PanelX + 8, panelY + PANEL_H - 18 - i * 14, { size: 10, font: 'F2', color: WHITE });
  });

  // VS badge in the center between teams
  const vsX = PAGE_MARGIN + PANEL_W + (CONTENT_WIDTH - PANEL_W * 2) / 2 - 14;
  layout.drawText('VS', vsX, panelY + (PANEL_H / 2) - 7, { size: 18, font: 'F2', color: ACCENT_COLOR });

  // ── Info strip below team panels ──
  const infoY = panelY - 6;

  // "POST-GAME STAT SHEET" pill badge
  layout.drawRect(PAGE_MARGIN, baseY + HEADER_H - 14, 168, 14, ACCENT_COLOR);
  layout.drawText('POST-GAME STAT SHEET', PAGE_MARGIN + 8, baseY + HEADER_H - 8, { size: 7, font: 'F2', color: [0.12, 0.08, 0.20] });

  // League · Season (top right)
  const leagueInfo = truncateText(`${data.leagueName}  |  ${data.seasonName}`, 58);
  layout.drawText(leagueInfo, PDF_PAGE_WIDTH - PAGE_MARGIN - leagueInfo.length * 4.0, baseY + HEADER_H - 8, { size: 7, color: TEXT_LIGHT });

  // Thin separator before info row
  layout.drawLine(PAGE_MARGIN, infoY, PDF_PAGE_WIDTH - PAGE_MARGIN, infoY, [0.18, 0.28, 0.43], 0.5);

  // Date (left) and result (right)
  layout.drawText(data.playedOn, PAGE_MARGIN, infoY - 12, { size: 8, font: 'F2', color: TEXT_LIGHT });
  const resultTrunc = truncateText(data.resultLabel, 55);
  layout.drawText(resultTrunc, PDF_PAGE_WIDTH - PAGE_MARGIN - resultTrunc.length * 4.0, infoY - 12, { size: 8, color: TEXT_LIGHT });

  // Advance cursor past header
  layout.advance(HEADER_H + 14);
}

function drawScoreboard(layout: PdfLayout, data: MatchStatSheetData) {
  // Vertical zones (y measured from card bottom):
  //  80 – team names (size 11, cap-top ≈ 88)
  //  66 – thin separator
  //  58 – "FINAL" label (size 8, cap-top ≈ 64)
  //  40–52 – WIN badge (h=12)
  //  14 – score baseline (size 30, cap-top ≈ 36)
  const CARD_H = 96;
  layout.ensureSpace(CARD_H + 4);
  const cardY = layout.currentY - CARD_H;
  const midX = PAGE_MARGIN + CONTENT_WIDTH / 2;
  const team1Won = data.team1Score > data.team2Score;
  const team2Won = data.team2Score > data.team1Score;

  // Card background
  layout.drawRect(PAGE_MARGIN, cardY, CONTENT_WIDTH, CARD_H, LIGHT_PANEL, LIGHT_BORDER, 0.8);

  // Left panel tint
  layout.drawRect(PAGE_MARGIN, cardY, CONTENT_WIDTH / 2, CARD_H, [0.93, 0.95, 0.99], undefined, 0);

  // Vertical center divider
  layout.drawLine(midX, cardY + 4, midX, cardY + CARD_H - 4, LIGHT_BORDER, 0.8);

  // Horizontal separator between names and score area
  layout.drawLine(PAGE_MARGIN + 4, cardY + 66, PAGE_MARGIN + CONTENT_WIDTH - 4, cardY + 66, LIGHT_BORDER, 0.5);

  // Team names (above separator)
  layout.drawText(truncateText(data.team1Name, 22), PAGE_MARGIN + 14, cardY + 80, { size: 11, font: 'F2', color: TEXT_DARK });
  layout.drawText(truncateText(data.team2Name, 22), midX + 14, cardY + 80, { size: 11, font: 'F2', color: TEXT_DARK });

  // "FINAL" - centered label in its own row below separator
  layout.drawText('FINAL', midX - 11, cardY + 58, { size: 8, font: 'F2', color: TEXT_MUTED });

  // WIN badge - its own row between FINAL and scores
  if (team1Won) {
    layout.drawRect(PAGE_MARGIN + 14, cardY + 40, 28, 12, SUCCESS_COLOR);
    layout.drawText('WIN', PAGE_MARGIN + 19, cardY + 46, { size: 6, font: 'F2', color: WHITE });
  }
  if (team2Won) {
    layout.drawRect(midX + 14, cardY + 40, 28, 12, SUCCESS_COLOR);
    layout.drawText('WIN', midX + 19, cardY + 46, { size: 6, font: 'F2', color: WHITE });
  }

  // Scores (bottom zone)
  layout.drawText(String(data.team1Score), PAGE_MARGIN + 14, cardY + 14, { size: 30, font: 'F2', color: team1Won ? SUCCESS_COLOR : PRIMARY_COLOR });
  layout.drawText(String(data.team2Score), midX + 14, cardY + 14, { size: 30, font: 'F2', color: team2Won ? SUCCESS_COLOR : PRIMARY_COLOR });

  layout.advance(CARD_H + 16);
}

function drawSectionHeader(layout: PdfLayout, title: string, subtitle?: string) {
  const titleH = subtitle ? 38 : 26;
  layout.ensureSpace(titleH + 10);

  const topY = layout.currentY;
  // Colored left accent bar
  layout.drawRect(PAGE_MARGIN, topY - titleH + 4, 4, titleH - 4, ACCENT_COLOR);
  layout.drawText(title, PAGE_MARGIN + 10, topY - 12, { size: 13, font: 'F2', color: PRIMARY_COLOR });
  if (subtitle) {
    layout.drawText(truncateText(subtitle, 72), PAGE_MARGIN + 10, topY - 26, { size: 8, color: TEXT_MUTED });
  }
  layout.advance(titleH);
  layout.drawLine(PAGE_MARGIN, layout.currentY, PDF_PAGE_WIDTH - PAGE_MARGIN, layout.currentY, LIGHT_BORDER, 0.7);
  layout.advance(8);
}

function drawTeamComparison(layout: PdfLayout, data: MatchStatSheetData) {
  drawSectionHeader(layout, 'Team Comparison');

  const stats = [
    { label: 'Points',    left: String(data.team1Totals.points),    right: String(data.team2Totals.points) },
    { label: 'FG',        left: `${data.team1Totals.fieldGoals} (${data.team1Totals.fieldGoalPercentage})`,     right: `${data.team2Totals.fieldGoals} (${data.team2Totals.fieldGoalPercentage})` },
    { label: '3-Pointers',left: `${data.team1Totals.threePointers} (${data.team1Totals.threePointPercentage})`, right: `${data.team2Totals.threePointers} (${data.team2Totals.threePointPercentage})` },
    { label: 'Free Throws',left: `${data.team1Totals.freeThrows} (${data.team1Totals.freeThrowPercentage})`,   right: `${data.team2Totals.freeThrows} (${data.team2Totals.freeThrowPercentage})` },
    { label: 'Rebounds',  left: String(data.team1Totals.rebounds),  right: String(data.team2Totals.rebounds) },
    { label: 'Assists',   left: String(data.team1Totals.assists),   right: String(data.team2Totals.assists) },
    { label: 'Steals',    left: String(data.team1Totals.steals),    right: String(data.team2Totals.steals) },
    { label: 'Turnovers', left: String(data.team1Totals.turnovers), right: String(data.team2Totals.turnovers) },
    { label: 'Fouls',     left: String(data.team1Totals.fouls),     right: String(data.team2Totals.fouls) },
  ];

  const COL1 = 200; // team1 data
  const COL2 = 123; // category label
  const COL3 = 200; // team2 data
  const ROW_H = 22;
  const HDR_H = 24;
  const tableH = HDR_H + stats.length * ROW_H;

  layout.ensureSpace(tableH + 4);
  const tableY = layout.currentY;

  // Header row
  layout.drawRect(PAGE_MARGIN, tableY - HDR_H, CONTENT_WIDTH, HDR_H, HEADER_BG);
  layout.drawText(truncateText(data.team1Name, 24), PAGE_MARGIN + 8, tableY - HDR_H + 8, { size: 9, font: 'F2', color: WHITE });
  layout.drawText('CATEGORY', PAGE_MARGIN + COL1 + 8, tableY - HDR_H + 8, { size: 8, font: 'F2', color: TEXT_LIGHT });
  layout.drawText(truncateText(data.team2Name, 24), PAGE_MARGIN + COL1 + COL2 + 8, tableY - HDR_H + 8, { size: 9, font: 'F2', color: WHITE });

  // Data rows
  let curY = tableY - HDR_H;
  stats.forEach((stat, i) => {
    const rowY = curY - ROW_H;
    layout.drawRect(PAGE_MARGIN, rowY, CONTENT_WIDTH, ROW_H, i % 2 === 0 ? WHITE : LIGHT_PANEL, LIGHT_BORDER, 0.4);

    // Highlight the better stat in each row (numeric comparison)
    const leftNum = parseFloat(stat.left);
    const rightNum = parseFloat(stat.right);
    const t1Better = !isNaN(leftNum) && !isNaN(rightNum) && stat.label !== 'Turnovers' && stat.label !== 'Fouls' && leftNum > rightNum;
    const t2Better = !isNaN(leftNum) && !isNaN(rightNum) && stat.label !== 'Turnovers' && stat.label !== 'Fouls' && rightNum > leftNum;
    const t1FewerBad = !isNaN(leftNum) && !isNaN(rightNum) && (stat.label === 'Turnovers' || stat.label === 'Fouls') && leftNum < rightNum;
    const t2FewerBad = !isNaN(leftNum) && !isNaN(rightNum) && (stat.label === 'Turnovers' || stat.label === 'Fouls') && rightNum < leftNum;

    layout.drawText(truncateText(stat.left, 26), PAGE_MARGIN + 8, rowY + 7, {
      size: 9,
      font: (t1Better || t1FewerBad) ? 'F2' : 'F1',
      color: (t1Better || t1FewerBad) ? SUCCESS_COLOR : TEXT_DARK,
    });
    layout.drawText(stat.label, PAGE_MARGIN + COL1 + 8, rowY + 7, { size: 8, color: TEXT_MUTED });
    layout.drawText(truncateText(stat.right, 26), PAGE_MARGIN + COL1 + COL2 + 8, rowY + 7, {
      size: 9,
      font: (t2Better || t2FewerBad) ? 'F2' : 'F1',
      color: (t2Better || t2FewerBad) ? SUCCESS_COLOR : TEXT_DARK,
    });

    curY = rowY;
  });

  // Bottom border
  layout.drawLine(PAGE_MARGIN, curY, PAGE_MARGIN + CONTENT_WIDTH, curY, LIGHT_BORDER, 0.7);
  layout.advance(tableH + 18);
}

function drawRosterTable(layout: PdfLayout, teamName: string, totals: TeamTotalsRow, rows: PlayerStatRow[], accent: readonly [number, number, number]) {
  const subtitle = `PTS ${totals.points}  |  FG ${totals.fieldGoals} (${totals.fieldGoalPercentage})  |  3PT ${totals.threePointers} (${totals.threePointPercentage})  |  FT ${totals.freeThrows} (${totals.freeThrowPercentage})`;
  drawSectionHeader(layout, `${teamName} - Player Breakdown`, subtitle);

  const HDR_H = 22;
  const ROW_H = 19;
  const TOTALS_H = 21;

  const drawHeader = () => {
    layout.ensureSpace(HDR_H + ROW_H * 2 + TOTALS_H + 6);
    const hdrY = layout.currentY;
    layout.drawRect(PAGE_MARGIN, hdrY - HDR_H, CONTENT_WIDTH, HDR_H, accent);

    let cx = PAGE_MARGIN;
    for (const col of ROSTER_COLS) {
      layout.drawText(col.label, cx + 4, hdrY - HDR_H + 7, { size: 7, font: 'F2', color: WHITE });
      cx += col.width;
    }
    layout.advance(HDR_H);
  };

  drawHeader();

  const playerRows: Record<string, string>[] = rows.map((r) => ({
    player: r.player,
    number: r.jerseyNumber,
    role: r.starterLabel === 'Starter' ? 'S' : 'B',
    pts: String(r.points),
    fg: r.fieldGoals,
    tp: r.threePointers,
    ft: r.freeThrows,
    reb: String(r.rebounds),
    ast: String(r.assists),
    stl: String(r.steals),
    blk: String(r.blocks),
    tov: String(r.turnovers),
    pf: String(r.fouls),
  }));

  playerRows.forEach((row, rowIndex) => {
    if (layout.currentY - (ROW_H + TOTALS_H + 6) < PAGE_MARGIN + 20) {
      layout.startPage();
      drawHeader();
    }
    const rowY = layout.currentY - ROW_H;
    layout.drawRect(PAGE_MARGIN, rowY, CONTENT_WIDTH, ROW_H, rowIndex % 2 === 0 ? WHITE : ALT_ROW, LIGHT_BORDER, 0.4);

    let cx = PAGE_MARGIN;
    for (const col of ROSTER_COLS) {
      const raw = row[col.key] ?? '';
      const value = truncateText(raw, estimateChars(col.width - 6, 8));
      const shift =
        col.align === 'right'
          ? Math.max(0, col.width - value.length * 4.1 - 4)
          : col.align === 'center'
            ? Math.max(0, (col.width - value.length * 4.1) / 2)
            : 4;
      layout.drawText(value, cx + shift, rowY + 6, { size: 8, color: TEXT_DARK });
      cx += col.width;
    }
    layout.advance(ROW_H);
  });

  // Totals row
  if (layout.currentY - TOTALS_H < PAGE_MARGIN + 20) {
    layout.startPage();
    drawHeader();
  }
  const totalsY = layout.currentY - TOTALS_H;
  layout.drawRect(PAGE_MARGIN, totalsY, CONTENT_WIDTH, TOTALS_H, TOTALS_BG, LIGHT_BORDER, 0.6);

  const totalsData: Record<string, string> = {
    player: 'TOTALS',
    number: '',
    role: '',
    pts: String(totals.points),
    fg: totals.fieldGoals,
    tp: totals.threePointers,
    ft: totals.freeThrows,
    reb: String(totals.rebounds),
    ast: String(totals.assists),
    stl: String(totals.steals),
    blk: String(totals.blocks),
    tov: String(totals.turnovers),
    pf: String(totals.fouls),
  };

  let cx = PAGE_MARGIN;
  for (const col of ROSTER_COLS) {
    const raw = totalsData[col.key] ?? '';
    const value = truncateText(raw, estimateChars(col.width - 6, 8));
    const shift =
      col.align === 'right'
        ? Math.max(0, col.width - value.length * 4.1 - 4)
        : col.align === 'center'
          ? Math.max(0, (col.width - value.length * 4.1) / 2)
          : 4;
    layout.drawText(value, cx + shift, totalsY + 7, { size: 8, font: 'F2', color: PRIMARY_COLOR });
    cx += col.width;
  }

  layout.advance(TOTALS_H + 18);
}

function addWatermarks(layout: PdfLayout) {
  // Diagonal watermark, drawn first so it's behind all content.
  // Transparency (18% opacity) is applied via the /WMgs ExtGState so it
  // remains visible even through solid table fills.
  // 45-degree CCW rotation: cos  sin  -sin  cos  tx  ty Tm
  const cos = 0.7071;
  const sin = 0.7071;
  const text = 'ELEVATE BALLERS';

  // Center on page: text width at 52pt ≈ 15 * 52 * 0.54 = 421px, half = 211
  const cx = PDF_PAGE_WIDTH / 2;
  const cy = PDF_PAGE_HEIGHT / 2;
  const halfW = 211;
  const tx = (cx - halfW * cos).toFixed(2);
  const ty = (cy - halfW * sin).toFixed(2);

  // Full-strength brand purple — the ExtGState opacity makes it subtle
  const color = `${formatRgb(TEAM2_COLOR)}`;
  const cmd = [
    'q',
    '/WMgs gs',
    'BT',
    `/F2 52 Tf`,
    `${color} rg`,
    `${cos} ${sin} ${-sin} ${cos} ${tx} ${ty} Tm`,
    `(${escapePdfText(text)}) Tj`,
    'ET',
    'Q',
  ].join('\n');

  for (let i = 0; i < layout.getPageCount(); i++) {
    layout.prependOnPage(i, cmd);
  }
}

function addFooters(layout: PdfLayout, data: MatchStatSheetData) {
  const totalPages = layout.getPageCount();
  const legend = 'GS: S = Starter, B = Bench  |  FG = Field Goals  |  3PT = Three-Pointers  |  FT = Free Throws  |  REB = Rebounds  |  AST = Assists  |  STL = Steals  |  BLK = Blocks  |  TO = Turnovers  |  PF = Fouls';

  for (let i = 0; i < totalPages; i++) {
    layout.drawOnPage(i, (page) => {
      // Separator line
      layout.drawLineOnPage(page, PAGE_MARGIN, PAGE_MARGIN + 28, PDF_PAGE_WIDTH - PAGE_MARGIN, PAGE_MARGIN + 28, LIGHT_BORDER, 0.6);
      // Team names in footer
      layout.drawTextOnPage(page, truncateText(`${data.team1Name}  vs  ${data.team2Name}`, 60), PAGE_MARGIN, PAGE_MARGIN + 20, { size: 7, font: 'F2', color: TEXT_MUTED });
      // Legend
      layout.drawTextOnPage(page, truncateText(legend, 95), PAGE_MARGIN, PAGE_MARGIN + 10, { size: 5.5, color: TEXT_MUTED });
      // Page number (right)
      const pageLabel = `Page ${i + 1} of ${totalPages}`;
      layout.drawTextOnPage(page, pageLabel, PDF_PAGE_WIDTH - PAGE_MARGIN - pageLabel.length * 3.1, PAGE_MARGIN + 10, { size: 6, color: TEXT_MUTED });
    });
  }
}


// ---------- data building ----------

function buildTeamRows(
  teamName: string,
  players: Array<{
    playerId: string;
    started: boolean;
    jerseyNumber: number | null;
    player: { firstName?: string | null; lastName?: string | null };
  }>,
  safeEvents: Array<{ playerId: string | null; isUndone?: boolean; eventType: any }>
): { rows: PlayerStatRow[]; totals: TeamTotalsRow } {
  const rows = players.map((matchPlayer) => {
    const stats = calculatePlayerMatchStats(matchPlayer.playerId, safeEvents);
    return {
      team: teamName,
      player: `${matchPlayer.player.firstName || ''} ${matchPlayer.player.lastName || ''}`.trim() || 'Unknown Player',
      jerseyNumber: matchPlayer.jerseyNumber === null ? '-' : String(matchPlayer.jerseyNumber),
      starterLabel: matchPlayer.started ? 'Starter' : 'Bench',
      points: stats.points,
      fieldGoals: `${stats.fieldGoalsMade}/${stats.fieldGoalsAttempted}`,
      threePointers: `${stats.threePointersMade}/${stats.threePointersAttempted}`,
      freeThrows: `${stats.freeThrowsMade}/${stats.freeThrowsAttempted}`,
      rebounds: stats.rebounds,
      assists: stats.assists,
      steals: stats.steals,
      blocks: stats.blocks,
      turnovers: stats.turnovers,
      fouls: stats.fouls,
    };
  });

  const totals = sumStats(
    rows.map((row) => {
      const [fgMade, fgAtt] = row.fieldGoals.split('/').map(Number);
      const [tpMade, tpAtt] = row.threePointers.split('/').map(Number);
      const [ftMade, ftAtt] = row.freeThrows.split('/').map(Number);
      return {
        points: row.points,
        fieldGoalsMade: fgMade, fieldGoalsAttempted: fgAtt,
        threePointersMade: tpMade, threePointersAttempted: tpAtt,
        freeThrowsMade: ftMade, freeThrowsAttempted: ftAtt,
        rebounds: row.rebounds, assists: row.assists, steals: row.steals,
        blocks: row.blocks, turnovers: row.turnovers, fouls: row.fouls,
      };
    })
  );

  return {
    rows,
    totals: {
      team: teamName,
      points: totals.points,
      fieldGoals: `${totals.fieldGoalsMade}/${totals.fieldGoalsAttempted}`,
      fieldGoalPercentage: formatPercentage(totals.fieldGoalsMade, totals.fieldGoalsAttempted),
      threePointers: `${totals.threePointersMade}/${totals.threePointersAttempted}`,
      threePointPercentage: formatPercentage(totals.threePointersMade, totals.threePointersAttempted),
      freeThrows: `${totals.freeThrowsMade}/${totals.freeThrowsAttempted}`,
      freeThrowPercentage: formatPercentage(totals.freeThrowsMade, totals.freeThrowsAttempted),
      rebounds: totals.rebounds, assists: totals.assists, steals: totals.steals,
      blocks: totals.blocks, turnovers: totals.turnovers, fouls: totals.fouls,
    },
  };
}

async function buildStatSheetData(matchId: string): Promise<MatchStatSheetData> {
  const match = await getMatchWithFullDetails(matchId);

  if (!match) throw new Error('Match not found');
  if (match.status !== 'COMPLETED') throw new Error('Stat sheet is only available for completed matches');

  const team1Name = match.team1?.name || match.team1Name || 'Team 1';
  const team2Name = match.team2?.name || match.team2Name || 'Team 2';
  const playedOnIso = new Date(match.date).toISOString().slice(0, 10);
  const team1Score = match.team1Score ?? 0;
  const team2Score = match.team2Score ?? 0;

  const resultLabel =
    team1Score === team2Score
      ? 'Game finished in a tie'
      : team1Score > team2Score
        ? `${team1Name} won by ${team1Score - team2Score}`
        : `${team2Name} won by ${team2Score - team1Score}`;

  const safeEvents = Array.isArray(match.events) ? match.events : [];
  const team1Players = sortPlayers(match.matchPlayers.filter((p) => p.teamId === match.team1Id));
  const team2Players = sortPlayers(match.matchPlayers.filter((p) => p.teamId === match.team2Id));

  const team1Stats = buildTeamRows(team1Name, team1Players, safeEvents);
  const team2Stats = buildTeamRows(team2Name, team2Players, safeEvents);

  // Build 2-letter initials from team name words
  const teamInitials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || name.slice(0, 2).toUpperCase();

  return {
    fileName: `${playedOnIso}_${sanitizeFileSegment(team1Name) || 'team-1'}_vs_${sanitizeFileSegment(team2Name) || 'team-2'}_stat-sheet.pdf`,
    matchTitle: `${team1Name} vs ${team2Name}`,
    playedOn: new Date(match.date).toLocaleDateString('en-US', {
      timeZone: MATCH_TIMEZONE,
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }),
    leagueName: match.league?.name || match.leagueName || 'League play',
    seasonName: match.season?.name || 'Season not specified',
    resultLabel,
    team1Name,
    team2Name,
    team1Initials: teamInitials(team1Name),
    team2Initials: teamInitials(team2Name),
    team1Score,
    team2Score,
    team1Totals: team1Stats.totals,
    team2Totals: team2Stats.totals,
    team1Rows: team1Stats.rows,
    team2Rows: team2Stats.rows,
  };
}

// ---------- render ----------

function drawShotSummary(layout: PdfLayout, data: MatchStatSheetData) {
  drawSectionHeader(layout, 'Shot Summary');

  const ROW_H = 22;
  const HDR_H = 22;
  const rows = [
    { label: 'Field Goals (2PT)', t1: data.team1Totals.fieldGoals, t2: data.team2Totals.fieldGoals, t1Pct: data.team1Totals.fieldGoalPercentage, t2Pct: data.team2Totals.fieldGoalPercentage },
    { label: '3-Pointers',        t1: data.team1Totals.threePointers, t2: data.team2Totals.threePointers, t1Pct: data.team1Totals.threePointPercentage, t2Pct: data.team2Totals.threePointPercentage },
    { label: 'Free Throws',       t1: data.team1Totals.freeThrows, t2: data.team2Totals.freeThrows, t1Pct: data.team1Totals.freeThrowPercentage, t2Pct: data.team2Totals.freeThrowPercentage },
  ];

  const tableH = HDR_H + rows.length * ROW_H;
  layout.ensureSpace(tableH + 4);
  const tableY = layout.currentY;

  // Header
  layout.drawRect(PAGE_MARGIN, tableY - HDR_H, CONTENT_WIDTH, HDR_H, HEADER_BG);
  layout.drawText('SHOT TYPE', PAGE_MARGIN + 8, tableY - HDR_H + 8, { size: 8, font: 'F2', color: TEXT_LIGHT });
  layout.drawText(truncateText(data.team1Name, 22), PAGE_MARGIN + 200, tableY - HDR_H + 8, { size: 8, font: 'F2', color: WHITE });
  layout.drawText(truncateText(data.team2Name, 22), PAGE_MARGIN + 360, tableY - HDR_H + 8, { size: 8, font: 'F2', color: WHITE });

  let curY = tableY - HDR_H;
  rows.forEach((row, i) => {
    const rowY = curY - ROW_H;
    layout.drawRect(PAGE_MARGIN, rowY, CONTENT_WIDTH, ROW_H, i % 2 === 0 ? WHITE : LIGHT_PANEL, LIGHT_BORDER, 0.4);
    layout.drawText(row.label, PAGE_MARGIN + 8, rowY + 7, { size: 8, color: TEXT_DARK });
    layout.drawText(`${row.t1} (${row.t1Pct})`, PAGE_MARGIN + 200, rowY + 7, { size: 8, font: 'F2', color: PRIMARY_COLOR });
    layout.drawText(`${row.t2} (${row.t2Pct})`, PAGE_MARGIN + 360, rowY + 7, { size: 8, font: 'F2', color: TEAM2_COLOR });
    curY = rowY;
  });

  layout.drawLine(PAGE_MARGIN, curY, PAGE_MARGIN + CONTENT_WIDTH, curY, LIGHT_BORDER, 0.7);
  layout.advance(tableH + 16);
}

function renderStatSheetPdf(data: MatchStatSheetData): Uint8Array {
  const layout = new PdfLayout();

  drawHeader(layout, data);
  drawScoreboard(layout, data);
  drawTeamComparison(layout, data);
  drawShotSummary(layout, data);
  drawRosterTable(layout, data.team1Name, data.team1Totals, data.team1Rows, PRIMARY_COLOR);
  drawRosterTable(layout, data.team2Name, data.team2Totals, data.team2Rows, TEAM2_COLOR);
  addWatermarks(layout);
  addFooters(layout, data);

  return layout.build();
}

export async function generateMatchStatSheetPDF(matchId: string): Promise<{ pdf: Uint8Array; fileName: string }> {
  const data = await buildStatSheetData(matchId);
  return { pdf: renderStatSheetPdf(data), fileName: data.fileName };
}
