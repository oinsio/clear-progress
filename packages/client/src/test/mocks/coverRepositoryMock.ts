import { vi } from "vitest";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import { createMock } from "./createMock";

export function createMockCoverRepository(
  overrides: Partial<Record<keyof CoverRepository, unknown>> = {},
): CoverRepository {
  return createMock<CoverRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getByHash: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
