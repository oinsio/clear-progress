import { describe, expect, it } from "vitest";
import { hasEntityChanged } from "./deepEqual";

describe("hasEntityChanged", () => {
  describe("should handle custom exclude fields", () => {
    it("should exclude custom fields from comparison", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        custom_field: "old",
      };

      const updated = {
        ...existing,
        custom_field: "new",
      };

      expect(hasEntityChanged(existing, updated, ["id", "custom_field"])).toBe(
        false,
      );
    });

    it("should detect changes in non-excluded fields", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        custom_field: "old",
      };

      const updated = {
        ...existing,
        name: "Task 2",
        custom_field: "new",
      };

      expect(hasEntityChanged(existing, updated, ["id", "custom_field"])).toBe(
        true,
      );
    });
  });
});
