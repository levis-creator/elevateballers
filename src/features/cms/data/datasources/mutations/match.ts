import { prisma } from '../../../../../lib/prisma';
import { getEnvBoolean } from '../../../../../lib/env';
import { ensureMatchSlug } from '../../../../matches/lib/slug';
import type { CreateMatchInput, UpdateMatchInput, Match } from '../../../types';
import { resolveLeagueSeasonScope } from '../../../../seasons/data/league-season-scope';
import {
  FixtureScopeError,
  fixtureSchedulingError,
} from '../../../../matches/domain/usecases/fixture-scheduling';

async function assertTeamsParticipate(
  leagueSeasonId: string,
  teamIds: Array<string | undefined>,
): Promise<void> {
  const ids = [...new Set(teamIds.filter(Boolean))] as string[];
  if (!ids.length) return;
  const count = await prisma.seasonTeam.count({
    where: { leagueSeasonId, teamId: { in: ids } },
  });
  if (count !== ids.length) {
    throw new FixtureScopeError('Every selected team must participate in the selected league season');
  }
}

function assertCompetitionTeamSlots(
  team1Id: string | null | undefined,
  team2Id: string | null | undefined,
  team1Name?: string | null,
  team2Name?: string | null,
): void {
  const placeholder = (id: string | null | undefined, name?: string | null) =>
    Boolean(id) || name === 'TBD' || name === 'BYE';
  if (!placeholder(team1Id, team1Name) || !placeholder(team2Id, team2Name)) {
    throw new FixtureScopeError(
      'Competition fixtures must use participating teams; only TBD or BYE bracket placeholders are allowed.',
    );
  }
}

async function assertFixtureSchedule(
  leagueSeasonId: string,
  fixtureDate: Date | string,
): Promise<void> {
  const competition = await prisma.leagueSeason.findUnique({
    where: { id: leagueSeasonId },
    select: { startDate: true, endDate: true, status: true },
  });
  if (!competition) throw new FixtureScopeError('The selected league competition does not exist');
  const error = fixtureSchedulingError(competition, fixtureDate);
  if (error) throw new FixtureScopeError(error);
}

export async function createMatch(data: CreateMatchInput): Promise<Match> {
  if (data.team1Id && data.team2Id && data.team1Id === data.team2Id) {
    throw new Error('A team cannot be matched against itself');
  }

  if (
    !data.team1Id && !data.team2Id &&
    data.team1Name && data.team2Name &&
    data.team1Name === data.team2Name &&
    data.team1Name !== 'TBD' && data.team2Name !== 'TBD' &&
    data.team1Name !== 'BYE' && data.team2Name !== 'BYE'
  ) {
    throw new Error('A team cannot be matched against itself');
  }

  const matchData: any = {
    date: new Date(data.date),
    team1Score: data.team1Score,
    team2Score: data.team2Score,
    status: data.status || 'UPCOMING',
    resultPublishedAt: data.resultPublishedAt ?? null,
  };

  if (data.stage && data.stage.trim() !== '') matchData.stage = data.stage;

  if (data.leagueSeasonId || (data.seasonId && data.leagueId)) {
    const scope = await resolveLeagueSeasonScope(data);
    await assertFixtureSchedule(scope.leagueSeasonId, data.date);
    assertCompetitionTeamSlots(data.team1Id, data.team2Id, data.team1Name, data.team2Name);
    await assertTeamsParticipate(scope.leagueSeasonId, [data.team1Id, data.team2Id]);
    Object.assign(matchData, scope);
    matchData.leagueName = null;
  } else if (data.leagueId) {
    matchData.league = { connect: { id: data.leagueId } };
  } else {
    matchData.leagueName = data.league || '';
  }

  if (data.team1Id) {
    matchData.team1 = { connect: { id: data.team1Id } };
  } else {
    matchData.team1Name = data.team1Name || '';
    matchData.team1Logo = data.team1Logo || '';
  }

  if (data.team2Id) {
    matchData.team2 = { connect: { id: data.team2Id } };
  } else {
    matchData.team2Name = data.team2Name || '';
    matchData.team2Logo = data.team2Logo || '';
  }

  if (data.nextWinnerMatchId !== undefined) matchData.nextWinnerMatchId = data.nextWinnerMatchId;
  if (data.nextLoserMatchId !== undefined) matchData.nextLoserMatchId = data.nextLoserMatchId;
  if (data.bracketPosition !== undefined) matchData.bracketPosition = data.bracketPosition;
  if (data.bracketRound !== undefined) matchData.bracketRound = data.bracketRound;
  if (data.bracketType !== undefined) matchData.bracketType = data.bracketType;

  const created = await prisma.match.create({
    data: matchData,
    include: { team1: true, team2: true, league: true, season: true },
  });

  // Generate the public URL slug now that the row (and its team relations)
  // exist. Failures shouldn't block creation — slug can be backfilled later.
  try {
    await ensureMatchSlug(created.id);
  } catch (err) {
    console.warn('createMatch: failed to generate slug', err);
  }

  // A match created already marked COMPLETED (e.g. backfilling a played playoff
  // result) needs its winner resolved from the scores and, if bracket
  // automation is on, the winner advanced — mirroring updateMatch's behaviour so
  // the bracket works whether a result is entered on create or on edit.
  if (created.status === 'COMPLETED') {
    const { updateMatchWinner } = await import('../../../../game-tracking/lib/score-calculation');
    await updateMatchWinner(created.id, prisma);

    if (getEnvBoolean('ENABLE_AUTOMATCHING', true)) {
      const { advanceWinnerToNextMatch } = await import('../../../../tournaments/lib/bracket-automation');
      await advanceWinnerToNextMatch(created.id, prisma);
    }
  }

  return created;
}

