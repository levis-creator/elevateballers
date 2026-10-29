/**
 * Renders the post-game stat sheet PDF in the v2 look: brand colours from
 * site settings, the night/paper/ink palette, the live console's home/away
 * colours, and the site's display/body/label typefaces embedded.
 *
 * Pure apart from pdf-lib: takes the sheet data, a theme and font bytes, so it
 * can be rendered with test data (no database or filesystem).
 */
import { PDFDocument, degrees, rgb, setCharacterSpacing, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  buildThemeColorPalette,
  type PublicBrandSettings,
} from '../../../settings/application/brandSettings';

export type PlayerStatRow = {
  team: string;
  player: string;
  jerseyNumber: string;
  starterLabel: string;
  /** Whole minutes on court, or "—" when unknown. */
  minutes: string;
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

export type TeamTotalsRow = {
  team: string;
  /** Sum of player minutes, blank when any player's minutes are unknown. */
  minutes: string;
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

export type MatchStatSheetData = {
  fileName: string;
  matchTitle: string;
  playedOn: string;
  leagueName: string;
  seasonName: string;
  resultLabel: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  /** A typed-in result has no play-by-play, so the sheet shows the final only. */
  manualScore: boolean;
  team1Totals: TeamTotalsRow;
  team2Totals: TeamTotalsRow;
  team1Rows: PlayerStatRow[];
  team2Rows: PlayerStatRow[];
};

export type StatSheetTheme = {
  siteName: string;
  uppercase: boolean;
  typefaces: Pick<PublicBrandSettings, 'display' | 'body' | 'label'>;
  brand: RGB;
  brandSoft: RGB;
  paper: RGB;
  zebra: RGB;
  panel: RGB;
  border: RGB;
  night: RGB;
  nightBorder: RGB;
  ink: RGB;
  muted: RGB;
  soft: RGB;
  cream: RGB;
  creamDim: RGB;
  home: RGB;
  away: RGB;
};

/** Font file bytes for each role (WOFF/TTF/OTF). */
export type StatSheetFontBytes = {
  display: Uint8Array;
  body: Uint8Array;
  bodyBold: Uint8Array;
  label: Uint8Array;
  labelBold: Uint8Array;
};

/** Font file per brand typeface and weight, as shipped in src/assets/fonts/stat-sheet. */
export const STAT_SHEET_FONT_FILES = {
  display: {
    Anton: 'anton-latin-400-normal.woff',
    'Archivo Black': 'archivo-black-latin-400-normal.woff',
  },
  body: {
    Archivo: ['archivo-latin-400-normal.woff', 'archivo-latin-700-normal.woff'],
    Inter: ['inter-latin-400-normal.woff', 'inter-latin-700-normal.woff'],
  },
  label: {
    'Space Mono': ['space-mono-latin-400-normal.woff', 'space-mono-latin-700-normal.woff'],
    'IBM Plex Mono': ['ibm-plex-mono-latin-400-normal.woff', 'ibm-plex-mono-latin-700-normal.woff'],
  },
} as const;

// Light-mode home/away colours from the live console (oklch 0.5 0.14 245 / 0.56 0.13 65).
const HOME_HEX = '#0068ad';
const AWAY_HEX = '#a76100';

function channels(value: string): RGB {
  const [r, g, b] = value.split(' ').map(Number);
  return rgb(r / 255, g / 255, b / 255);
}

function hex(value: string): RGB {
  return channels(
    [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16)).join(' '),
  );
}

export function buildStatSheetTheme(brand: PublicBrandSettings): StatSheetTheme {
  const p = buildThemeColorPalette(brand);
  return {
    siteName: brand.siteName,
    uppercase: brand.uppercaseHeadings,
    typefaces: { display: brand.display, body: brand.body, label: brand.label },
    brand: channels(p.brand),
    brandSoft: channels(p.brandSoft),
    paper: channels(p.paper),
    zebra: channels(p.paperRaised),
    panel: channels(p.paperPanel),
    border: channels(p.paperBorder),
    night: channels(p.night),
    nightBorder: channels(p.nightBorder),
    ink: channels(p.ink),
    muted: channels(p.inkMuted),
    soft: channels(p.inkSoft),
    cream: channels(p.cream),
    creamDim: channels(p.creamDim),
    home: hex(HOME_HEX),
    away: hex(AWAY_HEX),
  };
}

// ---------- layout ----------

// A4 portrait, in points.
const W = 595;
const H = 842;
const M = 36;
const CW = W - M * 2;
const FOOTER_H = 34;

type Fonts = { display: PDFFont; body: PDFFont; bodyBold: PDFFont; label: PDFFont; labelBold: PDFFont };
type FontKey = keyof Fonts;
type Align = 'left' | 'right' | 'center';
type TextOpts = { font?: FontKey; size?: number; color?: RGB; align?: Align; maxWidth?: number; tracking?: number };

class Sheet {
  page!: PDFPage;
  y = 0;
  pages: PDFPage[] = [];

  constructor(
    private doc: PDFDocument,
    readonly fonts: Fonts,
    readonly t: StatSheetTheme,
    readonly logo: PDFImage | null = null,
  ) {}

  newPage() {
    this.page = this.doc.addPage([W, H]);
    this.pages.push(this.page);
    this.watermark();
    this.y = H - M;
  }

  /** Starts a new page when `height` doesn't fit above the footer. Returns true if it did. */
  ensure(height: number): boolean {
    if (this.y - height >= M + FOOTER_H) return false;
    this.newPage();
    return true;
  }

  rect(x: number, y: number, w: number, h: number, color: RGB) {
    this.page.drawRectangle({ x, y, width: w, height: h, color });
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB, thickness = 0.5) {
    this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
  }

  width(s: string, font: FontKey, size: number, tracking = 0): number {
    return this.fonts[font].widthOfTextAtSize(s, size) + tracking * s.length;
  }

  /** Shortens `s` with an ellipsis until it fits `maxWidth`. */
  fit(s: string, font: FontKey, size: number, maxWidth: number, tracking = 0): string {
    if (this.width(s, font, size, tracking) <= maxWidth) return s;
    let cut = s;
    while (cut.length > 1 && this.width(`${cut}…`, font, size, tracking) > maxWidth) cut = cut.slice(0, -1);
    return `${cut.trimEnd()}…`;
  }

  /** Draws text; with `align: 'right'` x is the right edge, with 'center' the midpoint. */
  text(raw: string, x: number, y: number, o: TextOpts = {}) {
    const font = o.font ?? 'body';
    const size = o.size ?? 8;
    const tracking = o.tracking ?? 0;
    const s = o.maxWidth ? this.fit(raw, font, size, o.maxWidth, tracking) : raw;
    const w = this.width(s, font, size, tracking);
    const left = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    if (tracking) this.page.pushOperators(setCharacterSpacing(tracking));
    this.page.drawText(s, { x: left, y, size, font: this.fonts[font], color: o.color ?? this.t.ink });
    if (tracking) this.page.pushOperators(setCharacterSpacing(0));
  }

  /** Mono, letter-spaced, uppercase — the v2 label style. */
  label(s: string, x: number, y: number, o: TextOpts = {}) {
    this.text(s.toUpperCase(), x, y, { font: 'label', size: 6.5, tracking: 0.9, color: this.t.muted, ...o });
  }

  heading(s: string) {
    return this.t.uppercase ? s.toUpperCase() : s;
  }

  private watermark() {
    const text = this.t.siteName.toUpperCase();
    const size = 64;
    const angle = 35;
    const w = this.fonts.display.widthOfTextAtSize(text, size);
    const rad = (angle * Math.PI) / 180;
    this.page.drawText(text, {
      x: W / 2 - (w / 2) * Math.cos(rad) + (size / 3) * Math.sin(rad),
      y: H / 2 - (w / 2) * Math.sin(rad) - (size / 3) * Math.cos(rad),
      size,
      font: this.fonts.display,
      color: this.t.ink,
      opacity: 0.035,
      rotate: degrees(angle),
    });
  }
}

// ---------- sections ----------

/** Largest size from `max` down to `min` at which every line fits `width`. */
function fitSize(sheet: Sheet, lines: string[], font: FontKey, width: number, max: number, min: number): number {
  let size = max;
  while (size > min && lines.some((s) => sheet.width(s, font, size) > width)) size -= 1;
  return size;
}

/** A team name on one line, or split over two when one line would get too small. */
function teamNameLines(sheet: Sheet, name: string, width: number): { lines: string[]; size: number } {
  const one = fitSize(sheet, [name], 'display', width, 22, 12);
  const words = name.split(/\s+/);
  if (one >= 17 || words.length < 2) return { lines: [name], size: one };
  let best = [name, ''];
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const longest = (p: string[]) => Math.max(...p.map((s) => sheet.width(s, 'display', 10)));
    if (!best[1] || longest(pair) < longest(best)) best = pair;
  }
  return { lines: best, size: fitSize(sheet, best, 'display', width, 18, 11) };
}

