import { vi } from "vitest";

vi.mock("@/db/repositories/TaskRepository");
vi.mock("@/db/repositories/ChecklistRepository");
vi.mock("@/db/repositories/GoalRepository");
vi.mock("@/db/repositories/IdeaRepository");
vi.mock("@/db/repositories/ContextRepository");
vi.mock("@/db/repositories/CategoryRepository");
vi.mock("@/db/repositories/CoverRepository");
vi.mock("@/db/repositories/PendingCoverRepository");
vi.mock("@/db/repositories/SettingsRepository");
vi.mock("@/db/repositories/SyncMetaRepository");
vi.mock("@/services/CoverService");
vi.mock("@/services/CoverSyncService");
vi.mock("@/services/GoalService");
vi.mock("@/services/IdeaService");
vi.mock("@/services/SyncService");
vi.mock("@/services/TaskService");
