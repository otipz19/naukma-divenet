import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../../api/client";
import type { components } from "../../api/schema.gen";
import { Alert } from "../../components/Alert/Alert";
import { SiteCard } from "../../components/SiteCard/SiteCard";
import { SiteClusterLayer } from "./SiteClusterLayer";
import styles from "./MapPage.module.css";

export type SiteMarker = components["schemas"]["SiteMarkerResponse"];

const POPUP_MAX_WIDTH = 280;

async function fetchMarkers(): Promise<SiteMarker[]> {
  const { data } = await api.GET("/api/v1/sites/markers");
  return data ?? [];
}

/** The world map at `/` (spec site/map). The popup is a React portal, so SiteCard keeps its contexts. */
export function MapPage() {
  const { t } = useTranslation();
  const markers = useQuery({ queryKey: ["sites", "markers"], queryFn: fetchMarkers });
  const [selected, setSelected] = useState<SiteMarker>();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("site.map.title")}</h1>
      {markers.isError ? (
        <div className={styles.error}>
          <Alert tone="danger" live>
            {t("site.map.loadError")}
          </Alert>
        </div>
      ) : (
        <section className={styles.mapSection} aria-label={t("site.map.region")}>
          <MapContainer className={styles.map} center={[20, 10]} zoom={2} minZoom={2} worldCopyJump>
            <TileLayer
              key={t("site.map.attribution")}
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution={t("site.map.attribution")}
            />
            <SiteClusterLayer sites={markers.data ?? []} onSelect={setSelected} />
            {selected && (
              <Popup
                key={selected.id}
                position={[selected.lat, selected.lng]}
                maxWidth={POPUP_MAX_WIDTH}
                eventHandlers={{ remove: () => setSelected(undefined) }}
              >
                <SiteCard site={selected} />
              </Popup>
            )}
          </MapContainer>
        </section>
      )}
    </div>
  );
}
