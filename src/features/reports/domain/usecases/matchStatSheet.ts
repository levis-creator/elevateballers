import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';
import { prisma } from '../../../../lib/prisma';
import { getMatchWithFullDetails } from '../../../cms/lib/queries';
import { formatMinutes, secondsPlayed, type MinutesEvent } from '../../../game-tracking/domain/live-console/minutes';
import { toConsoleRules } from '../../../game-tracking/domain/live-console/rules';
import { collectShots, fieldGoalAttempts } from '../../../game-tracking/domain/live-console/shotChart';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';
import { calculatePlayerMatchStats, type PlayerMatchStatistics } from '../../../player/lib/playerStats';
import {
  siteSettingsService,
  resolvePublicBrandSettings,
  resolvePublicHeaderSettings,
  resolveStatSheetSettings,
} from '../../../settings';
import type { PublicBrandSettings } from '../../../settings/application/brandSettings';
import {
  STAT_SHEET_FONT_FILES,
  buildStatSheetTheme,
  renderStatSheetPdf,
  type MatchStatSheetData,
  type PlayerStatRow,
  type StatSheetFontBytes,
  type TeamTotalsRow,
} from './statSheetPdf';

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

// ---------- fonts ----------

// Font bytes per file, read once per process. The files ship in
// src/assets/fonts/stat-sheet (listed in the Vercel includeFiles).
const fontCache = new Map<string, Uint8Array>();

async function readFontFile(name: string): Promise<Uint8Array> {
  const cached = fontCache.get(name);
  if (cached) return cached;
  const here = dirname(fileURLToPath(import.meta.url));
  const bases = [
    join(here, '../../../../assets/fonts/stat-sheet'),
    join(process.cwd(), 'src/assets/fonts/stat-sheet'),
  ];
  for (const base of bases) {
    try {
      const bytes = new Uint8Array(await readFile(join(base, name)));
      fontCache.set(name, bytes);
      return bytes;
    } catch {
      // try next
    }
  }
  throw new Error(`Stat sheet font ${name} not found in src/assets/fonts/stat-sheet`);
}

export async function loadStatSheetFonts(typefaces: Pick<PublicBrandSettings, 'display' | 'body' | 'label'>): Promise<StatSheetFontBytes> {
  const [body, bodyBold] = STAT_SHEET_FONT_FILES.body[typefaces.body];
  const [label, labelBold] = STAT_SHEET_FONT_FILES.label[typefaces.label];
  const [d, b, bb, l, lb] = await Promise.all(
    [STAT_SHEET_FONT_FILES.display[typefaces.display], body, bodyBold, label, labelBold].map(readFontFile),
  );
  return { display: d, body: b, bodyBold: bb, label: l, labelBold: lb };
}

// ---------- data building ----------

type SheetPlayer = {
  playerId: string;
  started: boolean;
  jerseyNumber: number | null;
  minutesPlayed?: number | null;
  player: { firstName?: string | null; lastName?: string | null };
};

/**
 * Seconds per player from the substitution log, or null when it can't be
 * trusted: no substitutions were logged yet a bench player has stats, which
 * means the scorer tracked the game without recording subs.
 */
function minutesFromEvents(
  players: SheetPlayer[],
  events: Array<MinutesEvent & { eventType: any }>,
  rules: ReturnType<typeof toConsoleRules>,
): Map<string, number> | null {
  const live = events.filter((e) => !e.isUndone);
  const subs = live.some((e) => e.eventType === 'SUBSTITUTION_IN' || e.eventType === 'SUBSTITUTION_OUT');
  if (!subs) {
    const bench = new Set(players.filter((p) => !p.started).map((p) => p.playerId));
    if (live.some((e) => e.playerId && bench.has(e.playerId))) return null;
  }
  return secondsPlayed(players, live, rules);
}

