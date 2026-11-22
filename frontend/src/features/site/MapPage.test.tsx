import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
  ratingCount: 0,
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

/** Filters are collapsed when the page opens (design D4); this expands them. */
const openFilters = async () =>
  userEvent.click(await screen.findByRole("button", { name: /^Filters/ }));

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
    await openFilters();

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
    await openFilters();
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
    renderRoute("/?q=reef&difficulty=beginner&minRating=4");
    expect(await screen.findByLabelText("Search sites")).toHaveValue("reef");
    await openFilters();

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByLabelText("Search sites")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Beginner" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByLabelText("Min rating")).toHaveValue("");
    await waitFor(() => expect(lastUrl(urls).search).toBe("?sort=rating"));
  });

  it("applies a minimum rating and counts it", async () => {
    const urls = recordMarkers();
    renderRoute("/");
    await openFilters();

    await userEvent.selectOptions(await screen.findByLabelText("Min rating"), "4 stars and up");

    await waitFor(() => expect(lastUrl(urls).searchParams.get("minRating")).toBe("4"));
    expect(screen.getByRole("button", { name: "Filters · 1" })).toBeInTheDocument();
  });

  it("sorts by rating unless the user chooses the name order", async () => {
    const urls = recordMarkers();
    renderRoute("/");
    await waitFor(() => expect(lastUrl(urls).searchParams.get("sort")).toBe("rating"));
    await openFilters();

    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "Name (A–Z)");

    await waitFor(() => expect(lastUrl(urls).searchParams.get("sort")).toBe("name"));
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
    await openFilters();

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
    await openFilters();
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

describe("site/search: The URL holds the rating filter and the sort", () => {
  it("restores a URL with rating and sort", async () => {
    const urls = recordMarkers();
    renderRoute("/?minRating=4.5&sort=name");
    await openFilters();

    expect(await screen.findByLabelText("Min rating")).toHaveDisplayValue("4.5 stars and up");
    expect(screen.getByLabelText("Sort by")).toHaveDisplayValue("Name (A–Z)");
    await waitFor(() => expect(lastUrl(urls).searchParams.get("minRating")).toBe("4.5"));
    expect(lastUrl(urls).searchParams.get("sort")).toBe("name");
  });

  it("ignores a hand-edited rating and sort", async () => {
    const urls = recordMarkers();
    renderRoute("/?minRating=lots&sort=depth");

    await waitFor(() => expect(urls.length).toBeGreaterThan(0));
    expect(lastUrl(urls).searchParams.has("minRating")).toBe(false);
    expect(lastUrl(urls).searchParams.get("sort")).toBe("rating");
  });
});

describe("site/search: Filters sit behind a toggle at every width", () => {
  it("starts collapsed", async () => {
    recordMarkers();
    renderRoute("/");

    expect(await screen.findByRole("button", { name: "Filters" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: "Beginner" })).not.toBeInTheDocument();
  });

  it("reports the count and the expanded state", async () => {
    recordMarkers();
    renderRoute("/?difficulty=beginner");
    const toggle = await screen.findByRole("button", { name: "Filters · 1" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Beginner" })).toBeInTheDocument();
  });
});

describe("site/search: Active filters show as removable chips", () => {
  it("shows a chip per active filter while the filters are collapsed", async () => {
    recordMarkers();
    renderRoute("/?difficulty=beginner&gear=torch");

    const panel = await screen.findByRole("region", { name: "Search and filters" });
    expect(
      within(panel).getByRole("button", { name: "Remove filter: Beginner" }),
    ).toHaveTextContent("Beginner");
    expect(within(panel).getByRole("button", { name: "Remove filter: Torch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Filters/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("removes only its own filter", async () => {
    const urls = recordMarkers();
    renderRoute("/?difficulty=beginner&gear=torch");

    await userEvent.click(await screen.findByRole("button", { name: "Remove filter: Beginner" }));

    await waitFor(() => expect(lastUrl(urls).searchParams.has("difficulty")).toBe(false));
    expect(lastUrl(urls).searchParams.getAll("gear")).toEqual(["torch"]);
    expect(
      screen.queryByRole("button", { name: "Remove filter: Beginner" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters · 1" })).toBeInTheDocument();
  });

  it("names the chips in the active language", async () => {
    recordMarkers();
    renderRoute("/?difficulty=beginner&minDepth=10", { language: "uk" });

    expect(
      await screen.findByRole("button", { name: "Прибрати фільтр: Початковий" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Прибрати фільтр: Від 10 м" })).toBeInTheDocument();
  });
});

describe("site/search: The result count stays in view", () => {
  it("keeps the count in the panel head, outside the scrolling body", async () => {
    recordMarkers();
    renderRoute("/");

    const panel = await screen.findByRole("region", { name: "Search and filters" });
    expect(
      await within(panel).findByRole("heading", { name: "Sites found: 1" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Results" })).queryByRole("heading", {
        name: /Sites found/,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("site/map: The map offers adding a site", () => {
  it("puts the link on the map, not in the search panel", async () => {
    recordMarkers();
    renderRoute("/");

    const map = await screen.findByRole("region", { name: "Map of dive sites" });
    expect(within(map).getByRole("link", { name: "Add a site" })).toHaveAttribute(
      "href",
      "/sites/new",
    );
    const panel = screen.getByRole("region", { name: "Search and filters" });
    expect(
      within(panel)
        .queryAllByRole("link")
        .some((link) => link.getAttribute("href") === "/sites/new"),
    ).toBe(false);
  });

  it("uses the active language", async () => {
    recordMarkers();
    renderRoute("/", { language: "uk" });

    expect(await screen.findByRole("link", { name: "Додати місце" })).toHaveAttribute(
      "href",
      "/sites/new",
    );
  });
});

/** The phone layout: `matchMedia` matches the map's narrow query (design D3). */
function onPhone() {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    Object.assign(new EventTarget(), {
      matches: query === "(max-width: 1099px)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    }),
  );
}

describe("site/search: Phones show filters in a dialog and results in a sheet", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens the filters in a dialog that applies at once and closes on Show", async () => {
    onPhone();
    const urls = recordMarkers((url) =>
      url.searchParams.has("difficulty")
        ? [site({ id: 1 })]
        : [site({ id: 1 }), site({ id: 2, name: "Deep Wall", lat: -14, lng: 145 })],
    );
    renderRoute("/");
    const toggle = await screen.findByRole("button", { name: "Filters" });

    await userEvent.click(toggle);

    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(within(dialog).getByRole("button", { name: "Clear all" })).toBeInTheDocument();
    expect(await within(dialog).findByRole("button", { name: "Show 2 sites" })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Beginner" }));
    await waitFor(() => expect(lastUrl(urls).searchParams.getAll("difficulty")).toEqual(["1"]));

    await userEvent.click(await within(dialog).findByRole("button", { name: "Show 1 site" }));

    expect(screen.queryByRole("dialog", { name: "Filters" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters · 1" })).toHaveFocus();
  });

  it("clears every filter from the dialog", async () => {
    onPhone();
    const urls = recordMarkers();
    renderRoute("/?difficulty=beginner");

    await userEvent.click(await screen.findByRole("button", { name: "Filters · 1" }));
    await userEvent.click(
      within(screen.getByRole("dialog", { name: "Filters" })).getByRole("button", {
        name: "Clear all",
      }),
    );

    await waitFor(() => expect(lastUrl(urls).search).toBe("?sort=rating"));
  });

  it("peeks with the count and one card, and expands to every card", async () => {
    onPhone();
    recordMarkers(() => [
      site({ id: 1, name: "Reef A" }),
      site({ id: 2, name: "Reef B", lat: -14, lng: 145 }),
      site({ id: 3, name: "Reef C", lat: 20, lng: -87 }),
    ]);
    renderRoute("/");

    const sheet = screen.getByRole("region", { name: "Results" });
    expect(
      await within(sheet).findByRole("heading", { name: "Sites found: 3" }),
    ).toBeInTheDocument();
    expect(within(sheet).getAllByRole("link")).toHaveLength(1);
    const expand = within(sheet).getByRole("button", { name: "Show all" });
    expect(expand).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(expand);

    expect(within(sheet).getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(within(sheet).getAllByRole("link")).toHaveLength(3);
  });
});
