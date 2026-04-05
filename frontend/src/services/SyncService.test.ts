import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncService } from "./SyncService";
import type { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import type { Task, Goal } from "@/types/entities";
import type { PullResponse, PushResponse, PushResponseData } from "@/types/api";
import { LOCAL_COVER_ID_PREFIX, SYNC_META_KEYS } from "@/constants";

function makePullResponse(overrides: Partial<PullResponse> = {}): PullResponse {
  return {
    ok: true,
    data: {
      tasks: [],
      goals: [],
      contexts: [],
      categories: [],
      checklist_items: [],
    },
    settings: [],
    current_revision: 10,
    server_time: "2026-03-04T11:00:00.000Z",
    ...overrides,
  };
}

function makePushResponse(resultOverrides: PushResponseData = {}): PushResponse {
  return {
    ok: true,
    results: {
      tasks: [],
      goals: [],
      contexts: [],
      categories: [],
      checklist_items: [],
      settings: [],
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
    title: "Test Task",
    notes: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    revision: 0,
    _dirty: true,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-id",
    title: "Test Goal",
    description: "",
    cover_file_id: "",
    status: "in_progress",
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    revision: 0,
    _dirty: true,
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
  let settingsRepository: SettingsRepository;
  let syncMetaRepository: SyncMetaRepository;

  beforeEach(() => {
    mockApiClient = createMockApiClient();

    taskRepository = {
      getDirty: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as TaskRepository;

    goalRepository = {
      getDirty: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as GoalRepository;

    contextRepository = {
      getDirty: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as ContextRepository;

    categoryRepository = {
      getDirty: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as CategoryRepository;

    checklistRepository = {
      getDirty: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      applyServerRecords: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChecklistRepository;

    settingsRepository = {
      getDirty: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
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
      settingsRepository,
    );
  }

  describe("pull", () => {
    it("should read last_known_revision from sync_meta", async () => {
      (syncMetaRepository.getValue as ReturnType<typeof vi.fn>).mockResolvedValue(42);
      const service = createService();

      await service.pull();

      expect(syncMetaRepository.getValue).toHaveBeenCalledWith(SYNC_META_KEYS.LAST_KNOWN_REVISION);
    });

    it("should send since_revision from sync_meta to apiClient.pull", async () => {
      (syncMetaRepository.getValue as ReturnType<typeof vi.fn>).mockResolvedValue(42);
      const service = createService();

      await service.pull();

      expect(mockApiClient.pull).toHaveBeenCalledWith({ since_revision: 42 });
    });

    it("should call applyServerRecords on all entity repositories", async () => {
      const serverTasks = [makeTask({ _dirty: false })];
      mockApiClient = createMockApiClient({
        pull: vi.fn().mockResolvedValue(makePullResponse({ data: { tasks: serverTasks, goals: [], contexts: [], categories: [], checklist_items: [] }, current_revision: 5 })),
      });
      const service = createService();

      await service.pull();

      expect(taskRepository.applyServerRecords).toHaveBeenCalledWith(serverTasks);
      expect(goalRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(contextRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(categoryRepository.applyServerRecords).toHaveBeenCalledWith([]);
      expect(checklistRepository.applyServerRecords).toHaveBeenCalledWith([]);
    });

    it("should call settingsRepository.bulkUpsert with server settings", async () => {
      const serverSettings = [{ key: "default_box", value: "inbox", updated_at: "2026-03-04T10:00:00.000Z", _dirty: false }];
      mockApiClient = createMockApiClient({
        pull: vi.fn().mockResolvedValue(makePullResponse({ settings: serverSettings, current_revision: 5 })),
      });
      const service = createService();

      await service.pull();

      expect(settingsRepository.bulkUpsert).toHaveBeenCalledWith(serverSettings);
    });

    it("should save current_revision to sync_meta after pull", async () => {
      mockApiClient = createMockApiClient({
        pull: vi.fn().mockResolvedValue(makePullResponse({ current_revision: 55 })),
      });
      const service = createService();

      await service.pull();

      expect(syncMetaRepository.setValue).toHaveBeenCalledWith(SYNC_META_KEYS.LAST_KNOWN_REVISION, 55);
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
    it("should call getDirty on all repositories", async () => {
      const dirtyTask = makeTask();
      (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([dirtyTask]);
      (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(dirtyTask);
      const service = createService();

      await service.push();

      expect(taskRepository.getDirty).toHaveBeenCalledOnce();
      expect(goalRepository.getDirty).toHaveBeenCalledOnce();
      expect(contextRepository.getDirty).toHaveBeenCalledOnce();
      expect(categoryRepository.getDirty).toHaveBeenCalledOnce();
      expect(checklistRepository.getDirty).toHaveBeenCalledOnce();
      expect(settingsRepository.getDirty).toHaveBeenCalledOnce();
    });

    it("should not call apiClient.push when no dirty records exist", async () => {
      const service = createService();

      await service.push();

      expect(mockApiClient.push).not.toHaveBeenCalled();
    });

    it("should strip _dirty from records before sending to apiClient", async () => {
      const dirtyTask = makeTask({ _dirty: true });
      (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([dirtyTask]);
      (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(dirtyTask);
      const service = createService();

      await service.push();

      const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(pushCall.changes.tasks[0]._dirty).toBeUndefined();
    });

    it.each([
      ["strips local cover_file_id", `${LOCAL_COVER_ID_PREFIX}local-uuid`, ""],
      ["keeps remote cover_file_id", "remote-file-id", "remote-file-id"],
    ])("should %s before sending goal to server", async (_, cover_file_id, expected) => {
      const dirtyGoal = makeGoal({ cover_file_id, _dirty: true });
      (goalRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([dirtyGoal]);
      (goalRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(dirtyGoal);
      const service = createService();

      await service.push();

      const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(pushCall.changes.goals[0].cover_file_id).toBe(expected);
    });

    it("should throw if push response is not ok", async () => {
      const dirtyTask = makeTask();
      (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([dirtyTask]);
      mockApiClient = createMockApiClient({
        push: vi.fn().mockResolvedValue({ ok: false, results: {} }),
      });
      const service = createService();

      await expect(service.push()).rejects.toThrow("Push failed");
    });

    describe("applyPushResults — created/accepted", () => {
      it("should clear _dirty and set revision when version is unchanged", async () => {
        const task = makeTask({ id: "t1", version: 3, _dirty: true });
        (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([task]);
        // version same as when sent
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...task, version: 3 });
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(makePushResponse({ tasks: [{ id: "t1", status: "created", revision: 7 }] })),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", _dirty: false, revision: 7 }),
        );
      });

      it("should keep _dirty and set revision when version changed during push", async () => {
        const task = makeTask({ id: "t1", version: 3, _dirty: true });
        (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([task]);
        // version has bumped since sending
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...task, version: 4 });
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(makePushResponse({ tasks: [{ id: "t1", status: "accepted", revision: 8 }] })),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", _dirty: true, revision: 8 }),
        );
      });
    });

    describe("applyPushResults — conflict", () => {
      it("should overwrite local record with server_record and clear _dirty", async () => {
        const task = makeTask({ id: "t1", _dirty: true });
        const serverTask = makeTask({ id: "t1", title: "Server version", revision: 9, _dirty: false });
        (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([task]);
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(task);
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(makePushResponse({ tasks: [{ id: "t1", status: "conflict", server_record: serverTask }] })),
        });
        const service = createService();

        await service.push();

        expect(taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", title: "Server version", _dirty: false }),
        );
      });

      it("should apply goal conflict server_record", async () => {
        const goal = makeGoal({ id: "g1", _dirty: true });
        const serverGoal = makeGoal({ id: "g1", title: "Server Goal", revision: 3, _dirty: false });
        (goalRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([goal]);
        (goalRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(goal);
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(makePushResponse({ goals: [{ id: "g1", status: "conflict", server_record: serverGoal }] })),
        });
        const service = createService();

        await service.push();

        expect(goalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "g1", title: "Server Goal", _dirty: false }),
        );
      });
    });

    describe("last_known_revision update after push", () => {
      it("should update last_known_revision if push response contains higher revision", async () => {
        const task = makeTask({ id: "t1" });
        (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([task]);
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(task);
        (syncMetaRepository.getValue as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(5) // first call: last_known_revision
          .mockResolvedValueOnce(5); // second call: current value check
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(makePushResponse({ tasks: [{ id: "t1", status: "created", revision: 20 }] })),
        });
        const service = createService();

        await service.push();

        expect(syncMetaRepository.setValue).toHaveBeenCalledWith(SYNC_META_KEYS.LAST_KNOWN_REVISION, 20);
      });

      it("should not update last_known_revision if push response has no revisions", async () => {
        const task = makeTask({ id: "t1" });
        (taskRepository.getDirty as ReturnType<typeof vi.fn>).mockResolvedValue([task]);
        (taskRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(task);
        mockApiClient = createMockApiClient({
          push: vi.fn().mockResolvedValue(makePushResponse({ tasks: [{ id: "t1", status: "conflict", server_record: task }] })),
        });
        const service = createService();

        await service.push();

        expect(syncMetaRepository.setValue).not.toHaveBeenCalled();
      });
    });
  });

  describe("mutex (withLock)", () => {
    it("should serialize concurrent pull calls", async () => {
      const callOrder: string[] = [];
      let resolveFirst!: () => void;

      (mockApiClient.pull as ReturnType<typeof vi.fn>)
        .mockImplementationOnce(async () => {
          callOrder.push("pull1-start");
          await new Promise<void>((resolve) => { resolveFirst = resolve; });
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
