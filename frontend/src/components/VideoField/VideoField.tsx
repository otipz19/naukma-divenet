import { X } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/ApiError";
import { MAX_VIDEO_BYTES, uploadVideo, VIDEO_TYPES, type UploadedVideo } from "../../api/media";
import { Button } from "../Button/Button";
import styles from "./VideoField.module.css";

const MAX_VIDEOS = 3;

/** Spec media/video-field. Controlled, for React Hook Form's `Controller`; files upload one after another. */
export function VideoField({
  value,
  onChange,
}: {
  value: UploadedVideo[];
  onChange: (value: UploadedVideo[]) => void;
}) {
  const { t } = useTranslation();
  const hintId = useId();
  const labelId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  function failure(error: unknown, name: string) {
    const status = error instanceof ApiError && error.kind === "http" ? error.status : undefined;
    if (status === 413) return t("media.videoField.errors.tooLarge", { name });
    if (status === 415) return t("media.videoField.errors.wrongType", { name });
    return t("media.videoField.errors.failed", { name });
  }

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // The same file can be picked again after a refusal.
    event.target.value = "";
    const errors: string[] = [];
    let next = value;
    setMessages([]);
    setUploading(true);
    for (const file of files.slice(0, MAX_VIDEOS - value.length)) {
      if (!VIDEO_TYPES.includes(file.type)) {
        errors.push(t("media.videoField.errors.wrongType", { name: file.name }));
      } else if (file.size > MAX_VIDEO_BYTES) {
        errors.push(t("media.videoField.errors.tooLarge", { name: file.name }));
      } else {
        try {
          next = [...next, await uploadVideo(file)];
          onChange(next);
        } catch (error) {
          errors.push(failure(error, file.name));
        }
      }
    }
    setUploading(false);
    setMessages(errors);
  }

  return (
    <div className={styles.field}>
      <span id={labelId} className={`label ${styles.label}`}>
        {t("media.videoField.label")}
      </span>
      {value.map((video, index) => (
        <div key={video.id} className={styles.item}>
          <video
            className={styles.video}
            src={video.url}
            controls
            preload="metadata"
            aria-label={t("media.videoField.player", { position: index + 1 })}
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("media.videoField.remove", { position: index + 1 })}
            onClick={() => onChange(value.filter((item) => item.id !== video.id))}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </div>
      ))}
      {uploading && (
        <div
          className={styles.busy}
          role="progressbar"
          aria-label={t("media.videoField.uploading")}
        />
      )}
      {value.length < MAX_VIDEOS && !uploading && (
        <div>
          <Button
            variant="secondary"
            aria-describedby={hintId}
            onClick={() => input.current?.click()}
          >
            {t("media.videoField.add")}
          </Button>
        </div>
      )}
      {/* The button above opens this picker; the input itself stays out of the tab order. */}
      <input
        ref={input}
        className={styles.input}
        type="file"
        accept={VIDEO_TYPES.join(",")}
        multiple
        tabIndex={-1}
        aria-hidden="true"
        aria-labelledby={labelId}
        onChange={(event) => void pick(event)}
      />
      <span id={hintId} className={`body-sm ${styles.hint}`}>
        {value.length >= MAX_VIDEOS ? t("media.videoField.hintLimit") : t("media.videoField.hint")}
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
