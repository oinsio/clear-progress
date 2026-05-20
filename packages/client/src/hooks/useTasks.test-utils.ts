import { renderHook, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { BOX } from "@/constants";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { useTasks } from "./useTasks";

export const mockSchedulePush = vi.fn();

export const taskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
);

export async function setupHookWithOneTask(
  overrides: Parameters<typeof buildTask>[0] = {},
) {
  const task = buildTask({ box: "today", ...overrides });
  await db.tasks.add(task);
  const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
  await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  return { result, task };
}

export async function setupHookWithTwoTasks() {
  const task1 = buildTask({ box: "today", sort_order: 0 });
  const task2 = buildTask({ box: "today", sort_order: 1 });
  await db.tasks.bulkAdd([task1, task2]);
  const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
  await waitFor(() => expect(result.current.tasks).toHaveLength(2));
  return { result, task1, task2 };
}

export async function clearDatabase() {
  await db.tasks.clear();
  await db.checklist_items.clear();
}
