import type {
  PullResponse,
  PushResponse,
  SyncAdapter,
} from "@clear-progress/contract";
import { vi } from "vitest";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { SyncService } from "@/services/SyncService";
import type { Goal, Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

export function makePullResponse(
  overrides: Partial<PullResponse> = {},
): PullResponse {
  return {
    ok: true,
    tasks: [],
    goals: [],
    ideas: [],
    contexts: [],
    categories: [],
    checklist_items: [],
    settings: [],
    current_revision: 10,
    purge_revision: 0,
    server_time: "2026-03-04T11:00:00.000Z",
    ...overrides,
  };
}

export function makePushResponse(
  resultOverrides: PushResponse["results"] = {},
  revision?: number,
): PushResponse {
  return {
    ok: true,
    ...(revision !== undefined ? { revision } : {}),
    results: {
      ...resultOverrides,
    },
    server_time: "2026-03-04T11:00:00.000Z",
  };
}

export function createMockSyncAdapter(
  overrides: Partial<SyncAdapter> = {},
): SyncAdapter {
  return {
    uploadCover: vi.fn(),
    uploadCovers: vi.fn(),
    deleteCover: vi.fn(),
    getCover: vi.fn(),
    ping: vi.fn(),
    init: vi.fn(),
    pull: vi.fn().mockResolvedValue(makePullResponse()),
    push: vi.fn().mockResolvedValue(makePushResponse()),
    purge: vi.fn(),
    ...overrides,
  } as SyncAdapter;
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    name: "Test Task",
    description: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    is_hidden: false,
    next_date: "",
    appear_date: "",
    original_task_id: "",
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: crypto.randomUUID(),
    name: "Test Goal",
    description: "",
    cover_file_id: "",
    status: "in_progress",
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}

export function createMockRepositories() {
  const taskRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  } as unknown as TaskRepository;

  const goalRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  } as unknown as GoalRepository;

  const contextRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  } as unknown as ContextRepository;

  const categoryRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  } as unknown as CategoryRepository;

  const checklistRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  } as unknown as ChecklistRepository;

  const ideaRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  } as unknown as IdeaRepository;

  const settingsRepository = {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    clearNeedsSyncByKey: vi.fn().mockResolvedValue(undefined),
  } as unknown as SettingsRepository;

  const syncMetaRepository = {
    getValue: vi.fn().mockResolvedValue(0),
    setValue: vi.fn().mockResolvedValue(undefined),
  } as unknown as SyncMetaRepository;

  return {
    taskRepository,
    goalRepository,
    contextRepository,
    categoryRepository,
    checklistRepository,
    ideaRepository,
    settingsRepository,
    syncMetaRepository,
  };
}

export function mockAllRepositoriesGetAll(
  repositories: ReturnType<typeof createMockRepositories>,
  overrides: {
    tasks?: Task[];
    goals?: Goal[];
    contexts?: unknown[];
    categories?: unknown[];
    checklists?: unknown[];
    ideas?: unknown[];
    settings?: unknown[];
  } = {},
): void {
  (
    repositories.taskRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.tasks ?? []);
  (
    repositories.goalRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.goals ?? []);
  (
    repositories.contextRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.contexts ?? []);
  (
    repositories.categoryRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.categories ?? []);
  (
    repositories.checklistRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.checklists ?? []);
  (
    repositories.ideaRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.ideas ?? []);
  (
    repositories.settingsRepository.getAll as ReturnType<typeof vi.fn>
  ).mockResolvedValue(overrides.settings ?? []);
}

export function createSyncService(
  syncAdapter: SyncAdapter,
  repositories: ReturnType<typeof createMockRepositories>,
): SyncService {
  return new SyncService(
    syncAdapter,
    repositories.syncMetaRepository,
    repositories.taskRepository,
    repositories.goalRepository,
    repositories.contextRepository,
    repositories.categoryRepository,
    repositories.checklistRepository,
    repositories.ideaRepository,
    repositories.settingsRepository,
  );
}
