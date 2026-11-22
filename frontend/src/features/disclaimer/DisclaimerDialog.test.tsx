import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../../test/render";
import { DISCLAIMER_STORAGE_KEY } from "./disclaimerStorage";

const DISCLAIMER_EN =
  "Information on DiveNet is for reference only and does not replace dive planning according to your agency's standards.";

const disclaimer = () => screen.queryByRole("dialog", { name: "Before you dive" });

// jsdom has no showModal() (src/test/setup.ts shims it): Escape is simulated by firing `cancel`,
// which is what the browser fires. The real Escape is checked in the E2E suite.
const pressEscape = (dialog: HTMLElement) =>
  fireEvent(dialog, new Event("cancel", { cancelable: true }));

afterEach(() => vi.restoreAllMocks());

describe("shared/disclaimer: The disclaimer opens on a first visit", () => {
  it("shows the disclaimer and the project line on a first visit", () => {
    renderRoute("/", { firstVisit: true });

    const dialog = disclaimer()!;
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Safety:")).toBeInTheDocument();
    expect(within(dialog).getByText(DISCLAIMER_EN, { exact: false })).toBeInTheDocument();
    expect(within(dialog).getByText("DiveNet · NaUKMA course project")).toBeInTheDocument();
  });

  it("opens on any page", () => {
    renderRoute("/no-such-page", { firstVisit: true });

    expect(disclaimer()).toBeInTheDocument();
  });

  it("uses the Ukrainian text", () => {
    renderRoute("/", { firstVisit: true, language: "uk" });

    const dialog = screen.getByRole("dialog", { name: "Перед зануренням" });
    expect(within(dialog).getByText("Безпека:")).toBeInTheDocument();
    expect(within(dialog).getByText("DiveNet · курсовий проєкт НаУКМА")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Зрозуміло" })).toBeInTheDocument();
  });

  it("does not open again when a link is followed in the same visit", async () => {
    renderRoute("/", { firstVisit: true });

    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    await userEvent.click(
      within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Feed" }),
    );

    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(disclaimer()).not.toBeInTheDocument();
  });

  it("does not open for a visitor who chose not to see it again", () => {
    renderRoute("/");

    expect(disclaimer()).not.toBeInTheDocument();
  });
});

describe("shared/disclaimer: The disclaimer can be closed and not shown again", () => {
  it("starts with the box unchecked and saves nothing when closed that way", async () => {
    const view = renderRoute("/", { firstVisit: true });

    expect(screen.getByRole("checkbox", { name: "Don't show again" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(disclaimer()).not.toBeInTheDocument();
    expect(localStorage.getItem(DISCLAIMER_STORAGE_KEY)).toBeNull();

    // A reload is a new mount of the app.
    view.unmount();
    renderRoute("/", { firstVisit: true });
    expect(disclaimer()).toBeInTheDocument();
  });

  it("stays closed on the next load after Don't show again", async () => {
    const view = renderRoute("/", { firstVisit: true });

    await userEvent.click(screen.getByRole("checkbox", { name: "Don't show again" }));
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(disclaimer()).not.toBeInTheDocument();
    view.unmount();
    renderRoute("/", { firstVisit: true });
    expect(disclaimer()).not.toBeInTheDocument();
  });

  it("closes on Escape and moves focus to the main landmark", () => {
    renderRoute("/", { firstVisit: true });

    pressEscape(disclaimer()!);

    expect(disclaimer()).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("starts with focus on Got it", () => {
    renderRoute("/", { firstVisit: true });

    expect(screen.getByRole("button", { name: "Got it" })).toHaveFocus();
  });
});

describe("shared/disclaimer: Storage failures never break the disclaimer", () => {
  it("opens and closes when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderRoute("/", { firstVisit: true });

    expect(disclaimer()).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Don't show again" }));
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));

    expect(disclaimer()).not.toBeInTheDocument();
  });
});
