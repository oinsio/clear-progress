// implements FR1, FR2, FR8 of pin-task-detail-panel
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";

describe("useDetailPanelPinned", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // FR1: default value is false
  it("should return false when no preference is saved", () => {
    const { result } = renderHook(() => useDetailPanelPinned());
    expect(result.current.isDetailPanelPinned).toBe(false);
  });

  // FR2: reading stored true value
  it("should return true when localStorage has 'true'", () => {
    localStorage.setItem(STORAGE_KEYS.DETAIL_PANEL_PINNED, "true");
    const { result } = renderHook(() => useDetailPanelPinned());
    expect(result.current.isDetailPanelPinned).toBe(true);
  });

  // FR2: setting preference persists
  it("should persist true to localStorage when set", () => {
    const { result } = renderHook(() => useDetailPanelPinned());
    act(() => {
      result.current.setDetailPanelPinned(true);
    });
    expect(localStorage.getItem(STORAGE_KEYS.DETAIL_PANEL_PINNED)).toBe(
      "true",
    );
    expect(result.current.isDetailPanelPinned).toBe(true);
  });

  // FR8: corrupted value self-heals
  it("should self-heal corrupted value to false", () => {
    localStorage.setItem(STORAGE_KEYS.DETAIL_PANEL_PINNED, "maybe");
    const { result } = renderHook(() => useDetailPanelPinned());
    expect(result.current.isDetailPanelPinned).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.DETAIL_PANEL_PINNED)).toBeNull();
  });

  // FR1: uses correct storage key
  it("should use DETAIL_PANEL_PINNED storage key", () => {
    const { result } = renderHook(() => useDetailPanelPinned());
    act(() => {
      result.current.setDetailPanelPinned(true);
    });
    expect(localStorage.getItem("detail_panel_pinned")).toBe("true");
  });
});
