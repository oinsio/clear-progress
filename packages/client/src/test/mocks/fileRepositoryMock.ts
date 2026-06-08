import { vi } from "vitest";
import type { FileRepository } from "@/db/repositories/FileRepository";
import { createMock } from "./createMock";

export function createMockFileRepository(
  overrides: Partial<Record<keyof FileRepository, unknown>> = {},
): FileRepository {
  return createMock<FileRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getByHash: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
