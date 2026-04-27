import { vi } from "vitest";
import type { GoalService } from "@/services/GoalService";
import { createBaseCrudMocks } from "./baseMocks";
import { createMock } from "./createMock";

export function createMockGoalService(
  overrides: Partial<Record<keyof GoalService, unknown>> = {},
): GoalService {
  return createMock<GoalService>(
    {
      ...createBaseCrudMocks(),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      reorderGoals: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
