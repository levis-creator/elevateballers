import { prisma } from "@/lib/prisma";

export interface LeagueSeasonScopeInput {
	leagueSeasonId?: string | null;
	seasonId?: string | null;
	leagueId?: string | null;
}

export interface ResolvedLeagueSeasonScope {
	leagueSeasonId: string;
	seasonId: string;
	leagueId: string;
}

export class LeagueSeasonScopeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LeagueSeasonScopeError";
	}
}

/**
 * Resolve the first-class competition edition and reject inconsistent
 * identifiers. New API boundaries must provide leagueSeasonId; the pair/season
 * fallbacks remain only for internal compatibility callers during Phase 7.
 */
export async function resolveLeagueSeasonScope(
	input: LeagueSeasonScopeInput,
	client: Pick<typeof prisma, "leagueSeason"> = prisma,
): Promise<ResolvedLeagueSeasonScope> {
	const leagueSeason = input.leagueSeasonId
		? await client.leagueSeason.findUnique({
				where: { id: input.leagueSeasonId },
				select: { id: true, seasonId: true, leagueId: true },
			})
		: input.seasonId && input.leagueId
			? await client.leagueSeason.findUnique({
					where: {
						leagueId_seasonId: {
							leagueId: input.leagueId,
							seasonId: input.seasonId,
						},
					},
					select: { id: true, seasonId: true, leagueId: true },
				})
			: input.seasonId
				? await resolveOnlySeason(input.seasonId, client)
				: null;

	if (!leagueSeason) {
		throw new LeagueSeasonScopeError(
			"A valid leagueSeasonId or linked seasonId + leagueId is required.",
		);
	}
	if (input.seasonId && input.seasonId !== leagueSeason.seasonId) {
		throw new LeagueSeasonScopeError("seasonId does not belong to the selected league season.");
	}
	if (input.leagueId && input.leagueId !== leagueSeason.leagueId) {
		throw new LeagueSeasonScopeError("leagueId does not belong to the selected league season.");
	}
	return {
		leagueSeasonId: leagueSeason.id,
		seasonId: leagueSeason.seasonId,
		leagueId: leagueSeason.leagueId,
	};
}

/** Canonical Phase 7 API resolver: no inference from umbrella identifiers. */
export async function resolveLeagueSeasonById(
	leagueSeasonId: string | null | undefined,
	expected: Pick<LeagueSeasonScopeInput, "seasonId" | "leagueId"> = {},
	client: Pick<typeof prisma, "leagueSeason"> = prisma,
): Promise<ResolvedLeagueSeasonScope> {
	if (!leagueSeasonId) {
		throw new LeagueSeasonScopeError("leagueSeasonId is required.");
	}
	return resolveLeagueSeasonScope({ leagueSeasonId, ...expected }, client);
}

async function resolveOnlySeason(
	seasonId: string,
	client: Pick<typeof prisma, "leagueSeason">,
) {
	const rows = await client.leagueSeason.findMany({
		where: { seasonId },
		select: { id: true, seasonId: true, leagueId: true },
		take: 2,
	});
	if (rows.length > 1) {
		throw new LeagueSeasonScopeError(
			"leagueSeasonId is required because this season contains multiple leagues.",
		);
	}
	return rows[0] ?? null;
}
