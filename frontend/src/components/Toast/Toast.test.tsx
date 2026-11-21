import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "../../i18n";
import { TOAST_MS, ToastProvider, ToastRegion, useToast, type ToastInput } from "./Toast";

/** One button per toast to add, as a page would add them. */
function Adder({ toasts }: { toasts: ToastInput[] }) {
  const { show } = useToast();
  return (
    <>
      {toasts.map((toast, index) => (
        <button key={index} type="button" onClick={() => show(toast)}>
          {`Add ${index}`}
        </button>
      ))}
    </>
  );
}

function renderRegion(...toasts: ToastInput[]) {
  render(
    <I18nextProvider i18n={createI18n("en")}>
      <MemoryRouter>
        <ToastProvider>
          <Adder toasts={toasts} />
          <ToastRegion />
        </ToastProvider>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

const add = (index = 0) => fireEvent.click(screen.getByRole("button", { name: `Add ${index}` }));
const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("shared/app-shell: The app shell shows toasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast inside a status region", () => {
    renderRegion({
      title: "Achievement unlocked: First dive",
      body: "You logged your first dive.",
    });

    add();

    expect(screen.getByRole("status")).toHaveTextContent("Achievement unlocked: First dive");
    expect(screen.getByRole("status")).toHaveTextContent("You logged your first dive.");
  });

  it("closes on its own after 6 seconds", () => {
    renderRegion({ title: "First dive" });
    add();

    wait(TOAST_MS - 100);
    expect(screen.getByText("First dive")).toBeInTheDocument();
    wait(100);

    expect(screen.queryByText("First dive")).not.toBeInTheDocument();
  });

  it("pauses while hovered and closes 6 seconds after the pointer leaves", () => {
    renderRegion({ title: "First dive" });
    add();
    const toast = screen.getByText("First dive").closest("div")!.parentElement!;

    fireEvent.pointerEnter(toast);
    wait(TOAST_MS * 2);
    expect(screen.getByText("First dive")).toBeInTheDocument();
    fireEvent.pointerLeave(toast);
    wait(TOAST_MS - 100);
    expect(screen.getByText("First dive")).toBeInTheDocument();
    wait(100);

    expect(screen.queryByText("First dive")).not.toBeInTheDocument();
  });

  it("pauses while focus is on its link", () => {
    renderRegion({ title: "First dive", link: { to: "/users/1", label: "See achievements" } });
    add();
    const link = screen.getByRole("link", { name: "See achievements" });
    expect(link).toHaveAttribute("href", "/users/1");

    act(() => {
      link.focus();
    });
    wait(TOAST_MS * 2);
    expect(screen.getByText("First dive")).toBeInTheDocument();
    act(() => {
      link.blur();
    });
    wait(TOAST_MS);

    expect(screen.queryByText("First dive")).not.toBeInTheDocument();
  });

  it("closes on its close button", () => {
    renderRegion({ title: "First dive" });
    add();

    fireEvent.click(screen.getByRole("button", { name: "Close notification" }));

    expect(screen.queryByText("First dive")).not.toBeInTheDocument();
  });

  it("stacks two toasts, the newest last", () => {
    renderRegion({ title: "First dive" }, { title: "Wreck Explorer" });

    add(0);
    add(1);

    const titles = [...screen.getByRole("status").querySelectorAll("strong")].map(
      (title) => title.textContent,
    );
    expect(titles).toEqual(["First dive", "Wreck Explorer"]);
  });
});
