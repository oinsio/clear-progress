import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { db } from "../database";
import { createTaskRepositorySetup } from "./TaskRepository.test-setup";

describe("TaskRepository", () => {
  const { getRepository } = createTaskRepositorySetup();

  describe("create", () => {
    it("should save the task to the database", async () => {
      const task = buildTask();
      await getRepository().create(task);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask).toBeDefined();
      expect(savedTask?.id).toBe(task.id);
      expect(savedTask?.name).toBe(task.name);
    });

    it("should persist all task fields", async () => {
      const task = buildTask({
        name: "My task",
        box: "today",
        description: "some description",
      });
      await getRepository().create(task);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.name).toBe("My task");
      expect(savedTask?.box).toBe("today");
      expect(savedTask?.description).toBe("some description");
    });
  });

  describe("update", () => {
    it("should update an existing task", async () => {
      const task = buildTask({ name: "Old name" });
      await db.tasks.add(task);

      const updatedTask = { ...task, name: "New name" };
      await getRepository().update(updatedTask);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.name).toBe("New name");
    });
  });

  describe("bulkUpsert", () => {
    it("should insert multiple tasks", async () => {
      const tasks = [buildTask(), buildTask(), buildTask()];
      await getRepository().bulkUpsert(tasks);

      const allTasks = await db.tasks.toArray();
      expect(allTasks).toHaveLength(3);
    });

    it("should update existing tasks", async () => {
      const task = buildTask({ name: "Original" });
      await db.tasks.add(task);

      const updatedTask = { ...task, name: "Updated" };
      await getRepository().bulkUpsert([updatedTask]);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.name).toBe("Updated");
    });
  });
});
