import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { _resetForTesting, getSnapshot, setMenuOrder } from "./menuOrderStore";

describe("menuOrderStore", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTesting();
  });

  describe("setMenuOrder", () => {
    it("should update snapshot with array value", () => {
      const newOrder = [
        { mode: "goals" as const, visible: true },
        { mode: "inbox" as const, visible: true },
      ];

      setMenuOrder(newOrder);

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("goals");
      expect(snapshot[1].mode).toBe("inbox");
    });

    it("should update snapshot with updater function", () => {
      setMenuOrder((prev) =>
        prev.map((item) =>
          item.mode === "ideas" ? { ...item, visible: false } : item,
        ),
      );

      const snapshot = getSnapshot();
      const ideasItem = snapshot.find((item) => item.mode === "ideas");
      expect(ideasItem?.visible).toBe(false);
    });

    it("should persist to localStorage", () => {
      const newOrder = [
        { mode: "goals" as const, visible: true },
        { mode: "inbox" as const, visible: true },
      ];

      setMenuOrder(newOrder);

      const stored = localStorage.getItem(STORAGE_KEYS.MENU_ORDER);
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(newOrder);
    });

    it("should return new reference after update", () => {
      const before = getSnapshot();
      setMenuOrder([{ mode: "inbox" as const, visible: true }]);
      const after = getSnapshot();

      expect(before).not.toBe(after);
    });
  });
});
