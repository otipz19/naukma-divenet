import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import type { UploadedVideo } from "../../api/media";
import { createI18n } from "../../i18n";
import { server } from "../../test/server";
import { VideoField } from "./VideoField";

const url = `${window.location.origin}/api/v1/media/videos`;

const clip = (id: string): UploadedVideo => ({ id, url: `/media/${id}`, contentType: "video/mp4" });
const file = (name: string, type = "video/mp4") => new File(["x"], name, { type });

function Harness({ initial }: { initial: UploadedVideo[] }) {
  const [value, setValue] = useState(initial);
  return <VideoField value={value} onChange={setValue} />;
}

function setup(initial: UploadedVideo[] = [], language = "en") {
  const { container } = render(
    <I18nextProvider i18n={createI18n(language)}>
      <Harness initial={initial} />
    </I18nextProvider>,
  );
  return container.querySelector<HTMLInputElement>('input[type="file"]')!;
}

const pick = (input: HTMLInputElement, picked: File) =>
  userEvent.setup({ applyAccept: false }).upload(input, picked);

function serveUpload(respond: () => Response) {
  const state = { sent: false };
  server.use(
    http.post(url, () => {
      state.sent = true;
      return respond();
    }),
  );
  return state;
}

describe("media/video-field: The video field uploads and shows videos", () => {
  it("uploads, and shows a player", async () => {
    serveUpload(() => HttpResponse.json(clip("a"), { status: 201 }));
    const input = setup();

    await pick(input, file("reef.mp4"));

    const player = await screen.findByLabelText("Video 1");
    expect(player).toHaveAttribute("src", "/media/a");
    expect(player).toHaveAttribute("preload", "metadata");
  });

  it("says the limit is reached, and offers no more", () => {
    setup([clip("a"), clip("b"), clip("c")]);

    expect(screen.queryByRole("button", { name: "Add video" })).not.toBeInTheDocument();
    expect(screen.getByText("You can add at most 3 videos.")).toBeInTheDocument();
  });

  it("removes a video", async () => {
    setup([clip("a")]);

    await userEvent.click(screen.getByRole("button", { name: "Remove video 1" }));

    expect(screen.queryByLabelText("Video 1")).not.toBeInTheDocument();
  });
});

describe("media/video-field: Invalid videos are refused with a message", () => {
  it("refuses a file that is too large, without uploading", async () => {
    const state = serveUpload(() => HttpResponse.json(clip("a"), { status: 201 }));
    const input = setup();
    const big = file("big.mp4");
    Object.defineProperty(big, "size", { value: 51 * 1024 * 1024 });

    await pick(input, big);

    expect(await screen.findByRole("alert")).toHaveTextContent("big.mp4 is larger than 50 MB.");
    expect(state.sent).toBe(false);
  });

  it("refuses the wrong type, without uploading", async () => {
    const state = serveUpload(() => HttpResponse.json(clip("a"), { status: 201 }));
    const input = setup();

    await pick(input, file("reef.png", "image/png"));

    expect(await screen.findByRole("alert")).toHaveTextContent("reef.png is not an MP4 or WebM");
    expect(state.sent).toBe(false);
  });

  it("shows the server's refusal, and keeps the value", async () => {
    serveUpload(() =>
      HttpResponse.json(
        { status: 415 },
        { status: 415, headers: { "Content-Type": "application/problem+json" } },
      ),
    );
    const input = setup([clip("a")]);

    await pick(input, file("reef.mp4"));

    expect(await screen.findByRole("alert")).toHaveTextContent("reef.mp4 is not an MP4 or WebM");
    await waitFor(() => expect(screen.getByLabelText("Video 1")).toBeInTheDocument());
    expect(screen.queryByLabelText("Video 2")).not.toBeInTheDocument();
  });

  it("speaks Ukrainian", async () => {
    const input = setup([], "uk");

    await pick(input, file("reef.png", "image/png"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "reef.png — це не відео MP4 або WebM.",
    );
  });
});
