import { vi } from "vitest";

/**
 * Creates default mocks for common CRUD methods shared across services
 */
export function createBaseCrudMocks() {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    softDelete: vi.fn().mockResolvedValue(undefined),
    searchByTitle: vi.fn().mockResolvedValue([]),
  };
}
