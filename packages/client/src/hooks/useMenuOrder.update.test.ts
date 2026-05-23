import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { useMenuOrder } from "./useMenuOrder";
import { setupMenuOrderTests } from "./useMenuOrder.test-utils";

describe("useMenuOrder", () => {
  setupMenuOrderTests();

  describe("Updating menu order", () => {
    it("should persist changes to localStorage", () => {
      const { result } = renderHook(() => useMenuOrder());

      act(() => {
        result.current.setMenuOrder([
          { mode: "focused_goals", visible: false },
          { mode: "inbox", visible: true },
        ]);
      });

      const stored = localStorage.getItem(STORAGE_KEYS.MENU_ORDER);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual([
        { mode: "focused_goals", visible: false },
        { mode: "inbox", visible: true },
      ]);
    });

    it("should reflect changes across hook instances via shared store", () => {
      const { result: firstInstance } = renderHook(() => useMenuOrder());
      const { result: secondInstance } = renderHook(() => useMenuOrder());

      act(() => {
        firstInstance.current.setMenuOrder([
          { mode: "goals", visible: true },
          { mode: "inbox", visible: true },
        ]);
      });

      const secondModes = secondInstance.current.menuOrder.map(
        (item) => item.mode,
      );
      expect(secondModes[0]).toBe("goals");
      expect(secondModes[1]).toBe("inbox");
    });
  });
});
