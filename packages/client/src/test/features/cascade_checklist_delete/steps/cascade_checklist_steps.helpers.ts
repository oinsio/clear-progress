import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";

export function createScenarioContext() {
  const taskIds = new Map<string, string>();
  const checklistItemIds = new Map<string, string>();
  let taskService: TaskService;

  const reset = async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    taskIds.clear();
    checklistItemIds.clear();
    taskService = new TaskService(
      new TaskRepository(),
      new ChecklistRepository(),
    );
  };

  return {
    taskIds,
    checklistItemIds,
    get taskService() {
      return taskService;
    },
    reset,
  };
}

export async function seedTask(
  taskIds: Map<string, string>,
  name: string,
  overrides: Parameters<typeof buildTask>[0] = {},
) {
  const taskId = crypto.randomUUID();
  taskIds.set(name, taskId);
  await db.tasks.add(buildTask({ id: taskId, ...overrides }));
  return taskId;
}

export async function seedChecklistItem(
  checklistItemIds: Map<string, string>,
  name: string,
  overrides: Parameters<typeof buildChecklistItem>[0],
) {
  const itemId = crypto.randomUUID();
  checklistItemIds.set(name, itemId);
  await db.checklist_items.add(
    buildChecklistItem({ id: itemId, ...overrides }),
  );
  return itemId;
}
