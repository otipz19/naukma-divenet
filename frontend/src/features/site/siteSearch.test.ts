import { describe, expect, it } from "vitest";
import {
  activeFilters,
  matchingCodes,
  parseSearch,
  toMarkerQuery,
  toSearchParams,
} from "./siteSearch";

const names = {
  regions: { "eg-dahab": "Дахаб", "hr-istria": "Істрія" },
  countries: { EG: "Єгипет", HR: "Хорватія" },
};

describe("site/search: URL state", () => {
  it("round-trips the search and filters", () => {
    const query = "q=reef&difficulty=beginner&gear=torch&country=EG&region=eg-dahab&minDepth=5";

    expect(toSearchParams(parseSearch(new URLSearchParams(query))).toString()).toBe(query);
  });

  it("round-trips the minimum rating and the name order, and leaves out the default order", () => {
    expect(
      toSearchParams(parseSearch(new URLSearchParams("minRating=4.5&sort=name"))).toString(),
    ).toBe("minRating=4.5&sort=name");
    expect(toSearchParams(parseSearch(new URLSearchParams("sort=rating"))).toString()).toBe("");
  });

  it("ignores a hand-edited rating and sort", () => {
    const search = parseSearch(new URLSearchParams("minRating=lots&sort=depth"));

    expect(search.minRating).toBe("");
    expect(search.sort).toBe("rating");
  });

  it("ignores an unknown difficulty and a non-numeric depth", () => {
    const search = parseSearch(new URLSearchParams("difficulty=hard&minDepth=abc&maxDepth=-1"));

    expect(search.difficulties).toEqual([]);
    expect(search.minDepth).toBe("");
    expect(search.maxDepth).toBe("");
  });

  it("counts active filters without the text search", () => {
    const search = parseSearch(
      new URLSearchParams("q=reef&difficulty=beginner&gear=a&gear=b&country=EG"),
    );

    expect(activeFilters(search)).toBe(4);
  });
});

describe("site/search: The map page searches and filters", () => {
  it("sends both levels for Intermediate", () => {
    const search = parseSearch(new URLSearchParams("difficulty=intermediate"));

    expect(toMarkerQuery(search, names).difficulty).toEqual([2, 3]);
  });

  it("leaves out empty parameters and always sends the sort", () => {
    const { sort, ...rest } = toMarkerQuery(parseSearch(new URLSearchParams()), names);

    expect(sort).toBe("rating");
    expect(Object.values(rest).every((value) => value === undefined)).toBe(true);
  });

  it("sends the minimum rating and counts it as a filter", () => {
    const search = parseSearch(new URLSearchParams("minRating=4"));

    expect(toMarkerQuery(search, names).minRating).toBe(4);
    expect(activeFilters(search)).toBe(1);
  });
});

describe("site/search: Search works with names in the active language", () => {
  it("sends the codes of matching names", () => {
    const query = toMarkerQuery(parseSearch(new URLSearchParams("q=дахаб")), names);

    expect(query.q).toBe("дахаб");
    expect(query.qRegion).toEqual(["eg-dahab"]);
    expect(query.qCountry).toBeUndefined();
  });

  it("matches a part of a name, ignoring case", () => {
    expect(matchingCodes("ХОРВ", names.countries)).toEqual(["HR"]);
    expect(matchingCodes("  ", names.countries)).toEqual([]);
  });
});
