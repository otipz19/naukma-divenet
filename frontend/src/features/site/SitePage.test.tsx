import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import { renderRoute } from "../../test/render";
import { server } from "../../test/server";
import { formatCoordinates } from "./SitePage";

const siteUrl = `${window.location.origin}/api/v1/sites/7`;

const blueHole = (overrides: Partial<components["schemas"]["SiteResponse"]> = {}) => ({
  id: 7,
  name: "Blue Hole",
  lat: 28.5722,
  lng: 34.5375,
  countryCode: "EG",
  regionCode: "eg-dahab",
  difficulty: 4,
  minDepth: 6,
  maxDepth: 40,
  description: "A famous sinkhole.",
  requiredGear: ["torch"],
  recommendedGear: ["nitrox"],
  ...overrides,
});

const siteReturns = (site = blueHole()) =>
  server.use(http.get(siteUrl, () => HttpResponse.json(site)));

const problem = (status: number) =>
  HttpResponse.json(
    { status },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

describe("site/details: The site page shows the site's facts", () => {
  it("shows the facts", async () => {
    siteReturns();
    renderRoute("/sites/7");

    expect(await screen.findByRole("heading", { level: 1, name: "Blue Hole" })).toBeInTheDocument();
    expect(screen.getByText("28.5722° N, 34.5375° E · Egypt, Dahab")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
    expect(screen.getByText("6–40 m")).toBeInTheDocument();
    expect(screen.getByText("A famous sinkhole.")).toBeInTheDocument();
    expect(screen.getByText("Torch")).toBeInTheDocument();
    expect(screen.getByText("Nitrox")).toBeInTheDocument();
  });

  it("formats southern and western coordinates", () => {
    expect(formatCoordinates(-8.5, -80.25)).toBe("8.5000° S, 80.2500° W");
  });

  it("uses the active language", async () => {
    siteReturns();
    renderRoute("/sites/7", { language: "uk" });

    expect(await screen.findByText("Ліхтар")).toBeInTheDocument();
    expect(screen.getByText("Просунутий")).toBeInTheDocument();
    expect(screen.getByText(/Єгипет, Дахаб/)).toBeInTheDocument();
  });

  it("hides the gear headings of a site with no gear", async () => {
    siteReturns(blueHole({ requiredGear: [], recommendedGear: [] }));
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    expect(screen.queryByText("Required gear")).not.toBeInTheDocument();
    expect(screen.queryByText("Recommended gear")).not.toBeInTheDocument();
  });
});

describe("site/details: The site page shows the safety disclaimer", () => {
  it("has the disclaimer in main, with no dismiss control", async () => {
    siteReturns();
    renderRoute("/sites/7");

    await screen.findByRole("heading", { level: 1, name: "Blue Hole" });
    const main = within(screen.getByRole("main"));
    expect(main.getByText(/does not replace dive planning/)).toBeInTheDocument();
    expect(main.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("site/details: The site page links back to the map", () => {
  it("has a breadcrumb link to /", async () => {
    siteReturns();
    renderRoute("/sites/7");

    const breadcrumb = await screen.findByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByRole("link", { name: "Map" })).toHaveAttribute("href", "/");
  });
});

describe("site/details: The site page handles a missing site and a failed load", () => {
  it("shows not-found on a 404", async () => {
    server.use(http.get(siteUrl, () => problem(404)));
    renderRoute("/sites/7");

    expect(await screen.findByRole("heading", { name: "Site not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the map" })).toHaveAttribute("href", "/");
  });

  it("shows not-found for an id that is not a number", () => {
    renderRoute("/sites/abc");

    expect(screen.getByRole("heading", { name: "Site not found" })).toBeInTheDocument();
  });

  it("shows an alert on a server error", async () => {
    server.use(http.get(siteUrl, () => problem(500)));
    renderRoute("/sites/7");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "This site could not be loaded.",
    );
  }, 10000);
});
