import { describe, expect, it } from "vitest";
import { resolveConfiguredLeaderCategories } from "../configured-leader-categories";

describe("resolveConfiguredLeaderCategories", () => {
	it("preserves configured order and known statistic meaning", () => {
		const result = resolveConfiguredLeaderCategories([
			{ name: "Assists", unit: "AST" },
			{ name: "Points", unit: "PTS" },
		]);

		expect(result.map(({ name, unit, key }) => ({ name, unit, key }))).toEqual([
			{ name: "Assists", unit: "AST", key: "Assists" },
			{ name: "Points", unit: "PTS", key: "Points" },
		]);
	});

	it("keeps custom labels visible by assigning unused statistics", () => {
		const result = resolveConfiguredLeaderCategories([
			{ name: "Top Scorers", unit: "PPG" },
			{ name: "Glass Cleaners", unit: "RPG" },
		]);

		expect(result.map(({ name, key }) => ({ name, key }))).toEqual([
			{ name: "Top Scorers", key: "Points" },
			{ name: "Glass Cleaners", key: "Rebounds" },
		]);
	});
});
