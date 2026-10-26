import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../../test/render";

const DISCLAIMER_EN =
  "Information on DiveNet is for reference only and does not replace dive planning according to your agency's standards.";

describe("shared/app-shell: The footer shows the safety disclaimer", () => {
  it("shows the English disclaimer and the map-data attribution, with no button", () => {
    renderRoute("/");

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Safety:")).toBeInTheDocument();
    expect(within(footer).getByText(DISCLAIMER_EN)).toBeInTheDocument();
    expect(footer).toHaveTextContent("Map data © OpenStreetMap contributors");
    expect(within(footer).queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the Ukrainian disclaimer and meta line", () => {
    renderRoute("/", { language: "uk" });

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Безпека:")).toBeInTheDocument();
    expect(
      within(footer).getByText(
        "інформація на DiveNet має довідковий характер і не замінює планування занурення за стандартами вашої агенції.",
      ),
    ).toBeInTheDocument();
    expect(footer).toHaveTextContent(
      "DiveNet · курсовий проєкт НаУКМА · Дані мапи © учасники OpenStreetMap",
    );
  });

  it("shows the disclaimer on every page", () => {
    renderRoute("/no-such-page");

    expect(within(screen.getByRole("contentinfo")).getByText(DISCLAIMER_EN)).toBeInTheDocument();
  });
});
