import type { vi } from "vitest";
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
