import { vi } from "vitest";

vi.mock("@/db/repositories/TaskRepository");
vi.mock("@/db/repositories/ChecklistRepository");
vi.mock("@/db/repositories/GoalRepository");
vi.mock("@/db/repositories/IdeaRepository");
vi.mock("@/db/repositories/ContextRepository");
vi.mock("@/db/repositories/CategoryRepository");
vi.mock("@/db/repositories/FileRepository");
vi.mock("@/db/repositories/PendingFileRepository");
vi.mock("@/db/repositories/AttachmentRepository");
vi.mock("@/db/repositories/SettingsRepository");
vi.mock("@/db/repositories/SyncMetaRepository");
vi.mock("@/services/FileService");
vi.mock("@/services/FileSyncService");
vi.mock("@/services/GoalService");
vi.mock("@/services/IdeaService");
vi.mock("@/services/SyncService");
vi.mock("@/services/TaskService");
