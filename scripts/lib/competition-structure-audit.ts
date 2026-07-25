export interface AuditLeague {
	id: string;
	name: string;
}

export interface AuditSeason {
	id: string;
	name: string;
	leagueIds: string[];
}

export interface AuditConference {
	id: string;
	name: string;
	seasonId: string;
}

export interface AuditParticipation {
	id: string;
	seasonId: string;
	leagueId: string;
	teamId: string;
	teamName: string;
	conferenceId: string | null;
}

export interface AuditMatch {
	id: string;
	slug: string | null;
	seasonId: string | null;
	leagueId: string | null;
	team1Id: string | null;
	team2Id: string | null;
}

export interface CompetitionAuditSnapshot {
	leagues: AuditLeague[];
	seasons: AuditSeason[];
	conferences: AuditConference[];
	participations: AuditParticipation[];
	matches: AuditMatch[];
}

export type AuditSeverity = "BLOCKER" | "WARNING";

export interface AuditFinding {
	code: string;
	severity: AuditSeverity;
	message: string;
	ids: string[];
}

export interface CompetitionAuditReport {
	generatedAt: string;
	leagueInventory: AuditLeague[];
	seasonLeagueDistribution: {
		zero: number;
		one: number;
		two: number;
		moreThanTwo: number;
	};
	counts: {
		leagues: number;
		seasons: number;
		conferences: number;
		participations: number;
		matches: number;
		blockers: number;
		warnings: number;
	};
	officialLeagues: {
		men: AuditLeague | null;
		women: AuditLeague | null;
	};
	findings: AuditFinding[];
}

