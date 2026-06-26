/**
 * Unit tests for useSidebarHover hook.
 *
 * Implements FR5, FR6 of improve-sidebar-ux.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SIDEBAR_HOVER_CLOSE_DELAY_MS,
  SIDEBAR_HOVER_OPEN_DELAY_MS,
} from "@/constants";
import type { SidebarEffectiveState } from "@/types/common";
import { useSidebarHover } from "./useSidebarHover";

describe("useSidebarHover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithState = (
    initialState: SidebarEffectiveState = "hover-ready",
  ) =>
    renderHook(
      ({ state }: { state: SidebarEffectiveState }) => useSidebarHover(state),
      { initialProps: { state: initialState } },
    );

  const mouseEnter = (result: {
    current: ReturnType<typeof useSidebarHover>;
  }) => {
    act(() => {
      result.current.hoverHandlers.onMouseEnter();
    });
  };

  const mouseLeave = (result: {
    current: ReturnType<typeof useSidebarHover>;
  }) => {
    act(() => {
      result.current.hoverHandlers.onMouseLeave();
    });
  };

  const advanceBy = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };

  const expandViaHover = (result: {
    current: ReturnType<typeof useSidebarHover>;
  }) => {
    mouseEnter(result);
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS);
  };

  // FR5: initial state
  it("should return isHoverExpanded false initially", () => {
    const { result } = renderWithState();
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should return hoverHandlers with onMouseEnter and onMouseLeave", () => {
    const { result } = renderWithState();
    expect(typeof result.current.hoverHandlers.onMouseEnter).toBe("function");
    expect(typeof result.current.hoverHandlers.onMouseLeave).toBe("function");
  });

  // FR5: inactive when not hover-ready
  it("should keep isHoverExpanded false when effectiveState is expanded", () => {
    const { result } = renderWithState("expanded");
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should keep isHoverExpanded false when effectiveState is collapsed", () => {
    const { result } = renderWithState("collapsed");
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  // FR5: mouseenter -> debounce -> expand
  it("should set isHoverExpanded to true after open delay on mouseenter", () => {
    const { result } = renderWithState();
    mouseEnter(result);
    expect(result.current.isHoverExpanded).toBe(false);
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(true);
  });

  // FR5: mouseenter then leave before delay -> stays collapsed
  it("should keep isHoverExpanded false when mouse leaves before open delay", () => {
    const { result } = renderWithState();
    mouseEnter(result);
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS - 1);
    mouseLeave(result);
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  // FR5: mouseleave -> debounce -> collapse
  it("should set isHoverExpanded to false after close delay on mouseleave", () => {
    const { result } = renderWithState();
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    mouseLeave(result);
    expect(result.current.isHoverExpanded).toBe(true);
    advanceBy(SIDEBAR_HOVER_CLOSE_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  // FR5: mouseleave then re-enter before close delay -> stays expanded
  it("should cancel close when mouse re-enters before close delay", () => {
    const { result } = renderWithState();
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    mouseLeave(result);
    advanceBy(SIDEBAR_HOVER_CLOSE_DELAY_MS - 1);
    mouseEnter(result);
    advanceBy(SIDEBAR_HOVER_CLOSE_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(true);
  });

  // FR5: reset when effectiveState changes from hover-ready
  it("should reset isHoverExpanded when effectiveState changes from hover-ready", () => {
    const { result, rerender } = renderWithState();
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    rerender({ state: "expanded" as SidebarEffectiveState });
    expect(result.current.isHoverExpanded).toBe(false);
  });

  // Clean up timers on unmount
  it("should clean up timers on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderWithState();

    mouseEnter(result);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  // Additional tests for mutation coverage

  it("should cancel pending open timer on mouseleave", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result } = renderWithState();

    mouseEnter(result);
    const callCountBefore = clearTimeoutSpy.mock.calls.length;

    mouseLeave(result);
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callCountBefore);

    advanceBy(
      Math.max(SIDEBAR_HOVER_OPEN_DELAY_MS, SIDEBAR_HOVER_CLOSE_DELAY_MS),
    );
    expect(result.current.isHoverExpanded).toBe(false);
    clearTimeoutSpy.mockRestore();
  });

  it("should cancel pending close timer on mouseenter", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result } = renderWithState();

    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    mouseLeave(result);
    const callCountBefore = clearTimeoutSpy.mock.calls.length;

    mouseEnter(result);
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
    clearTimeoutSpy.mockRestore();
  });

  it("should clear timers when effectiveState changes from hover-ready with pending open timer", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, rerender } = renderWithState();

    mouseEnter(result);
    const callCountBefore = clearTimeoutSpy.mock.calls.length;

    rerender({ state: "collapsed" as SidebarEffectiveState });
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callCountBefore);

    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(false);
    clearTimeoutSpy.mockRestore();
  });

  it("should clear timers when effectiveState changes from hover-ready with pending close timer", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, rerender } = renderWithState();

    expandViaHover(result);
    mouseLeave(result);
    const callCountBefore = clearTimeoutSpy.mock.calls.length;

    rerender({ state: "expanded" as SidebarEffectiveState });
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
    clearTimeoutSpy.mockRestore();
  });

  it("should react to effectiveState changing back to hover-ready", () => {
    const { result, rerender } = renderWithState();

    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    rerender({ state: "expanded" as SidebarEffectiveState });
    expect(result.current.isHoverExpanded).toBe(false);

    rerender({ state: "hover-ready" as SidebarEffectiveState });
    expect(result.current.isHoverExpanded).toBe(false);

    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);
  });

  it("should not expand on mouseenter when not in hover-ready state even with delay", () => {
    const { result } = renderWithState("collapsed");
    mouseEnter(result);
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS * 10);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should not collapse on mouseleave when not in hover-ready state", () => {
    const { result } = renderWithState("collapsed");
    mouseLeave(result);
    advanceBy(SIDEBAR_HOVER_CLOSE_DELAY_MS * 10);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should handle multiple mouseenter calls without stacking open timers", () => {
    const { result } = renderWithState();
    mouseEnter(result);
    mouseEnter(result);
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(true);
  });

  it("should handle clean unmount when no timers are pending", () => {
    const { unmount } = renderWithState();
    expect(() => unmount()).not.toThrow();
  });

  it("should unmount cleanly with both open and close timer interactions", () => {
    const { result, unmount } = renderWithState();
    expandViaHover(result);
    mouseLeave(result);
    expect(() => unmount()).not.toThrow();
  });

  it("should stop responding to mouseenter after state changes from hover-ready to collapsed", () => {
    const { result, rerender } = renderWithState();
    rerender({ state: "collapsed" as SidebarEffectiveState });

    const { onMouseEnter } = result.current.hoverHandlers;
    act(() => {
      onMouseEnter();
    });
    advanceBy(SIDEBAR_HOVER_OPEN_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should stop responding to mouseleave after state changes from hover-ready to expanded", () => {
    const { result, rerender } = renderWithState();
    rerender({ state: "expanded" as SidebarEffectiveState });

    const { onMouseLeave } = result.current.hoverHandlers;
    act(() => {
      onMouseLeave();
    });
    advanceBy(SIDEBAR_HOVER_CLOSE_DELAY_MS);
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should reset isHoverExpanded to false when leaving hover-ready even if already true", () => {
    const { result, rerender } = renderWithState();
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    rerender({ state: "collapsed" as SidebarEffectiveState });
    expect(result.current.isHoverExpanded).toBe(false);
  });

  it("should not reset isHoverExpanded when state stays as hover-ready", () => {
    const { result, rerender } = renderWithState();
    expandViaHover(result);
    expect(result.current.isHoverExpanded).toBe(true);

    rerender({ state: "hover-ready" as SidebarEffectiveState });
    expect(result.current.isHoverExpanded).toBe(true);
  });
});
