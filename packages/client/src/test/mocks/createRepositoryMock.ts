import { vi } from "vitest";
import { createMock } from "./createMock";
export function createRepositoryMock<T>(
  overrides: Partial<Record<keyof T, unknown>> = {},
): T {
  return createMock<T>(
    {
      getActive: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
      getChangedSince: vi.fn().mockResolvedValue([]),
      getDirty: vi.fn().mockResolvedValue([]),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as Partial<Record<keyof T, unknown>>,
    overrides,
  );
}
