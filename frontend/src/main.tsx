import "./styles/fonts";
import "../../design/system/tokens.css";
import "./styles/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { App } from "./app/App";
import { watchSystemTheme } from "./app/theme";
import { initI18n } from "./i18n";

watchSystemTheme();
const i18n = initI18n();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
