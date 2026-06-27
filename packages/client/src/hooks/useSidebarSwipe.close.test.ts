// implements FR9 of improve-sidebar-ux
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupSidebarElement,
  fireElementTouchEnd,
  fireElementTouchMove,
  fireElementTouchStart,
  renderSidebarSwipeHook,
  type SidebarSwipeTestContext,
  setupSidebarSwipeTest,
} from "./useSidebarSwipe.test-utils";

describe("useSidebarSwipe — swipe to close", () => {
  let context: SidebarSwipeTestContext;

  afterEach(() => {
    cleanupSidebarElement(context.element);
  });

  describe("right-side sidebar", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "right", isOpen: true });
    });

    it("should call onClose when swiping right past threshold", () => {
      renderSidebarSwipeHook(context.options);
      act(() => {
        fireElementTouchStart(context.element, 200, 100);
        fireElementTouchMove(context.element, 215, 100); // past detection
        fireElementTouchMove(context.element, 280, 100); // past threshold (208 * 0.3 = 62.4)
        fireElementTouchEnd(context.element);
      });
      expect(context.onClose).toHaveBeenCalledTimes(1);
    });

    it("should snap back when swipe does not exceed threshold", () => {
      renderSidebarSwipeHook(context.options);
      act(() => {
        fireElementTouchStart(context.element, 200, 100);
        fireElementTouchMove(context.element, 215, 100);
        fireElementTouchMove(context.element, 230, 100); // only 30px, below threshold
        fireElementTouchEnd(context.element);
      });
      expect(context.onClose).not.toHaveBeenCalled();
    });
  });

  describe("left-side sidebar", () => {
    beforeEach(() => {
      context = setupSidebarSwipeTest({ side: "left", isOpen: true });
    });

    it("should call onClose when swiping left past threshold", () => {
      renderSidebarSwipeHook(context.options);
      act(() => {
        fireElementTouchStart(context.element, 100, 100);
        fireElementTouchMove(context.element, 85, 100); // past detection
        fireElementTouchMove(context.element, 20, 100); // past threshold
        fireElementTouchEnd(context.element);
      });
      expect(context.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
