import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("shows the image when there is one", () => {
    const { container } = render(<Avatar initials="MK" src="/media/1/thumb" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "/media/1/thumb");
    expect(screen.queryByText("MK")).not.toBeInTheDocument();
  });

  it("shows the initials otherwise", () => {
    const { container } = render(<Avatar initials="MK" src={null} />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("MK")).toBeInTheDocument();
  });
});
