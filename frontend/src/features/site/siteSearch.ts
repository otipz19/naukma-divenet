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

export interface FilterChip {
  key: string;
  label: string;
  /** The search with only this filter removed. */
  without: SiteSearch;
}

/** Translates a locale key, as i18next's `t` does. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * One removable chip per active filter, in the order the filters are shown (rework-map-page
 * design D5). There is one chip per counted filter, so the chips always match `activeFilters`.
 */
export function activeFilterChips(search: SiteSearch, t: Translate): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const word of search.difficulties) {
    chips.push({
      key: `difficulty:${word}`,
      label: t(`site.difficulty.${word}`),
      without: { ...search, difficulties: search.difficulties.filter((w) => w !== word) },
    });
  }
  for (const code of search.gear) {
    chips.push({
      key: `gear:${code}`,
      label: t(`gear.${code}`),
      without: { ...search, gear: search.gear.filter((c) => c !== code) },
    });
  }
  const single = (
    key: "country" | "region" | "minDepth" | "maxDepth" | "minRating",
    label: string,
  ) => {
    if (search[key]) chips.push({ key, label, without: { ...search, [key]: "" } });
  };
  single("country", t(`geo.countries.${search.country}`));
  single("region", t(`geo.regions.${search.region}`));
  single("minDepth", t("site.search.chip.minDepth", { n: search.minDepth }));
  single("maxDepth", t("site.search.chip.maxDepth", { n: search.maxDepth }));
  single("minRating", t("site.search.chip.minRating", { value: search.minRating }));
  return chips;
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
