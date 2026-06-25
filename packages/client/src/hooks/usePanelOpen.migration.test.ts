// implements FR10 of improve-sidebar-ux
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => true,
}));

import { LEGACY_ALWAYS_OPEN_KEY, usePanelOpen } from "./usePanelOpen";

describe("usePanelOpen — always-open migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should set PANEL_OPEN to true and remove legacy key when PANEL_ALWAYS_OPEN was true", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "true");

    renderHook(() => usePanelOpen());

    expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBe("true");
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should remove legacy key without changing PANEL_OPEN when PANEL_ALWAYS_OPEN was false", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "false");

    renderHook(() => usePanelOpen());

    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should not touch PANEL_OPEN when PANEL_ALWAYS_OPEN is not present", () => {
    renderHook(() => usePanelOpen());

    expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBeNull();
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should preserve existing PANEL_OPEN value when PANEL_ALWAYS_OPEN is not present", () => {
    localStorage.setItem(STORAGE_KEYS.PANEL_OPEN, "false");

    renderHook(() => usePanelOpen());

    expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBe("false");
  });

  it("should return isPanelOpen as true after migration from always-open", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "true");

    const { result } = renderHook(() => usePanelOpen());

    expect(result.current.isPanelOpen).toBe(true);
  });

  it("should export the correct legacy key value", () => {
    expect(LEGACY_ALWAYS_OPEN_KEY).toBe("panel_always_open");
  });

  it("should not set PANEL_OPEN when legacy key has non-true value", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "something_else");

    renderHook(() => usePanelOpen());

    // PANEL_OPEN should not be set because legacy value was not "true"
    // On desktop default is true, so stored value should still be null
    expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBeNull();
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });
});
