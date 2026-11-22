import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

/** One shared, controllable `matchMedia` result, as the browser hands out for a query. */
function fakeMatchMedia(initial: boolean) {
  const target = new EventTarget();
  const media = Object.assign(target, { matches: initial, media: "(max-width: 1099px)" });
  vi.spyOn(window, "matchMedia").mockImplementation(() => media as unknown as MediaQueryList);
  return (next: boolean) => {
    media.matches = next;
    target.dispatchEvent(new Event("change"));
  };
}

afterEach(() => vi.restoreAllMocks());

describe("rework-map-page design D3: useMediaQuery", () => {
  it("returns whether the query matches and follows its changes", () => {
    const change = fakeMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 1099px)"));
    expect(result.current).toBe(false);

    act(() => change(true));

    expect(result.current).toBe(true);
  });
});
