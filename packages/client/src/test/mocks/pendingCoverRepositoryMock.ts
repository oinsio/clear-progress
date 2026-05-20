import { vi } from "vitest";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { createMock } from "./createMock";

export function createMockPendingCoverRepository(
  overrides: Partial<Record<keyof PendingCoverRepository, unknown>> = {},
): PendingCoverRepository {
  return createMock<PendingCoverRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      getByHash: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
