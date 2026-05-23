import { renderHook } from "@testing-library/react";
import type { GoalService } from "@/services/GoalService";
import type { IdeaService } from "@/services/IdeaService";
import type { TaskService } from "@/services/TaskService";
import { createMockGoalService } from "@/test/mocks/goalServiceMock";
import { createMockIdeaService } from "@/test/mocks/ideaServiceMock";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
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

export function renderUseSearch(mocks: SearchMocks) {
  return renderHook(() =>
    useSearch(
      mocks.mockTaskService,
      mocks.mockGoalService,
      mocks.mockIdeaService,
    ),
  );
}

export { buildGoal } from "@/test/factories/goalFactory";
export { buildIdea } from "@/test/factories/ideaFactory";
export { buildTask } from "@/test/factories/taskFactory";
export { createMockGoalService, createMockIdeaService, createMockTaskService };