function drawHeader(sheet: Sheet, d: MatchStatSheetData) {
  const { t } = sheet;
  // A paper strip carrying the logo (as on the site header), then the night
  // scoreboard band.
  const STRIP_H = 58;
  const BAND_H = 150;
  const stripBase = H - STRIP_H;
  const base = stripBase - BAND_H;
  sheet.rect(0, stripBase, W, STRIP_H, t.paper);
  sheet.rect(0, H - 3, W, 3, t.brand);
  sheet.rect(0, base, W, BAND_H, t.night);

  const LOGO_H = 36;
  const LOGO_MAX_W = 170;
  const logoY = stripBase + (STRIP_H - 3 - LOGO_H) / 2;
  if (sheet.logo) {
    const scale = Math.min(LOGO_H / sheet.logo.height, LOGO_MAX_W / sheet.logo.width);
    const w = sheet.logo.width * scale;
    const h = sheet.logo.height * scale;
    sheet.page.drawImage(sheet.logo, { x: M, y: logoY + (LOGO_H - h) / 2, width: w, height: h });
  } else {
    sheet.text(t.siteName.toUpperCase(), M, logoY + 8, { font: 'display', size: 20, color: t.ink, maxWidth: LOGO_MAX_W });
  }
  sheet.label('Post-game stat sheet', W - M, logoY + 18, { font: 'labelBold', color: t.brand, align: 'right' });
  sheet.label(`${d.leagueName}  /  ${d.seasonName}`, W - M, logoY + 5, { align: 'right', maxWidth: CW - LOGO_MAX_W - 20 });

  // Teams and score.
  const team1Won = d.team1Score > d.team2Score;
  const team2Won = d.team2Score > d.team1Score;
  const NAME_W = 148;
  const nameTop = base + 124;

  const teamBlock = (name: string, side: 'home' | 'away', won: boolean) => {
    const right = side === 'away';
    const x = right ? W - M - 12 : M + 12;
    const align: Align = right ? 'right' : 'left';
    const { lines, size } = teamNameLines(sheet, sheet.heading(name), NAME_W);
    sheet.rect(right ? W - M - 3 : M, nameTop - 62, 3, 66, side === 'home' ? t.home : t.away);
    sheet.label(side === 'home' ? 'Home' : 'Away', x, nameTop - 4, { color: side === 'home' ? t.home : t.away, font: 'labelBold', align });
    let y = nameTop - 8 - size;
    for (const line of lines) {
      sheet.text(line, x, y, { font: 'display', size, color: t.cream, maxWidth: NAME_W, align });
      y -= size + 2;
    }
    if (won) sheet.label('Winner', x, y - 4, { color: t.brandSoft, align });
  };
  teamBlock(d.team1Name, 'home', team1Won);
  teamBlock(d.team2Name, 'away', team2Won);

  const mid = W / 2;
  const scoreY = nameTop - 50;
  const tie = !team1Won && !team2Won;
  sheet.text(String(d.team1Score), mid - 14, scoreY, { font: 'display', size: 44, align: 'right', color: team1Won || tie ? t.cream : t.creamDim });
  sheet.text('–', mid, scoreY + 6, { font: 'display', size: 26, align: 'center', color: t.creamDim });
  sheet.text(String(d.team2Score), mid + 14, scoreY, { font: 'display', size: 44, color: team2Won || tie ? t.cream : t.creamDim });
  sheet.label('Final', mid, scoreY - 18, { align: 'center', font: 'labelBold', color: t.brandSoft });

  // Bottom strip: date and result.
  const bottomY = base + 16;
  sheet.line(M, bottomY + 14, W - M, bottomY + 14, t.nightBorder);
  sheet.label(d.playedOn, M, bottomY, { color: t.creamDim });
  sheet.text(d.resultLabel, W - M, bottomY, { align: 'right', size: 8, color: t.cream, maxWidth: CW - 200 });

  sheet.y = base - 22;
}

