// implements FR7 of improve-sidebar-ux
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

let mockIsDesktop = true;

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

import { usePanelOpen } from "./usePanelOpen";

describe("usePanelOpen", () => {
  beforeEach(() => {
    localStorage.clear();
    mockIsDesktop = true;
  });

  it("should return isPanelOpen property in the result", () => {
    const { result } = renderHook(() => usePanelOpen());

    expect(result.current).toHaveProperty("isPanelOpen");
  });

  it("should return togglePanelOpen function in the result", () => {
    const { result } = renderHook(() => usePanelOpen());

    expect(result.current).toHaveProperty("togglePanelOpen");
    expect(typeof result.current.togglePanelOpen).toBe("function");
  });

  it("should default to true on desktop", () => {
    mockIsDesktop = true;

    const { result } = renderHook(() => usePanelOpen());

    expect(result.current.isPanelOpen).toBe(true);
  });

  it("should default to false on mobile", () => {
    mockIsDesktop = false;

    const { result } = renderHook(() => usePanelOpen());

    expect(result.current.isPanelOpen).toBe(false);
  });

  it("should toggle from open to closed", () => {
    mockIsDesktop = true;

    const { result } = renderHook(() => usePanelOpen());
    expect(result.current.isPanelOpen).toBe(true);

    act(() => {
      result.current.togglePanelOpen();
    });

    expect(result.current.isPanelOpen).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBe("false");
  });

  it("should toggle from closed to open", () => {
    mockIsDesktop = false;

    const { result } = renderHook(() => usePanelOpen());
    expect(result.current.isPanelOpen).toBe(false);

    act(() => {
      result.current.togglePanelOpen();
    });

    expect(result.current.isPanelOpen).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBe("true");
  });

  it("should use saved value over platform default", () => {
    mockIsDesktop = false;
    localStorage.setItem(STORAGE_KEYS.PANEL_OPEN, "true");

    const { result } = renderHook(() => usePanelOpen());

    expect(result.current.isPanelOpen).toBe(true);
  });

  it("should toggle twice correctly reflecting updated state", () => {
    mockIsDesktop = true;

    const { result } = renderHook(() => usePanelOpen());
    expect(result.current.isPanelOpen).toBe(true);

    act(() => {
      result.current.togglePanelOpen();
    });
    expect(result.current.isPanelOpen).toBe(false);

    act(() => {
      result.current.togglePanelOpen();
    });
    expect(result.current.isPanelOpen).toBe(true);
  });

  // implements FR4, FR5, FR6 of improve-sidebar-ux
  describe("temporary open (modal drawer)", () => {
    it("should return isTemporarilyOpen as false by default", () => {
      const { result } = renderHook(() => usePanelOpen());

      expect(result.current.isTemporarilyOpen).toBe(false);
    });

    it("should return openTemporarily function", () => {
      const { result } = renderHook(() => usePanelOpen());

      expect(typeof result.current.openTemporarily).toBe("function");
    });

    it("should return closeTemporary function", () => {
      const { result } = renderHook(() => usePanelOpen());

      expect(typeof result.current.closeTemporary).toBe("function");
    });

    it("should return effectiveIsOpen property", () => {
      const { result } = renderHook(() => usePanelOpen());

      expect(result.current).toHaveProperty("effectiveIsOpen");
    });

    it("should set isTemporarilyOpen to true when openTemporarily is called", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());
      expect(result.current.isTemporarilyOpen).toBe(false);

      act(() => {
        result.current.openTemporarily();
      });

      expect(result.current.isTemporarilyOpen).toBe(true);
    });

    it("should set isTemporarilyOpen to false when closeTemporary is called", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());

      act(() => {
        result.current.openTemporarily();
      });
      expect(result.current.isTemporarilyOpen).toBe(true);

      act(() => {
        result.current.closeTemporary();
      });

      expect(result.current.isTemporarilyOpen).toBe(false);
    });

    it("should not persist isTemporarilyOpen to localStorage", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());

      act(() => {
        result.current.openTemporarily();
      });

      expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).not.toBe("true");
    });

    it("should compute effectiveIsOpen as true when isPanelOpen is true", () => {
      mockIsDesktop = true;

      const { result } = renderHook(() => usePanelOpen());

      expect(result.current.effectiveIsOpen).toBe(true);
    });

    it("should compute effectiveIsOpen as true when isTemporarilyOpen is true", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());
      expect(result.current.effectiveIsOpen).toBe(false);

      act(() => {
        result.current.openTemporarily();
      });

      expect(result.current.effectiveIsOpen).toBe(true);
    });

    it("should compute effectiveIsOpen as false when both isPanelOpen and isTemporarilyOpen are false", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());

      expect(result.current.effectiveIsOpen).toBe(false);
    });

    it("should keep isPanelOpen false when openTemporarily is called", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());

      act(() => {
        result.current.openTemporarily();
      });

      expect(result.current.isPanelOpen).toBe(false);
      expect(result.current.isTemporarilyOpen).toBe(true);
    });

    it("should reset isTemporarilyOpen when togglePanelOpen is called to open", () => {
      mockIsDesktop = false;

      const { result } = renderHook(() => usePanelOpen());

      act(() => {
        result.current.openTemporarily();
      });
      expect(result.current.isTemporarilyOpen).toBe(true);

      act(() => {
        result.current.togglePanelOpen();
      });

      expect(result.current.isPanelOpen).toBe(true);
      expect(result.current.isTemporarilyOpen).toBe(false);
    });
  });
});
