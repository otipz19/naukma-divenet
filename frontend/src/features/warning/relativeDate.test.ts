import { describe, expect, it } from "vitest";

import { formatRelativeDate } from "./relativeDate";

describe("formatRelativeDate", () => {
  const now = new Date("2026-05-01T14:00:00Z");

  it("formats today, yesterday and n days ago in en", () => {
    expect(formatRelativeDate("2026-05-01T09:00:00Z", "en", now)).toBe("today");
    expect(formatRelativeDate("2026-04-30T12:00:00Z", "en", now)).toBe("yesterday");
    expect(formatRelativeDate("2026-04-29T12:00:00Z", "en", now)).toBe("2 days ago");
  });

  it("uses relative time at the 30-day boundary and a date after it in en", () => {
    expect(formatRelativeDate("2026-04-01T12:00:00Z", "en", now)).toBe("30 days ago");
    expect(formatRelativeDate("2026-03-31T12:00:00Z", "en", now)).toBe("31 Mar 2026");
    expect(formatRelativeDate("2026-03-03T12:00:00Z", "en", now)).toBe("3 Mar 2026");
  });

  it("formats today, yesterday, n days ago, the 30-day boundary and older dates in uk", () => {
    const rtfUk = new Intl.RelativeTimeFormat("uk", { numeric: "auto" });
    expect(formatRelativeDate("2026-05-01T09:00:00Z", "uk", now)).toBe(rtfUk.format(0, "day"));
    expect(formatRelativeDate("2026-04-30T12:00:00Z", "uk", now)).toBe(rtfUk.format(-1, "day"));
    expect(formatRelativeDate("2026-04-29T12:00:00Z", "uk", now)).toBe(rtfUk.format(-2, "day"));
    expect(formatRelativeDate("2026-04-01T12:00:00Z", "uk", now)).toBe(rtfUk.format(-30, "day"));
    const dtfUk = new Intl.DateTimeFormat("uk", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    expect(formatRelativeDate("2026-03-31T12:00:00Z", "uk", now)).toBe(
      dtfUk.format(new Date("2026-03-31T12:00:00Z")),
    );
  });
});
