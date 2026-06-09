import { describe, expect, it } from "vitest";
import {
  convertEntitySortOrders,
  convertTaskSortOrders,
} from "../sortOrderMigration";

describe("sortOrderMigration", () => {
  describe("convertTaskSortOrders", () => {
    it("should return empty array when given empty array", () => {
      const result = convertTaskSortOrders([]);

      expect(result).toEqual([]);
    });

    it("should return string sort_order for a single task", () => {
      const tasks = [{ id: "task-1", sort_order: 0 }];

      const result = convertTaskSortOrders(tasks);

      expect(result).toHaveLength(1);
      expect(typeof result[0].sort_order).toBe("string");
      expect(result[0].sort_order.length).toBeGreaterThan(0);
    });

    it("should reverse order: lowest integer gets highest string key", () => {
      const tasks = [
        { id: "task-a", sort_order: 0 },
        { id: "task-b", sort_order: 1 },
        { id: "task-c", sort_order: 2 },
      ];

      const result = convertTaskSortOrders(tasks);

      const taskA = result.find((task) => task.id === "task-a")!;
      const taskB = result.find((task) => task.id === "task-b")!;
      const taskC = result.find((task) => task.id === "task-c")!;

      expect(taskA.sort_order > taskB.sort_order).toBe(true);
      expect(taskB.sort_order > taskC.sort_order).toBe(true);
    });

    it("should leave already-string sort_orders unchanged", () => {
      const tasks = [
        { id: "task-x", sort_order: "a1" as unknown as number },
        { id: "task-y", sort_order: "a2" as unknown as number },
      ];

      const result = convertTaskSortOrders(tasks);

      expect(result).toEqual([
        { id: "task-x", sort_order: "a1" },
        { id: "task-y", sort_order: "a2" },
      ]);
    });
  });

  describe("convertEntitySortOrders", () => {
    it("should return empty array when given empty array", () => {
      const result = convertEntitySortOrders([]);

      expect(result).toEqual([]);
    });

    it("should return string sort_order for a single entity", () => {
      const entities = [{ id: "entity-1", sort_order: 0 }];

      const result = convertEntitySortOrders(entities);

      expect(result).toHaveLength(1);
      expect(typeof result[0].sort_order).toBe("string");
      expect(result[0].sort_order.length).toBeGreaterThan(0);
    });

    it("should preserve ascending order: item[0] < item[1] < item[2]", () => {
      const entities = [
        { id: "entity-a", sort_order: 0 },
        { id: "entity-b", sort_order: 1 },
        { id: "entity-c", sort_order: 2 },
      ];

      const result = convertEntitySortOrders(entities);

      const entityA = result.find((entity) => entity.id === "entity-a")!;
      const entityB = result.find((entity) => entity.id === "entity-b")!;
      const entityC = result.find((entity) => entity.id === "entity-c")!;

      expect(entityA.sort_order < entityB.sort_order).toBe(true);
      expect(entityB.sort_order < entityC.sort_order).toBe(true);
    });

    it("should leave already-string sort_orders unchanged", () => {
      const entities = [
        { id: "entity-x", sort_order: "a1" as unknown as number },
        { id: "entity-y", sort_order: "a2" as unknown as number },
      ];

      const result = convertEntitySortOrders(entities);

      expect(result).toEqual([
        { id: "entity-x", sort_order: "a1" },
        { id: "entity-y", sort_order: "a2" },
      ]);
    });
  });
});