function drawSectionHeader(sheet: Sheet, index: number, title: string, subtitle?: string) {
  const { t } = sheet;
  sheet.ensure(subtitle ? 70 : 58);
  const y = sheet.y;
  sheet.label(String(index).padStart(2, '0'), M, y - 8, { font: 'labelBold', color: t.brand });
  sheet.text(sheet.heading(title), M + 22, y - 12, { font: 'display', size: 16, color: t.ink, maxWidth: CW - 22 });
  let bottom = y - 20;
  if (subtitle) {
    sheet.label(subtitle, M + 22, y - 26, { maxWidth: CW - 22 });
    bottom = y - 34;
  }
  sheet.line(M, bottom, W - M, bottom, t.border, 0.6);
  sheet.y = bottom - 4;
}

/** Column header row: team colour rule on top, label-style text on the panel tint. */
function drawTableHead(sheet: Sheet, height: number, accent: RGB | null, draw: (baseline: number) => void) {
  const top = sheet.y;
  sheet.rect(M, top - height, CW, height, sheet.t.panel);
  if (accent) sheet.rect(M, top - 2, CW, 2, accent);
  draw(top - height + (height - 6.5) / 2 + 1);
  sheet.y = top - height;
}

function drawTeamComparison(sheet: Sheet, d: MatchStatSheetData) {
  const { t } = sheet;
  drawSectionHeader(sheet, 1, 'Team comparison');

  const a = d.team1Totals;
  const b = d.team2Totals;
  const stats: Array<{ label: string; left: string; right: string; l: number; r: number; lowerWins?: boolean }> = [
    { label: 'Points', left: String(a.points), right: String(b.points), l: a.points, r: b.points },
    { label: 'Field goals', left: `${a.fieldGoals}  ${a.fieldGoalPercentage}`, right: `${b.fieldGoals}  ${b.fieldGoalPercentage}`, l: parseFloat(a.fieldGoalPercentage), r: parseFloat(b.fieldGoalPercentage) },
    { label: '3-pointers', left: `${a.threePointers}  ${a.threePointPercentage}`, right: `${b.threePointers}  ${b.threePointPercentage}`, l: parseFloat(a.threePointPercentage), r: parseFloat(b.threePointPercentage) },
    { label: 'Free throws', left: `${a.freeThrows}  ${a.freeThrowPercentage}`, right: `${b.freeThrows}  ${b.freeThrowPercentage}`, l: parseFloat(a.freeThrowPercentage), r: parseFloat(b.freeThrowPercentage) },
    { label: 'Rebounds', left: String(a.rebounds), right: String(b.rebounds), l: a.rebounds, r: b.rebounds },
    { label: 'Assists', left: String(a.assists), right: String(b.assists), l: a.assists, r: b.assists },
    { label: 'Steals', left: String(a.steals), right: String(b.steals), l: a.steals, r: b.steals },
    { label: 'Blocks', left: String(a.blocks), right: String(b.blocks), l: a.blocks, r: b.blocks },
    { label: 'Turnovers', left: String(a.turnovers), right: String(b.turnovers), l: a.turnovers, r: b.turnovers, lowerWins: true },
    { label: 'Fouls', left: String(a.fouls), right: String(b.fouls), l: a.fouls, r: b.fouls, lowerWins: true },
  ];

  const ROW_H = 19;
  sheet.ensure(22 + stats.length * ROW_H);
  drawTableHead(sheet, 22, null, (by) => {
    sheet.rect(M + 10, by + 1, 5, 5, t.home);
    sheet.text(d.team1Name, M + 20, by, { font: 'bodyBold', size: 8, maxWidth: 190 });
    sheet.label('Category', W / 2, by, { align: 'center' });
    sheet.rect(W - M - 15, by + 1, 5, 5, t.away);
    sheet.text(d.team2Name, W - M - 20, by, { font: 'bodyBold', size: 8, maxWidth: 190, align: 'right' });
  });

  stats.forEach((s, i) => {
    const rowY = sheet.y - ROW_H;
    if (i % 2 === 1) sheet.rect(M, rowY, CW, ROW_H, t.zebra);
    const leftWins = s.lowerWins ? s.l < s.r : s.l > s.r;
    const rightWins = s.lowerWins ? s.r < s.l : s.r > s.l;
    const by = rowY + 6.5;
    sheet.text(s.left, M + 20, by, { font: leftWins ? 'bodyBold' : 'body', size: 8.5, color: leftWins ? t.ink : t.muted });
    if (leftWins) sheet.rect(M + 10, by + 1.5, 3, 3, t.home);
    sheet.label(s.label, W / 2, by + 0.5, { align: 'center', color: t.soft });
    sheet.text(s.right, W - M - 20, by, { font: rightWins ? 'bodyBold' : 'body', size: 8.5, color: rightWins ? t.ink : t.muted, align: 'right' });
    if (rightWins) sheet.rect(W - M - 13, by + 1.5, 3, 3, t.away);
    sheet.y = rowY;
  });
  sheet.line(M, sheet.y, W - M, sheet.y, t.border, 0.6);
  sheet.y -= 22;
}

