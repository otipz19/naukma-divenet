import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "../Alert/Alert";
import { TextField } from "../TextField/TextField";
import { Button } from "./Button";

describe("Form components (design/system/components)", () => {
  it("Button does not submit unless asked to", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("TextField links its label to the input and shows the hint", () => {
    render(<TextField label="Display name" hint="Shown on your reviews." name="displayName" />);

    const input = screen.getByLabelText("Display name");
    expect(input).toHaveAttribute("name", "displayName");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAccessibleDescription("Shown on your reviews.");
  });

  it("TextField marks an error and links it with aria-describedby", () => {
    render(
      <TextField
        label="Password"
        hint="Replaced by the error."
        error="Must be at least 8 characters."
      />,
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Must be at least 8 characters.");
    expect(screen.queryByText("Replaced by the error.")).not.toBeInTheDocument();
  });

  it("Alert announces a live error with role=alert", () => {
    render(
      <Alert tone="danger" live>
        Email or password is incorrect.
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });

  it("Alert has no alert role unless it is live", () => {
    render(<Alert tone="info">Notice</Alert>);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
