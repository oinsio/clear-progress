import { vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import type { Task } from "@/types/entities";
import { TaskService } from "./TaskService";

export function createTestContext(
  taskRepoOverrides: Partial<TaskRepository> = {},
  checklistRepoOverrides: Partial<ChecklistRepository> = {},
) {
  const mockTaskRepository = createMockTaskRepository(taskRepoOverrides);
  const mockChecklistRepository = createMockChecklistRepository(
    checklistRepoOverrides,
  );
  const taskService = new TaskService(
    mockTaskRepository,
    mockChecklistRepository,
  );
  return { mockTaskRepository, mockChecklistRepository, taskService };
}

export function getCreatedTask(mockTaskRepository: TaskRepository): Task {
  return (mockTaskRepository.create as ReturnType<typeof vi.fn>).mock
    .calls[0][0];
}

export function getCreatedItem(mockChecklistRepository: ChecklistRepository) {
  return (mockChecklistRepository.create as ReturnType<typeof vi.fn>).mock
    .calls[0][0];
}

/**
 * Installs an `update` mock that records each updated task into the returned
 * map (keyed by task id) and echoes the task back. Shared setup for softDelete
 * / restore tests that assert on the final state of updated tasks.
 */
export function mockUpdateRecording(
  mockTaskRepository: TaskRepository,
): Record<string, Task> {
  const recordedUpdates: Record<string, Task> = {};
  mockTaskRepository.update = vi.fn().mockImplementation(async (task: Task) => {
    recordedUpdates[task.id] = task;
    return task;
  });
  return recordedUpdates;
}

/**
 * Installs a `getById` mock resolving from a base id->task map, preferring any
 * task already written into `recordedUpdates` so reads observe prior updates.
 * Returns undefined for unknown ids. Shared setup for softDelete / restore
 * tests.
 */
export function mockGetByIdFromMap(
  mockTaskRepository: TaskRepository,
  tasksById: Record<string, Task>,
  recordedUpdates: Record<string, Task> = {},
): void {
  mockTaskRepository.getById = vi
    .fn()
    .mockImplementation(async (id: string) => {
      return recordedUpdates[id] ?? tasksById[id] ?? undefined;
    });
}
