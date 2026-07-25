import { describe, expect, it } from "vitest";
import { standingsCacheKey, standingsCachePattern } from "./standings-cache";

describe("standings cache scope", () => {
  it("separates overall and conference tables by competition edition", () => {
    expect(standingsCacheKey("men")).toBe("standings:men:overall");
    expect(standingsCacheKey("women", "east")).toBe(
      "standings:women:conference:east",
    );
  });

  it("invalidates every table for only the completed match's competition", () => {
    expect(standingsCachePattern("men")).toBe("standings:men:*");
  });
});
