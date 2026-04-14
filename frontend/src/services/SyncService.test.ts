import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncService } from "./SyncService";
import type { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import type { Task, Goal } from "@/types/entities";
import type { PullResponse, PushResponse, PushResponseData } from "@/types/api";
import { LOCAL_COVER_ID_PREFIX, SYNC_META_KEYS } from "@/constants";
import { db } from "@/db/database";

function makePullResponse(overrides: Partial<PullResponse> = {}): PullResponse {
  return {
    ok: true,
    data: {
      tasks: [],
      goals: [],
      ideas: [],
      contexts: [],
      categories: [],
      checklist_items: [],
    },
    settings: [],
    current_revision: 10,
    purge_revision: 0,
    server_time: "2026-03-04T11:00:00.000Z",
    ...overrides,
  };
}

function makePushResponse(
  resultOverrides: PushResponseData = {},
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

function createMockApiClient(
  overrides: Partial<Record<keyof ApiClient, unknown>> = {},
): ApiClient {
  return {
    uploadCover: vi.fn(),
    uploadCovers: vi.fn(),
    deleteCover: vi.fn(),
    getCovers: vi.fn(),
    ping: vi.fn(),
    pingUrl: vi.fn(),
    init: vi.fn(),
    pull: vi.fn().mockResolvedValue(makePullResponse()),
    push: vi.fn().mockResolvedValue(makePushResponse()),
    ...overrides,
  } as ApiClient;
}

function makeTask(overrides: Partial<Task> = {}): Task {
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-id",
    name: "Test Goal",
    description: "",
    cover_file_id: "",
    status: "in_progress",
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    revision: 0,
    needsSync: true,
    ...overrides,
  };
}

describe("SyncService", () => {
  let mockApiClient: ApiClient;
  let taskRepository: TaskRepository;
  let goalRepository: GoalRepository;
  let contextRepository: ContextRepository;
  let categoryRepository: CategoryRepository;
  let checklistRepository: ChecklistRepository;
  let ideaRepository: IdeaRepository;
  let settingsRepository: SettingsRepository;
  let syncMetaRepository: SyncMetaRepository;

  beforeEach(() => {
    mockApiClient = createMockApiClient();

    taskRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as TaskRepository;

    goalRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as GoalRepository;

    contextRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as ContextRepository;

    categoryRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as CategoryRepository;

    checklistRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChecklistRepository;

    ideaRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as IdeaRepository;

    settingsRepository = {
      getNeedingSync: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
      clearNeedsSyncByKey: vi.fn().mockResolvedValue(undefined),
    } as unknown as SettingsRepository;

    syncMetaRepository = {
      getValue: vi.fn().mockResolvedValue(0),
      setValue: vi.fn().mockResolvedValue(undefined),
    } as unknown as SyncMetaRepository;
  });

  function createService(): SyncService {
    return new SyncService(
      mockApiClient,
      syncMetaRepository,
      taskRepository,
      goalRepository,
      contextRepository,
      categoryRepository,
      checklistRepository,
      ideaRepository,
      settingsRepository,
    );
  }

  describe("pull", () => {
    it("should read last_known_revision from sync_meta", async () => {
      (
        syncMetaRepository.getValue as ReturnType<typeof vi.fn>
      ).mockResolvedValue(42);
      const service = createService();

      await service.pull();

      expect(syncMetaRepository.getValue).toHaveBeenCalledWith(
        SYNC_META_KEYS.LAST_KNOWN_REVISION,
      );
    });

    it("should send since_revision from sync_meta to apiClient.pull", async () => {
      (
        syncMetaRepository.getValue as ReturnType<typeof vi.fn>
      ).mockResolvedValue(42);
      const service = createService();

      await service.pull();

      expect(mockApiClient.pull).toHaveBeenCalledWith({ since_revision: 42 });
    });

    it("should call applyServerRecords on all entity repositories", async () => {
      const serverTasks = [makeTask({ needsSync: false })];
      mockApiClient = createMockApiClient({
        pull: vi.fn().mockResolvedValue(
          makePullResponse({
            data: {
              tasks: serverTasks,
              goals: [],
              ideas: [],
              contexts: [],
              categories: [],
              checklist_items: [],
            },
            current_revision: 5,
          }),
        ),
      });
      const service = createService();

      await service.pull();

      expect(taskRepository.applyServerRecords).toHaveBeenCalledWith(
        serverTasks,
      );
      expect(goalRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(contextRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(categoryRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(checklistRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(ideaRepository.applyServerRecords).toHaveBeenCalledWith([]);
    });

    it("should call settingsRepository.bulkUpsert with server settings", async () => {
      const serverSettings = [
        {
          key: "default_box",
          value: "inbox",
          updated_at: "2026-03-04T10:00:00.000Z",
          needsSync: false,
        },
      ];
      mockApiClient = createMockApiClient({
        pull: vi
          .fn()
          .mockResolvedValue(
            makePullResponse({ settings: serverSettings, current_revision: 5 }),
          ),
      });
      const service = createService();

      await service.pull();

      expect(settingsRepository.bulkUpsert).toHaveBeenCalledWith(
        serverSettings,
      );
    });

    it("should save current_revision to sync_meta after pull", async () => {
      mockApiClient = createMockApiClient({
        pull: vi
          .fn()
          .mockResolvedValue(makePullResponse({ current_revision: 55 })),
      });
      const service = createService();

      await service.pull();

      expect(syncMetaRepository.setValue).toHaveBeenCalledWith(
        SYNC_META_KEYS.LAST_KNOWN_REVISION,
        55,
      );
    });

    it("should throw if pull response is not ok", async () => {
      mockApiClient = createMockApiClient({
        pull: vi.fn().mockResolvedValue({ ok: false }),
      });
      const service = createService();

      await expect(service.pull()).rejects.toThrow("Pull failed");
    });
  });

  describe("push", () => {
    it("should call getNeedingSync on all repositories", async () => {
      const needsSyncTask = makeTask();
      (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue([
        needsSyncTask,
      ]);
      (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
        needsSyncTask,
      );
      const service = createService();

      await service.push();

      expect(taskRepository.getNeedingSync).toHaveBeenCalledOnce();
      expect(goalRepository.getNeedingSync).toHaveBeenCalledOnce();
      expect(contextRepository.getNeedingSync).toHaveBeenCalledOnce();
      expect(categoryRepository.getNeedingSync).toHaveBeenCalledOnce();
      expect(checklistRepository.getNeedingSync).toHaveBeenCalledOnce();
      expect(settingsRepository.getNeedingSync).toHaveBeenCalledOnce();
    });

    it("should not call apiClient.push when no needsSync records exist", async () => {
      const service = createService();

      await service.push();

      expect(mockApiClient.push).not.toHaveBeenCalled();
    });

    it("should strip needsSync from records before sending to apiClient", async () => {
      const needsSyncTask = makeTask({ needsSync: true });
      (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue([
        needsSyncTask,
      ]);
      (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
        needsSyncTask,
      );
      const service = createService();

      await service.push();

      const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(pushCall.changes.tasks[0].needsSync).toBeUndefined();
    });

    it.each([
      ["strips local cover_file_id", `${LOCAL_COVER_ID_PREFIX}local-uuid`, ""],
      ["keeps remote cover_file_id", "remote-file-id", "remote-file-id"],
    ])(
      "should %s before sending goal to server",
      async (_, cover_file_id, expected) => {
        const needsSyncGoal = makeGoal({ cover_file_id, needsSync: true });
        (goalRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [needsSyncGoal],
        );
        (goalRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
          needsSyncGoal,
        );
        const service = createService();

        await service.push();

        const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        expect(pushCall.changes.goals[0].cover_file_id).toBe(expected);
      },
    );

    it("should send push when only contexts are needsSync", async () => {
      const context = {
        id: "ctx1",
        name: "Home",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 2,
        revision: 1,
        needsSync: true,
      };
      (
        contextRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([context]);
      const service = createService();

      await service.push();

      expect(mockApiClient.push).toHaveBeenCalled();
    });

    it("should send push when only categories are needsSync", async () => {
      const category = {
        id: "cat1",
        name: "Work",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 2,
        revision: 1,
        needsSync: true,
      };
      (
        categoryRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([category]);
      const service = createService();

      await service.push();

      expect(mockApiClient.push).toHaveBeenCalled();
    });

    it("should send push when only checklist_items are needsSync", async () => {
      const item = {
        id: "ci1",
        task_id: "t1",
        name: "Item",
        is_completed: false,
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 2,
        revision: 1,
        needsSync: true,
      };
      (
        checklistRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item]);
      const service = createService();

      await service.push();

      expect(mockApiClient.push).toHaveBeenCalled();
    });

    it("should send push when only settings are needsSync", async () => {
      const setting = {
        key: "accent_color",
        value: "green",
        updated_at: "",
        needsSync: true,
      };
      (
        settingsRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([setting]);
      const service = createService();

      await service.push();

      expect(mockApiClient.push).toHaveBeenCalled();
    });

    describe("applyPushResults — settings", () => {
      it("should clear needsSync on settings after accepted push response", async () => {
        const setting = {
          key: "accent_color",
          value: "green",
          updated_at: "",
          needsSync: true,
        };
        (
          settingsRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([setting]);
        mockApiClient = createMockApiClient({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse(
                { settings: [{ id: "accent_color", status: "accepted" }] },
                5,
              ),
            ),
        });
        const service = createService();

        await service.push();

        expect(settingsRepository.clearNeedsSyncByKey).toHaveBeenCalledWith([
          "accent_color",
        ]);
      });

      it("should clear needsSync on settings after created push response", async () => {
        const setting = {
          key: "default_box",
          value: "inbox",
          updated_at: "",
          needsSync: true,
        };
        (
          settingsRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([setting]);
        mockApiClient = createMockApiClient({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse(
                { settings: [{ id: "default_box", status: "created" }] },
                6,
              ),
            ),
        });
        const service = createService();

        await service.push();

        expect(settingsRepository.clearNeedsSyncByKey).toHaveBeenCalledWith([
          "default_box",
        ]);
      });

      it("should NOT clear needsSync on settings with conflict status", async () => {
        const setting = {
          key: "accent_color",
          value: "green",
          updated_at: "",
          needsSync: true,
        };
        (
          settingsRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([setting]);
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(
            makePushResponse({
              settings: [{ id: "accent_color", status: "conflict" }],
            }),
          ),
        });
        const service = createService();

        await service.push();

        expect(settingsRepository.clearNeedsSyncByKey).not.toHaveBeenCalled();
      });

      it("should not call apiClient.push when settings were cleared after previous sync", async () => {
        // Simulates the next push after settings were already synced (needsSync: false)
        (
          settingsRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([]);
        const service = createService();

        await service.push();

        expect(mockApiClient.push).not.toHaveBeenCalled();
      });
    });

    it("should clear needsSync for accepted context using pushRevision from response", async () => {
      const context = {
        id: "ctx1",
        name: "Home",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 2,
        revision: 1,
        needsSync: true,
      };
      (
        contextRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([context]);
      (contextRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
        { ...context },
      );
      mockApiClient = createMockApiClient({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { contexts: [{ id: "ctx1", status: "accepted" }] },
              7,
            ),
          ),
      });
      const service = createService();

      await service.push();

      expect(contextRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ctx1", needsSync: false, revision: 7 }),
      );
    });

    it("should clear needsSync for accepted category using pushRevision from response", async () => {
      const category = {
        id: "cat1",
        name: "Work",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 2,
        revision: 1,
        needsSync: true,
      };
      (
        categoryRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([category]);
      (
        categoryRepository.getById as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ ...category });
      mockApiClient = createMockApiClient({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { categories: [{ id: "cat1", status: "accepted" }] },
              8,
            ),
          ),
      });
      const service = createService();

      await service.push();

      expect(categoryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "cat1", needsSync: false, revision: 8 }),
      );
    });

    it("should clear needsSync for accepted checklist_item using pushRevision from response", async () => {
      const item = {
        id: "ci1",
        task_id: "t1",
        name: "Item",
        is_completed: false,
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 2,
        revision: 1,
        needsSync: true,
      };
      (
        checklistRepository.getNeedingSync as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item]);
      (
        checklistRepository.getById as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ ...item });
      mockApiClient = createMockApiClient({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { checklist_items: [{ id: "ci1", status: "created" }] },
              9,
            ),
          ),
      });
      const service = createService();

      await service.push();

      expect(checklistRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ci1", needsSync: false, revision: 9 }),
      );
    });

    it("should throw if push response is not ok", async () => {
      const needsSyncTask = makeTask();
      (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue([
        needsSyncTask,
      ]);
      mockApiClient = createMockApiClient({
        push: vi.fn().mockResolvedValue({ ok: false, results: {} }),
      });
      const service = createService();

      await expect(service.push()).rejects.toThrow("Push failed");
    });

    describe("applyPushResults — created/accepted", () => {
      it("should clear needsSync and set revision when version is unchanged", async () => {
        const task = makeTask({ id: "t1", version: 3, needsSync: true });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        // version same as when sent
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
          ...task,
          version: 3,
        });
        mockApiClient = createMockApiClient({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 7),
            ),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", needsSync: false, revision: 7 }),
        );
      });

      it("should keep needsSync and set revision when version changed during push", async () => {
        const task = makeTask({ id: "t1", version: 3, needsSync: true });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        // version has bumped since sending
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
          ...task,
          version: 4,
        });
        mockApiClient = createMockApiClient({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse(
                { tasks: [{ id: "t1", status: "accepted" }] },
                8,
              ),
            ),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", needsSync: true, revision: 8 }),
        );
      });
    });

    describe("applyPushResults — conflict", () => {
      it("should overwrite local record with server_record and clear needsSync", async () => {
        const task = makeTask({ id: "t1", needsSync: true });
        const serverTask = makeTask({
          id: "t1",
          name: "Server version",
          revision: 9,
          needsSync: false,
        });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
          task,
        );
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(
            makePushResponse({
              tasks: [
                { id: "t1", status: "conflict", server_record: serverTask },
              ],
            }),
          ),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "t1",
            name: "Server version",
            needsSync: false,
          }),
        );
      });

      it("should apply goal conflict server_record", async () => {
        const goal = makeGoal({ id: "g1", needsSync: true });
        const serverGoal = makeGoal({
          id: "g1",
          name: "Server Goal",
          revision: 3,
          needsSync: false,
        });
        (goalRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [goal],
        );
        (goalRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
          goal,
        );
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(
            makePushResponse({
              goals: [
                { id: "g1", status: "conflict", server_record: serverGoal },
              ],
            }),
          ),
        });
        const service = createService();

        await service.push();

        expect(goalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "g1",
            name: "Server Goal",
            needsSync: false,
          }),
        );
      });
    });

    describe("last_known_revision update after push", () => {
      it("should update last_known_revision using response.revision (top-level)", async () => {
        const task = makeTask({ id: "t1" });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
          task,
        );
        mockApiClient = createMockApiClient({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse(
                { tasks: [{ id: "t1", status: "created" }] },
                20,
              ),
            ),
        });
        const service = createService();

        await service.push();

        expect(syncMetaRepository.setValue).toHaveBeenCalledWith(
          SYNC_META_KEYS.LAST_KNOWN_REVISION,
          20,
        );
      });

      it("should not update last_known_revision if push response has no top-level revision (all conflict)", async () => {
        const task = makeTask({ id: "t1" });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
          task,
        );
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(
            makePushResponse({
              tasks: [{ id: "t1", status: "conflict", server_record: task }],
            }),
          ),
        });
        const service = createService();

        await service.push();

        expect(syncMetaRepository.setValue).not.toHaveBeenCalled();
      });
    });

    describe("applyPushResults — edge cases", () => {
      it("should skip update when getById returns undefined for created/accepted record", async () => {
        const task = makeTask({ id: "t1", needsSync: true });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(
          undefined,
        );
        mockApiClient = createMockApiClient({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 5),
            ),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).not.toHaveBeenCalled();
      });

      it("should not enter conflict branch for created record even if server_record is present", async () => {
        const task = makeTask({ id: "t1", version: 3, needsSync: true });
        const serverTask = makeTask({ id: "t1", name: "Server Version" });
        (taskRepository.getNeedingSync as ReturnType<typeof vi.fn>).mockResolvedValue(
          [task],
        );
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
          ...task,
          version: 3,
        });
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(
            makePushResponse(
              {
                tasks: [
                  { id: "t1", status: "created", server_record: serverTask },
                ],
              },
              5,
            ),
          ),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ revision: 5, needsSync: false }),
        );
        expect(taskRepository.update).not.toHaveBeenCalledWith(
          expect.objectContaining({ name: "Server Version" }),
        );
      });
    });
  });

  describe("resetAndPull", () => {
    it("should reset last_known_revision to 0 before pulling", async () => {
      const service = createService();

      await service.resetAndPull();

      expect(syncMetaRepository.setValue).toHaveBeenCalledWith(
        SYNC_META_KEYS.LAST_KNOWN_REVISION,
        0,
      );
    });

    it("should call pull during resetAndPull", async () => {
      const service = createService();

      await service.resetAndPull();

      expect(mockApiClient.pull).toHaveBeenCalled();
    });

    it("should mark all tasks as needsSync: false in db", async () => {
      const taskId = crypto.randomUUID();
      await db.tasks.put({
        id: taskId,
        name: "Task",
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
        created_at: "",
        updated_at: "",
        version: 1,
        revision: 1,
        needsSync: true,
      });
      const service = createService();

      await service.resetAndPull();

      const task = await db.tasks.get(taskId);
      expect(task!.needsSync).toBe(false);
    });

    it("should mark all goals as needsSync: false in db", async () => {
      const goalId = crypto.randomUUID();
      await db.goals.put({
        id: goalId,
        name: "Goal",
        description: "",
        cover_file_id: "",
        status: "planning",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 1,
        revision: 1,
        needsSync: true,
      });
      const service = createService();

      await service.resetAndPull();

      const goal = await db.goals.get(goalId);
      expect(goal!.needsSync).toBe(false);
    });

    it("should mark all contexts as needsSync: false in db", async () => {
      const contextId = crypto.randomUUID();
      await db.contexts.put({
        id: contextId,
        name: "Home",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 1,
        revision: 1,
        needsSync: true,
      });
      const service = createService();

      await service.resetAndPull();

      const context = await db.contexts.get(contextId);
      expect(context!.needsSync).toBe(false);
    });

    it("should mark all categories as needsSync: false in db", async () => {
      const categoryId = crypto.randomUUID();
      await db.categories.put({
        id: categoryId,
        name: "Work",
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 1,
        revision: 1,
        needsSync: true,
      });
      const service = createService();

      await service.resetAndPull();

      const category = await db.categories.get(categoryId);
      expect(category!.needsSync).toBe(false);
    });

    it("should mark all checklist_items as needsSync: false in db", async () => {
      const itemId = crypto.randomUUID();
      const taskId = crypto.randomUUID();
      await db.checklist_items.put({
        id: itemId,
        task_id: taskId,
        name: "Item",
        is_completed: false,
        sort_order: 0,
        is_deleted: false,
        created_at: "",
        updated_at: "",
        version: 1,
        revision: 1,
        needsSync: true,
      });
      const service = createService();

      await service.resetAndPull();

      const item = await db.checklist_items.get(itemId);
      expect(item!.needsSync).toBe(false);
    });

    it("should mark all settings as needsSync: false in db", async () => {
      await db.settings.put({
        key: "accent_color",
        value: "green",
        updated_at: "",
        needsSync: true,
      });
      const service = createService();

      await service.resetAndPull();

      const setting = await db.settings.get("accent_color");
      expect(setting!.needsSync).toBe(false);
    });
  });

  describe("mutex (withLock)", () => {
    it("should serialize concurrent pull calls", async () => {
      const callOrder: string[] = [];
      let resolveFirst!: () => void;

      (mockApiClient.pull as ReturnType<typeof vi.fn>)
        .mockImplementationOnce(async () => {
          callOrder.push("pull1-start");
          await new Promise<void>((resolve) => {
            resolveFirst = resolve;
          });
          callOrder.push("pull1-end");
          return makePullResponse({ current_revision: 1, server_time: "" });
        })
        .mockImplementationOnce(async () => {
          callOrder.push("pull2-start");
          return makePullResponse({ current_revision: 2, server_time: "" });
        });

      const service = createService();

      const p1 = service.pull();
      const p2 = service.pull();

      // Let the first pull get to the awaiting state
      await Promise.resolve();
      await Promise.resolve();
      resolveFirst();
      await Promise.all([p1, p2]);

      expect(callOrder).toEqual(["pull1-start", "pull1-end", "pull2-start"]);
    });
  });
});
