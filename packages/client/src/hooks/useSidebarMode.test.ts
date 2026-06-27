// implements FR1, FR10 of improve-sidebar-ux
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import {
  LEGACY_ALWAYS_OPEN_KEY,
  LEGACY_PANEL_OPEN_KEY,
  migratePanelAlwaysOpen,
  migratePanelOpenToSidebarMode,
  useSidebarMode,
} from "./useSidebarMode";

describe("useSidebarMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default sidebar mode when no value is saved", () => {
    const { result } = renderHook(() => useSidebarMode());

    expect(result.current[0]).toBe("expanded");
  });

  it("should return saved sidebar mode from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_MODE, "collapsed");

    const { result } = renderHook(() => useSidebarMode());

    expect(result.current[0]).toBe("collapsed");
  });

  it("should return expand-on-hover when saved", () => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_MODE, "expand-on-hover");

    const { result } = renderHook(() => useSidebarMode());

    expect(result.current[0]).toBe("expand-on-hover");
  });

  it("should persist sidebar mode to localStorage when changed", () => {
    const { result } = renderHook(() => useSidebarMode());

    act(() => {
      result.current[1]("collapsed");
    });

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe("collapsed");
    expect(result.current[0]).toBe("collapsed");
  });

  it("should return setter function as second element", () => {
    const { result } = renderHook(() => useSidebarMode());

    expect(typeof result.current[1]).toBe("function");
  });
});

describe("migratePanelOpenToSidebarMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should migrate panel_open true to expanded sidebar mode", () => {
    localStorage.setItem(LEGACY_PANEL_OPEN_KEY, "true");

    migratePanelOpenToSidebarMode();

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe("expanded");
    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBeNull();
  });

  it("should migrate panel_open false to collapsed sidebar mode", () => {
    localStorage.setItem(LEGACY_PANEL_OPEN_KEY, "false");

    migratePanelOpenToSidebarMode();

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe("collapsed");
    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBeNull();
  });

  it("should not migrate when sidebar_mode is already set", () => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_MODE, "expand-on-hover");
    localStorage.setItem(LEGACY_PANEL_OPEN_KEY, "true");

    migratePanelOpenToSidebarMode();

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBe(
      "expand-on-hover",
    );
    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBe("true");
  });

  it("should do nothing when neither key exists", () => {
    migratePanelOpenToSidebarMode();

    expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE)).toBeNull();
  });
});

describe("migratePanelAlwaysOpen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should migrate panel_always_open true to panel_open true", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "true");

    migratePanelAlwaysOpen();

    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBe("true");
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should remove panel_always_open without setting panel_open when value is false", () => {
    localStorage.setItem(LEGACY_ALWAYS_OPEN_KEY, "false");

    migratePanelAlwaysOpen();

    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should do nothing when panel_always_open does not exist", () => {
    migratePanelAlwaysOpen();

    expect(localStorage.getItem(LEGACY_PANEL_OPEN_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY)).toBeNull();
  });

  it("should use the correct legacy key name panel_always_open", () => {
    expect(LEGACY_ALWAYS_OPEN_KEY).toBe("panel_always_open");
  });

  it("should use the correct legacy key name panel_open", () => {
    expect(LEGACY_PANEL_OPEN_KEY).toBe("panel_open");
  });
});
