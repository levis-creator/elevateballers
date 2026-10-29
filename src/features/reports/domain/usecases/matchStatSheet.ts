import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getMatchWithFullDetails } from '../../../cms/lib/queries';
import { MATCH_TIMEZONE } from '../../../matches/domain/usecases/utils';
import { calculatePlayerMatchStats, type PlayerMatchStatistics } from '../../../player/lib/playerStats';
import { siteSettingsService, resolvePublicBrandSettings } from '../../../settings';
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
    team1Totals: team1Stats.totals,
    team2Totals: team2Stats.totals,
    team1Rows: team1Stats.rows,
    team2Rows: team2Stats.rows,
  };
}

// ---------- render ----------

export async function generateMatchStatSheetPDF(matchId: string): Promise<{ pdf: Uint8Array; fileName: string }> {
  const [data, brandRecords] = await Promise.all([
    buildStatSheetData(matchId),
    siteSettingsService.list('brand').catch(() => []),
  ]);
  const brand = resolvePublicBrandSettings(brandRecords);
  const pdf = await renderStatSheetPdf(data, buildStatSheetTheme(brand), await loadStatSheetFonts(brand));
  return { pdf, fileName: data.fileName };
}
