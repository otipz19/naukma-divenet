export const SUPPORTED_LANGUAGES = ["en", "uk"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "divenet.lang";

function isSupported(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

// Storage can throw (private browsing, blocked site data); language handling must never break start-up.
export function readSavedLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupported(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveLanguage(language: string): void {
  if (!isSupported(language)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Not saved; the choice still applies for this visit.
  }
}

/** Saved choice first, then `uk` for a Ukrainian browser, otherwise `en`. */
export function detectInitialLanguage(
  browserLanguages: readonly string[] = navigator.languages,
): Language {
  const saved = readSavedLanguage();
  if (saved) return saved;
  const preferred = browserLanguages[0]?.toLowerCase();
  return preferred === "uk" || preferred?.startsWith("uk-") ? "uk" : DEFAULT_LANGUAGE;
}

export function setDocumentLanguage(language: string): void {
  document.documentElement.lang = language;
}
