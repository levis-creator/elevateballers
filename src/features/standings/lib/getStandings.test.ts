import { describe, expect, it } from "vitest";
import { calculateStandings } from "./getStandings";

const participant = (id: string, name: string) => ({
  team: { id, name, nickname: null, logo: null, slug: name.toLowerCase() },
});

describe("calculateStandings", () => {
  it("includes registered teams with no matches and excludes unregistered teams", () => {
    const result = calculateStandings(
      [participant("a", "Alpha"), participant("b", "Beta")],
      [
        { team1Id: "a", team2Id: "outside", team1Score: 80, team2Score: 70 },
      ],
    );
    expect(result.map((row) => row.teamId)).toEqual(["a", "b"]);
    expect(result[0]).toMatchObject({ won: 1, points: 3 });
    expect(result[1]).toMatchObject({ played: 0, points: 0 });
  });

  it("ranks by points, difference, points scored, then team name", () => {
    const result = calculateStandings(
      [participant("a", "Alpha"), participant("b", "Beta")],
      [{ team1Id: "a", team2Id: "b", team1Score: 90, team2Score: 80 }],
    );
    expect(result.map((row) => [row.rank, row.teamId])).toEqual([[1, "a"], [2, "b"]]);
  });
});
