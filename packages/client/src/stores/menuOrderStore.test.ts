import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import {
  _resetForTesting,
  getSnapshot,
  setMenuOrder,
  subscribe,
} from "./menuOrderStore";

describe("menuOrderStore", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTesting();
  });

  describe("getSnapshot", () => {
    it("should return default menu order when localStorage is empty", () => {
      const snapshot = getSnapshot();
      const modes = snapshot.map((item) => item.mode);

      expect(modes).toEqual([
        "inbox",
        "contexts",
        "categories",
        "goals",
        "ideas",
        "tasks",
        "completed",
        "focused_goals",
        "deleted",
      ]);
    });

    it("should return validated data from localStorage", () => {
      const customOrder = [
        { mode: "goals", visible: true },
        { mode: "inbox", visible: true },
      ];
      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify(customOrder),
      );
      _resetForTesting();

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("goals");
      expect(snapshot[1].mode).toBe("inbox");
    });

    it("should return defaults for unparseable localStorage data", () => {
      localStorage.setItem(STORAGE_KEYS.MENU_ORDER, "not-valid-json!!!");
      _resetForTesting();

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("inbox");
    });

    it("should return defaults and log error when Zod validation fails", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify("not-an-array"),
      );
      _resetForTesting();

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("inbox");
      expect(snapshot).toHaveLength(9);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Invalid menu order:",
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });

    it("should return defaults when localStorage has no menu order key", () => {
      localStorage.removeItem(STORAGE_KEYS.MENU_ORDER);
      _resetForTesting();

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("inbox");
      expect(snapshot).toHaveLength(9);
    });

    it("should set deleted as not visible by default", () => {
      const snapshot = getSnapshot();
      const deletedItem = snapshot.find((item) => item.mode === "deleted");
      expect(deletedItem?.visible).toBe(false);
    });

    it("should add missing modes during migration", () => {
      const oldOrder = [
        { mode: "inbox", visible: true },
        { mode: "goals", visible: true },
        { mode: "deleted", visible: false },
      ];
      localStorage.setItem(STORAGE_KEYS.MENU_ORDER, JSON.stringify(oldOrder));
      _resetForTesting();

      const snapshot = getSnapshot();
      const modes = snapshot.map((item) => item.mode);

      expect(modes).toContain("focused_goals");
      expect(modes).toContain("contexts");
      expect(modes[0]).toBe("inbox");
      expect(modes[1]).toBe("goals");
      expect(modes[2]).toBe("deleted");
    });

    it("should maintain referential stability between calls", () => {
      const firstCall = getSnapshot();
      const secondCall = getSnapshot();

      expect(firstCall).toBe(secondCall);
    });
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

  describe("subscribe", () => {
    it("should notify subscriber on setMenuOrder", () => {
      const listener = vi.fn();
      subscribe(listener);

      setMenuOrder([{ mode: "inbox" as const, visible: true }]);

      expect(listener).toHaveBeenCalledOnce();
    });

    it("should notify multiple subscribers", () => {
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      subscribe(listenerA);
      subscribe(listenerB);

      setMenuOrder([{ mode: "inbox" as const, visible: true }]);

      expect(listenerA).toHaveBeenCalledOnce();
      expect(listenerB).toHaveBeenCalledOnce();
    });

    it("should not call unsubscribed listener", () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      unsubscribe();
      setMenuOrder([{ mode: "inbox" as const, visible: true }]);

      expect(listener).not.toHaveBeenCalled();
    });

    it("should call listener on each setMenuOrder call", () => {
      const listener = vi.fn();
      subscribe(listener);

      setMenuOrder([{ mode: "inbox" as const, visible: true }]);
      setMenuOrder([{ mode: "goals" as const, visible: true }]);
      setMenuOrder([{ mode: "tasks" as const, visible: true }]);

      expect(listener).toHaveBeenCalledTimes(3);
    });
  });
});
