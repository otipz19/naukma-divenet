import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import type { UploadedMedia } from "../../api/media";
import { createI18n } from "../../i18n";
import { server } from "../../test/server";
import { PhotoField, type PhotoFieldItem } from "./PhotoField";

const mediaUrl = () => `${window.location.origin}/api/v1/media`;

function media(name: string): UploadedMedia {
  const id = `00000000-0000-4000-8000-${name.padStart(12, "0").slice(-12)}`;
  return {
    id,
    url: `/media/${id}`,
    thumbnailUrl: `/media/${id}/thumb`,
    contentType: "image/jpeg",
    width: 1200,
    height: 800,
  };
}

const jpeg = (name: string, size = 16) =>
  new File([new Uint8Array(size)], name, { type: "image/jpeg" });

/** Renders the field with its value in state, as a form would; `values` records each change. */
function renderField({
  initial = [],
  max = 5,
  language = "en",
}: { initial?: UploadedMedia[]; max?: number; language?: string } = {}) {
  const values: PhotoFieldItem[][] = [];
  function Harness() {
    const [value, setValue] = useState<PhotoFieldItem[]>(initial);
    return (
      <PhotoField
        value={value}
        max={max}
        onChange={(next) => {
          values.push(next);
          setValue(next);
        }}
      />
    );
  }
  const view = render(
    <I18nextProvider i18n={createI18n(language)}>
      <Harness />
    </I18nextProvider>,
  );
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const user = userEvent.setup({ applyAccept: false });
  return { input, user, values, current: () => values.at(-1) ?? initial };
}

/** Answers each upload with media named after the file; `received` lists the file names. */
function uploads(
  respond: (name: string) => Promise<Response> | Response = (name) =>
    HttpResponse.json(media(name), { status: 201 }),
) {
  const received: string[] = [];
  server.use(
    http.post(mediaUrl(), async ({ request }) => {
      const file = (await request.formData()).get("file") as File;
      received.push(file.name);
      return respond(file.name);
    }),
  );
  return received;
}

describe("media/photo-field: The photo field shows the form's photos", () => {
  it("Field with two photos", () => {
    renderField({ initial: [media("a"), media("b")] });

    const images = screen.getAllByRole("img");
    expect(images.map((image) => image.getAttribute("alt"))).toEqual(["Photo 1", "Photo 2"]);
    expect(images.map((image) => image.getAttribute("src"))).toEqual([
      media("a").thumbnailUrl,
      media("b").thumbnailUrl,
    ]);
    expect(screen.getByRole("group", { name: "Photos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add photo" })).toHaveAccessibleDescription(
      "JPEG, PNG or WebP up to 10 MB each.",
    );
  });

  it("File picker accepts images only", () => {
    const { input } = renderField();

    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(input).toHaveAttribute("multiple");
  });

  it("Field in Ukrainian", () => {
    renderField({ initial: [media("a")], language: "uk" });

    expect(screen.getByRole("group", { name: "Фото" })).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Фото 1");
    expect(screen.getByRole("button", { name: "Видалити фото 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Додати фото" })).toHaveAccessibleDescription(
      "JPEG, PNG або WebP, до 10 МБ кожне.",
    );
  });
});

describe("media/photo-field: Picked photos are uploaded", () => {
  it("Two photos picked: both join the value in pick order, even when the second finishes first", async () => {
    const received = uploads(async (name) => {
      await delay(name === "first.jpg" ? 60 : 0);
      return HttpResponse.json(media(name), { status: 201 });
    });
    const { input, user, current } = renderField();

    await user.upload(input, [jpeg("first.jpg"), jpeg("second.jpg")]);

    await waitFor(() => expect(current()).toEqual([media("first.jpg"), media("second.jpg")]));
    expect(received.sort()).toEqual(["first.jpg", "second.jpg"]);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img").map((image) => image.getAttribute("src"))).toEqual([
      media("first.jpg").thumbnailUrl,
      media("second.jpg").thumbnailUrl,
    ]);
  });

  it("Upload in progress", async () => {
    uploads(async () => {
      await delay("infinite");
      return new HttpResponse(null, { status: 500 });
    });
    const { input, user, current } = renderField();

    await user.upload(input, jpeg("reef.jpg"));

    expect(await screen.findByRole("progressbar", { name: "Uploading photo" })).toBeInTheDocument();
    expect(current()).toEqual([]);
  });
});

