export const DISCLAIMER_STORAGE_KEY = "divenet.disclaimer";
const DISMISSED = "dismissed";

// Storage can throw (private browsing, blocked site data). A failure counts as "not saved",
// so the disclaimer shows again; it must never break start-up (spec shared/disclaimer).
export function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISCLAIMER_STORAGE_KEY) === DISMISSED;
  } catch {
    return false;
  }
}

export function saveDismissed(): void {
  try {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, DISMISSED);
  } catch {
    // Not saved; the dialog shows again on the next visit.
  }
}
