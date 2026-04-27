import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShowCheckbox } from "./useShowCheckbox";

vi.mock("./useIsDesktop");
vi.mock("./useHasTouchPointer");

import { useHasTouchPointer } from "./useHasTouchPointer";
import { useIsDesktop } from "./useIsDesktop";

describe("useShowCheckbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true on desktop (≥1024px)", () => {
    vi.mocked(useIsDesktop).mockReturnValue(true);
    vi.mocked(useHasTouchPointer).mockReturnValue(false);

    const { result } = renderHook(() => useShowCheckbox());

    expect(result.current).toBe(true);
  });

  it("should return false on mobile with touch pointer", () => {
    vi.mocked(useIsDesktop).mockReturnValue(false);
    vi.mocked(useHasTouchPointer).mockReturnValue(true);

    const { result } = renderHook(() => useShowCheckbox());

    expect(result.current).toBe(false);
  });

  it("should return true on tablet with mouse (pointer: fine)", () => {
    vi.mocked(useIsDesktop).mockReturnValue(false);
    vi.mocked(useHasTouchPointer).mockReturnValue(false);

    const { result } = renderHook(() => useShowCheckbox());

    expect(result.current).toBe(true);
  });

  it("should return true on desktop with touch pointer", () => {
    vi.mocked(useIsDesktop).mockReturnValue(true);
    vi.mocked(useHasTouchPointer).mockReturnValue(true);

    const { result } = renderHook(() => useShowCheckbox());

    expect(result.current).toBe(true);
  });
});
