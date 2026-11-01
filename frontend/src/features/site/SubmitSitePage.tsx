import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Link } from "react-router";
import "leaflet/dist/leaflet.css";
import { ApiError } from "../../api/ApiError";
import { api } from "../../api/client";
import { Alert } from "../../components/Alert/Alert";
import { difficultyWord } from "../../components/Badge/DifficultyBadge";
import { Button } from "../../components/Button/Button";
import { Chip } from "../../components/Chip/Chip";
import { SelectField } from "../../components/SelectField/SelectField";
import { TextAreaField } from "../../components/TextField/TextAreaField";
import { TextField } from "../../components/TextField/TextField";
import { pinIcon } from "./SiteClusterLayer";
import { StatusBadge } from "./StatusBadge";
import { submitSchema, wrapLongitude, type SubmitValues } from "./submitSchema";
import styles from "./SubmitSitePage.module.css";

const EMPTY: SubmitValues = {
  name: "",
  lat: "",
  lng: "",
  country: "",
  regionCode: "",
  minDepth: "",
  maxDepth: "",
  difficulty: "",
  description: "",
};
const LEVELS = [1, 2, 3, 4, 5];
const SERVER_FIELDS = [
  "name",
  "lat",
  "lng",
  "regionCode",
  "minDepth",
  "maxDepth",
  "difficulty",
  "description",
];

