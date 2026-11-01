function startOfLocalDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

const MS_PER_DAY = 86_400_000;

/**
 * Formats an ISO timestamp as "today", "yesterday" or "n days ago" in `locale` when posted in the
 * last 30 calendar days, and as the localized short date otherwise (design D6).
 */
export function formatRelativeDate(iso: string, locale: string, now: Date = new Date()): string {
  const posted = new Date(iso);
  if (Number.isNaN(posted.getTime())) {
    return iso;
  }
  const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(posted)) / MS_PER_DAY);
  if (diffDays >= 0 && diffDays <= 30) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diffDays, "day");
  }
  const dateLocale = locale === "en" ? "en-GB" : locale;
  return new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(posted);
}
