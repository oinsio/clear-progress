import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMenuOrder } from "./useMenuOrder";
import { setupMenuOrderTests } from "./useMenuOrder.test-utils";

describe("useMenuOrder", () => {
  setupMenuOrderTests();

  describe("Default menu order", () => {
    it("should return default menu order when localStorage is empty", () => {
      const { result } = renderHook(() => useMenuOrder());

      const modes = result.current.menuOrder.map((item) => item.mode);

      expect(modes).toEqual([
        "inbox",
        "contexts",
        "categories",
        "ideas",
        "goals",
        "tasks",
        "completed",
        "memos",
        "deleted",
        "focused_goals",
      ]);
    });

    it("should have focused_goals visible by default", () => {
      const { result } = renderHook(() => useMenuOrder());

      const focusedGoalsItem = result.current.menuOrder.find(
        (item) => item.mode === "focused_goals",
      );

      expect(focusedGoalsItem?.visible).toBe(true);
    });
  });
});
