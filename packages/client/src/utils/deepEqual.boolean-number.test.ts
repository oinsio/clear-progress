import { describe, expect, it } from "vitest";
import { hasEntityChanged } from "./deepEqual";

describe("hasEntityChanged", () => {
  describe("should handle boolean and number fields", () => {
    it("should detect boolean field changes", () => {
      const existing = {
        id: "1",
        is_completed: false,
      };

      const updated = {
        ...existing,
        is_completed: true,
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });

    it("should detect number field changes", () => {
      const existing = {
        id: "1",
        sort_order: "0",
      };

      const updated = {
        ...existing,
        sort_order: "1",
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });

    it("should return false when boolean stays the same", () => {
      const existing = {
        id: "1",
        is_completed: true,
      };

      const updated = {
        ...existing,
        is_completed: true,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });
  });
});
