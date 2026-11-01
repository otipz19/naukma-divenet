import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Popup, TileLayer } from "react-leaflet";
import { Link, useSearchParams } from "react-router";
import "leaflet/dist/leaflet.css";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { Button, buttonClassName } from "../../components/Button/Button";
import { SiteCard } from "../../components/SiteCard/SiteCard";
import { TextField } from "../../components/TextField/TextField";
import { SearchFilters } from "./SearchFilters";
import { SiteClusterLayer } from "./SiteClusterLayer";
import {
  activeFilters,
  parseSearch,
  toMarkerQuery,
  toSearchParams,
  type SiteSearch,
} from "./siteSearch";
import styles from "./MapPage.module.css";

export type SiteMarker = components["schemas"]["SiteMarkerResponse"];

const POPUP_MAX_WIDTH = 280;
const TYPING_DEBOUNCE_MS = 300;
const NO_SITES: SiteMarker[] = [];

/** The world map at `/` with search, filters and results (specs site/map, site/search). The popup is a React portal, so SiteCard keeps its contexts. */
export function MapPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const search = parseSearch(params);

  const update = (next: SiteSearch, options?: { replace: boolean }) =>
    setParams(toSearchParams(next), options);

  // The box updates at once; the URL, and so the request, follows after a pause in typing.
  const [text, setText] = useState(search.q);
  const [syncedQ, setSyncedQ] = useState(search.q);
  if (search.q !== syncedQ) {
    setSyncedQ(search.q);
    setText(search.q);
  }
  useEffect(() => {
    if (text === search.q) return;
    const timer = setTimeout(
      () => update({ ...search, q: text }, { replace: true }),
      TYPING_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  });

  const bundle = i18n.getResourceBundle(i18n.resolvedLanguage ?? i18n.language, "translation") as {
    geo: { regions: Record<string, string>; countries: Record<string, string> };
  };
  const query = toMarkerQuery(search, bundle.geo);
  const markers = useQuery({
    queryKey: ["sites", "markers", query],
    queryFn: async () => (await api.GET("/api/v1/sites/markers", { params: { query } })).data ?? [],
    placeholderData: keepPreviousData,
  });
  const sites = markers.data ?? NO_SITES;

  const [selectedId, setSelectedId] = useState<number>();
  // Derived, so a popup closes by itself when its site leaves the results.
  const selected = sites.find((site) => site.id === selectedId);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const filterCount = activeFilters(search);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("site.map.title")}</h1>
      <div className={styles.layout}>
        <div className={styles.side}>
          <section className={styles.controls} aria-label={t("site.search.panel")}>
            <Link className={buttonClassName({ variant: "secondary" })} to="/sites/new">
              {t("site.submit.link")}
            </Link>
            <TextField
              type="search"
              label={t("site.search.label")}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className={styles.filtersToggle}>
              <Button
                variant="secondary"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                {filterCount > 0
                  ? t("site.search.filtersCount", { n: filterCount })
                  : t("site.search.filters")}
              </Button>
            </div>
            <div className={filtersOpen ? undefined : styles.closedOnNarrow}>
              <SearchFilters
                search={search}
                onChange={update}
                onClear={() => setParams(new URLSearchParams())}
              />
            </div>
          </section>
          <section className={styles.results} aria-label={t("site.search.results")}>
            <div className={styles.resultsHead}>
              <h2 className={`label ${styles.flush}`}>
                {t("site.search.found", { n: sites.length })}
              </h2>
              <span className={styles.listToggle}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={listOpen}
                  onClick={() => setListOpen(!listOpen)}
                >
                  {t(listOpen ? "site.search.hideList" : "site.search.showList")}
                </Button>
              </span>
            </div>
            <div
              className={`${styles.list} ${listOpen || sites.length === 0 || markers.isError ? "" : styles.closedOnNarrow}`}
            >
              {markers.isError ? (
                <Alert tone="danger" live>
                  {t("site.map.loadError")}
                </Alert>
              ) : (
                markers.isSuccess &&
                sites.length === 0 && (
                  <p className={`body ${styles.flush}`}>{t("site.search.nothingFound")}</p>
                )
              )}
              {!markers.isError &&
                sites.map((site) => (
                  <SiteCard key={site.id} site={site} selected={site.id === selectedId} />
                ))}
            </div>
          </section>
        </div>
        <section className={styles.mapSection} aria-label={t("site.map.region")}>
          <MapContainer className={styles.map} center={[20, 10]} zoom={2} minZoom={2} worldCopyJump>
            <TileLayer
              key={t("site.map.attribution")}
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution={t("site.map.attribution")}
            />
            <SiteClusterLayer sites={sites} onSelect={setSelectedId} />
            {selected && (
              <Popup
                key={selected.id}
                position={[selected.lat, selected.lng]}
                maxWidth={POPUP_MAX_WIDTH}
                eventHandlers={{ remove: () => setSelectedId(undefined) }}
              >
                <SiteCard site={selected} />
              </Popup>
            )}
          </MapContainer>
        </section>
      </div>
    </div>
  );
}
