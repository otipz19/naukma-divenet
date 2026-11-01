import {
  DIFFICULTY_WORDS,
  levelsOf,
  type DifficultyWord,
} from "../../components/Badge/DifficultyBadge";

/** The minimum ratings the map offers (add-site-reviews design D7). */
export const MIN_RATINGS = ["3", "4", "4.5"] as const;

export const SORTS = ["rating", "name"] as const;

export type SiteSort = (typeof SORTS)[number];

/** The search, filters and sort as the URL holds them (design D4). */
export interface SiteSearch {
  q: string;
  difficulties: DifficultyWord[];
  gear: string[];
  country: string;
  region: string;
  minDepth: string;
  maxDepth: string;
  /** "" for any rating. */
  minRating: string;
  sort: SiteSort;
}

const isDifficulty = (value: string): value is DifficultyWord =>
  (DIFFICULTY_WORDS as readonly string[]).includes(value);

const wholeNumber = (value: string | null) => (value && /^\d+$/.test(value) ? value : "");

const oneOf = <T extends string>(values: readonly T[], value: string | null): T | undefined =>
  values.find((candidate) => candidate === value);

/** Reads the URL; a hand-edited unknown value is ignored, so it cannot cause a 400. */
export function parseSearch(params: URLSearchParams): SiteSearch {
  return {
    q: params.get("q") ?? "",
    difficulties: params.getAll("difficulty").filter(isDifficulty),
    gear: params.getAll("gear"),
    country: params.get("country") ?? "",
    region: params.get("region") ?? "",
    minDepth: wholeNumber(params.get("minDepth")),
    maxDepth: wholeNumber(params.get("maxDepth")),
    minRating: oneOf(MIN_RATINGS, params.get("minRating")) ?? "",
    sort: oneOf(SORTS, params.get("sort")) ?? "rating",
  };
}

export function toSearchParams(search: SiteSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  for (const word of search.difficulties) params.append("difficulty", word);
  for (const code of search.gear) params.append("gear", code);
  for (const key of ["country", "region", "minDepth", "maxDepth", "minRating"] as const) {
    if (search[key]) params.set(key, search[key]);
  }
  // Rating order is the default, so only the name order shows in the URL.
  if (search.sort !== "rating") params.set("sort", search.sort);
  return params;
}

/** How many filters are on; the text search has its own box, so it does not count. */
export function activeFilters(search: SiteSearch): number {
  return (
    search.difficulties.length +
    search.gear.length +
    [search.country, search.region, search.minDepth, search.maxDepth, search.minRating].filter(
      Boolean,
    ).length
  );
}

/** The codes whose name in the active language contains the text, ignoring case (design D3). */
export function matchingCodes(text: string, names: Record<string, string>): string[] {
  const needle = text.trim().toLocaleLowerCase();
  if (!needle) return [];
  return Object.entries(names)
    .filter(([, name]) => name.toLocaleLowerCase().includes(needle))
    .map(([code]) => code);
}

/** The markers request's query parameters; `names` holds the active language's place names. `sort` is always sent. */
export function toMarkerQuery(
  search: SiteSearch,
  names: { regions: Record<string, string>; countries: Record<string, string> },
) {
  const number = (value: string) => (value ? Number(value) : undefined);
  const text = (value: string) => value || undefined;
  const list = <T>(values: T[]) => (values.length > 0 ? values : undefined);
  return {
    q: text(search.q),
    qRegion: list(matchingCodes(search.q, names.regions)),
    qCountry: list(matchingCodes(search.q, names.countries)),
    difficulty: list(search.difficulties.flatMap(levelsOf)),
    gear: list(search.gear),
    country: text(search.country),
    region: text(search.region),
    minDepth: number(search.minDepth),
    maxDepth: number(search.maxDepth),
    minRating: number(search.minRating),
    sort: search.sort,
  };
}
