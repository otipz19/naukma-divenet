import L from "leaflet";
import "leaflet.markercluster";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { SiteMarker } from "./MapPage";
import styles from "./MapPage.module.css";

const PIN_SIZE = 24;
const CLUSTER_SIZE = 40;

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

/** Adds one clustered marker per site to the surrounding map. */
export function SiteClusterLayer({
  sites,
  onSelect,
}: {
  sites: SiteMarker[];
  onSelect: (id: number) => void;
}) {
  const map = useMap();

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
