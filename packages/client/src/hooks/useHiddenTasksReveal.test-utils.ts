import { afterEach, beforeEach, type Mock, vi } from "vitest";

export { createMutableClock } from "@/test/helpers/mutableClock";

export function setupHiddenTasksRevealMocks(
  mockRevealHiddenTasks: Mock,
  MockHiddenTaskService: Mock,
) {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRevealHiddenTasks.mockResolvedValue([]);
    // eslint-disable-next-line prefer-arrow-callback
    MockHiddenTaskService.mockImplementation(() => ({
      revealHiddenTasks: mockRevealHiddenTasks,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}
