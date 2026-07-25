import { describe, expect, it, vi } from "vitest";
import {
	LeagueSeasonScopeError,
	resolveLeagueSeasonById,
	resolveLeagueSeasonScope,
} from "../league-season-scope";

const row = { id: "ls1", seasonId: "s1", leagueId: "l1" };

describe("resolveLeagueSeasonScope", () => {
	it("resolves the canonical scope from leagueSeasonId", async () => {
		const client = {
			leagueSeason: {
				findUnique: vi.fn().mockResolvedValue(row),
				findMany: vi.fn(),
			},
		} as any;
		await expect(
			resolveLeagueSeasonScope({ leagueSeasonId: "ls1" }, client),
		).resolves.toEqual({
			leagueSeasonId: "ls1",
			seasonId: "s1",
			leagueId: "l1",
		});
	});

	it("rejects identifiers that disagree", async () => {
		const client = {
			leagueSeason: {
				findUnique: vi.fn().mockResolvedValue(row),
				findMany: vi.fn(),
			},
		} as any;
		await expect(
			resolveLeagueSeasonScope(
				{ leagueSeasonId: "ls1", seasonId: "wrong" },
				client,
			),
		).rejects.toBeInstanceOf(LeagueSeasonScopeError);
	});

	it("rejects season-only scope when the season has multiple leagues", async () => {
		const client = {
			leagueSeason: {
				findUnique: vi.fn(),
				findMany: vi.fn().mockResolvedValue([
					row,
					{ id: "ls2", seasonId: "s1", leagueId: "l2" },
				]),
			},
		} as any;
		await expect(resolveLeagueSeasonScope({ seasonId: "s1" }, client)).rejects.toThrow(
			"multiple leagues",
		);
	});

	it("requires leagueSeasonId at canonical API boundaries", async () => {
		const client = {
			leagueSeason: { findUnique: vi.fn(), findMany: vi.fn() },
		} as any;
		await expect(resolveLeagueSeasonById(undefined, {}, client)).rejects.toThrow(
			"leagueSeasonId is required",
		);
		expect(client.leagueSeason.findUnique).not.toHaveBeenCalled();
	});
});
