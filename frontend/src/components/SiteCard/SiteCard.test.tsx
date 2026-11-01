import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { components } from "../../api/schema.gen";
import { createI18n } from "../../i18n";
import { SiteCard } from "./SiteCard";

const site = (
  overrides: Partial<components["schemas"]["SiteMarkerResponse"]> = {},
): components["schemas"]["SiteMarkerResponse"] => ({
  id: 7,
  name: "Blue Hole",
  lat: 28.5,
  lng: 34.5,
  countryCode: "EG",
  regionCode: "eg-dahab",
  difficulty: 4,
  minDepth: 6,
  maxDepth: 40,
  ratingCount: 0,
  ...overrides,
});

function renderCard(card: components["schemas"]["SiteMarkerResponse"], language = "en") {
  return render(
    <I18nextProvider i18n={createI18n(language)}>
      <MemoryRouter>
        <SiteCard site={card} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("site/search: Site cards show the rating", () => {
  it("shows a rated site's rating and count", () => {
    renderCard(site({ averageRating: 4.9, ratingCount: 342 }));

    const rating = screen.getByRole("img", { name: "Rated 4.9 out of 5, 342 ratings" });
    expect(rating).toHaveTextContent("4.9");
    expect(rating).toHaveTextContent("(342)");
  });

  it("shows the no-ratings text for an unrated site", () => {
    renderCard(site(), "uk");

    expect(screen.getByText("Ще немає оцінок")).toBeInTheDocument();
  });
});