describe("media/photo-field: Invalid photos are refused with a message", () => {
  it("Too large before upload", async () => {
    const received = uploads();
    const { input, user, current } = renderField();

    await user.upload(input, jpeg("reef.jpg", 12 * 1024 * 1024));

    expect(await screen.findByRole("alert")).toHaveTextContent("reef.jpg is larger than 10 MB.");
    expect(received).toEqual([]);
    expect(current()).toEqual([]);
  });

  it("Wrong type before upload", async () => {
    const received = uploads();
    const { input, user } = renderField();

    await user.upload(input, new File(["%PDF"], "notes.pdf", { type: "application/pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "notes.pdf is not a JPEG, PNG or WebP image.",
    );
    expect(received).toEqual([]);
  });

  it("Server refuses the file", async () => {
    uploads((name) =>
      name === "bad.jpg"
        ? HttpResponse.json(
            { status: 415, title: "Unsupported Media Type" },
            { status: 415, headers: { "Content-Type": "application/problem+json" } },
          )
        : HttpResponse.json(media(name), { status: 201 }),
    );
    const { input, user, current } = renderField();

    await user.upload(input, [jpeg("bad.jpg"), jpeg("good.jpg")]);

    await waitFor(() => expect(current()).toEqual([media("good.jpg")]));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "bad.jpg is not a JPEG, PNG or WebP image.",
    );
  });

  it("Network failure", async () => {
    uploads(() => HttpResponse.error());
    const { input, user, values } = renderField();

    await user.upload(input, jpeg("reef.jpg"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "reef.jpg could not be uploaded. Try again.",
    );
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(values).toEqual([]);
  });

  it("A refused file leaves the other picked files alone", async () => {
    const received = uploads();
    const { input, user, current } = renderField();

    await user.upload(input, [
      new File(["x"], "notes.pdf", { type: "application/pdf" }),
      jpeg("reef.jpg"),
    ]);

    await waitFor(() => expect(current()).toEqual([media("reef.jpg")]));
    expect(received).toEqual(["reef.jpg"]);
    expect(screen.getByRole("alert")).toHaveTextContent("notes.pdf");
  });
});

describe("media/photo-field: Photos can be removed", () => {
  it("Remove the first photo", async () => {
    const { user, current } = renderField({ initial: [media("a"), media("b"), media("c")] });

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));

    expect(current()).toEqual([media("b"), media("c")]);
    expect(screen.getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual([
      "Photo 1",
      "Photo 2",
    ]);
  });
});

describe("media/photo-field: The field limits the number of photos", () => {
  it("Limit reached", () => {
    renderField({ initial: [media("a"), media("b"), media("c")], max: 3 });

    expect(screen.queryByRole("button", { name: "Add photo" })).not.toBeInTheDocument();
    expect(screen.getByText("You can add at most 3 photos.")).toBeInTheDocument();
  });

  it("Too many picked", async () => {
    const received = uploads();
    const { input, user, current } = renderField({ initial: [media("a"), media("b")], max: 3 });

    await user.upload(input, [jpeg("one.jpg"), jpeg("two.jpg"), jpeg("three.jpg")]);

    expect(await screen.findByRole("alert")).toHaveTextContent("2 files were skipped");
    await waitFor(() => expect(current()).toEqual([media("a"), media("b"), media("one.jpg")]));
    expect(received).toEqual(["one.jpg"]);
  });
});
