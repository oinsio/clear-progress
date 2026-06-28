import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { db } from "../database";
import { createTaskRepositorySetup } from "./TaskRepository.test-setup";

describe("TaskRepository", () => {
  const { getRepository } = createTaskRepositorySetup();

  describe("findHiddenRecurringTask", () => {
    it("should find hidden task by original_task_id", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const hiddenCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, hiddenCopy]);

      const found = await getRepository().findHiddenRecurringTask("original-1");

      expect(found).toBeDefined();
      expect(found?.id).toBe("copy-1");
      expect(found?.original_task_id).toBe("original-1");
    });

    it("should return undefined when no hidden copy exists", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      await db.tasks.add(originalTask);

      const found = await getRepository().findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should ignore revealed tasks (is_hidden = false)", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const revealedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: false,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, revealedCopy]);

      const found = await getRepository().findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should ignore completed tasks", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const completedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: true,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, completedCopy]);

      const found = await getRepository().findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should ignore deleted tasks", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const deletedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: true,
      });
      await db.tasks.bulkAdd([originalTask, deletedCopy]);

      const found = await getRepository().findHiddenRecurringTask("original-1");

      expect(found).toBeUndefined();
    });

    it("should return first hidden copy when multiple exist", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
        is_hidden: false,
      });
      const hiddenCopy1 = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: false,
      });
      const hiddenCopy2 = buildTask({
        id: "copy-2",
        original_task_id: "original-1",
        is_hidden: true,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([originalTask, hiddenCopy1, hiddenCopy2]);

      const found = await getRepository().findHiddenRecurringTask("original-1");

      expect(found).toBeDefined();
      expect(["copy-1", "copy-2"]).toContain(found?.id);
    });
  });

  // implements FR1 of dedup-recurring-after-pull
  describe("findDuplicateRecurringGroups", () => {
    const ORIGINAL_ID_1 = "11111111-1111-4111-a111-111111111111";
    const ORIGINAL_ID_2 = "22222222-2222-4222-a222-222222222222";
    const ORIGINAL_ID_3 = "33333333-3333-4333-a333-333333333333";

    it("should return grouped tasks by original_task_id", async () => {
      const copyA1 = buildTask({
        id: "copy-a1",
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      const copyA2 = buildTask({
        id: "copy-a2",
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([copyA1, copyA2]);

      const groups = await getRepository().findDuplicateRecurringGroups([
        ORIGINAL_ID_1,
      ]);

      expect(groups.size).toBe(1);
      const group = groups.get(ORIGINAL_ID_1)!;
      expect(group).toHaveLength(2);
      expect(group.map((task) => task.id).sort()).toEqual([
        "copy-a1",
        "copy-a2",
      ]);
    });

    it("should filter out completed tasks", async () => {
      const activeTask = buildTask({
        id: "active-1",
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      const completedTask = buildTask({
        id: "completed-1",
        original_task_id: ORIGINAL_ID_1,
        is_completed: true,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([activeTask, completedTask]);

      const groups = await getRepository().findDuplicateRecurringGroups([
        ORIGINAL_ID_1,
      ]);

      const group = groups.get(ORIGINAL_ID_1)!;
      expect(group).toHaveLength(1);
      expect(group[0].id).toBe("active-1");
    });

    it("should filter out deleted tasks", async () => {
      const activeTask = buildTask({
        id: "active-1",
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      const deletedTask = buildTask({
        id: "deleted-1",
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: true,
      });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const groups = await getRepository().findDuplicateRecurringGroups([
        ORIGINAL_ID_1,
      ]);

      const group = groups.get(ORIGINAL_ID_1)!;
      expect(group).toHaveLength(1);
      expect(group[0].id).toBe("active-1");
    });

    it("should handle multiple groups independently", async () => {
      const copyA1 = buildTask({
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      const copyA2 = buildTask({
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      const copyB1 = buildTask({
        original_task_id: ORIGINAL_ID_2,
        is_completed: false,
        is_deleted: false,
      });
      const copyB2 = buildTask({
        original_task_id: ORIGINAL_ID_2,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([copyA1, copyA2, copyB1, copyB2]);

      const groups = await getRepository().findDuplicateRecurringGroups([
        ORIGINAL_ID_1,
        ORIGINAL_ID_2,
      ]);

      expect(groups.size).toBe(2);
      expect(groups.get(ORIGINAL_ID_1)).toHaveLength(2);
      expect(groups.get(ORIGINAL_ID_2)).toHaveLength(2);
    });

    it("should return empty map for IDs with no matches", async () => {
      const groups = await getRepository().findDuplicateRecurringGroups([
        ORIGINAL_ID_3,
      ]);

      expect(groups.size).toBe(0);
    });

    it("should return single copy per group when only one active copy exists", async () => {
      const singleTask = buildTask({
        id: "single-1",
        original_task_id: ORIGINAL_ID_1,
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.add(singleTask);

      const groups = await getRepository().findDuplicateRecurringGroups([
        ORIGINAL_ID_1,
      ]);

      expect(groups.size).toBe(1);
      const group = groups.get(ORIGINAL_ID_1)!;
      expect(group).toHaveLength(1);
      expect(group[0].id).toBe("single-1");
    });
  });

  describe("findByOriginalTaskId", () => {
    it("should find all copies by original_task_id", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
      });
      const copy1 = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
      });
      const copy2 = buildTask({
        id: "copy-2",
        original_task_id: "original-1",
      });
      const otherTask = buildTask({
        id: "other-1",
        original_task_id: "",
      });
      await db.tasks.bulkAdd([originalTask, copy1, copy2, otherTask]);

      const copies = await getRepository().findByOriginalTaskId("original-1");

      expect(copies).toHaveLength(2);
      expect(copies.map((t) => t.id).sort()).toEqual(["copy-1", "copy-2"]);
    });

    it("should return empty array when no copies exist", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
      });
      await db.tasks.add(originalTask);

      const copies = await getRepository().findByOriginalTaskId("original-1");

      expect(copies).toEqual([]);
    });

    it("should include deleted and completed copies", async () => {
      const originalTask = buildTask({
        id: "original-1",
        original_task_id: "",
      });
      const deletedCopy = buildTask({
        id: "copy-1",
        original_task_id: "original-1",
        is_deleted: true,
      });
      const completedCopy = buildTask({
        id: "copy-2",
        original_task_id: "original-1",
        is_completed: true,
      });
      await db.tasks.bulkAdd([originalTask, deletedCopy, completedCopy]);

      const copies = await getRepository().findByOriginalTaskId("original-1");

      expect(copies).toHaveLength(2);
      expect(copies.map((t) => t.id).sort()).toEqual(["copy-1", "copy-2"]);
    });
  });
});
