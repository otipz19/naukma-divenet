import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { createI18n } from "../../i18n";
import { Rating, RatingInput } from "./Rating";

function renderIn(ui: ReactNode, language = "en") {
  return render(<I18nextProvider i18n={createI18n(language)}>{ui}</I18nextProvider>);
}

const filledStars = (container: HTMLElement) =>
  container.querySelectorAll('svg[data-filled="true"]').length;

describe("shared/rating: The rating display shows stars, the value and the count", () => {
  it("shows a site rating", () => {
    const { container } = renderIn(<Rating value={4.6} count={128} />);

    const rating = screen.getByRole("img", { name: "Rated 4.6 out of 5, 128 ratings" });
    expect(rating).toHaveTextContent("4.6");
    expect(rating).toHaveTextContent("(128)");
    expect(filledStars(container)).toBe(5);
  });

  it("shows a review rating", () => {
    const { container } = renderIn(<Rating value={5} />);

    const rating = screen.getByRole("img", { name: "Rated 5 out of 5" });
    expect(rating).toHaveTextContent("5.0");
    expect(filledStars(container)).toBe(5);
  });

  it("rounds the stars and keeps the exact value", () => {
    const { container } = renderIn(<Rating value={3.4} count={2} />);

    expect(screen.getByText("3.4")).toBeInTheDocument();
    expect(filledStars(container)).toBe(3);
  });

  it("shows no ratings yet", () => {
    const { container } = renderIn(<Rating value={null} count={0} />);

    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("is labelled in Ukrainian", () => {
    renderIn(
      <>
        <Rating value={4.6} count={128} />
        <Rating />
      </>,
      "uk",
    );

    expect(screen.getByRole("img", { name: "Оцінка 4.6 з 5, 128 оцінок" })).toBeInTheDocument();
    expect(screen.getByText("Ще немає оцінок")).toBeInTheDocument();
  });
});

/** The input with its value in state, as a form holds it; `values` records each change. */
function renderInput(values: (number | null)[]) {
  function Harness() {
    const [value, setValue] = useState<number | null>(null);
    return (
      <RatingInput
        value={value}
        onChange={(next) => {
          values.push(next);
          setValue(next);
        }}
      />
    );
  }
  return renderIn(<Harness />);
}

describe("shared/rating: The rating input picks 1 to 5 stars or no rating", () => {
  it("picks 4 stars", async () => {
    const values: (number | null)[] = [];
    const { container } = renderInput(values);

    expect(screen.getByRole("radio", { name: "No rating" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));

    expect(values).toEqual([4]);
    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
    expect(filledStars(container)).toBe(4);
    expect(screen.getByText("4 / 5")).toBeInTheDocument();
  });

  it("goes back to no rating", async () => {
    const values: (number | null)[] = [];
    const { container } = renderInput(values);

    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    await userEvent.click(screen.getByRole("radio", { name: "No rating" }));

    expect(values).toEqual([4, null]);
    expect(filledStars(container)).toBe(0);
  });

  it("labels the stars 1 star to 5 stars", () => {
    renderInput([]);

    expect(
      screen
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("aria-label") ?? radio.parentElement?.textContent),
    ).toEqual(["1 star", "2 stars", "3 stars", "4 stars", "5 stars", "No rating"]);
  });
});
