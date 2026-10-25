import { useTranslation } from "react-i18next";

// Placeholder until the app shell is designed (docs/DESIGN.md, add-app-shell).
export function HomePage() {
  const { t } = useTranslation();
  return (
    <main>
      <h1>{t("app.name")}</h1>
      <p>{t("home.placeholder")}</p>
    </main>
  );
}