function LocationClicks({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

/** The submission page at `/sites/new`, with the author's submissions (spec site/submission). */
export function SubmitSitePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [required, setRequired] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<"success" | "failure">();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SubmitValues>({ resolver: zodResolver(submitSchema), defaultValues: EMPTY });

  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.GET("/api/v1/countries")).data ?? [],
  });
  const gearItems = useQuery({
    queryKey: ["gear-items"],
    queryFn: async () => (await api.GET("/api/v1/gear-items")).data ?? [],
  });
  const mine = useQuery({
    queryKey: ["sites", "mine"],
    queryFn: async () => (await api.GET("/api/v1/sites/mine")).data ?? [],
  });

  const country = useWatch({ control, name: "country" });
  const latText = useWatch({ control, name: "lat" });
  const lngText = useWatch({ control, name: "lng" });
  const lat = Number(latText);
  const lng = Number(lngText);
  const hasPoint = latText !== "" && lngText !== "" && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const regions = countries.data?.find((item) => item.code === country)?.regions ?? [];
  const message = (key?: string) => (key ? t(key) : undefined);

  const pickLocation = (pickedLat: number, pickedLng: number) => {
    setValue("lat", pickedLat.toFixed(4), { shouldValidate: true });
    setValue("lng", wrapLongitude(pickedLng).toFixed(4), { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setOutcome(undefined);
    try {
      await api.POST("/api/v1/sites", {
        body: {
          name: values.name,
          regionCode: values.regionCode,
          lat: Number(values.lat),
          lng: Number(values.lng),
          difficulty: Number(values.difficulty),
          minDepth: Number(values.minDepth),
          maxDepth: Number(values.maxDepth),
          description: values.description,
          requiredGear: required,
          recommendedGear: recommended,
        },
      });
      reset(EMPTY);
      setRequired([]);
      setRecommended([]);
      setOutcome("success");
      await queryClient.invalidateQueries({ queryKey: ["sites"] });
    } catch (error) {
      const fields = error instanceof ApiError ? (error.problem?.errors ?? []) : [];
      const known = fields.filter((field) => SERVER_FIELDS.includes(field.field));
      for (const field of known) {
        setError(field.field as keyof SubmitValues, { message: "site.submit.errors.rejected" });
      }
      // A field with no input of its own, such as gear, or any other failure.
      if (known.length === 0 || known.length < fields.length) setOutcome("failure");
    }
  });

  const gearGroup = (
    legend: string,
    pressed: string[],
    other: string[],
    onChange: (next: string[]) => void,
    clearOther: (next: string[]) => void,
  ) => (
    <fieldset className={styles.group}>
      <legend className="label">{legend}</legend>
      <div className={styles.chips}>
        {(gearItems.data ?? []).map((item) => (
          <Chip
            key={item.code}
            pressed={pressed.includes(item.code)}
            onToggle={() => {
              if (pressed.includes(item.code)) {
                onChange(pressed.filter((code) => code !== item.code));
              } else {
                onChange([...pressed, item.code]);
                clearOther(other.filter((code) => code !== item.code));
              }
            }}
          >
            {t(`gear.${item.code}`)}
          </Chip>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className={styles.page}>
      <form className={styles.form} noValidate onSubmit={(event) => void onSubmit(event)}>
        <div className={styles.head}>
          <h1 className={`h1 ${styles.flush}`}>{t("site.submit.title")}</h1>
          <p className={`body ${styles.muted}`}>{t("site.submit.hint")}</p>
        </div>
        <TextField
          label={t("site.submit.name")}
          error={message(errors.name?.message)}
          {...register("name")}
        />
        <section className={styles.group} aria-label={t("site.submit.mapLabel")}>
          <span className="label">{t("site.submit.location")}</span>
          <span className={`body-sm ${styles.muted}`}>{t("site.submit.mapHint")}</span>
          <div className={styles.mapBox}>
            <MapContainer
              className={styles.map}
              center={[20, 10]}
              zoom={1}
              minZoom={1}
              worldCopyJump
            >
              <TileLayer
                key={t("site.map.attribution")}
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution={t("site.map.attribution")}
              />
              <LocationClicks onPick={pickLocation} />
              {hasPoint && <Marker position={[lat, lng]} icon={pinIcon} />}
            </MapContainer>
          </div>
        </section>
        <div className={styles.pair}>
          <TextField
            label={t("site.submit.lat")}
            inputMode="decimal"
            error={message(errors.lat?.message)}
            {...register("lat")}
          />
          <TextField
            label={t("site.submit.lng")}
            inputMode="decimal"
            error={message(errors.lng?.message)}
            {...register("lng")}
          />
          <SelectField
            label={t("site.search.country")}
            error={message(errors.country?.message)}
            {...register("country", { onChange: () => setValue("regionCode", "") })}
          >
            <option value="">{t("site.submit.choose")}</option>
            {(countries.data ?? []).map((item) => (
              <option key={item.code} value={item.code}>
                {t(`geo.countries.${item.code}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t("site.search.region")}
            disabled={!country}
            error={message(errors.regionCode?.message)}
            {...register("regionCode")}
          >
            <option value="">{t("site.submit.choose")}</option>
            {regions.map((item) => (
              <option key={item.code} value={item.code}>
                {t(`geo.regions.${item.code}`)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t("site.search.minDepth")}
            inputMode="numeric"
            error={message(errors.minDepth?.message)}
            {...register("minDepth")}
          />
          <TextField
            label={t("site.search.maxDepth")}
            inputMode="numeric"
            error={message(errors.maxDepth?.message)}
            {...register("maxDepth")}
          />
        </div>
        <SelectField
          label={t("site.search.difficulty")}
          error={message(errors.difficulty?.message)}
          {...register("difficulty")}
        >
          <option value="">{t("site.submit.choose")}</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {`${level} · ${t(`site.difficulty.${difficultyWord(level)}`)}`}
            </option>
          ))}
        </SelectField>
        {gearGroup(
          t("site.details.requiredGear"),
          required,
          recommended,
          setRequired,
          setRecommended,
        )}
        {gearGroup(
          t("site.details.recommendedGear"),
          recommended,
          required,
          setRecommended,
          setRequired,
        )}
        <TextAreaField
          label={t("site.submit.description")}
          error={message(errors.description?.message)}
          {...register("description")}
        />
        {/* Beside the button: on a long form the top would be out of view. */}
        {outcome === "success" && (
          <Alert tone="success" live>
            {t("site.submit.success")}
          </Alert>
        )}
        {outcome === "failure" && (
          <Alert tone="danger" live>
            {t("site.submit.failure")}
          </Alert>
        )}
        <div className={styles.actions}>
          <Button type="submit" disabled={isSubmitting}>
            {t("site.submit.send")}
          </Button>
        </div>
      </form>
      <aside className={styles.aside}>
        <h2 className={`h3 ${styles.flush}`}>{t("site.submit.yours")}</h2>
        {mine.data?.length === 0 && (
          <p className={`body-sm ${styles.muted}`}>{t("site.submit.none")}</p>
        )}
        {mine.data?.map((site) => (
          <div key={site.id} className={styles.card}>
            <div className={styles.cardHead}>
              <Link className="label" to={`/sites/${site.id}`}>
                {site.name}
              </Link>
              <StatusBadge status={site.status} />
            </div>
            {site.rejectionReason && (
              <p className={`body-sm ${styles.muted}`}>{site.rejectionReason}</p>
            )}
          </div>
        ))}
      </aside>
    </div>
  );
}
