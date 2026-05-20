import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetForTesting, setMenuOrder, subscribe } from "./menuOrderStore";

describe("menuOrderStore", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTesting();
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
