// implements FR8, NFR-R3 of improve-sidebar-ux
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useHoverCapability } from "./useHoverCapability";

type ChangeListener = (event: MediaQueryListEvent) => void;

function createMockMatchMedia(initialMatches: boolean) {
  let currentListener: ChangeListener | null = null;

  const mediaQueryList = {
    matches: initialMatches,
    addEventListener: vi.fn((_event: string, listener: ChangeListener) => {
      currentListener = listener;
    }),
    removeEventListener: vi.fn((_event: string, _listener: ChangeListener) => {
      currentListener = null;
    }),
  };

  const triggerChange = (matches: boolean) => {
    if (currentListener) {
      currentListener({ matches } as MediaQueryListEvent);
    }
  };

  return { mediaQueryList, triggerChange };
}

/**
 * Creates a matchMedia mock that only returns the expected result
 * for the exact "(hover: hover)" query. Any other query returns matches=false.
 * This ensures the constant HOVER_MEDIA_QUERY is used correctly.
 */
function createStrictMatchMedia(initialMatches: boolean) {
  let currentListener: ChangeListener | null = null;

  const realMediaQueryList = {
    matches: initialMatches,
    addEventListener: vi.fn((_event: string, listener: ChangeListener) => {
      currentListener = listener;
    }),
    removeEventListener: vi.fn((_event: string, _listener: ChangeListener) => {
      currentListener = null;
    }),
  };

  const wrongQueryResult = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  const matchMediaFn = vi.fn((query: string) => {
    if (query === "(hover: hover)") return realMediaQueryList;
    return wrongQueryResult;
  });

  const triggerChange = (matches: boolean) => {
    if (currentListener) {
      currentListener({ matches } as MediaQueryListEvent);
    }
  };

  return { matchMediaFn, realMediaQueryList, triggerChange };
}

describe("useHoverCapability", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("should return true when device supports hover", () => {
    const { matchMediaFn } = createStrictMatchMedia(true);
    window.matchMedia = matchMediaFn as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useHoverCapability());

    expect(result.current).toBe(true);
  });

  it("should return false when device does not support hover", () => {
    const { matchMediaFn } = createStrictMatchMedia(false);
    window.matchMedia = matchMediaFn as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useHoverCapability());

    expect(result.current).toBe(false);
  });

  it("should update when media query changes from hover to no-hover", () => {
    const { mediaQueryList, triggerChange } = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    const { result } = renderHook(() => useHoverCapability());
    expect(result.current).toBe(true);

    act(() => {
      triggerChange(false);
    });

    expect(result.current).toBe(false);
  });

  it("should update when media query changes from no-hover to hover", () => {
    const { mediaQueryList, triggerChange } = createMockMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    const { result } = renderHook(() => useHoverCapability());
    expect(result.current).toBe(false);

    act(() => {
      triggerChange(true);
    });

    expect(result.current).toBe(true);
  });

  it("should register change listener on mount", () => {
    const { mediaQueryList } = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    renderHook(() => useHoverCapability());

    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should remove change listener on unmount", () => {
    const { mediaQueryList } = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    const { unmount } = renderHook(() => useHoverCapability());
    unmount();

    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should query the correct media query string", () => {
    const { mediaQueryList } = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    renderHook(() => useHoverCapability());

    expect(window.matchMedia).toHaveBeenCalledWith("(hover: hover)");
  });

  it("should call matchMedia exactly twice — once for initial state and once in effect", () => {
    const { mediaQueryList } = createMockMatchMedia(false);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    renderHook(() => useHoverCapability());

    // getHasHover() call in useState + matchMedia in useEffect
    expect(window.matchMedia).toHaveBeenCalledTimes(2);
    // Both calls must use the exact media query string
    for (const call of (window.matchMedia as ReturnType<typeof vi.fn>).mock
      .calls) {
      expect(call[0]).toBe("(hover: hover)");
    }
  });

  it("should not re-register listener on re-render when deps array is empty", () => {
    const { mediaQueryList } = createMockMatchMedia(true);
    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    const { rerender } = renderHook(() => useHoverCapability());

    // After initial mount: 1 addEventListener, 0 removeEventListener
    expect(mediaQueryList.addEventListener).toHaveBeenCalledTimes(1);
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledTimes(0);

    rerender();

    // After re-render: still 1 addEventListener, still 0 removeEventListener
    // If deps were not empty, React would re-run the effect: cleanup (remove) + setup (add)
    expect(mediaQueryList.addEventListener).toHaveBeenCalledTimes(1);
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledTimes(0);
  });
});
