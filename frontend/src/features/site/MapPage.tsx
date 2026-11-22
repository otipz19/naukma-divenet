import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Popup, TileLayer } from "react-leaflet";
import { Link, useSearchParams } from "react-router";
import "leaflet/dist/leaflet.css";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { Button, buttonClassName } from "../../components/Button/Button";
import { Dialog, DialogActions, DialogBody } from "../../components/Dialog/Dialog";
import { SiteCard } from "../../components/SiteCard/SiteCard";
import { TextField } from "../../components/TextField/TextField";
import { SearchFilters } from "./SearchFilters";
import { SiteClusterLayer } from "./SiteClusterLayer";
import {
  activeFilterChips,
  activeFilters,
  parseSearch,
  toMarkerQuery,
  toSearchParams,
  type SiteSearch,
} from "./siteSearch";
import { NARROW_MAP_QUERY, useMediaQuery } from "./useMediaQuery";
import { useIsAdmin } from "../auth/useSession";
import styles from "./MapPage.module.css";

export type SiteMarker = components["schemas"]["SiteMarkerResponse"];

const POPUP_MAX_WIDTH = 280;
const TYPING_DEBOUNCE_MS = 300;
const NO_SITES: SiteMarker[] = [];

/**
 * The world map at `/` with search, filters and results (specs site/map, site/search). It fills
 * the viewport below the header. On a desktop the side panel has a fixed head over a scrolling
 * body; below 1100 px the controls float over the map, the filters open in a dialog and the
 * results are a sheet (rework-map-page design D4, D6). The popup is a React portal, so SiteCard
 * keeps its contexts.
 */
export function MapPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const search = parseSearch(params);
  const narrow = useMediaQuery(NARROW_MAP_QUERY);
  const isAdmin = useIsAdmin();

  const update = (next: SiteSearch, options?: { replace: boolean }) =>
    setParams(toSearchParams(next), options);
  const clearAll = () => setParams(new URLSearchParams());

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
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // The floating search bar grows with the active-filter chips; Leaflet's zoom control sits under it.
  const [topBarHeight, setTopBarHeight] = useState(0);
  const measureTopBar = useCallback((bar: HTMLElement | null) => {
    if (!bar || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setTopBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  const filterCount = activeFilters(search);
  const chips = activeFilterChips(search, t);

  const searchBox = (
    <TextField
      type="search"
      label={t("site.search.label")}
      placeholder={narrow ? t("site.search.label") : undefined}
      value={text}
      onChange={(event) => setText(event.target.value)}
    />
  );

  const filtersToggle = (
    <Button
      variant="secondary"
      size={narrow ? "md" : "sm"}
      aria-expanded={filtersOpen}
      onClick={() => setFiltersOpen(!filtersOpen)}
    >
      {filterCount > 0
        ? t("site.search.filtersCount", { n: filterCount })
        : t("site.search.filters")}
    </Button>
  );

  const chipList = chips.length > 0 && (
    <ul className={styles.activeChips}>
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            className={`label ${styles.removeChip}`}
            aria-label={t("site.search.removeFilter", { name: chip.label })}
            onClick={() => update(chip.without)}
          >
            {chip.label}
            <X size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );

  const count = (
    <h2 className={`label ${styles.flush}`}>{t("site.search.found", { n: sites.length })}</h2>
  );

  // In the phone's sheet, only the first card shows until it is expanded (design D6).
  const listed = narrow && !sheetExpanded ? sites.slice(0, 1) : sites;
  const results = (
    <>
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
        listed.map((site) => (
          <SiteCard key={site.id} site={site} selected={site.id === selectedId} />
        ))}
    </>
  );

  const addSite = !isAdmin && (
    <Link
      className={`${buttonClassName({ variant: "primary" })} ${styles.addSite}`}
      to="/sites/new"
    >
      <Plus size={20} aria-hidden="true" />
      {t("site.map.addSite")}
    </Link>
  );

  const map = (
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
  );

  if (narrow) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{t("site.map.title")}</h1>
        <div
          className={styles.phone}
          style={{ "--top-bar-height": `${topBarHeight}px` } as CSSProperties}
        >
          <section className={styles.mapSection} aria-label={t("site.map.region")}>
            {map}
          </section>
          <section
            ref={measureTopBar}
            className={styles.topBar}
            aria-label={t("site.search.panel")}
          >
            <div className={styles.topRow}>
              {searchBox}
              {filtersToggle}
            </div>
            {chipList}
          </section>
          <div className={styles.bottomStack}>
            {addSite}
            <section
              className={`${styles.sheet} ${sheetExpanded ? styles.sheetExpanded : ""}`}
              aria-label={t("site.search.results")}
            >
              <div className={styles.resultsHead}>
                {count}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={sheetExpanded}
                  onClick={() => setSheetExpanded(!sheetExpanded)}
                >
                  {t(sheetExpanded ? "site.search.sheetCollapse" : "site.search.sheetExpand")}
                </Button>
              </div>
              <div className={styles.list}>{results}</div>
            </section>
          </div>
        </div>
        {filtersOpen && (
          <Dialog title={t("site.search.filters")} onClose={() => setFiltersOpen(false)}>
            <DialogBody>
              <SearchFilters search={search} onChange={update} />
            </DialogBody>
            <DialogActions>
              <Button variant="secondary" onClick={clearAll}>
                {t("site.search.clearAll")}
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>
                {t("site.search.showSites", { count: sites.length })}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("site.map.title")}</h1>
      <div className={styles.layout}>
        <div className={styles.side}>
          <section className={styles.head} aria-label={t("site.search.panel")}>
            {searchBox}
            <div className={styles.toolbar}>
              {filtersToggle}
              {chipList}
            </div>
            <div className={styles.resultsHead}>{count}</div>
          </section>
          <div className={styles.body}>
            {filtersOpen && (
              <div className={styles.filtersBox}>
                <SearchFilters search={search} onChange={update} onClear={clearAll} />
              </div>
            )}
            <section className={styles.list} aria-label={t("site.search.results")}>
              {results}
            </section>
          </div>
        </div>
        <section className={styles.mapSection} aria-label={t("site.map.region")}>
          {map}
          {addSite}
        </section>
      </div>
    </div>
  );
}
