import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const popupLink = async () => {
  await waitFor(() => expect(document.querySelector(".leaflet-popup-content a")).not.toBeNull());
  return document.querySelector<HTMLElement>(".leaflet-popup-content a")!;
};

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

    const link = await popupLink();
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

    const link = await popupLink();
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

const egypt = {
  code: "EG",
  name: "Egypt",
  regions: [
    { code: "eg-dahab", name: "Dahab" },
    { code: "eg-hurghada", name: "Hurghada" },
  ],
};
const croatia = { code: "HR", name: "Croatia", regions: [{ code: "hr-istria", name: "Istria" }] };

/** Answers markers from a function of the request's URL, and records each URL. */
function recordMarkers(answer: (url: URL) => SiteMarker[] = () => [site({})]) {
  const urls: URL[] = [];
  server.use(
    http.get(markersUrl, ({ request }) => {
      const url = new URL(request.url);
      urls.push(url);
      return HttpResponse.json(answer(url));
    }),
    http.get(`${window.location.origin}/api/v1/countries`, () =>
      HttpResponse.json([egypt, croatia]),
    ),
    http.get(`${window.location.origin}/api/v1/gear-items`, () =>
      HttpResponse.json([{ code: "torch", name: "Torch" }]),
    ),
  );
  return urls;
}

const lastUrl = (urls: URL[]) => urls[urls.length - 1]!;

describe("site/search: The map page searches and filters", () => {
  it("applies a chip to the request, the map and the list", async () => {
    const urls = recordMarkers((url) =>
      url.searchParams.has("difficulty")
        ? [site({ id: 1, name: "Easy Reef" })]
        : [
            site({ id: 1, name: "Easy Reef" }),
            site({ id: 2, name: "Deep Wall", lat: -14, lng: 145 }),
          ],
    );
    renderRoute("/");
    await waitFor(() => expect(pins()).toHaveLength(2));

    await userEvent.click(screen.getByRole("button", { name: "Beginner" }));

    await waitFor(() => expect(lastUrl(urls).searchParams.getAll("difficulty")).toEqual(["1"]));
    await waitFor(() => expect(pins()).toHaveLength(1));
    expect(screen.getByRole("link", { name: /Easy Reef/ })).toHaveAttribute("href", "/sites/1");
    expect(screen.queryByRole("link", { name: /Deep Wall/ })).not.toBeInTheDocument();
    expect(screen.getByText("Sites found: 1")).toBeInTheDocument();
  });

  it("offers only the chosen country's regions and clears the region on a change", async () => {
    recordMarkers();
    renderRoute("/");
    const country = await screen.findByLabelText("Country");
    await screen.findByRole("option", { name: "Egypt" });

    await userEvent.selectOptions(country, "EG");
    await userEvent.selectOptions(screen.getByLabelText("Region"), "eg-dahab");
    expect(screen.queryByRole("option", { name: "Istria" })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Country"), "HR");

    expect(screen.getByLabelText("Region")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Istria" })).toBeInTheDocument();
  });

  it("clears everything", async () => {
    const urls = recordMarkers();
    renderRoute("/?q=reef&difficulty=beginner");
    expect(await screen.findByLabelText("Search sites")).toHaveValue("reef");

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByLabelText("Search sites")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Beginner" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => expect(lastUrl(urls).search).toBe(""));
  });

  it("sends typed text after the pause, with codes of the active language", async () => {
    const urls = recordMarkers(() => []);
    renderRoute("/", { language: "uk" });

    await userEvent.type(await screen.findByLabelText("Пошук місць"), "дахаб");

    await waitFor(() => expect(lastUrl(urls).searchParams.get("q")).toBe("дахаб"));
    expect(lastUrl(urls).searchParams.getAll("qRegion")).toEqual(["eg-dahab"]);
  });

  it("marks the list card of the open popup as selected", async () => {
    recordMarkers();
    renderRoute("/");
    await waitFor(() => expect(pins()).toHaveLength(1));
    const card = await screen.findByRole("link", { name: /Lighthouse Reef/ });
    expect(card).not.toHaveAttribute("aria-current");

    fireEvent.click(pins()[0]!);

    await popupLink();
    expect(card).toHaveAttribute("aria-current", "true");
  });

  it("closes the popup when its site leaves the results", async () => {
    recordMarkers((url) => (url.searchParams.has("difficulty") ? [] : [site({})]));
    renderRoute("/");
    await waitFor(() => expect(pins()).toHaveLength(1));
    fireEvent.click(pins()[0]!);
    await popupLink();

    await userEvent.click(screen.getByRole("button", { name: "Beginner" }));

    await waitFor(() => expect(document.querySelector(".leaflet-popup-content a")).toBeNull());
  });
});

describe("site/search: An empty result says so", () => {
  it("shows the nothing-found text", async () => {
    recordMarkers(() => []);
    renderRoute("/");

    expect(await screen.findByText(/Nothing found/)).toBeInTheDocument();
  });
});

describe("site/search: The URL holds the search and filters", () => {
  it("restores a filtered URL", async () => {
    const urls = recordMarkers();
    renderRoute("/?q=reef&difficulty=beginner&gear=torch");

    expect(await screen.findByLabelText("Search sites")).toHaveValue("reef");
    expect(screen.getByRole("button", { name: "Beginner" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await screen.findByRole("button", { name: "Torch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await waitFor(() => expect(lastUrl(urls).searchParams.get("q")).toBe("reef"));
    expect(lastUrl(urls).searchParams.getAll("difficulty")).toEqual(["1"]);
    expect(lastUrl(urls).searchParams.getAll("gear")).toEqual(["torch"]);
  });
});

describe("site/search: Narrow screens show a filters toggle and a results sheet", () => {
  it("reports the count and the expanded state", async () => {
    recordMarkers();
    renderRoute("/?difficulty=beginner");
    const toggle = await screen.findByRole("button", { name: "Filters · 1" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
