import { describe, it, expect } from "vitest";
import { hasEntityChanged } from "./deepEqual";

describe("hasEntityChanged", () => {
  describe("should detect changes in entity fields", () => {
    it("should return true when a field value changes", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Old description",
        version: 1,
        updated_at: "2024-01-01T00:00:00.000Z",
        _dirty: false,
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
        version: 1,
        updated_at: "2024-01-01T00:00:00.000Z",
        _dirty: false,
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
        version: 1,
        updated_at: "2024-01-01T00:00:00.000Z",
        _dirty: false,
        revision: 0,
      };

      const updated = {
        ...existing,
        version: 2,
        updated_at: "2024-01-02T00:00:00.000Z",
        _dirty: true,
        revision: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });
  });

  describe("should normalize empty values", () => {
    it('should treat "" and undefined as equal', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "",
        version: 1,
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: undefined as string | undefined,
        version: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it('should treat undefined and "" as equal', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: undefined as string | undefined,
        version: 1,
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: "",
        version: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it('should treat null and "" as equal', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: null as string | null,
        version: 1,
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: "",
        version: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it('should detect change from "" to non-empty string', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "",
        version: 1,
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: "New description",
        version: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });
  });

  describe("should handle multiple field changes", () => {
    it("should return true when multiple fields change", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "Description",
        is_completed: false,
        version: 1,
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
        version: 1,
      };

      const updated = {
        ...existing,
        is_completed: true,
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });
  });

  describe("should handle boolean and number fields", () => {
    it("should detect boolean field changes", () => {
      const existing = {
        id: "1",
        is_completed: false,
        version: 1,
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
        sort_order: 0,
        version: 1,
      };

      const updated = {
        ...existing,
        sort_order: 1,
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });

    it("should return false when boolean stays the same", () => {
      const existing = {
        id: "1",
        is_completed: true,
        version: 1,
      };

      const updated = {
        ...existing,
        is_completed: true,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });
  });

  describe("should handle custom exclude fields", () => {
    it("should exclude custom fields from comparison", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        custom_field: "old",
        version: 1,
      };

      const updated = {
        ...existing,
        custom_field: "new",
      };

      expect(
        hasEntityChanged(existing, updated, ["id", "version", "custom_field"]),
      ).toBe(false);
    });

    it("should detect changes in non-excluded fields", () => {
      const existing = {
        id: "1",
        name: "Task 1",
        custom_field: "old",
        version: 1,
      };

      const updated = {
        ...existing,
        name: "Task 2",
        custom_field: "new",
      };

      expect(
        hasEntityChanged(existing, updated, ["id", "version", "custom_field"]),
      ).toBe(true);
    });
  });
});
