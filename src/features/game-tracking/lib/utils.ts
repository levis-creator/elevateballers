/**
 * Game tracking utility functions
 * Clock utilities, quarter management, and game state helpers
 */

/**
 * Format seconds to MM:SS display format
 */
export function formatClockTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) {
    return '00:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Parse MM:SS format to seconds
 */
export function parseClockTime(timeString: string): number | null {
  const parts = timeString.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
    return null;
  }

  return minutes * 60 + seconds;
}

/**
 * Calculate total seconds for a quarter based on minutes
 */
export function periodSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Check if quarter is overtime
 */
export function isOvertimePeriod(period: number, numberOfPeriods: number): boolean {
  return period > numberOfPeriods;
}

/**
 * Get quarter label (e.g., "1st", "2nd", "Halftime", "OT1", "OT2")
 */
export function getPeriodLabel(period: number, numberOfPeriods: number = 4, halftimePeriod: number = 2): string {
  if (period <= numberOfPeriods) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = period % 10;
    const suffix = remainder <= 3 && Math.floor(period / 10) !== 1 ? suffixes[remainder] || 'th' : 'th';
    return `${period}${suffix}`;
  }

  const otNumber = period - numberOfPeriods;
  return `OT${otNumber}`;
}

/**
 * Check if a quarter ends at halftime
 */
export function isHalftimePeriod(period: number, halftimePeriod: number): boolean {
  return period === halftimePeriod;
}

/**
 * Check if we're transitioning to/from halftime
 */
export function isHalftimeTransition(currentPeriod: number, nextPeriod: number, halftimePeriod: number): boolean {
  return currentPeriod === halftimePeriod && nextPeriod === halftimePeriod + 1;
}

/**
 * Calculate next sequence number for a match event
 * Note: This function requires prisma to be passed or imported where used
 */
export async function getNextSequenceNumber(
  matchId: string,
  prismaClient: any
): Promise<number> {
  const lastEvent = await prismaClient.matchEvent.findFirst({
    where: {
      matchId,
      isUndone: false,
    },
    orderBy: {
      sequenceNumber: 'desc',
    },
    select: {
      sequenceNumber: true,
    },
  });

  return (lastEvent?.sequenceNumber ?? 0) + 1;
}

/**
 * Check if team is in bonus (one-and-one free throws)
 */
export function isInBonus(teamFouls: number, foulsForBonus: number): boolean {
  return teamFouls >= foulsForBonus && teamFouls < foulsForBonus * 2;
}

/**
 * Check if team is in double bonus (two free throws)
 */
export function isInDoubleBonus(teamFouls: number, foulsForBonus: number): boolean {
  return teamFouls >= foulsForBonus * 2;
}

/**
 * Get bonus status text
 */
export function getBonusStatus(teamFouls: number, foulsForBonus: number): string {
  if (isInDoubleBonus(teamFouls, foulsForBonus)) {
    return 'Double Bonus';
  }
  if (isInBonus(teamFouls, foulsForBonus)) {
    return 'Bonus';
  }
  return '';
}

/**
 * Validate clock seconds (must be non-negative and within quarter length)
 */
export function validateClockSeconds(
  seconds: number,
  periodMinutes: number
): boolean {
  const maxSeconds = periodMinutes * 60;
  return seconds >= 0 && seconds <= maxSeconds;
}

/**
 * Calculate quarter start time based on quarter number and quarter length
 */
export function calculatePeriodStartTime(
  period: number,
  periodLengthMinutes: number,
  gameStartTime: Date
): Date {
  const periodsBefore = period - 1;
  const minutesOffset = periodsBefore * periodLengthMinutes;
  const startTime = new Date(gameStartTime);
  startTime.setMinutes(startTime.getMinutes() + minutesOffset);
  return startTime;
}

/**
 * Calculate remaining fouls until bonus
 */
export function getFoulsUntilBonus(teamFouls: number, foulsForBonus: number): number {
  return Math.max(0, foulsForBonus - teamFouls);
}

/**
 * Calculate score difference and determine leader
 */
export function calculateScoreDifference(
  team1Score: number,
  team2Score: number
): { diff: number; leader: 'team1' | 'team2' | 'tie' } {
  const diff = Math.abs(team1Score - team2Score);
  
  if (team1Score > team2Score) {
    return { diff, leader: 'team1' };
  } else if (team2Score > team1Score) {
    return { diff, leader: 'team2' };
  } else {
    return { diff: 0, leader: 'tie' };
  }
}
