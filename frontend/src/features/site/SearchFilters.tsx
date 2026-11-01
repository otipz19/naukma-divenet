import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { DIFFICULTY_WORDS, type DifficultyWord } from "../../components/Badge/DifficultyBadge";
import { Button } from "../../components/Button/Button";
import { Chip } from "../../components/Chip/Chip";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextField } from "../../components/TextField/TextField";
import type { SiteSearch } from "./siteSearch";
import styles from "./MapPage.module.css";

const toggled = <T,>(values: T[], value: T) =>
  values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

/** The filters of spec site/search. `onChange` carries the whole next search. */
export function SearchFilters({
  search,
  onChange,
  onClear,
}: {
  search: SiteSearch;
  onChange: (next: SiteSearch, options?: { replace: boolean }) => void;
  onClear: () => void;
}) {
  const { t, i18n } = useTranslation();
  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.GET("/api/v1/countries")).data ?? [],
  });
  const gearItems = useQuery({
    queryKey: ["gear-items"],
    queryFn: async () => (await api.GET("/api/v1/gear-items")).data ?? [],
  });
  const collator = new Intl.Collator(i18n.language);
  const byName = <T,>(items: T[], name: (item: T) => string) =>
    items
      .map((item) => ({ item, name: name(item) }))
      .sort((a, b) => collator.compare(a.name, b.name));

  const regions = countries.data?.find((country) => country.code === search.country)?.regions ?? [];

  const depth = (key: "minDepth" | "maxDepth", label: string) => (
    <TextField
      label={label}
      inputMode="numeric"
      value={search[key]}
      onChange={(event) => {
        const value = event.target.value;
        if (/^\d*$/.test(value)) onChange({ ...search, [key]: value }, { replace: true });
      }}
    />
  );

  return (
    <div className={styles.filters}>
      <div className={styles.filtersHead}>
        <h2 className={`h3 ${styles.flush}`}>{t("site.search.filters")}</h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t("site.search.clearAll")}
        </Button>
      </div>
      <fieldset className={styles.group}>
        <legend className="label">{t("site.search.difficulty")}</legend>
        <div className={styles.chips}>
          {DIFFICULTY_WORDS.map((word: DifficultyWord) => (
            <Chip
              key={word}
              pressed={search.difficulties.includes(word)}
              onToggle={() =>
                onChange({ ...search, difficulties: toggled(search.difficulties, word) })
              }
            >
              {t(`site.difficulty.${word}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className={styles.pair}>
        {depth("minDepth", t("site.search.minDepth"))}
        {depth("maxDepth", t("site.search.maxDepth"))}
      </div>
      <div className={styles.pair}>
        <SelectField
          label={t("site.search.country")}
          value={search.country}
          onChange={(event) => onChange({ ...search, country: event.target.value, region: "" })}
        >
          <option value="">{t("site.search.allCountries")}</option>
          {byName(countries.data ?? [], (c) => t(`geo.countries.${c.code}`)).map(
            ({ item, name }) => (
              <option key={item.code} value={item.code}>
                {name}
              </option>
            ),
          )}
        </SelectField>
        <SelectField
          label={t("site.search.region")}
          value={search.region}
          disabled={!search.country}
          onChange={(event) => onChange({ ...search, region: event.target.value })}
        >
          <option value="">{t("site.search.allRegions")}</option>
          {byName(regions, (r) => t(`geo.regions.${r.code}`)).map(({ item, name }) => (
            <option key={item.code} value={item.code}>
              {name}
            </option>
          ))}
        </SelectField>
      </div>
      <fieldset className={styles.group}>
        <legend className="label">{t("site.search.gear")}</legend>
        <div className={styles.chips}>
          {byName(gearItems.data ?? [], (g) => t(`gear.${g.code}`)).map(({ item, name }) => (
            <Chip
              key={item.code}
              pressed={search.gear.includes(item.code)}
              onToggle={() => onChange({ ...search, gear: toggled(search.gear, item.code) })}
            >
              {name}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
