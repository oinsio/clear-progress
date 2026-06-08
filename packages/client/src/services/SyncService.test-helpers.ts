import type {
  PullResponse,
  PushResponse,
  SyncAdapter,
} from "@clear-progress/contract";
import { vi } from "vitest";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import type {
  Attachment,
  Category,
  ChecklistItem,
  Context,
  Goal,
  Idea,
  Task,
} from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { SyncService } from "./SyncService";

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
    attachments: [],
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
    results: { ...resultOverrides },
    server_time: "2026-03-04T11:00:00.000Z",
  };
}

export function createMockSyncAdapter(
  overrides: Partial<SyncAdapter> = {},
): SyncAdapter {
  return {
    uploadFile: vi.fn().mockResolvedValue({
      ok: true,
      data_hash: "new-data-hash",
      reused: false,
    }),
    uploadFiles: vi
      .fn()
      .mockImplementation(
        (request: { files: Array<{ data_hash: string; goal_id: string }> }) =>
          Promise.resolve({
            ok: true,
            results: request.files.map((file) => ({
              data_hash: file.data_hash,
              goal_id: file.goal_id,
              reused: false,
            })),
          }),
      ),
    deleteFile: vi
      .fn()
      .mockResolvedValue({ ok: true, deleted: true, ref_count: 0 }),
    getFile: vi.fn().mockResolvedValue({ ok: true, files: [] }),
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
    id: "task-id",
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
    needsSync: true,
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-id",
    name: "Test Goal",
    description: "",
    cover_hash: "",
    status: "in_progress",
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

export function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: "idea-id",
    name: "Test Idea",
    description: "",
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

export function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    id: "ctx-id",
    name: "Test Context",
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-id",
    name: "Test Category",
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

export function makeChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id: "ci-id",
    task_id: "task-id",
    name: "Test Item",
    is_completed: false,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

export function makeAttachment(
  overrides: Partial<Attachment> = {},
): Attachment {
  return {
    id: "att-id",
    entity_type: "task",
    entity_id: "task-id",
    data_hash: "test-hash",
    filename: "test-file.pdf",
    mime_type: "application/pdf",
    file_size: 1024,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

export function createEntityRepoMock() {
  return {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    applyServerRecords: vi.fn().mockResolvedValue(undefined),
  };
}

export function asMock<T>(fn: T) {
  return fn as unknown as ReturnType<typeof vi.fn>;
}

function createSettingsRepoMock(): SettingsRepository {
  return {
    getNeedingSync: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    clearNeedsSyncByKey: vi.fn().mockResolvedValue(undefined),
  } as unknown as SettingsRepository;
}

function createSyncMetaRepoMock(): SyncMetaRepository {
  return {
    getValue: vi.fn().mockResolvedValue(0),
    setValue: vi.fn().mockResolvedValue(undefined),
  } as unknown as SyncMetaRepository;
}

export interface SyncTestContext {
  mockSyncAdapter: SyncAdapter;
  taskRepository: TaskRepository;
  goalRepository: GoalRepository;
  contextRepository: ContextRepository;
  categoryRepository: CategoryRepository;
  checklistRepository: ChecklistRepository;
  ideaRepository: IdeaRepository;
  attachmentRepository: AttachmentRepository;
  settingsRepository: SettingsRepository;
  syncMetaRepository: SyncMetaRepository;
}

export function setupSyncTestContext(): SyncTestContext {
  return {
    mockSyncAdapter: createMockSyncAdapter(),
    taskRepository: createEntityRepoMock() as unknown as TaskRepository,
    goalRepository: createEntityRepoMock() as unknown as GoalRepository,
    contextRepository: createEntityRepoMock() as unknown as ContextRepository,
    categoryRepository: createEntityRepoMock() as unknown as CategoryRepository,
    checklistRepository:
      createEntityRepoMock() as unknown as ChecklistRepository,
    ideaRepository: createEntityRepoMock() as unknown as IdeaRepository,
    attachmentRepository:
      createEntityRepoMock() as unknown as AttachmentRepository,
    settingsRepository: createSettingsRepoMock(),
    syncMetaRepository: createSyncMetaRepoMock(),
  };
}

export function createService(ctx: SyncTestContext): SyncService {
  return new SyncService(
    ctx.mockSyncAdapter,
    ctx.syncMetaRepository,
    ctx.taskRepository,
    ctx.goalRepository,
    ctx.contextRepository,
    ctx.categoryRepository,
    ctx.checklistRepository,
    ctx.ideaRepository,
    ctx.settingsRepository,
    ctx.attachmentRepository,
  );
}

function withMockMethod<T extends object>(
  repo: T,
  methodName: string,
  mockFn: ReturnType<typeof vi.fn>,
): T {
  return {
    ...repo,
    [methodName]: mockFn,
  } as T;
}

export function withNeedingSync<T extends object>(
  repo: T,
  entities: unknown[],
): T {
  return withMockMethod(
    repo,
    "getNeedingSync",
    vi.fn().mockResolvedValue(entities),
  );
}

export function withGetAll<T extends object>(repo: T, entities: unknown[]): T {
  return withMockMethod(repo, "getAll", vi.fn().mockResolvedValue(entities));
}

export function withGetById<T extends object>(
  repo: T,
  entities: { id: string }[],
): T {
  return withMockMethod(
    repo,
    "getById",
    vi
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve(entities.find((entity) => entity.id === id)),
      ),
  );
}

type EntityType =
  | "task"
  | "goal"
  | "context"
  | "category"
  | "checklist"
  | "idea"
  | "attachment";

export function setupEntityForPush<T extends { id: string }>(
  ctx: SyncTestContext,
  entityType: EntityType,
  entity: T,
): void {
  const repoMap = {
    task: ctx.taskRepository,
    goal: ctx.goalRepository,
    context: ctx.contextRepository,
    category: ctx.categoryRepository,
    checklist: ctx.checklistRepository,
    idea: ctx.ideaRepository,
    attachment: ctx.attachmentRepository,
  };
  const repo = repoMap[entityType];
  asMock(repo.getNeedingSync).mockResolvedValue([entity]);
  asMock(repo.getById).mockResolvedValue(entity);
}

export function getPushCallArg(mockAdapter: SyncAdapter) {
  return asMock(mockAdapter.push).mock.calls[0][0];
}

export function setupEmptyRepositories(ctx: SyncTestContext): void {
  ctx.taskRepository = withGetAll(ctx.taskRepository, []);
  ctx.goalRepository = withGetAll(ctx.goalRepository, []);
  ctx.contextRepository = withGetAll(ctx.contextRepository, []);
  ctx.categoryRepository = withGetAll(ctx.categoryRepository, []);
  ctx.checklistRepository = withGetAll(ctx.checklistRepository, []);
  ctx.ideaRepository = withGetAll(ctx.ideaRepository, []);
  ctx.attachmentRepository = withGetAll(ctx.attachmentRepository, []);
  ctx.settingsRepository = withGetAll(ctx.settingsRepository, []);
}

export interface EntityTestCase {
  entityName: string;
  payloadKey: string;
  makeEntity: (overrides?: Record<string, unknown>) => unknown;
  setupRepo: (ctx: SyncTestContext, entities: unknown[]) => void;
  getRepo: (ctx: SyncTestContext) => ReturnType<typeof createEntityRepoMock>;
  expectedIdOrKey: string;
}

export const ENTITY_TEST_CASES: EntityTestCase[] = [
  {
    entityName: "context",
    payloadKey: "contexts",
    makeEntity: (overrides = {}) =>
      makeContext({ id: "ctx1", name: "Home", ...overrides }),
    setupRepo: (ctx, entities) => {
      ctx.contextRepository = withNeedingSync(ctx.contextRepository, entities);
    },
    getRepo: (ctx) =>
      ctx.contextRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    expectedIdOrKey: "ctx1",
  },
  {
    entityName: "category",
    payloadKey: "categories",
    makeEntity: (overrides = {}) =>
      makeCategory({ id: "cat1", name: "Work", ...overrides }),
    setupRepo: (ctx, entities) => {
      ctx.categoryRepository = withNeedingSync(
        ctx.categoryRepository,
        entities,
      );
    },
    getRepo: (ctx) =>
      ctx.categoryRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    expectedIdOrKey: "cat1",
  },
  {
    entityName: "checklist_item",
    payloadKey: "checklist_items",
    makeEntity: (overrides = {}) =>
      makeChecklistItem({
        id: "ci1",
        task_id: "t0",
        name: "Item",
        ...overrides,
      }),
    setupRepo: (ctx, entities) => {
      ctx.checklistRepository = withNeedingSync(
        ctx.checklistRepository,
        entities,
      );
    },
    getRepo: (ctx) =>
      ctx.checklistRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    expectedIdOrKey: "ci1",
  },
  {
    entityName: "idea",
    payloadKey: "ideas",
    makeEntity: (overrides = {}) => makeIdea({ id: "idea1", ...overrides }),
    setupRepo: (ctx, entities) => {
      ctx.ideaRepository = withNeedingSync(ctx.ideaRepository, entities);
    },
    getRepo: (ctx) =>
      ctx.ideaRepository as unknown as ReturnType<typeof createEntityRepoMock>,
    expectedIdOrKey: "idea1",
  },
  {
    entityName: "setting",
    payloadKey: "settings",
    makeEntity: () => ({
      key: "theme",
      value: "dark",
      updated_at: toISOTimestamp(),
      needsSync: true,
    }),
    setupRepo: (ctx, entities) => {
      ctx.settingsRepository = withNeedingSync(
        ctx.settingsRepository,
        entities,
      );
    },
    getRepo: (ctx) =>
      ctx.settingsRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    expectedIdOrKey: "theme",
  },
];

export const ENTITY_TEST_CASES_WITH_REVISION: Array<{
  entityName: string;
  getRepo: (ctx: SyncTestContext) => ReturnType<typeof createEntityRepoMock>;
  makeEntity: () => unknown;
  payloadKey: string;
  pushRevision: number;
}> = [
  {
    entityName: "context",
    getRepo: (ctx) =>
      ctx.contextRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    makeEntity: () => makeContext({ id: "ctx1", name: "Home", revision: 1 }),
    payloadKey: "contexts",
    pushRevision: 7,
  },
  {
    entityName: "category",
    getRepo: (ctx) =>
      ctx.categoryRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    makeEntity: () => makeCategory({ id: "cat1", name: "Work", revision: 1 }),
    payloadKey: "categories",
    pushRevision: 8,
  },
  {
    entityName: "checklist_item",
    getRepo: (ctx) =>
      ctx.checklistRepository as unknown as ReturnType<
        typeof createEntityRepoMock
      >,
    makeEntity: () =>
      makeChecklistItem({
        id: "ci1",
        task_id: "t1",
        name: "Item",
        revision: 1,
      }),
    payloadKey: "checklist_items",
    pushRevision: 9,
  },
  {
    entityName: "idea",
    getRepo: (ctx) =>
      ctx.ideaRepository as unknown as ReturnType<typeof createEntityRepoMock>,
    makeEntity: () =>
      makeIdea({
        id: "i1",
        updated_at: "2026-01-01T10:00:00.000Z",
        needsSync: true,
      }),
    payloadKey: "ideas",
    pushRevision: 12,
  },
];
