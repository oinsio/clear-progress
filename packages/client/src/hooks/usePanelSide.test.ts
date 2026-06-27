// implements FR7 of improve-sidebar-ux
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

let mockIsDesktop = true;

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

import { usePanelSide } from "./usePanelSide";

describe("usePanelSide", () => {
  beforeEach(() => {
    localStorage.clear();
    mockIsDesktop = true;
  });

  it("should return panelSide property in the result", () => {
    const { result } = renderHook(() => usePanelSide());

    expect(result.current).toHaveProperty("panelSide");
  });

  it("should return setPanelSide function in the result", () => {
    const { result } = renderHook(() => usePanelSide());

    expect(result.current).toHaveProperty("setPanelSide");
    expect(typeof result.current.setPanelSide).toBe("function");
  });

  it("should default to 'left' on desktop", () => {
    mockIsDesktop = true;

    const { result } = renderHook(() => usePanelSide());

    expect(result.current.panelSide).toBe("left");
  });

  it("should default to 'right' on mobile", () => {
    mockIsDesktop = false;

    const { result } = renderHook(() => usePanelSide());

    expect(result.current.panelSide).toBe("right");
  });

  it("should persist selected side to localStorage", () => {
    const { result } = renderHook(() => usePanelSide());

    act(() => {
      result.current.setPanelSide("right");
    });

    expect(localStorage.getItem(STORAGE_KEYS.PANEL_SIDE)).toBe("right");
    expect(result.current.panelSide).toBe("right");
  });

  it("should use saved value over platform default", () => {
    mockIsDesktop = true;
    localStorage.setItem(STORAGE_KEYS.PANEL_SIDE, "right");

    const { result } = renderHook(() => usePanelSide());

    expect(result.current.panelSide).toBe("right");
  });

  it("should lock in platform default on first render so resize does not flip side", () => {
    mockIsDesktop = true;

    const { result, rerender } = renderHook(() => usePanelSide());

    expect(result.current.panelSide).toBe("left");
    expect(localStorage.getItem(STORAGE_KEYS.PANEL_SIDE)).toBe("left");

    // Simulate window resize crossing the breakpoint
    mockIsDesktop = false;
    rerender();

    expect(result.current.panelSide).toBe("left");
  });

  it("should lock in mobile default when first opened on mobile", () => {
    mockIsDesktop = false;

    const { result, rerender } = renderHook(() => usePanelSide());

    expect(result.current.panelSide).toBe("right");
    expect(localStorage.getItem(STORAGE_KEYS.PANEL_SIDE)).toBe("right");

    // Simulate window resize to desktop
    mockIsDesktop = true;
    rerender();

    expect(result.current.panelSide).toBe("right");
  });
});
