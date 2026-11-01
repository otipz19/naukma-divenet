import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("reports its state and toggles on click", async () => {
    const onToggle = vi.fn();
    render(
      <Chip pressed onToggle={onToggle}>
        Torch
      </Chip>,
    );

    const chip = screen.getByRole("button", { name: "Torch" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(chip);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
