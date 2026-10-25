// @vitest-environment node
import { describe, expect, it } from "vitest";
import { findMissingKeys } from "./check-i18n.mjs";

describe("shared/i18n: Both locale files have the same keys", () => {
  it("passes when the locales have the same keys", () => {
    expect(
      findMissingKeys({
        "en.json": { home: { title: "Home" } },
        "uk.json": { home: { title: "Головна" } },
      }),
    ).toEqual([]);
  });

  it("names a key missing from uk and the file", () => {
    expect(
      findMissingKeys({
        "en.json": { home: { title: "Home", intro: "Hi" } },
        "uk.json": { home: { intro: "Привіт" } },
      }),
    ).toEqual(["home.title is missing in uk.json"]);
  });

  it("treats an empty value as missing", () => {
    expect(
      findMissingKeys({
        "en.json": { home: { title: "Home" } },
        "uk.json": { home: { title: "" } },
      }),
    ).toEqual(["home.title is missing in uk.json"]);
  });

  it("reports keys missing in either direction", () => {
    expect(
      findMissingKeys({
        "en.json": { a: "A" },
        "uk.json": { b: "Б" },
      }),
    ).toEqual(["b is missing in en.json", "a is missing in uk.json"]);
  });
});
