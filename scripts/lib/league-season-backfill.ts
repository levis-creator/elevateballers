export type BackfillStatus = "ACTIVE" | "COMPLETED";
export type BackfillStructure = "SINGLE_TABLE" | "CONFERENCES";

export interface BackfillLeagueSeason {
	leagueId: string;
	seasonId: string;
	id: string | null;
	season: {
		startDate: Date;
		endDate: Date;
		registrationOpensAt: Date | null;
		registrationClosesAt: Date | null;
		bracketType: string | null;
		active: boolean;
	};
}

export interface BackfillConference {
	id: string;
	name: string;
	seasonId: string;
	leagueSeasonId: string | null;
	memberLeagueIds: string[];
}

export interface BackfillChild {
	id: string;
	seasonId: string | null;
	leagueId: string | null;
	leagueSeasonId: string | null;
}

export interface LeagueSeasonBackfillSnapshot {
	leagueSeasons: BackfillLeagueSeason[];
	conferences: BackfillConference[];
	seasonTeams: BackfillChild[];
	matches: BackfillChild[];
}

export interface LeagueSeasonBackfillPlan {
	leagueSeasons: Array<{
		leagueId: string;
		seasonId: string;
		id: string;
		startDate: Date;
		endDate: Date;
		registrationOpensAt: Date | null;
		registrationClosesAt: Date | null;
		bracketType: string | null;
		status: BackfillStatus;
		competitionStructure: BackfillStructure;
	}>;
	conferences: Array<{ id: string; leagueSeasonId: string }>;
	seasonTeams: Array<{ id: string; leagueSeasonId: string }>;
	matches: Array<{ id: string; leagueSeasonId: string }>;
	blockers: Array<{ code: string; message: string; ids: string[] }>;
}

const pairKey = (seasonId: string, leagueId: string) => `${seasonId}:${leagueId}`;

export function planLeagueSeasonBackfill(
	snapshot: LeagueSeasonBackfillSnapshot,
	createId: (seasonId: string, leagueId: string) => string,
): LeagueSeasonBackfillPlan {
	const blockers: LeagueSeasonBackfillPlan["blockers"] = [];
	const idByPair = new Map<string, string>();

	for (const row of snapshot.leagueSeasons) {
		const id = row.id ?? createId(row.seasonId, row.leagueId);
		idByPair.set(pairKey(row.seasonId, row.leagueId), id);
	}

	const conferencePlans: LeagueSeasonBackfillPlan["conferences"] = [];
	const conferenceCountByLeagueSeason = new Map<string, number>();

	for (const conference of snapshot.conferences) {
		const memberLeagueIds = [...new Set(conference.memberLeagueIds)];
		const seasonCandidates = snapshot.leagueSeasons.filter(
			(row) => row.seasonId === conference.seasonId,
		);

		let leagueId: string | null = null;
		if (memberLeagueIds.length === 1) leagueId = memberLeagueIds[0];
		else if (memberLeagueIds.length === 0 && seasonCandidates.length === 1) {
			leagueId = seasonCandidates[0].leagueId;
		}

		if (memberLeagueIds.length > 1) {
			blockers.push({
				code: "CONFERENCE_MIXED_LEAGUES",
				message: `${conference.name} contains teams from multiple leagues.`,
				ids: [conference.id, ...memberLeagueIds],
			});
			continue;
		}
		if (!leagueId) {
			blockers.push({
				code: "CONFERENCE_LEAGUE_AMBIGUOUS",
				message: `${conference.name} cannot be assigned to one league season.`,
				ids: [conference.id, conference.seasonId],
			});
			continue;
		}

		const leagueSeasonId = idByPair.get(pairKey(conference.seasonId, leagueId));
		if (!leagueSeasonId) {
			blockers.push({
				code: "CONFERENCE_PAIR_MISSING",
				message: `${conference.name} resolves to a season/league pair that is not linked.`,
				ids: [conference.id, conference.seasonId, leagueId],
			});
			continue;
		}
		if (conference.leagueSeasonId && conference.leagueSeasonId !== leagueSeasonId) {
			blockers.push({
				code: "CONFERENCE_LINK_CONFLICT",
				message: `${conference.name} already points to a different league season.`,
				ids: [conference.id, conference.leagueSeasonId, leagueSeasonId],
			});
			continue;
		}
		conferencePlans.push({ id: conference.id, leagueSeasonId });
		conferenceCountByLeagueSeason.set(
			leagueSeasonId,
			(conferenceCountByLeagueSeason.get(leagueSeasonId) ?? 0) + 1,
		);
	}

	function planChildren(kind: "season team" | "match", rows: BackfillChild[]) {
		const plans: Array<{ id: string; leagueSeasonId: string }> = [];
		for (const row of rows) {
			if (!row.seasonId || !row.leagueId) {
				blockers.push({
					code: kind === "match" ? "MATCH_MISSING_SCOPE" : "SEASON_TEAM_MISSING_SCOPE",
					message: `${kind} ${row.id} is missing its legacy season or league.`,
					ids: [row.id],
				});
				continue;
			}
			const leagueSeasonId = idByPair.get(pairKey(row.seasonId, row.leagueId));
			if (!leagueSeasonId) {
				blockers.push({
					code: kind === "match" ? "MATCH_PAIR_MISSING" : "SEASON_TEAM_PAIR_MISSING",
					message: `${kind} ${row.id} has no matching league-season link.`,
					ids: [row.id, row.seasonId, row.leagueId],
				});
				continue;
			}
			if (row.leagueSeasonId && row.leagueSeasonId !== leagueSeasonId) {
				blockers.push({
					code: kind === "match" ? "MATCH_LINK_CONFLICT" : "SEASON_TEAM_LINK_CONFLICT",
					message: `${kind} ${row.id} already points to a different league season.`,
					ids: [row.id, row.leagueSeasonId, leagueSeasonId],
				});
				continue;
			}
			plans.push({ id: row.id, leagueSeasonId });
		}
		return plans;
	}

	return {
		leagueSeasons: snapshot.leagueSeasons.map((row) => {
			const id = idByPair.get(pairKey(row.seasonId, row.leagueId))!;
			return {
				leagueId: row.leagueId,
				seasonId: row.seasonId,
				id,
				startDate: row.season.startDate,
				endDate: row.season.endDate,
				registrationOpensAt: row.season.registrationOpensAt,
				registrationClosesAt: row.season.registrationClosesAt,
				bracketType: row.season.bracketType,
				status: row.season.active ? "ACTIVE" : "COMPLETED",
				competitionStructure:
					(conferenceCountByLeagueSeason.get(id) ?? 0) > 0
						? "CONFERENCES"
						: "SINGLE_TABLE",
			};
		}),
		conferences: conferencePlans,
		seasonTeams: planChildren("season team", snapshot.seasonTeams),
		matches: planChildren("match", snapshot.matches),
		blockers,
	};
}
