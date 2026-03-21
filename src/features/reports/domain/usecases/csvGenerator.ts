/**
 * CSV Generator
 * Generates CSV files from report data
 */

/**
 * Escape CSV field value
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV from array of objects
 */
export function generateCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => escapeCSVField(row[header])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate CSV from match statistics
 */
export function generateMatchStatisticsCSV(matchData: {
  match: any;
  team1Stats: any;
  team2Stats: any;
  playerStats: any[];
}): string {
  const rows: Record<string, any>[] = [];

  // Match header
  rows.push({
    Type: 'Match',
    'Team 1': matchData.match.team1Name || matchData.match.team1?.name || '',
    'Team 1 Score': matchData.match.team1Score || 0,
    'Team 2': matchData.match.team2Name || matchData.match.team2?.name || '',
    'Team 2 Score': matchData.match.team2Score || 0,
    Date: matchData.match.date ? new Date(matchData.match.date).toLocaleDateString() : '',
  });

  // Team statistics
  if (matchData.team1Stats) {
    rows.push({
      Type: 'Team Statistics',
      Team: matchData.match.team1Name || matchData.match.team1?.name || 'Team 1',
      ...matchData.team1Stats,
    });
  }

  if (matchData.team2Stats) {
    rows.push({
      Type: 'Team Statistics',
      Team: matchData.match.team2Name || matchData.match.team2?.name || 'Team 2',
      ...matchData.team2Stats,
    });
  }

  // Player statistics
  if (matchData.playerStats && matchData.playerStats.length > 0) {
    matchData.playerStats.forEach((playerStat) => {
      rows.push({
        Type: 'Player Statistics',
        ...playerStat,
      });
    });
  }

  return generateCSV(rows);
}

/**
 * Generate CSV from player statistics
 */
export function generatePlayerStatisticsCSV(data: {
  player: any;
  statistics: any;
  matches: any[];
}): string {
  const rows: Record<string, any>[] = [];

  // Player header
  rows.push({
    Type: 'Player',
    Name: `${data.player.firstName || ''} ${data.player.lastName || ''}`.trim(),
    Team: data.player.team?.name || '',
    Position: data.player.position || '',
  });

  // Statistics summary
  if (data.statistics) {
    rows.push({
      Type: 'Statistics Summary',
      ...data.statistics,
    });
  }

  // Match-by-match statistics
  if (data.matches && data.matches.length > 0) {
    data.matches.forEach((match) => {
      rows.push({
        Type: 'Match',
        Date: match.date ? new Date(match.date).toLocaleDateString() : '',
        Opponent: match.opponent || '',
        ...match.stats,
      });
    });
  }

  return generateCSV(rows);
}

/**
 * Generate CSV from play-by-play data
 */
export function generatePlayByPlayCSV(events: any[]): string {
  const rows = events.map((event) => ({
    Quarter: event.period,
    Time: event.secondsRemaining
      ? `${Math.floor(event.secondsRemaining / 60)}:${(event.secondsRemaining % 60).toString().padStart(2, '0')}`
      : `${event.minute}'`,
    Event: event.eventType,
    Player: event.player ? `${event.player.firstName || ''} ${event.player.lastName || ''}`.trim() : '',
    Team: event.team?.name || '',
    Description: event.description || '',
  }));

  return generateCSV(rows);
}