function buildTeamRows(
  teamName: string,
  players: SheetPlayer[],
  safeEvents: Array<{ playerId: string | null; isUndone?: boolean; eventType: any }>,
  seconds: Map<string, number> | null,
): { rows: PlayerStatRow[]; totals: TeamTotalsRow } {
  // An admin-entered minutesPlayed wins over the event-log figure.
  const secondsFor = (p: SheetPlayer) =>
    p.minutesPlayed != null ? p.minutesPlayed * 60 : seconds?.get(p.playerId) ?? null;
  const known = players.map(secondsFor);
  const teamSeconds = known.every((s) => s != null) && known.length ? known.reduce((a, s) => a! + s!, 0) : null;

  const rows = players.map((matchPlayer, i) => {
    const stats = calculatePlayerMatchStats(matchPlayer.playerId, safeEvents);
    return {
      team: teamName,
      player: `${matchPlayer.player.firstName || ''} ${matchPlayer.player.lastName || ''}`.trim() || 'Unknown Player',
      jerseyNumber: matchPlayer.jerseyNumber === null ? '-' : String(matchPlayer.jerseyNumber),
      starterLabel: matchPlayer.started ? 'Starter' : 'Bench',
      minutes: formatMinutes(known[i]),
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
      minutes: teamSeconds == null ? '' : formatMinutes(teamSeconds),
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

  const gameRules = match.gameRulesId
    ? await prisma.gameRules.findUnique({ where: { id: match.gameRulesId } }).catch(() => null)
    : null;
  const rules = toConsoleRules(gameRules);
  const teamSeconds = (players: SheetPlayer[], teamId: string | null) =>
    minutesFromEvents(players, safeEvents.filter((e) => e.teamId === teamId), rules);

  const team1Stats = buildTeamRows(team1Name, team1Players, safeEvents, teamSeconds(team1Players, match.team1Id));
  const team2Stats = buildTeamRows(team2Name, team2Players, safeEvents, teamSeconds(team2Players, match.team2Id));

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
    team1Score,
    team2Score,
    manualScore: match.scoreSource === 'MANUAL',
    shots: {
      home: collectShots(safeEvents, match.team1Id),
      away: collectShots(safeEvents, match.team2Id),
      homeAttempts: fieldGoalAttempts(safeEvents, match.team1Id),
      awayAttempts: fieldGoalAttempts(safeEvents, match.team2Id),
    },
    team1Totals: team1Stats.totals,
    team2Totals: team2Stats.totals,
    team1Rows: team1Stats.rows,
    team2Rows: team2Stats.rows,
  };
}

// ---------- logo ----------

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const logoCache = new Map<string, Uint8Array | null>();

/**
 * The site header logo as bytes. Local paths are read from public/ when the
 * file is on disk (dev, cPanel) and otherwise fetched from the site itself
 * (on Vercel, public/ is served by the CDN, not the function). Returns null
 * when it can't be loaded, so the sheet falls back to the site name.
 */
async function loadLogo(path: string, origin: string | undefined): Promise<Uint8Array | null> {
  if (logoCache.has(path)) return logoCache.get(path)!;
  let bytes: Uint8Array | null = null;
  const absolute = /^https?:\/\//.test(path) ? path : path.startsWith('//') ? `https:${path}` : null;

  if (!absolute) {
    const publicDir = resolve(process.cwd(), 'public');
    const file = resolve(publicDir, `.${decodeURIComponent(path.split(/[?#]/)[0])}`);
    if (file.startsWith(publicDir + sep)) {
      bytes = await readFile(file).then((b) => new Uint8Array(b)).catch(() => null);
    }
  }
  const url = absolute ?? (origin ? new URL(path, origin).href : null);
  if (!bytes && url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const length = Number(res.headers.get('content-length') ?? 0);
      if (res.ok && length <= MAX_LOGO_BYTES) {
        const body = new Uint8Array(await res.arrayBuffer());
        if (body.length <= MAX_LOGO_BYTES) bytes = body;
      }
    } catch (error) {
      console.warn('Stat sheet logo could not be fetched:', error);
    }
  }
  if (bytes) logoCache.set(path, bytes);
  return bytes;
}

// ---------- render ----------

/** `origin` is the site's own origin, used to fetch a logo stored under public/. */
export async function generateMatchStatSheetPDF(matchId: string, origin?: string): Promise<{ pdf: Uint8Array; fileName: string }> {
  const [data, settings] = await Promise.all([
    buildStatSheetData(matchId),
    siteSettingsService.list().catch(() => []),
  ]);
  const brand = resolvePublicBrandSettings(settings);
  const { logo: sheetLogo, ...options } = resolveStatSheetSettings(settings);
  const logoPath = sheetLogo || resolvePublicHeaderSettings(settings).logo;
  const [fonts, logo] = await Promise.all([loadStatSheetFonts(brand), loadLogo(logoPath, origin)]);
  const pdf = await renderStatSheetPdf(data, buildStatSheetTheme(brand), fonts, logo, options);
  return { pdf, fileName: data.fileName };
}
