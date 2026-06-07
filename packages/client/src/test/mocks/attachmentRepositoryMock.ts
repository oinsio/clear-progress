import { vi } from "vitest";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { createMock } from "./createMock";

export function createMockAttachmentRepository(
  overrides: Partial<Record<keyof AttachmentRepository, unknown>> = {},
): AttachmentRepository {
  return createMock<AttachmentRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      getByEntityTypeAndId: vi.fn().mockResolvedValue([]),
      getAllByEntityTypeAndId: vi.fn().mockResolvedValue([]),
      getByHash: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
      getChangedSince: vi.fn().mockResolvedValue([]),
      getNeedingSync: vi.fn().mockResolvedValue([]),
      softDeleteByEntityTypeAndId: vi.fn().mockResolvedValue(0),
      restoreByEntityTypeAndId: vi.fn().mockResolvedValue(0),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    },
    overrides,
  );
}
