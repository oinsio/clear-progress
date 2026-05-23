import { vi } from "vitest";

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
  SettingsRepository: vi.fn(),
}));
vi.mock("@/db/repositories/SyncMetaRepository", () => ({
  SyncMetaRepository: vi.fn(),
}));
