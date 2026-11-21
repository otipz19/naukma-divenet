import { describe, expect, it } from "vitest";

// jsdom does no layout, and Vitest stubs CSS imports, so the rule is checked in the file itself.
// The front-end has no Node types, so node:fs is typed here for the one call it makes.
const { readFileSync } = (await import(String("node:fs"))) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
// A variable path keeps Vite from rewriting the URL into an asset URL.
const file = "./Dialog.module.css";
const css = readFileSync(new URL(file, import.meta.url), "utf8");

describe("shared/dialogs: A dialog is modal and named by its title", () => {
  it("fills the screen on a phone", () => {
    const phone = css.slice(css.indexOf("@media (max-width: 767px)"));

    expect(phone).toContain("width: 100vw");
    expect(phone).toContain("height: 100dvh");
    expect(phone).toContain("border-radius: 0");
  });
});
