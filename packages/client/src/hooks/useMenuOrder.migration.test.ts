import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { _resetForTesting } from "@/stores/menuOrderStore";
import { useMenuOrder } from "./useMenuOrder";
import { setupMenuOrderTests } from "./useMenuOrder.test-utils";

describe("useMenuOrder", () => {
  setupMenuOrderTests();

  describe("Migration: adding focused_goals to existing menuOrder", () => {
    it("should add focused_goals when it is missing from saved menuOrder", () => {
      // Simulate old menuOrder without focused_goals
      const oldMenuOrder = [
        { mode: "inbox", visible: true },
        { mode: "contexts", visible: true },
        { mode: "categories", visible: true },
        { mode: "goals", visible: true },
        { mode: "ideas", visible: true },
        { mode: "tasks", visible: true },
        { mode: "completed", visible: true },
        { mode: "deleted", visible: false },
      ];

      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify(oldMenuOrder),
      );
      _resetForTesting();

      const { result } = renderHook(() => useMenuOrder());

      // focused_goals should be added at the end
      const modes = result.current.menuOrder.map((item) => item.mode);
      expect(modes).toContain("focused_goals");

      // Check that all original items are preserved
      expect(modes).toContain("inbox");
      expect(modes).toContain("goals");
      expect(modes).toContain("deleted");
    });

    it("should not duplicate focused_goals if it already exists", () => {
      const menuOrderWithFocusedGoals = [
        { mode: "inbox", visible: true },
        { mode: "contexts", visible: true },
        { mode: "categories", visible: true },
        { mode: "goals", visible: true },
        { mode: "ideas", visible: true },
        { mode: "tasks", visible: true },
        { mode: "completed", visible: true },
        { mode: "focused_goals", visible: true },
        { mode: "deleted", visible: false },
      ];

      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify(menuOrderWithFocusedGoals),
      );
      _resetForTesting();

      const { result } = renderHook(() => useMenuOrder());

      const modes = result.current.menuOrder.map((item) => item.mode);
      const focusedGoalsCount = modes.filter(
        (mode) => mode === "focused_goals",
      ).length;

      expect(focusedGoalsCount).toBe(1);
    });

    it("should preserve user's custom order when adding focused_goals", () => {
      // User has reordered items
      const customMenuOrder = [
        { mode: "goals", visible: true },
        { mode: "inbox", visible: true },
        { mode: "tasks", visible: true },
        { mode: "contexts", visible: true },
        { mode: "categories", visible: true },
        { mode: "ideas", visible: true },
        { mode: "completed", visible: true },
        { mode: "deleted", visible: false },
      ];

      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify(customMenuOrder),
      );
      _resetForTesting();

      const { result } = renderHook(() => useMenuOrder());

      // focused_goals should be added at the end, preserving custom order
      const modes = result.current.menuOrder.map((item) => item.mode);

      expect(modes[0]).toBe("goals");
      expect(modes[1]).toBe("inbox");
      expect(modes[2]).toBe("tasks");
      expect(modes).toContain("focused_goals");

      // focused_goals is added at the end
      const focusedGoalsIndex = modes.indexOf("focused_goals");
      expect(focusedGoalsIndex).toBeGreaterThan(7); // After all original items
    });

    it("should set focused_goals as visible by default when migrating", () => {
      const oldMenuOrder = [
        { mode: "inbox", visible: true },
        { mode: "goals", visible: true },
        { mode: "deleted", visible: false },
      ];

      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify(oldMenuOrder),
      );
      _resetForTesting();

      const { result } = renderHook(() => useMenuOrder());

      const focusedGoalsItem = result.current.menuOrder.find(
        (item) => item.mode === "focused_goals",
      );

      expect(focusedGoalsItem).toBeDefined();
      expect(focusedGoalsItem?.visible).toBe(true);
    });
  });
});
