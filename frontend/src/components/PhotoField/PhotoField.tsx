import { X } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/ApiError";
import { MAX_UPLOAD_BYTES, UPLOAD_TYPES, uploadMedia, type UploadedMedia } from "../../api/media";
import { Button } from "../Button/Button";
import styles from "./PhotoField.module.css";

/** A photo in the value: a new upload, or one that already belongs to the content being edited. */
export type PhotoFieldItem = Pick<
  UploadedMedia,
  "id" | "url" | "thumbnailUrl" | "width" | "height"
>;

/** One picked file that has not joined the value yet: uploading, or done and waiting its turn. */
interface Slot {
  key: number;
  media?: UploadedMedia;
  settled: boolean;
}

type PhotoFieldProps = {
  value: PhotoFieldItem[];
  onChange: (value: PhotoFieldItem[]) => void;
  /** The most photos the form takes. */
  max: number;
  /** Translated label; "Photos" by default. */
  label?: string;
};

/**
 * Spec media/photo-field: the Photos field of design/screens/ReviewForm.html. Controlled, so it fits
 * React Hook Form's `Controller`. Picked files upload in parallel, and each joins the value in the
 * order it was picked, whichever finishes first (design D7).
 */
export function PhotoField({ value, onChange, max, label }: PhotoFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const nextKey = useRef(0);
  // Upload callbacks run after renders; these hold what they need to see right now.
  const latest = useRef({ value, onChange, slots });
  useLayoutEffect(() => {
    latest.current = { value, onChange, slots };
  });

  const room = Math.max(0, max - value.length - slots.length);

  function update(nextValue: PhotoFieldItem[], nextSlots: Slot[]) {
    const changed = nextValue !== latest.current.value;
    latest.current = { ...latest.current, value: nextValue, slots: nextSlots };
    setSlots(nextSlots);
    if (changed) latest.current.onChange(nextValue);
  }

  /** Marks a slot done, then moves every leading done slot into the value, in pick order. */
  function settle(key: number, media?: UploadedMedia) {
    const marked = latest.current.slots.map((slot) =>
      slot.key === key ? { ...slot, media, settled: true } : slot,
    );
    const waiting = marked.findIndex((slot) => !slot.settled);
    const ready = waiting < 0 ? marked : marked.slice(0, waiting);
    const added = ready.flatMap((slot) => (slot.media ? [slot.media] : []));
    const { value: current } = latest.current;
    update(added.length > 0 ? [...current, ...added] : current, marked.slice(ready.length));
  }

  function failure(error: unknown, name: string) {
    const status = error instanceof ApiError && error.kind === "http" ? error.status : undefined;
    if (status === 413) return t("media.photoField.errors.tooLarge", { name });
    if (status === 415) return t("media.photoField.errors.wrongType", { name });
    if (status === 400) return t("media.photoField.errors.unreadable", { name });
    return t("media.photoField.errors.failed", { name });
  }

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Cleared, so picking the same file again fires another change.
    event.target.value = "";
    const refused: string[] = [];
    const valid = files.filter((file) => {
      if (!UPLOAD_TYPES.includes(file.type)) {
        refused.push(t("media.photoField.errors.wrongType", { name: file.name }));
      } else if (file.size > MAX_UPLOAD_BYTES) {
        refused.push(t("media.photoField.errors.tooLarge", { name: file.name }));
      } else {
        return true;
      }
      return false;
    });
    const { value: current, slots: busy } = latest.current;
    const accepted = valid.slice(0, Math.max(0, max - current.length - busy.length));
    const skipped = valid.length - accepted.length;
    if (skipped > 0) refused.push(t("media.photoField.skipped", { count: skipped }));
    setMessages(refused);

    const started = accepted.map((file) => ({ key: nextKey.current++, file }));
    update(current, [...busy, ...started.map(({ key }) => ({ key, settled: false }))]);
    for (const { key, file } of started) {
      uploadMedia(file).then(
        (media) => settle(key, media),
        (error: unknown) => {
          setMessages((shown) => [...shown, failure(error, file.name)]);
          settle(key);
        },
      );
    }
  }

  function remove(index: number) {
    update(
      latest.current.value.filter((_, i) => i !== index),
      latest.current.slots,
    );
  }

  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  return (
    <div className={styles.field} role="group" aria-labelledby={labelId}>
      <span id={labelId} className={`label ${styles.label}`}>
        {label ?? t("media.photoField.label")}
      </span>
      <div className={styles.tiles}>
        {value.map((media, index) => (
          <div key={media.id} className={styles.tile}>
            <img
              className={styles.image}
              src={media.thumbnailUrl}
              alt={t("media.photoField.alt", { position: index + 1 })}
            />
            <button
              type="button"
              className={styles.remove}
              aria-label={t("media.photoField.remove", { position: index + 1 })}
              onClick={() => remove(index)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {slots.map((slot, index) =>
          slot.media ? (
            <div key={slot.key} className={styles.tile}>
              <img
                className={styles.image}
                src={slot.media.thumbnailUrl}
                alt={t("media.photoField.alt", { position: value.length + index + 1 })}
              />
            </div>
          ) : (
            <div
              key={slot.key}
              className={`${styles.tile} ${styles.busy}`}
              role="progressbar"
              aria-label={t("media.photoField.uploading")}
            />
          ),
        )}
        {room > 0 && (
          <Button
            variant="secondary"
            className={styles.add}
            aria-describedby={hintId}
            onClick={() => input.current?.click()}
          >
            {t("media.photoField.add")}
          </Button>
        )}
      </div>
      {/* The button above opens this picker; the input itself stays out of the tab order. */}
      <input
        ref={input}
        className={styles.input}
        type="file"
        accept={UPLOAD_TYPES.join(",")}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        onChange={pick}
      />
      <span id={hintId} className={`body-sm ${styles.hint}`}>
        {value.length >= max
          ? t("media.photoField.hintLimit", { count: max })
          : t("media.photoField.hint")}
      </span>
      {messages.length > 0 && (
        <ul className={`body-sm ${styles.errors}`} role="alert">
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
