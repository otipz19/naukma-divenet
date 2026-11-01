import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { Button } from "../../components/Button/Button";
import { TextField } from "../../components/TextField/TextField";
import { parseSearch, toMarkerQuery } from "../site/siteSearch";
import styles from "./DiveLog.module.css";

export interface PickedSite {
  id: number;
  name: string;
}

const TYPING_DEBOUNCE_MS = 300;
const MAX_RESULTS = 8;

/** Finds an approved site by text, in the active language too; a chosen site shows with Change (design D6). */
export function SitePicker({
  value,
  onChange,
  error,
  hint,
}: {
  value: PickedSite | null;
  onChange: (site: PickedSite | null) => void;
  error?: string;
  /** Replaces the dive log's hint. */
  hint?: string;
}) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), TYPING_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const bundle = i18n.getResourceBundle(i18n.resolvedLanguage ?? i18n.language, "translation") as {
    geo: { regions: Record<string, string>; countries: Record<string, string> };
  };
  const query = toMarkerQuery(parseSearch(new URLSearchParams({ q: term })), bundle.geo);
  const results = useQuery({
    queryKey: ["sites", "markers", query],
    queryFn: async () => (await api.GET("/api/v1/sites/markers", { params: { query } })).data ?? [],
    enabled: term !== "" && value === null,
  });

  if (value) {
    return (
      <div className={styles.picked}>
        <span className="label">{t("divelog.form.site")}</span>
        <div className={styles.pickedRow}>
          <span className="body">{value.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setText("");
              setTerm("");
              onChange(null);
            }}
          >
            {t("divelog.form.changeSite")}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.picker}>
      <TextField
        type="search"
        label={t("divelog.form.site")}
        hint={hint ?? t("divelog.form.siteHint")}
        error={error}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {term !== "" && results.isSuccess && results.data.length === 0 && (
        <span className={`body-sm ${styles.muted}`}>{t("divelog.form.noSites")}</span>
      )}
      {term !== "" && results.data && results.data.length > 0 && (
        <ul className={styles.results}>
          {results.data.slice(0, MAX_RESULTS).map((site) => (
            <li key={site.id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => onChange({ id: site.id, name: site.name })}
              >
                <span className="label">{site.name}</span>
                <span className={`body-sm ${styles.muted}`}>
                  {`${t(`geo.countries.${site.countryCode}`)} · ${t(`geo.regions.${site.regionCode}`)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
