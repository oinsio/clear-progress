import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

export function createScenarioContext() {
  const taskIds = new Map<string, string>();
  let taskService: TaskService;

  const reset = async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    taskIds.clear();
    taskService = new TaskService(
      new TaskRepository(),
      new ChecklistRepository(),
    );
  };

  return {
    taskIds,
    get taskService() {
      return taskService;
    },
    reset,
  };
}

export async function seedTask(
  taskIds: Map<string, string>,
  name: string,
  overrides: Partial<Task> = {},
) {
  const taskId = crypto.randomUUID();
  taskIds.set(name, taskId);
  await db.tasks.add(buildTask({ id: taskId, name, ...overrides }));
  return taskId;
}

export async function getTask(
  taskIds: Map<string, string>,
  name: string,
): Promise<Task> {
  return (await db.tasks.get(getIdOrThrow(taskIds, name))) as Task;
}
