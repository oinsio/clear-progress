import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { _resetForTesting, getSnapshot } from "./menuOrderStore";

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
        "memos",
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

    it("should return defaults and log warning when Zod validation fails", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      localStorage.setItem(
        STORAGE_KEYS.MENU_ORDER,
        JSON.stringify("not-an-array"),
      );
      _resetForTesting();

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("inbox");
      expect(snapshot).toHaveLength(10);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Corrupted"),
      );

      consoleSpy.mockRestore();
    });

    it("should return defaults when localStorage has no menu order key", () => {
      localStorage.removeItem(STORAGE_KEYS.MENU_ORDER);
      _resetForTesting();

      const snapshot = getSnapshot();
      expect(snapshot[0].mode).toBe("inbox");
      expect(snapshot).toHaveLength(10);
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
});