function matchOfficialLeagues(leagues: AuditLeague[]) {
	const women = leagues.filter((league) => /\b(women|women's|female)\b/i.test(league.name));
	const men = leagues.filter(
		(league) =>
			/\b(men|men's|male)\b/i.test(league.name) &&
			!/\b(women|women's|female)\b/i.test(league.name),
	);
	return {
		men: men.length === 1 ? men[0] : null,
		women: women.length === 1 ? women[0] : null,
		menCandidates: men,
		womenCandidates: women,
	};
}

function finding(
	findings: AuditFinding[],
	severity: AuditSeverity,
	code: string,
	message: string,
	ids: string[],
) {
	findings.push({ severity, code, message, ids: [...new Set(ids)].sort() });
}

export function auditCompetitionStructure(
	snapshot: CompetitionAuditSnapshot,
	now = new Date(),
): CompetitionAuditReport {
	const findings: AuditFinding[] = [];
	const official = matchOfficialLeagues(snapshot.leagues);
	const leagueById = new Map(snapshot.leagues.map((league) => [league.id, league]));
	const seasonById = new Map(snapshot.seasons.map((season) => [season.id, season]));
	const conferenceById = new Map(snapshot.conferences.map((conference) => [conference.id, conference]));
	const participationBySeasonTeam = new Map(
		snapshot.participations.map((row) => [`${row.seasonId}:${row.teamId}`, row]),
	);

	if (snapshot.leagues.length !== 2) {
		finding(
			findings,
			"BLOCKER",
			"OFFICIAL_LEAGUE_COUNT",
			`Expected exactly two league records (Men and Women); found ${snapshot.leagues.length}.`,
			snapshot.leagues.map((league) => league.id),
		);
	}
	if (!official.men || !official.women) {
		finding(
			findings,
			"BLOCKER",
			"OFFICIAL_LEAGUES_UNRESOLVED",
			`Could not identify exactly one men's and one women's league by name (men candidates: ${official.menCandidates.length}, women candidates: ${official.womenCandidates.length}).`,
			[...official.menCandidates, ...official.womenCandidates].map((league) => league.id),
		);
	}

	for (const season of snapshot.seasons) {
		if (season.leagueIds.length === 0) {
			finding(findings, "WARNING", "SEASON_WITHOUT_LEAGUE", `${season.name} has no linked league.`, [season.id]);
		}
		if (season.leagueIds.length > 2) {
			finding(
				findings,
				"BLOCKER",
				"SEASON_WITH_TOO_MANY_LEAGUES",
				`${season.name} is linked to ${season.leagueIds.length} leagues.`,
				[season.id, ...season.leagueIds],
			);
		}
		const unknown = season.leagueIds.filter((leagueId) => !leagueById.has(leagueId));
		if (unknown.length) {
			finding(
				findings,
				"BLOCKER",
				"SEASON_UNKNOWN_LEAGUE",
				`${season.name} references league records that do not exist.`,
				[season.id, ...unknown],
			);
		}
	}

	for (const row of snapshot.participations) {
		const season = seasonById.get(row.seasonId);
		if (!season || !leagueById.has(row.leagueId) || !season.leagueIds.includes(row.leagueId)) {
			finding(
				findings,
				"BLOCKER",
				"PARTICIPATION_INVALID_SCOPE",
				`${row.teamName}'s participation does not resolve to a valid season/league link.`,
				[row.id, row.seasonId, row.leagueId],
			);
		}
		if (row.conferenceId) {
			const conference = conferenceById.get(row.conferenceId);
			if (!conference || conference.seasonId !== row.seasonId) {
				finding(
					findings,
					"BLOCKER",
					"PARTICIPATION_CROSS_SEASON_CONFERENCE",
					`${row.teamName} is assigned to a missing conference or one from another season.`,
					[row.id, row.conferenceId],
				);
			}
		}
	}

	for (const conference of snapshot.conferences) {
		const members = snapshot.participations.filter((row) => row.conferenceId === conference.id);
		const memberLeagueIds = [...new Set(members.map((row) => row.leagueId))];
		const seasonLeagueIds = seasonById.get(conference.seasonId)?.leagueIds ?? [];

		if (memberLeagueIds.length > 1) {
			finding(
				findings,
				"BLOCKER",
				"CONFERENCE_MIXED_LEAGUES",
				`${conference.name} contains teams from multiple leagues.`,
				[conference.id, ...memberLeagueIds, ...members.map((row) => row.id)],
			);
		} else if (memberLeagueIds.length === 0 && seasonLeagueIds.length !== 1) {
			finding(
				findings,
				"BLOCKER",
				"CONFERENCE_LEAGUE_AMBIGUOUS",
				`${conference.name} has no teams and its league cannot be inferred from the season.`,
				[conference.id, conference.seasonId],
			);
		}
	}

	const matchLeaguesBySeasonTeam = new Map<string, Set<string>>();
	for (const match of snapshot.matches) {
		if (!match.seasonId || !match.leagueId) {
			finding(
				findings,
				"BLOCKER",
				"MATCH_MISSING_SCOPE",
				`Match ${match.slug ?? match.id} is missing a season or league.`,
				[match.id],
			);
			continue;
		}

		const season = seasonById.get(match.seasonId);
		if (!season || !leagueById.has(match.leagueId) || !season.leagueIds.includes(match.leagueId)) {
			finding(
				findings,
				"BLOCKER",
				"MATCH_INVALID_SCOPE",
				`Match ${match.slug ?? match.id} does not resolve to a valid season/league link.`,
				[match.id, match.seasonId, match.leagueId],
			);
		}

		for (const teamId of [match.team1Id, match.team2Id]) {
			if (!teamId) continue;
			const key = `${match.seasonId}:${teamId}`;
			const leagues = matchLeaguesBySeasonTeam.get(key) ?? new Set<string>();
			leagues.add(match.leagueId);
			matchLeaguesBySeasonTeam.set(key, leagues);

			const participation = participationBySeasonTeam.get(key);
			if (!participation || participation.leagueId !== match.leagueId) {
				finding(
					findings,
					"BLOCKER",
					"MATCH_TEAM_NOT_REGISTERED",
					`A team in match ${match.slug ?? match.id} is not registered in the same season and league.`,
					[match.id, teamId],
				);
			}
		}
	}

	for (const [key, leagueIds] of matchLeaguesBySeasonTeam) {
		if (leagueIds.size > 1) {
			finding(
				findings,
				"BLOCKER",
				"TEAM_PLAYS_IN_MULTIPLE_LEAGUES",
				`Team participation ${key} appears in matches from multiple leagues in one season.`,
				[key, ...leagueIds],
			);
		}
	}

	const blockers = findings.filter((item) => item.severity === "BLOCKER").length;
	const warnings = findings.length - blockers;
	return {
		generatedAt: now.toISOString(),
		leagueInventory: [...snapshot.leagues].sort((a, b) => a.name.localeCompare(b.name)),
		seasonLeagueDistribution: {
			zero: snapshot.seasons.filter((season) => season.leagueIds.length === 0).length,
			one: snapshot.seasons.filter((season) => season.leagueIds.length === 1).length,
			two: snapshot.seasons.filter((season) => season.leagueIds.length === 2).length,
			moreThanTwo: snapshot.seasons.filter((season) => season.leagueIds.length > 2).length,
		},
		counts: {
			leagues: snapshot.leagues.length,
			seasons: snapshot.seasons.length,
			conferences: snapshot.conferences.length,
			participations: snapshot.participations.length,
			matches: snapshot.matches.length,
			blockers,
			warnings,
		},
		officialLeagues: { men: official.men, women: official.women },
		findings,
	};
}
