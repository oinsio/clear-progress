import { describe, expect, it } from "vitest";
import { hasEntityChanged } from "./deepEqual";

describe("hasEntityChanged", () => {
  describe("should detect changes in entity fields", () => {
    it("should return true when a field value changes", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Old description",
        updated_at: "2024-01-01T00:00:00.000Z",
        needsSync: false,
      };

      const updated = {
        ...existing,
        description: "New description",
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });

    it("should return false when no fields change", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Description",
        updated_at: "2024-01-01T00:00:00.000Z",
        needsSync: false,
      };

      const updated = {
        ...existing,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it("should return false when only metadata fields change", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Description",
        updated_at: "2024-01-01T00:00:00.000Z",
        needsSync: false,
        revision: 0,
      };

      const updated = {
        ...existing,
        updated_at: "2024-01-02T00:00:00.000Z",
        needsSync: true,
        revision: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });
  });
});
