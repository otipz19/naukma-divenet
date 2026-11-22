import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { createI18n } from "../../i18n";
import { usePhotoViewer, type ViewerPhoto } from "./PhotoViewer";

const photos: ViewerPhoto[] = [
  { url: "/media/1.jpg", alt: "First photo" },
  { url: "/media/2.jpg", alt: "Second photo" },
  { url: "/media/3.jpg", alt: "Third photo" },
];

function Gallery({ items }: { items: ViewerPhoto[] }) {
  const { open, viewer } = usePhotoViewer(items);
  return (
    <>
      {items.map((photo, index) => (
        <a key={photo.url} href={photo.url} onClick={open(index)}>
          {`Thumb ${index + 1}`}
        </a>
      ))}
      {viewer}
    </>
  );
}

function renderGallery(items = photos, language = "en") {
  render(
    <I18nextProvider i18n={createI18n(language)}>
      <Gallery items={items} />
    </I18nextProvider>,
  );
}

/** The image the viewer shows now (other slides are preloaded but hidden). */
function current() {
  return document.querySelector(".yarl__slide_current img");
}

describe("PhotoViewer (spec media/photo-viewer)", () => {
  it("opens at the photo whose thumbnail was pressed", async () => {
    renderGallery();
    fireEvent.click(screen.getByText("Thumb 2"));
    await waitFor(() => expect(current()).toHaveAttribute("alt", "Second photo"));
    expect(screen.getByRole("button", { name: "Close photo" })).toBeInTheDocument();
  });

  it("leaves a modified click to the browser", () => {
    renderGallery();
    // Read what the app did, then stop jsdom from following the link.
    let prevented: boolean | undefined;
    const record = (event: Event) => {
      prevented = event.defaultPrevented;
      event.preventDefault();
    };
    document.addEventListener("click", record);
    fireEvent.click(screen.getByText("Thumb 1"), { ctrlKey: true });
    document.removeEventListener("click", record);
    expect(prevented).toBe(false);
    expect(current()).toBeNull();
  });

  it("moves with Next and the left arrow key", async () => {
    renderGallery();
    fireEvent.click(screen.getByText("Thumb 1"));
    await waitFor(() => expect(current()).toHaveAttribute("alt", "First photo"));
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    await waitFor(() => expect(current()).toHaveAttribute("alt", "Second photo"));
    fireEvent.keyDown(document.querySelector(".yarl__container")!, { key: "ArrowLeft" });
    await waitFor(() => expect(current()).toHaveAttribute("alt", "First photo"));
  });

  it("closes on Escape and returns focus to the thumbnail", async () => {
    renderGallery();
    const thumb = screen.getByText("Thumb 3");
    fireEvent.click(thumb);
    await waitFor(() => expect(current()).not.toBeNull());
    fireEvent.keyDown(document.querySelector(".yarl__container")!, { key: "Escape" });
    await waitFor(() => expect(document.querySelector(".yarl__root")).toBeNull());
    await waitFor(() => expect(thumb).toHaveFocus());
  });

  it("shows no previous or next for a single photo", async () => {
    renderGallery(photos.slice(0, 1));
    fireEvent.click(screen.getByText("Thumb 1"));
    await waitFor(() => expect(current()).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Next photo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous photo" })).toBeNull();
  });

  it("labels its buttons in Ukrainian", async () => {
    renderGallery(photos, "uk");
    fireEvent.click(screen.getByText("Thumb 1"));
    await waitFor(() => expect(current()).not.toBeNull());
    expect(screen.getByRole("button", { name: "Закрити фото" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Наступне фото" })).toBeInTheDocument();
  });
});