function drawShotSummary(sheet: Sheet, d: MatchStatSheetData) {
  const { t } = sheet;
  drawSectionHeader(sheet, 2, 'Shooting');

  const rows = [
    { label: 'Field goals', a: d.team1Totals.fieldGoals, ap: d.team1Totals.fieldGoalPercentage, b: d.team2Totals.fieldGoals, bp: d.team2Totals.fieldGoalPercentage },
    { label: '3-pointers', a: d.team1Totals.threePointers, ap: d.team1Totals.threePointPercentage, b: d.team2Totals.threePointers, bp: d.team2Totals.threePointPercentage },
    { label: 'Free throws', a: d.team1Totals.freeThrows, ap: d.team1Totals.freeThrowPercentage, b: d.team2Totals.freeThrows, bp: d.team2Totals.freeThrowPercentage },
  ];

  const ROW_H = 30;
  const COL_A = M + 120;
  const COL_B = M + 120 + 205;
  const BAR_W = 180;
  sheet.ensure(rows.length * ROW_H + 8);

  const bar = (x: number, y: number, pct: string, color: RGB) => {
    sheet.rect(x, y, BAR_W, 4, t.panel);
    sheet.rect(x, y, (BAR_W * Math.min(100, parseFloat(pct) || 0)) / 100, 4, color);
  };

  rows.forEach((r) => {
    const rowY = sheet.y - ROW_H;
    sheet.label(r.label, M, rowY + 13, { color: t.ink, font: 'labelBold' });
    sheet.text(r.a, COL_A, rowY + 16, { font: 'bodyBold', size: 9 });
    sheet.text(r.ap, COL_A + BAR_W, rowY + 16, { size: 8, color: t.muted, align: 'right' });
    bar(COL_A, rowY + 7, r.ap, t.home);
    sheet.text(r.b, COL_B, rowY + 16, { font: 'bodyBold', size: 9 });
    sheet.text(r.bp, COL_B + BAR_W, rowY + 16, { size: 8, color: t.muted, align: 'right' });
    bar(COL_B, rowY + 7, r.bp, t.away);
    sheet.line(M, rowY, W - M, rowY, t.border, 0.4);
    sheet.y = rowY;
  });
  sheet.y -= 22;
}

