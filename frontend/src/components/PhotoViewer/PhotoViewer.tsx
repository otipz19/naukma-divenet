import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

/** One photo the viewer shows: the full-size file and its text alternative. */
export type ViewerPhoto = { url: string; alt: string; width?: number; height?: number };

const hideButton = () => null;

/**
 * design/system/components/PhotoViewer: an overlay over the page with close, previous and
 * next (spec media/photo-viewer). It wraps `yet-another-react-lightbox` (design D1): the
 * library makes the page behind inert, handles Escape and the arrow keys, and turns off its
 * animations under `prefers-reduced-motion`.
 */
export function PhotoViewer({
  photos,
  index,
  onClose,
  onClosed,
}: {
  photos: readonly ViewerPhoto[];
  /** The photo shown first; `null` keeps the viewer closed. */
  index: number | null;
  onClose: () => void;
  /** Called once the viewer has left the page. */
  onClosed?: () => void;
}) {
  const { t } = useTranslation();
  const single = photos.length < 2;
  return (
    <Lightbox
      open={index !== null}
      index={index ?? 0}
      close={onClose}
      on={{ exited: onClosed }}
      slides={photos.map((photo) => ({
        src: photo.url,
        alt: photo.alt,
        width: photo.width,
        height: photo.height,
      }))}
      carousel={{ finite: true }}
      controller={{ closeOnBackdropClick: true }}
      render={single ? { buttonPrev: hideButton, buttonNext: hideButton } : undefined}
      labels={{
        Close: t("media.viewer.close"),
        Previous: t("media.viewer.previous"),
        Next: t("media.viewer.next"),
        Lightbox: t("media.viewer.label"),
        Carousel: t("media.viewer.carousel"),
        Slide: t("media.viewer.slide"),
        "Photo gallery": t("media.viewer.gallery"),
        "{index} of {total}": t("media.viewer.position"),
      }}
    />
  );
}

/** A click the browser should handle itself: another button, or with a modifier key. */
function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * Opens `photos` in the viewer from their thumbnails. Each thumbnail stays a link to the
 * file; `open(index)` gives its click handler, which opens the viewer on a plain click and
 * leaves a modified click to the browser. Focus returns to the thumbnail on close.
 */
export function usePhotoViewer(photos: readonly ViewerPhoto[]): {
  open: (index: number) => (event: MouseEvent<HTMLElement>) => void;
  viewer: ReactNode;
} {
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback(
    (at: number) => (event: MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      event.preventDefault();
      opener.current = event.currentTarget;
      setIndex(at);
    },
    [],
  );
  const viewer = (
    <PhotoViewer
      photos={photos}
      index={index}
      onClose={() => setIndex(null)}
      onClosed={() => opener.current?.focus()}
    />
  );
  return { open, viewer };
}
