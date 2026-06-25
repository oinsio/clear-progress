// implements FR8 of improve-sidebar-ux
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_SWIPE_EDGE_ZONE_PX } from "@/constants";
import {
  cleanupSidebarElement,
  fireDocumentTouchEnd,
  fireDocumentTouchMove,
  fireDocumentTouchStart,
  renderSidebarSwipeHook,
  type SidebarSwipeTestContext,
  setupSidebarSwipeTest,
} from "./useSidebarSwipe.test-utils";

describe("useSidebarSwipe — edge swipe to open", () => {
  let context: SidebarSwipeTestContext;

  afterEach(() => {
    cleanupSidebarElement(context.element);
  });

  describe("right-side sidebar", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "right", isOpen: false });
    });

    it("should call onOpen when edge swipe from right exceeds threshold", () => {
      renderSidebarSwipeHook(context.options);
      const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        fireDocumentTouchMove(edgeStartX - 20, 100); // past detection
        fireDocumentTouchMove(edgeStartX - 100, 100); // past threshold (208 * 0.3 = 62.4)
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).toHaveBeenCalledTimes(1);
    });

    it("should not open when touch starts outside edge zone", () => {
      renderSidebarSwipeHook(context.options);
      const outsideEdgeX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX - 10;
      act(() => {
        fireDocumentTouchStart(outsideEdgeX, 100);
        fireDocumentTouchMove(outsideEdgeX - 100, 100);
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).not.toHaveBeenCalled();
    });

    it("should snap back when swipe does not exceed threshold", () => {
      renderSidebarSwipeHook(context.options);
      const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        fireDocumentTouchMove(edgeStartX - 20, 100); // past detection
        fireDocumentTouchMove(edgeStartX - 30, 100); // not past threshold
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).not.toHaveBeenCalled();
    });
  });

  describe("left-side sidebar", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "left", isOpen: false });
    });

    it("should call onOpen when edge swipe from left exceeds threshold", () => {
      renderSidebarSwipeHook(context.options);
      const edgeStartX = SIDEBAR_SWIPE_EDGE_ZONE_PX - 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        fireDocumentTouchMove(edgeStartX + 20, 100); // past detection
        fireDocumentTouchMove(edgeStartX + 100, 100); // past threshold
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).toHaveBeenCalledTimes(1);
    });

    it("should not open when touch starts outside left edge zone", () => {
      renderSidebarSwipeHook(context.options);
      const outsideEdgeX = SIDEBAR_SWIPE_EDGE_ZONE_PX + 10;
      act(() => {
        fireDocumentTouchStart(outsideEdgeX, 100);
        fireDocumentTouchMove(outsideEdgeX + 100, 100);
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).not.toHaveBeenCalled();
    });
  });
});
