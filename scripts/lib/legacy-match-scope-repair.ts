export interface RepairLeagueSeason {
	id: string | null;
	seasonId: string;
	leagueId: string;
	startDate: Date;
	endDate: Date;
}

export interface RepairMatch {
	id: string;
	date: Date;
	seasonId: string | null;
	leagueId: string | null;
	leagueSeasonId: string | null;
	team1Id: string | null;
	team2Id: string | null;
}

export interface RepairParticipation {
	teamId: string;
	seasonId: string;
	leagueId: string;
}

export function planLegacyMatchScopeRepair(
	matches: RepairMatch[],
	leagueSeasons: RepairLeagueSeason[],
	participations: RepairParticipation[],
) {
	const participationKeys = new Set(
		participations.map((row) => `${row.teamId}:${row.seasonId}:${row.leagueId}`),
	);
	const updates: Array<{
		matchId: string;
		expectedLeagueId: string;
		seasonId: string;
		leagueSeasonId: string | null;
	}> = [];
	const blockers: Array<{ matchId: string; reason: string; candidateCount: number }> = [];

	for (const match of matches) {
		if (match.seasonId || !match.leagueId || !match.team1Id || !match.team2Id) {
			blockers.push({
				matchId: match.id,
				reason: "Match is not eligible: expected a missing season plus league and both team IDs.",
				candidateCount: 0,
			});
			continue;
		}

		const candidates = leagueSeasons.filter((candidate) => {
			if (candidate.leagueId !== match.leagueId) return false;
			if (match.date < candidate.startDate || match.date > candidate.endDate) return false;
			return (
				participationKeys.has(
					`${match.team1Id}:${candidate.seasonId}:${candidate.leagueId}`,
				) &&
				participationKeys.has(
					`${match.team2Id}:${candidate.seasonId}:${candidate.leagueId}`,
				)
			);
		});

		if (candidates.length !== 1) {
			blockers.push({
				matchId: match.id,
				reason:
					candidates.length === 0
						? "No season matches the league, date, and both teams."
						: "More than one season matches the league, date, and both teams.",
				candidateCount: candidates.length,
			});
			continue;
		}

		updates.push({
			matchId: match.id,
			expectedLeagueId: match.leagueId,
			seasonId: candidates[0].seasonId,
			leagueSeasonId: candidates[0].id,
		});
	}

	return { updates, blockers };
}
