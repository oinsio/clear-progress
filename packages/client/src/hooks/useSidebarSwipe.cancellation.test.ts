// implements FR8, FR9, NFR-R2 of improve-sidebar-ux
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

describe("useSidebarSwipe — vertical cancellation and desktop no-op", () => {
  let context: SidebarSwipeTestContext;

  afterEach(() => {
    cleanupSidebarElement(context.element);
  });

  describe("vertical scroll cancellation", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "right", isOpen: false });
    });

    it("should cancel swipe when vertical movement exceeds horizontal", () => {
      renderSidebarSwipeHook(context.options);
      const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        // Vertical movement (20px) exceeds horizontal (5px)
        fireDocumentTouchMove(edgeStartX - 5, 120);
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).not.toHaveBeenCalled();
    });
  });

  describe("desktop no-op", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({
        side: "right",
        isOpen: false,
        isDesktop: true,
      });
    });

    it("should return translateX 0 on desktop", () => {
      const { result } = renderSidebarSwipeHook(context.options);
      expect(result.current.sidebarTranslateX).toBe(0);
    });

    it("should not call onOpen on desktop even with edge swipe", () => {
      renderSidebarSwipeHook(context.options);
      const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
      act(() => {
        fireDocumentTouchStart(edgeStartX, 100);
        fireDocumentTouchMove(edgeStartX - 100, 100);
        fireDocumentTouchEnd();
      });
      expect(context.onOpen).not.toHaveBeenCalled();
    });
  });
});
