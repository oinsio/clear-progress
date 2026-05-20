import { describe, expect, it } from "vitest";
import { hasEntityChanged } from "./deepEqual";

describe("hasEntityChanged", () => {
  describe("should normalize empty values", () => {
    it('should treat "" and undefined as equal', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "",
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: undefined as string | undefined,
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it('should treat undefined and "" as equal', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: undefined as string | undefined,
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: "",
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it('should treat null and "" as equal', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: null as string | null,
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: "",
      };

      expect(hasEntityChanged(existing, updated)).toBe(false);
    });

    it('should detect change from "" to non-empty string', () => {
      const existing = {
        id: "1",
        name: "Task 1",
        description: "",
      };

      const updated = {
        id: "1",
        name: "Task 1",
        description: "New description",
      };

      expect(hasEntityChanged(existing, updated)).toBe(true);
    });
  });
});