// Player table columns; widths sum to CW (523).
const ROSTER_COLS = [
  { key: 'number', label: '#', width: 22, align: 'center' },
  { key: 'player', label: 'Player', width: 132, align: 'left' },
  { key: 'role', label: 'GS', width: 20, align: 'center' },
  { key: 'min', label: 'MIN', width: 26, align: 'right' },
  { key: 'pts', label: 'PTS', width: 30, align: 'right' },
  { key: 'fg', label: 'FG', width: 42, align: 'right' },
  { key: 'tp', label: '3PT', width: 40, align: 'right' },
  { key: 'ft', label: 'FT', width: 40, align: 'right' },
  { key: 'reb', label: 'REB', width: 30, align: 'right' },
  { key: 'ast', label: 'AST', width: 29, align: 'right' },
  { key: 'stl', label: 'STL', width: 28, align: 'right' },
  { key: 'blk', label: 'BLK', width: 28, align: 'right' },
  { key: 'tov', label: 'TO', width: 28, align: 'right' },
  { key: 'pf', label: 'PF', width: 28, align: 'right' },
] as const;

type RosterKey = (typeof ROSTER_COLS)[number]['key'];

function drawRosterRow(sheet: Sheet, row: Record<RosterKey, string>, baseline: number, o: { bold?: boolean; color?: RGB } = {}) {
  let x = M;
  for (const col of ROSTER_COLS) {
    const value = row[col.key];
    const font: FontKey = o.bold || col.key === 'pts' ? 'bodyBold' : 'body';
    const at = col.align === 'right' ? x + col.width - 6 : col.align === 'center' ? x + col.width / 2 : x + 4;
    sheet.text(value, at, baseline, { font, size: 8, align: col.align, maxWidth: col.width - 8, color: o.color });
    x += col.width;
  }
}

