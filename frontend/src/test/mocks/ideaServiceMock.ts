import { vi } from "vitest";
import type { IdeaService } from "@/services/IdeaService";
import { createMock } from "./createMock";
import { createBaseCrudMocks } from "./baseMocks";

export function createMockIdeaService(
  overrides: Partial<Record<keyof IdeaService, unknown>> = {},
): IdeaService {
  return createMock<IdeaService>(
    {
      ...createBaseCrudMocks(),
      restore: vi.fn().mockResolvedValue(undefined),
      reorderIdeas: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
