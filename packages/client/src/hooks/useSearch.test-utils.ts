import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import type { GoalService } from "@/services/GoalService";
import type { IdeaService } from "@/services/IdeaService";
import type { TaskService } from "@/services/TaskService";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";
import { createMockIdeaService } from "@/test/mocks/ideaServiceMock";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import type { Goal, Idea, Task } from "@/types/entities";
import { useSearch } from "./useSearch";

export interface SearchMocks {
  mockTaskService: TaskService;
  mockGoalService: GoalService;
  mockIdeaService: IdeaService;
}

export function createSearchMocks(): SearchMocks {
  return {
    mockTaskService: createMockTaskService(),
    mockGoalService: createMockGoalService(),
    mockIdeaService: createMockIdeaService(),
  };
}

export interface SearchServiceData {
  tasks?: Task[];
  goals?: Goal[];
  ideas?: Idea[];
}

export function setupSearchServiceMocks(
  mocks: SearchMocks,
  data: SearchServiceData,
): void {
  if (data.tasks) {
    mocks.mockTaskService = createMockTaskService({
      searchByName: vi.fn().mockResolvedValue(data.tasks),
    });
  }
  if (data.goals) {
    mocks.mockGoalService = createMockGoalService({
      searchByName: vi.fn().mockResolvedValue(data.goals),
    });
  }
  if (data.ideas) {
    mocks.mockIdeaService = createMockIdeaService({
      searchByName: vi.fn().mockResolvedValue(data.ideas),
    });
  }
}

export function renderUseSearch(mocks: SearchMocks) {
  return renderHook(() =>
    useSearch(
      mocks.mockTaskService,
      mocks.mockGoalService,
      mocks.mockIdeaService,
    ),
  );
}

export async function performSearch(mocks: SearchMocks, query: string) {
  const { result } = renderUseSearch(mocks);
  await act(async () => {
    await result.current.search(query);
  });
  return result.current;
}

export { buildGoal } from "@/test/factories/goalFactory";
export { buildIdea } from "@/test/factories/ideaFactory";
export { buildTask } from "@/test/factories/taskFactory";
export { createMockGoalService, createMockIdeaService, createMockTaskService };
