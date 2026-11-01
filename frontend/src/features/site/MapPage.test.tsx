import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import type { SiteMarker } from "./MapPage";

const markersUrl = `${window.location.origin}/api/v1/sites/markers`;

const site = (overrides: Partial<SiteMarker>): SiteMarker => ({
  id: 7,
  name: "Lighthouse Reef",
  lat: 28.5,
  lng: 34.52,
  countryCode: "EG",
  regionCode: "eg-dahab",
  difficulty: 1,
  minDepth: 3,
  maxDepth: 18,
  ...overrides,
});

const markersReturn = (sites: SiteMarker[]) =>
  server.use(http.get(markersUrl, () => HttpResponse.json(sites)));

// jsdom has no layout; Leaflet draws only what falls inside a sized container.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 1000 });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 600 });
});

const pins = () => document.querySelectorAll<HTMLElement>(".leaflet-marker-icon[title]");

describe("site/map: The root path shows a world map of sites", () => {
  it("holds one marker per site and credits OpenStreetMap", async () => {
    markersReturn([
      site({ id: 1, name: "Reef A" }),
      site({ id: 2, name: "Reef B", lat: -14, lng: 145 }),
      site({ id: 3, name: "Reef C", lat: 20, lng: -87 }),
    ]);
    renderRoute("/");

    await waitFor(() => expect(pins()).toHaveLength(3));
    expect(screen.getByRole("heading", { level: 1, name: "Dive-site map" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "OpenStreetMap" })).toBeInTheDocument();
  });
});

describe("site/map: Nearby markers cluster", () => {
  it("shows two close markers as one cluster with the count", async () => {
    markersReturn([site({ id: 1 }), site({ id: 2, lat: 28.50001 })]);
    renderRoute("/");

    await screen.findByText("2");
    expect(pins()).toHaveLength(0);
  });
});

describe("site/map: A marker opens a summary that links to the site", () => {
  it("shows the site's summary", async () => {
    markersReturn([site({})]);
    renderRoute("/");
    await waitFor(() => expect(pins()).toHaveLength(1));

    fireEvent.click(pins()[0]!);

    const link = await screen.findByRole("link", { name: /Lighthouse Reef/ });
    expect(link).toHaveAttribute("href", "/sites/7");
    expect(within(link).getByText("Egypt · Dahab")).toBeInTheDocument();
    expect(within(link).getByText("Beginner")).toBeInTheDocument();
    expect(within(link).getByText("3–18 m")).toBeInTheDocument();
  });

  it("uses the active language", async () => {
    markersReturn([site({})]);
    renderRoute("/", { language: "uk" });
    await waitFor(() => expect(pins()).toHaveLength(1));

    fireEvent.click(pins()[0]!);

    const link = await screen.findByRole("link", { name: /Lighthouse Reef/ });
    expect(within(link).getByText("Єгипет · Дахаб")).toBeInTheDocument();
    expect(within(link).getByText("Початковий")).toBeInTheDocument();
  });
});

describe("site/map: The map page reports a failed load", () => {
  it("shows an alert on a server error", async () => {
    server.use(http.get(markersUrl, () => HttpResponse.json({ status: 500 }, { status: 500 })));
    renderRoute("/");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "The dive sites could not be loaded.",
    );
  }, 10000);
});
