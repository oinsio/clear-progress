import { vi } from "vitest";
import type { TaskService } from "@/services/TaskService";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

export interface TestContext {
  mockTaskService: TaskService;
  onReload: ReturnType<typeof vi.fn>;
}

export function createTestContext(
  overrides?: Parameters<typeof createMockTaskService>[0],
): TestContext {
  const mockTaskService = createMockTaskService(overrides);
  const onReload = vi.fn().mockResolvedValue(undefined);
  return { mockTaskService, onReload };
}
