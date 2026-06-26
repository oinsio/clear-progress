// implements FR8 of improve-sidebar-ux
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockIsDesktop = true;
let mockHasHover = true;
let mockSidebarMode: "expanded" | "collapsed" | "expand-on-hover" = "expanded";
const mockSetSidebarMode = vi.fn();

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

vi.mock("@/hooks/useHoverCapability", () => ({
  useHoverCapability: () => mockHasHover,
}));

vi.mock("@/hooks/useSidebarMode", () => ({
  useSidebarMode: () => [mockSidebarMode, mockSetSidebarMode],
  migratePanelOpenToSidebarMode: vi.fn(),
}));

import { useSidebarState } from "./useSidebarState";

describe("useSidebarState", () => {
  beforeEach(() => {
    mockIsDesktop = true;
    mockHasHover = true;
    mockSidebarMode = "expanded";
    vi.clearAllMocks();
  });

  it("should return effectiveState property", () => {
    const { result } = renderHook(() => useSidebarState());

    expect(result.current).toHaveProperty("effectiveState");
  });

  it("should return sidebarMode property", () => {
    const { result } = renderHook(() => useSidebarState());

    expect(result.current.sidebarMode).toBe("expanded");
  });

  it("should return setSidebarMode function", () => {
    const { result } = renderHook(() => useSidebarState());

    expect(result.current.setSidebarMode).toBe(mockSetSidebarMode);
  });

  it("should return isNarrow as inverse of isDesktop", () => {
    mockIsDesktop = true;

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.isNarrow).toBe(false);
  });

  it("should return isNarrow true when not desktop", () => {
    mockIsDesktop = false;

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.isNarrow).toBe(true);
  });

  it("should return hasHover property", () => {
    mockHasHover = true;

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.hasHover).toBe(true);
  });

  it("should resolve expanded state for wide + hover + expanded mode", () => {
    mockIsDesktop = true;
    mockHasHover = true;
    mockSidebarMode = "expanded";

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.effectiveState).toBe("expanded");
  });

  it("should resolve hover-ready for wide + hover + expand-on-hover mode", () => {
    mockIsDesktop = true;
    mockHasHover = true;
    mockSidebarMode = "expand-on-hover";

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.effectiveState).toBe("hover-ready");
  });

  it("should resolve collapsed for narrow + no-hover + expanded mode", () => {
    mockIsDesktop = false;
    mockHasHover = false;
    mockSidebarMode = "expanded";

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.effectiveState).toBe("collapsed");
  });

  it("should resolve hover-ready for narrow + hover + expanded mode", () => {
    mockIsDesktop = false;
    mockHasHover = true;
    mockSidebarMode = "expanded";

    const { result } = renderHook(() => useSidebarState());

    expect(result.current.effectiveState).toBe("hover-ready");
  });
});
