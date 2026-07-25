import { describe, expect, it } from "vitest";
import { fixtureSchedulingError } from "../fixture-scheduling";

const competition = {
	startDate: "2026-03-01",
	endDate: "2026-10-31",
	status: "SCHEDULED" as const,
};

describe("fixtureSchedulingError", () => {
	it("accepts fixtures within the competition window, including boundary dates", () => {
		expect(fixtureSchedulingError(competition, "2026-03-01T18:00:00Z")).toBeNull();
		expect(fixtureSchedulingError(competition, "2026-10-31T18:00:00Z")).toBeNull();
	});

	it("rejects fixtures outside the competition window", () => {
		expect(fixtureSchedulingError(competition, "2026-11-01T10:00:00Z")).toContain(
			"between 2026-03-01 and 2026-10-31",
		);
	});

	it("rejects registration and completed competition editions", () => {
		expect(
			fixtureSchedulingError({ ...competition, status: "REGISTRATION" }, "2026-05-01"),
		).toContain("registration");
		expect(
			fixtureSchedulingError({ ...competition, status: "COMPLETED" }, "2026-05-01"),
		).toContain("completed");
	});
});
