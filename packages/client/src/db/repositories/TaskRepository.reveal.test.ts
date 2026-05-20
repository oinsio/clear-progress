import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import type { ISODate } from "@/types/entities";
import { db } from "../database";
import { createTaskRepositorySetup } from "./TaskRepository.test-setup";

describe("TaskRepository", () => {
  const { getRepository } = createTaskRepositorySetup();

  describe("getTasksToReveal", () => {
    it("should find hidden task with appear_date <= today", async () => {
      const hiddenTask = buildTask({
        is_hidden: true,
        appear_date: "2026-04-20" as ISODate,
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(hiddenTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(hiddenTask.id);
    });

    it("should not find hidden task with appear_date in future", async () => {
      const hiddenTask = buildTask({
        is_hidden: true,
        appear_date: "2026-04-25" as ISODate,
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(hiddenTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });

    it("should not find hidden task with empty appear_date", async () => {
      const hiddenTask = buildTask({
        is_hidden: true,
        appear_date: "",
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(hiddenTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });

    it("should not find non-hidden task", async () => {
      const visibleTask = buildTask({
        is_hidden: false,
        appear_date: "2026-04-20" as ISODate,
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(visibleTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });

    it("should not find deleted hidden task with appear_date <= today", async () => {
      const deletedTask = buildTask({
        is_hidden: true,
        appear_date: "2026-04-20" as ISODate,
        is_deleted: true,
        is_completed: false,
      });
      await db.tasks.add(deletedTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });

    it("should not find completed hidden task with appear_date <= today", async () => {
      const completedTask = buildTask({
        is_hidden: true,
        appear_date: "2026-04-20" as ISODate,
        is_deleted: false,
        is_completed: true,
      });
      await db.tasks.add(completedTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });

    it("should find hidden task when appear_date equals today", async () => {
      const hiddenTask = buildTask({
        is_hidden: true,
        appear_date: "2026-04-21" as ISODate,
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(hiddenTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(hiddenTask.id);
    });

    it("should not find hidden task with invalid appear_date format", async () => {
      const hiddenTask = buildTask({
        is_hidden: true,
        appear_date: "invalid-date" as ISODate,
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(hiddenTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });

    it("should not find hidden task with malformed appear_date", async () => {
      const hiddenTask = buildTask({
        is_hidden: true,
        appear_date: "2026-13-45" as ISODate,
        is_deleted: false,
        is_completed: false,
      });
      await db.tasks.add(hiddenTask);

      const tasks = await getRepository().getTasksToReveal("2026-04-21");

      expect(tasks).toEqual([]);
    });
  });
});
