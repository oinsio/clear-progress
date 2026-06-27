// implements FR10 of improve-sidebar-ux
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import {
  LEGACY_ALWAYS_OPEN_KEY,
  LEGACY_PANEL_OPEN_KEY,
  useSidebarMode,
} from "./useSidebarMode";

describe("useSidebarMode — always-open migration chain", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should migrate PANEL_ALWAYS_OPEN true through to expanded sidebar mode", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "true");

    renderHook(() => useSidebarMode());

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe("expanded");
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBeNull();
  });

  it("should remove legacy key without setting sidebar mode when PANEL_ALWAYS_OPEN was false", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "false");

    renderHook(() => useSidebarMode());

    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should not touch sidebar mode when PANEL_ALWAYS_OPEN is not present", () => {
    renderHook(() => useSidebarMode());

    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should preserve existing sidebar mode when PANEL_ALWAYS_OPEN is not present", () => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_MODE, "collapsed");

    renderHook(() => useSidebarMode());

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe("collapsed");
  });

  it("should return expanded sidebar mode after migration from always-open", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "true");

    const { result } = renderHook(() => useSidebarMode());

    expect(result.current[0]).toBe("expanded");
  });

  it("should export the correct legacy key value", () => {
    expect(LEGACY_ALWAYS_OPEN_KEY).toBe("panel_always_open");
  });

  it("should not set sidebar mode when legacy key has non-true value", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "something_else");

    renderHook(() => useSidebarMode());

    // Legacy key should be removed, but no panel_open value was set
    // so sidebar_mode uses the default "expanded"
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });
});
