import { beforeEach } from "vitest";
import { db } from "../database";
import { TaskRepository } from "./TaskRepository";

export function createTaskRepositorySetup(): {
  getRepository: () => TaskRepository;
} {
  let taskRepository: TaskRepository;

  beforeEach(async () => {
    await db.tasks.clear();
    taskRepository = new TaskRepository();
  });

  return {
    getRepository: () => taskRepository,
  };
}
