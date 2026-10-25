import i18next, { type i18n, type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  detectInitialLanguage,
  saveLanguage,
  setDocumentLanguage,
} from "./language";
import en from "./locales/en.json";
import uk from "./locales/uk.json";

export const resources: Resource = { en: { translation: en }, uk: { translation: uk } };

/**
 * Creates an initialised i18next instance. Locales are bundled, so initialisation is synchronous.
 * Later language changes are saved and reflected in `<html lang>`.
 */
export function createI18n(language: string, localeResources: Resource = resources): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    resources: localeResources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    returnEmptyString: false,
    interpolation: { escapeValue: false }, // React already escapes output.
    initAsync: false,
  });
  setDocumentLanguage(instance.language);
  instance.on("languageChanged", (lng) => {
    saveLanguage(lng);
    setDocumentLanguage(lng);
  });
  return instance;
}

export function initI18n(): i18n {
  return createI18n(detectInitialLanguage());
}
