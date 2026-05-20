import { describe, expect, it } from "vitest";
import { hasEntityChanged } from "./deepEqual";

describe("hasEntityChanged", () => {
  describe("should handle multiple field changes", () => {
    it("should return true when multiple fields change", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Description",
        is_completed: false,
      };

      const updated = {
        ...existing,
        name: "Task 1 Updated",
        description: "New description",
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });

    it("should return true when at least one field changes", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Description",
        is_completed: false,
      };

      const updated = {
        ...existing,
        is_completed: true,
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });
  });
});