function drawRosterTable(sheet: Sheet, index: number, side: 'home' | 'away', teamName: string, totals: TeamTotalsRow, rows: PlayerStatRow[]) {
  const { t } = sheet;
  const accent = side === 'home' ? t.home : t.away;
  const subtitle = `${totals.points} pts  ·  FG ${totals.fieldGoals} ${totals.fieldGoalPercentage}  ·  3PT ${totals.threePointers} ${totals.threePointPercentage}  ·  FT ${totals.freeThrows} ${totals.freeThrowPercentage}`;
  drawSectionHeader(sheet, index, `${teamName} box score`, subtitle);

  const HEAD_H = 20;
  const ROW_H = 18;
  const TOTALS_H = 20;

  const head = () =>
    drawTableHead(sheet, HEAD_H, accent, (by) => {
      let x = M;
      for (const col of ROSTER_COLS) {
        const at = col.align === 'right' ? x + col.width - 6 : col.align === 'center' ? x + col.width / 2 : x + 4;
        sheet.label(col.label, at, by, { font: 'labelBold', size: 6, tracking: 0.6, align: col.align });
        x += col.width;
      }
    });

  sheet.ensure(HEAD_H + ROW_H * 2 + TOTALS_H);
  head();

  rows.forEach((r, i) => {
    if (sheet.ensure(ROW_H + TOTALS_H)) head();
    const rowY = sheet.y - ROW_H;
    if (i % 2 === 1) sheet.rect(M, rowY, CW, ROW_H, t.zebra);
    drawRosterRow(sheet, {
      number: r.jerseyNumber,
      player: r.player,
      role: r.starterLabel === 'Starter' ? 'S' : '',
      min: r.minutes,
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
    }, rowY + 6);
    sheet.y = rowY;
  });

  if (!rows.length) {
    const rowY = sheet.y - ROW_H;
    sheet.text('No players recorded for this team.', M + 4, rowY + 6, { size: 8, color: t.muted });
    sheet.y = rowY;
  }

  if (sheet.ensure(TOTALS_H)) head();
  const totalsY = sheet.y - TOTALS_H;
  sheet.line(M, sheet.y, W - M, sheet.y, t.ink, 0.8);
  drawRosterRow(sheet, {
    number: '',
    player: 'Totals',
    role: '',
    min: totals.minutes,
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
  }, totalsY + 7, { bold: true });
  sheet.line(M, totalsY, W - M, totalsY, t.border, 0.6);
  sheet.y = totalsY - 24;
}

