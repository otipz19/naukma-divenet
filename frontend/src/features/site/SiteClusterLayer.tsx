import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { SiteMarker } from "./MapPage";
import styles from "./MapPage.module.css";

const PIN_SIZE = 24;
const CLUSTER_SIZE = 40;
/** The closest the map zooms to fit the results: a region, even for a single site (design D3). */
export const FIT_MAX_ZOOM = 9;
/** Room kept between the fitted pins and the map edge, or the controls floating over it. */
const FIT_MARGIN = 24;

/** Div icons: Leaflet's default image icons break under Vite, and these take token colours. */
export const pinIcon = L.divIcon({
  // Leaflet positions the icon with `transform`, so only an inner element may rotate.
  className: "",
  html: `<span class="${styles.pin}"></span>`,
  iconSize: [PIN_SIZE, PIN_SIZE],
  iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
});

function clusterIcon(cluster: L.MarkerCluster) {
  return L.divIcon({
    className: `label ${styles.cluster}`,
    html: String(cluster.getChildCount()),
    iconSize: [CLUSTER_SIZE, CLUSTER_SIZE],
  });
}

/**
 * Adds one clustered marker per site to the surrounding map. When the sites for a new
 * non-empty `fitKey` arrive, the map fits them once (spec site/search, design D3); an empty
 * key, an empty result or `undefined` (still loading) leaves the view alone. `cover` is the
 * height the controls floating over the top and the bottom of the map take.
 */
export function SiteClusterLayer({
  sites,
  onSelect,
  fitKey,
  cover = { top: 0, bottom: 0 },
}: {
  sites: SiteMarker[];
  onSelect: (id: number) => void;
  fitKey?: string;
  cover?: { top: number; bottom: number };
}) {
  const map = useMap();
  const fitted = useRef("");
  const { top, bottom } = cover;

  useEffect(() => {
    if (fitKey === undefined || fitKey === fitted.current) return;
    fitted.current = fitKey;
    if (!fitKey || sites.length === 0) return;
    // Leaflet keeps the size the map had when it was created; on a page that opens with a search
    // the container may still be settling into its layout, so read the size again first.
    map.invalidateSize();
    map.fitBounds(L.latLngBounds(sites.map((site) => [site.lat, site.lng])), {
      maxZoom: FIT_MAX_ZOOM,
      // A jump, not an animation: an animated zoom can be cut short while the page is still loading.
      animate: false,
      paddingTopLeft: [FIT_MARGIN, top + FIT_MARGIN],
      paddingBottomRight: [FIT_MARGIN, bottom + FIT_MARGIN],
    });
  }, [map, sites, fitKey, top, bottom]);

  useEffect(() => {
    const layer = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      showCoverageOnHover: false,
    });
    for (const site of sites) {
      const marker = L.marker([site.lat, site.lng], {
        icon: pinIcon,
        title: site.name,
        alt: site.name,
      });
      marker.on("click", () => onSelect(site.id));
      layer.addLayer(marker);
    }
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, sites, onSelect]);

  return null;
}
