import { vi } from "vitest";

// Shared across every `new SettingsRepository()` instance (SyncService's copy and
// SyncProvider's own SettingsService copy alike), so tests can control the resolved
// value regardless of which instance ends up calling it. Defaults to `undefined` for
// every key, which makes SettingsService getters fall back to their defaults —
// preserving pre-existing SyncProvider test behavior (M1 of configurable-sync-timing).
const { mockSettingsGetValue: hoistedMockSettingsGetValue } = vi.hoisted(
  () => ({
    mockSettingsGetValue: vi.fn().mockResolvedValue(undefined),
  }),
);
export const mockSettingsGetValue = hoistedMockSettingsGetValue;

vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));
vi.mock("@/db/repositories/GoalRepository", () => ({
  GoalRepository: vi.fn(),
}));
vi.mock("@/db/repositories/ContextRepository", () => ({
  ContextRepository: vi.fn(),
}));
vi.mock("@/db/repositories/CategoryRepository", () => ({
  CategoryRepository: vi.fn(),
}));
vi.mock("@/db/repositories/ChecklistRepository", () => ({
  ChecklistRepository: vi.fn(),
}));
vi.mock("@/db/repositories/IdeaRepository", () => ({
  IdeaRepository: vi.fn(),
}));
vi.mock("@/db/repositories/SettingsRepository", () => ({
  SettingsRepository: vi.fn().mockImplementation(() => ({
    getValue: mockSettingsGetValue,
    set: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    getByKey: vi.fn().mockResolvedValue(undefined),
    getNeedingSync: vi.fn().mockResolvedValue([]),
    clearNeedsSyncByKey: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
  })),
}));
vi.mock("@/db/repositories/SyncMetaRepository", () => ({
  SyncMetaRepository: vi.fn(),
}));
