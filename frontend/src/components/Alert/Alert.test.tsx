import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders title, body and actions after the body", () => {
    const title = "Hazard";
    const body = "Strong current";
    const actionLabel = "Edit";

    render(
      <Alert tone="danger" title={title} actions={<button type="button">{actionLabel}</button>}>
        <p>{body}</p>
      </Alert>,
    );

    const bodyParagraph = screen.getByText(body);
    const actionButton = screen.getByRole("button", { name: actionLabel });
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(
      bodyParagraph.compareDocumentPosition(actionButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
