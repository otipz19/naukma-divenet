import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { createI18n } from "../../i18n";
import { PagePlaceholder, Skeleton } from "./Skeleton";

// Vitest stubs CSS imports, so the reduced-motion rule is checked in the stylesheet itself.
const { readFileSync } = (await import(String("node:fs"))) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
// The path goes through a variable, so Vite does not rewrite it into an asset URL.
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("./Skeleton.module.css");

describe("shared/web-app: Main pages show a loading placeholder", () => {
  it("Reduced motion: the skeleton does not animate", () => {
    const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(css.slice(start)).toMatch(/\.skeleton\s*\{\s*animation:\s*none;/);
  });

  it("marks the region busy and announces Loading in the active locale", () => {
    render(
      <I18nextProvider i18n={createI18n("uk")}>
        <PagePlaceholder>
          <Skeleton />
        </PagePlaceholder>
      </I18nextProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Завантаження…");
    expect(screen.getByRole("status").parentElement).toHaveAttribute("aria-busy", "true");
  });
});