function drawManualNote(sheet: Sheet) {
  const { t } = sheet;
  drawSectionHeader(sheet, 1, 'Result only');
  const boxH = 46;
  const top = sheet.y - 6;
  sheet.rect(M, top - boxH, CW, boxH, t.panel);
  sheet.rect(M, top - boxH, 3, boxH, t.brand);
  sheet.text('This score was entered manually.', M + 14, top - 19, { font: 'bodyBold', size: 9 });
  sheet.text('No play-by-play was tracked, so there are no team or player stats for this match.', M + 14, top - 33, { size: 8, color: t.muted, maxWidth: CW - 28 });
  sheet.y = top - boxH - 20;
}

function drawFooters(sheet: Sheet, d: MatchStatSheetData) {
  const { t } = sheet;
  const total = sheet.pages.length;
  const legend = 'GS S = starter · MIN minutes · FG field goals · 3PT three-pointers · FT free throws · REB rebounds · AST assists · STL steals · BLK blocks · TO turnovers · PF fouls';
  sheet.pages.forEach((page, i) => {
    sheet.page = page;
    sheet.line(M, M + 24, W - M, M + 24, t.border, 0.6);
    sheet.label(`${t.siteName}  ·  ${d.team1Name} vs ${d.team2Name}`, M, M + 13, { size: 6, color: t.muted, maxWidth: CW - 80 });
    sheet.label(`Page ${i + 1} / ${total}`, W - M, M + 13, { size: 6, color: t.muted, align: 'right', font: 'labelBold' });
    if (!d.manualScore) sheet.label(legend, M, M + 3, { size: 5, tracking: 0, color: t.soft, maxWidth: CW });
  });
}

// ---------- render ----------

/** Embeds a PNG or JPEG logo; anything else (SVG, WebP) or a bad file is skipped. */
async function embedLogo(doc: PDFDocument, bytes: Uint8Array | null | undefined): Promise<PDFImage | null> {
  if (!bytes || bytes.length < 4) return null;
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return await doc.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
  } catch (error) {
    console.warn('Stat sheet logo could not be embedded:', error);
  }
  return null;
}

export async function renderStatSheetPdf(
  d: MatchStatSheetData,
  theme: StatSheetTheme,
  fontBytes: StatSheetFontBytes,
  logoBytes?: Uint8Array | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const embed = (bytes: Uint8Array) => doc.embedFont(bytes, { subset: true });
  const [display, body, bodyBold, label, labelBold] = await Promise.all([
    embed(fontBytes.display),
    embed(fontBytes.body),
    embed(fontBytes.bodyBold),
    embed(fontBytes.label),
    embed(fontBytes.labelBold),
  ]);

  doc.setTitle(`${d.matchTitle} — stat sheet`);
  doc.setAuthor(theme.siteName);
  doc.setCreator(theme.siteName);

  const sheet = new Sheet(doc, { display, body, bodyBold, label, labelBold }, theme, await embedLogo(doc, logoBytes));
  sheet.newPage();
  drawHeader(sheet, d);
  if (d.manualScore) {
    drawManualNote(sheet);
  } else {
    drawTeamComparison(sheet, d);
    drawShotSummary(sheet, d);
    drawRosterTable(sheet, 3, 'home', d.team1Name, d.team1Totals, d.team1Rows);
    drawRosterTable(sheet, 4, 'away', d.team2Name, d.team2Totals, d.team2Rows);
  }
  drawFooters(sheet, d);

  return doc.save();
}
