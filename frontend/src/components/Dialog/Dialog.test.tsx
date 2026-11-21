import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "../../i18n";
import { Button } from "../Button/Button";
import { ConfirmDialog, Dialog, DialogActions, DialogBody, useDialogClose } from "./Dialog";

// jsdom has no showModal() (src/test/setup.ts shims it): Escape is simulated by firing `cancel`,
// which is what the browser fires. Inertness and real Escape are checked in the E2E suite.
const escape = (dialog: HTMLElement) =>
  fireEvent(dialog, new Event("cancel", { cancelable: true }));

function CancelButton() {
  const close = useDialogClose();
  return <Button onClick={close}>Cancel</Button>;
}

/** A page with an opener and a form dialog whose single field marks it dirty when changed. */
function Harness({ onSend = () => {} }: { onSend?: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  return (
    <>
      <Button onClick={() => setOpen(true)}>Log a dive</Button>
      {open && (
        <Dialog
          title="Log a dive"
          dirty={value !== ""}
          onClose={() => {
            setOpen(false);
            setValue("");
          }}
        >
          <DialogBody>
            <label>
              Site
              <input value={value} onChange={(event) => setValue(event.target.value)} />
            </label>
          </DialogBody>
          <DialogActions>
            <CancelButton />
            <Button onClick={onSend}>Save dive</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

function renderHarness(props: { onSend?: () => void } = {}) {
  render(
    <I18nextProvider i18n={createI18n("en")}>
      <Harness {...props} />
    </I18nextProvider>,
  );
}

async function open() {
  const opener = screen.getByRole("button", { name: "Log a dive" });
  await userEvent.click(opener);
  return { opener, dialog: screen.getByRole("dialog", { name: "Log a dive" }) };
}

describe("shared/dialogs: A dialog is modal and named by its title", () => {
  it("opens as a modal named by its title, with focus inside", async () => {
    renderHarness();

    const { dialog } = await open();

    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByRole("heading", { level: 2, name: "Log a dive" })).toBeInTheDocument();
    expect(screen.getByLabelText("Site")).toHaveFocus();
  });
});

describe("shared/dialogs: A dialog closes and returns focus", () => {
  it("closes on Escape and returns focus to the opener", async () => {
    renderHarness();
    const { opener, dialog } = await open();

    escape(dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("closes on its translated close button", async () => {
    renderHarness();
    const { opener } = await open();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("stays open on a click outside it", async () => {
    renderHarness();
    const { dialog } = await open();

    // A backdrop click lands on the <dialog> element itself.
    await userEvent.click(dialog);

    expect(screen.getByRole("dialog", { name: "Log a dive" })).toBeInTheDocument();
  });
});

describe("shared/dialogs: Closing a form with unsaved changes asks first", () => {
  it("closes after Discard, and nothing is sent", async () => {
    const onSend = vi.fn();
    renderHarness({ onSend });
    const { opener, dialog } = await open();
    await userEvent.type(screen.getByLabelText("Site"), "Blue");

    escape(dialog);
    const question = screen.getByRole("dialog", { name: "Discard changes?" });
    expect(question).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
    expect(opener).toHaveFocus();
  });

  it("stays open with the value after Keep editing", async () => {
    renderHarness();
    await open();
    await userEvent.type(screen.getByLabelText("Site"), "Blue");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(screen.getByRole("dialog", { name: "Log a dive" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Discard changes?" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Site")).toHaveValue("Blue");
  });

  it("keeps the form open when Escape answers the question", async () => {
    renderHarness();
    const { dialog } = await open();
    await userEvent.type(screen.getByLabelText("Site"), "Blue");
    escape(dialog);

    escape(screen.getByRole("dialog", { name: "Discard changes?" }));

    expect(screen.queryByRole("dialog", { name: "Discard changes?" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Log a dive" })).toBeInTheDocument();
    expect(screen.getByLabelText("Site")).toHaveValue("Blue");
  });

  it("closes at once without changes", async () => {
    renderHarness();
    const { dialog } = await open();

    escape(dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

function renderConfirm() {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <I18nextProvider i18n={createI18n("en")}>
      <ConfirmDialog
        question="Delete the dive at SS Thistlegorm on 12 Mar 2026?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </I18nextProvider>,
  );
  return { onConfirm, onCancel };
}

describe("shared/dialogs: A confirmation dialog asks before a destructive action", () => {
  it("runs the action on the confirming button", async () => {
    const { onConfirm, onCancel } = renderConfirm();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("does not run it on Cancel or Escape", async () => {
    const { onConfirm, onCancel } = renderConfirm();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    escape(screen.getByRole("dialog"));

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("is named by its question and starts on Cancel", () => {
    renderConfirm();

    expect(
      screen.getByRole("dialog", { name: "Delete the dive at SS Thistlegorm on 12 Mar 2026?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });
});
