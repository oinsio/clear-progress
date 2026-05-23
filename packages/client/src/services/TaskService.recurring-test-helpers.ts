import { vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import type { buildTask } from "@/test/factories/taskFactory";
import type { ChecklistItem } from "@/types/entities";

export const setupCompletionMocks = (
  mockTaskRepository: TaskRepository,
  mockChecklistRepository: ChecklistRepository,
  existingTask: ReturnType<typeof buildTask>,
  completedTask: ReturnType<typeof buildTask>,
  recurringTask: ReturnType<typeof buildTask> | null,
  checklistItems: ChecklistItem[] = [],
) => {
  mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
  mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
  mockTaskRepository.create = vi.fn().mockResolvedValue(recurringTask);
  mockTaskRepository.findHiddenRecurringTask = vi
    .fn()
    .mockResolvedValue(undefined);
  mockChecklistRepository.getActiveByTaskId = vi
    .fn()
    .mockResolvedValue(checklistItems);
};

export const setupCreateTaskCapture = (
  mockTaskRepository: TaskRepository,
  existingTask: ReturnType<typeof buildTask>,
  completedTask: ReturnType<typeof buildTask>,
  mockChecklistRepository: ChecklistRepository,
) => {
  let createdTask: ReturnType<typeof buildTask> | null = null;
  mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
  mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
  mockTaskRepository.create = vi.fn().mockImplementation(async (task) => {
    createdTask = task;
    return task;
  });
  mockTaskRepository.findHiddenRecurringTask = vi
    .fn()
    .mockResolvedValue(undefined);
  mockChecklistRepository.getActiveByTaskId = vi.fn().mockResolvedValue([]);
  return () => createdTask;
};

export const setupUpdateTaskCapture = (
  mockTaskRepository: TaskRepository,
  tasksById: Record<string, ReturnType<typeof buildTask>>,
  mockChecklistRepository: ChecklistRepository,
  existingHiddenCopy?: ReturnType<typeof buildTask>,
) => {
  let updatedCopyTask: ReturnType<typeof buildTask> | null = null;
  mockTaskRepository.getById = vi
    .fn()
    .mockImplementation(async (id) => tasksById[id]);
  mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
    if (task.id === existingHiddenCopy?.id) {
      updatedCopyTask = task;
    }
    return task;
  });
  mockTaskRepository.create = vi.fn();
  mockTaskRepository.findHiddenRecurringTask = vi
    .fn()
    .mockResolvedValue(existingHiddenCopy);
  mockChecklistRepository.getActiveByTaskId = vi.fn().mockResolvedValue([]);
  return () => updatedCopyTask;
};
