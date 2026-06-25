// implements FR7 of improve-sidebar-ux
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

let mockIsDesktop = true;

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

import { useFilterBarPosition } from "./useFilterBarPosition";

describe("useFilterBarPosition", () => {
  beforeEach(() => {
    localStorage.clear();
    mockIsDesktop = true;
  });

  it("should return filterBarPosition property in the result", () => {
    const { result } = renderHook(() => useFilterBarPosition());

    expect(result.current).toHaveProperty("filterBarPosition");
  });

  it("should return setFilterBarPosition function in the result", () => {
    const { result } = renderHook(() => useFilterBarPosition());

    expect(result.current).toHaveProperty("setFilterBarPosition");
    expect(typeof result.current.setFilterBarPosition).toBe("function");
  });

  it("should default to 'top' on desktop", () => {
    mockIsDesktop = true;

    const { result } = renderHook(() => useFilterBarPosition());

    expect(result.current.filterBarPosition).toBe("top");
  });

  it("should default to 'bottom' on mobile", () => {
    mockIsDesktop = false;

    const { result } = renderHook(() => useFilterBarPosition());

    expect(result.current.filterBarPosition).toBe("bottom");
  });

  it("should persist selected position to localStorage", () => {
    const { result } = renderHook(() => useFilterBarPosition());

    act(() => {
      result.current.setFilterBarPosition("bottom");
    });

    expect(localStorage.getItem(STORAGE_KEYS.FILTER_BAR_POSITION)).toBe(
      "bottom",
    );
    expect(result.current.filterBarPosition).toBe("bottom");
  });

  it("should use saved value over platform default", () => {
    mockIsDesktop = true;
    localStorage.setItem(STORAGE_KEYS.FILTER_BAR_POSITION, "bottom");

    const { result } = renderHook(() => useFilterBarPosition());

    expect(result.current.filterBarPosition).toBe("bottom");
  });
});
