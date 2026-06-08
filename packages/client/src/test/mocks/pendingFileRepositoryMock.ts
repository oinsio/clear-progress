import { vi } from "vitest";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import { createMock } from "./createMock";

export function createMockPendingFileRepository(
  overrides: Partial<Record<keyof PendingFileRepository, unknown>> = {},
): PendingFileRepository {
  return createMock<PendingFileRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getByHash: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
