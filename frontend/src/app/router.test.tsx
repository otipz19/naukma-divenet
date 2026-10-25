import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../test/render";

describe("shared/web-app: The app serves a placeholder home page", () => {
  it("renders the product name and the placeholder notice at /", () => {
    renderRoute("/");

    expect(screen.getByRole("heading", { level: 1, name: "DiveNet" })).toBeInTheDocument();
    expect(screen.getByText("The DiveNet interface is being designed.")).toBeInTheDocument();
  });
});

describe("shared/web-app: Unknown paths show a not-found page", () => {
  it("shows the not-found message and a link home", () => {
    renderRoute("/no-such-page");

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("returns to the home page through the link", async () => {
    renderRoute("/no-such-page");

    await userEvent.click(screen.getByRole("link", { name: "Back to the home page" }));

    expect(screen.getByRole("heading", { level: 1, name: "DiveNet" })).toBeInTheDocument();
  });
});
