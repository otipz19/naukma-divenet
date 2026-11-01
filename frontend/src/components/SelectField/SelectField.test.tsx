import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectField } from "./SelectField";

describe("SelectField", () => {
  it("links its label to the select", () => {
    render(
      <SelectField label="Country" defaultValue="EG">
        <option value="EG">Egypt</option>
      </SelectField>,
    );

    expect(screen.getByLabelText("Country")).toHaveValue("EG");
  });
});