export async function updateMatch(id: string, data: UpdateMatchInput): Promise<Match | null> {
  const updateData: any = {};

  if (data.date) updateData.date = new Date(data.date);
  if (data.team1Score !== undefined) updateData.team1Score = data.team1Score;
  if (data.team2Score !== undefined) updateData.team2Score = data.team2Score;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.resultPublishedAt !== undefined) updateData.resultPublishedAt = data.resultPublishedAt;
  if (data.duration !== undefined) updateData.duration = data.duration;

  if (data.stage !== undefined) {
    updateData.stage = data.stage && data.stage.trim() !== '' ? data.stage : null;
  }

  if (data.leagueId !== undefined) {
    if (data.leagueId) {
      updateData.leagueId = data.leagueId;
      updateData.leagueName = null;
    } else {
      updateData.leagueId = null;
      updateData.leagueName = data.league || '';
    }
  } else if (data.league !== undefined) {
    updateData.leagueName = data.league;
  }

  if (data.seasonId !== undefined) {
    updateData.seasonId = data.seasonId || null;
  }

  if (data.team1Id !== undefined) {
    if (data.team1Id) {
      updateData.team1Id = data.team1Id;
      updateData.team1Name = null;
      updateData.team1Logo = null;
    } else {
      updateData.team1Id = null;
      updateData.team1Name = data.team1Name || '';
      updateData.team1Logo = data.team1Logo || '';
    }
  } else if (data.team1Name !== undefined || data.team1Logo !== undefined) {
    if (data.team1Name !== undefined) updateData.team1Name = data.team1Name;
    if (data.team1Logo !== undefined) updateData.team1Logo = data.team1Logo;
  }

  if (data.team2Id !== undefined) {
    if (data.team2Id) {
      updateData.team2Id = data.team2Id;
      updateData.team2Name = null;
      updateData.team2Logo = null;
    } else {
      updateData.team2Id = null;
      updateData.team2Name = data.team2Name || '';
      updateData.team2Logo = data.team2Logo || '';
    }
  } else if (data.team2Name !== undefined || data.team2Logo !== undefined) {
    if (data.team2Name !== undefined) updateData.team2Name = data.team2Name;
    if (data.team2Logo !== undefined) updateData.team2Logo = data.team2Logo;
  }

  try {
    const currentMatch = await prisma.match.findUnique({
      where: { id },
      select: {
        status: true,
        leagueSeasonId: true,
        seasonId: true,
        leagueId: true,
        date: true,
        team1Id: true,
        team2Id: true,
        team1Name: true,
        team2Name: true,
      },
    });
    if (!currentMatch) return null;

    const competitionValidationNeeded =
      data.leagueSeasonId !== undefined ||
      data.seasonId !== undefined ||
      data.leagueId !== undefined ||
      data.team1Id !== undefined ||
      data.team2Id !== undefined ||
      data.date !== undefined;
    if (competitionValidationNeeded && currentMatch.leagueSeasonId) {
      const scope = await resolveLeagueSeasonScope({
        leagueSeasonId: data.leagueSeasonId ?? currentMatch.leagueSeasonId,
        seasonId: data.seasonId ?? currentMatch.seasonId,
        leagueId: data.leagueId ?? currentMatch.leagueId,
      });
      const team1Id = data.team1Id ?? currentMatch.team1Id;
      const team2Id = data.team2Id ?? currentMatch.team2Id;
      assertCompetitionTeamSlots(
        team1Id,
        team2Id,
        data.team1Name ?? currentMatch.team1Name,
        data.team2Name ?? currentMatch.team2Name,
      );
      await assertTeamsParticipate(scope.leagueSeasonId, [team1Id ?? undefined, team2Id ?? undefined]);
      if (
        data.date !== undefined ||
        data.leagueSeasonId !== undefined ||
        data.seasonId !== undefined ||
        data.leagueId !== undefined
      ) {
        await assertFixtureSchedule(scope.leagueSeasonId, data.date ?? currentMatch.date);
      }
      Object.assign(updateData, scope, { leagueName: null });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updateData,
      include: { team1: true, team2: true, league: true, season: true },
    });

    const statusChangedToCompleted =
      data.status === 'COMPLETED' && currentMatch?.status !== 'COMPLETED';
    const scoresUpdatedOnCompletedMatch =
      currentMatch?.status === 'COMPLETED' &&
      (data.team1Score !== undefined || data.team2Score !== undefined);

    if (statusChangedToCompleted || scoresUpdatedOnCompletedMatch) {
      const { updateMatchWinner } = await import('../../../../game-tracking/lib/score-calculation');
      await updateMatchWinner(id, prisma);

      if (getEnvBoolean('ENABLE_AUTOMATCHING', true)) {
        const { advanceWinnerToNextMatch } = await import('../../../../tournaments/lib/bracket-automation');
        await advanceWinnerToNextMatch(id, prisma);
      }
    }

    // Refresh the slug if teams or date changed (it's idempotent when nothing
    // relevant moved). Failures are non-fatal — old slug keeps working.
    const teamOrDateChanged =
      data.team1Id !== undefined ||
      data.team2Id !== undefined ||
      data.team1Name !== undefined ||
      data.team2Name !== undefined ||
      data.date !== undefined;
    if (teamOrDateChanged) {
      try {
        await ensureMatchSlug(id);
      } catch (err) {
        console.warn('updateMatch: failed to refresh slug', err);
      }
    }

    return updatedMatch;
  } catch (error) {
    if (error instanceof FixtureScopeError) throw error;
    console.error('Error updating match:', error);
    return null;
  }
}

export async function deleteMatch(id: string): Promise<boolean> {
  try {
    await prisma.match.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error('Error deleting match:', error);
    return false;
  }
}
