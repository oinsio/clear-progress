// implements FR8, FR9 of improve-sidebar-ux
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_SWIPE_EDGE_ZONE_PX } from "@/constants";
import {
  cleanupSidebarElement,
  fireDocumentTouchEnd,
  fireDocumentTouchMove,
  fireDocumentTouchStart,
  fireElementTouchEnd,
  fireElementTouchMove,
  fireElementTouchStart,
  renderSidebarSwipeHook,
  type SidebarSwipeTestContext,
  setupSidebarSwipeTest,
} from "./useSidebarSwipe.test-utils";

describe("useSidebarSwipe — translateX tracking", () => {
  let context: SidebarSwipeTestContext;

  afterEach(() => {
    cleanupSidebarElement(context.element);
  });

  describe("opening right sidebar", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "right", isOpen: false });
    });

    it("should return 0 initially", () => {
      const { result } = renderSidebarSwipeHook(context.options);
      expect(result.current.sidebarTranslateX).toBe(0);
    });

    it("should track translateX during edge swipe", () => {
      const { result } = renderSidebarSwipeHook(context.options);
      const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        fireDocumentTouchMove(edgeStartX - 20, 100); // past detection
        fireDocumentTouchMove(edgeStartX - 50, 100);
      });
      // translateX should be positive (sidebarWidth - progress)
      // sidebarWidth = 208, progress = 50, translateX = 208 - 50 = 158
      expect(result.current.sidebarTranslateX).toBe(158);
    });

    it("should reset translateX to 0 after touch end", () => {
      const { result } = renderSidebarSwipeHook(context.options);
      const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        fireDocumentTouchMove(edgeStartX - 20, 100);
        fireDocumentTouchMove(edgeStartX - 50, 100);
        fireDocumentTouchEnd();
      });
      expect(result.current.sidebarTranslateX).toBe(0);
    });
  });

  describe("closing right sidebar", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "right", isOpen: true });
    });

    it("should track positive translateX during close swipe", () => {
      const { result } = renderSidebarSwipeHook(context.options);
      act(() => {
        fireElementTouchStart(context.element, 200, 100);
        fireElementTouchMove(context.element, 215, 100); // past detection
        fireElementTouchMove(context.element, 250, 100);
      });
      // deltaX = 50, clamped between 0 and 208
      expect(result.current.sidebarTranslateX).toBe(50);
    });

    it("should reset translateX to 0 after close touch end", () => {
      const { result } = renderSidebarSwipeHook(context.options);
      act(() => {
        fireElementTouchStart(context.element, 200, 100);
        fireElementTouchMove(context.element, 215, 100);
        fireElementTouchMove(context.element, 250, 100);
        fireElementTouchEnd(context.element);
      });
      expect(result.current.sidebarTranslateX).toBe(0);
    });
  });
});
