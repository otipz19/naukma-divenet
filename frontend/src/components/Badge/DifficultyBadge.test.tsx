import { describe, expect, it } from "vitest";
import { difficultyWord } from "./DifficultyBadge";

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
});
