import { describe, expect, it } from "vitest";
import { difficultyWord, levelsOf } from "./DifficultyBadge";

describe("site/map: Difficulty is shown as a word", () => {
  it("maps each level to a word", () => {
    expect([1, 2, 3, 4, 5].map(difficultyWord)).toEqual([
      "beginner",
      "intermediate",
      "intermediate",
      "advanced",
      "technical",
    ]);
  });

  it("reverses the mapping", () => {
    expect(levelsOf("intermediate")).toEqual([2, 3]);
    expect(levelsOf("technical")).toEqual([5]);
  });
});
