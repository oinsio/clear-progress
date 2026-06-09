import { describe, expect, it } from "vitest";
import {
  compareSortKeys,
  generateAppendKey,
  generateKeyBetween,
  generateTopKey,
  needsRebalancing,
  rebalanceKeys,
} from "../SortOrderService";

describe("SortOrderService", () => {
  describe("generateTopKey", () => {
    it("should return a valid key when given empty array", () => {
      const key = generateTopKey([]);

      expect(key).toBeTruthy();
      expect(typeof key).toBe("string");
    });

    it("should return a key greater than the current maximum", () => {
      const existingKeys = ["a1", "a2", "a3"];

      const topKey = generateTopKey(existingKeys);

      expect(topKey > "a3").toBe(true);
    });
  });

  describe("generateAppendKey", () => {
    it("should behave the same as generateTopKey", () => {
      const existingKeys = ["a1", "a2", "a3"];

      const appendKey = generateAppendKey(existingKeys);
      const topKey = generateTopKey(existingKeys);

      expect(appendKey).toBe(topKey);
    });
  });

  describe("generateKeyBetween", () => {
    it("should return a key between two given keys", () => {
      const lowerKey = "a1";
      const upperKey = "a3";

      const middleKey = generateKeyBetween(lowerKey, upperKey);

      expect(middleKey > lowerKey).toBe(true);
      expect(middleKey < upperKey).toBe(true);
    });

    it("should return a key less than upper when lower is null", () => {
      const upperKey = "a5";

      const resultKey = generateKeyBetween(null, upperKey);

      expect(resultKey < upperKey).toBe(true);
    });

    it("should return a key greater than lower when upper is null", () => {
      const lowerKey = "a5";

      const resultKey = generateKeyBetween(lowerKey, null);

      expect(resultKey > lowerKey).toBe(true);
    });
  });

  describe("rebalanceKeys", () => {
    it("should return the requested number of keys in ascending order", () => {
      const keyCount = 5;

      const keys = rebalanceKeys(keyCount);

      expect(keys).toHaveLength(keyCount);
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i] > keys[i - 1]).toBe(true);
      }
    });

    it("should return evenly distributed short keys", () => {
      const keyCount = 10;

      const keys = rebalanceKeys(keyCount);

      for (const key of keys) {
        expect(key.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe("compareSortKeys", () => {
    it("should return negative number when keyA is less than keyB", () => {
      expect(compareSortKeys("a1", "a3")).toBeLessThan(0);
    });

    it("should return positive number when keyA is greater than keyB", () => {
      expect(compareSortKeys("a3", "a1")).toBeGreaterThan(0);
    });

    it("should return 0 when both keys are equal", () => {
      expect(compareSortKeys("a1", "a1")).toBe(0);
    });
  });

  describe("needsRebalancing", () => {
    it("should return true for keys longer than 10 characters", () => {
      const longKey = "a".repeat(11);

      expect(needsRebalancing(longKey)).toBe(true);
    });

    it("should return false for keys of 10 characters or less", () => {
      const shortKey = "a".repeat(10);

      expect(needsRebalancing(shortKey)).toBe(false);
    });
  });
});
