import type { PushResponse } from "@clear-progress/contract";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUSH_RESULT_STATUS, SYNC_META_KEYS } from "@/constants";
import {
  asMock,
  type createEntityRepoMock,
  createMockSyncAdapter,
  createService,
  ENTITY_TEST_CASES_WITH_REVISION,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeIdea,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
  withNeedingSync,
} from "./SyncService.test-helpers";

describe("SyncService — push results", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  describe("settings", () => {
    it("should clear needsSync on settings after accepted push response", async () => {
      const setting = {
        key: "accent_color",
        value: "green",
        updated_at: "",
        needsSync: true,
      };
      asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([
        setting,
      ]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { settings: [{ key: "accent_color", status: "accepted" }] },
              5,
            ),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.settingsRepository.clearNeedsSyncByKey).toHaveBeenCalledWith([
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
      asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([
        setting,
      ]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { settings: [{ key: "default_box", status: "created" }] },
              6,
            ),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.settingsRepository.clearNeedsSyncByKey).toHaveBeenCalledWith([
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
      asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([
        setting,
      ]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            settings: [{ key: "accent_color", status: "conflict" }],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.settingsRepository.clearNeedsSyncByKey).not.toHaveBeenCalled();
    });

    it("should not call apiClient.push when settings were cleared after previous sync", async () => {
      asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([]);
      const service = createService(ctx);

      await service.push();

      expect(ctx.mockSyncAdapter.push).not.toHaveBeenCalled();
    });
  });

  it.each(
    ENTITY_TEST_CASES_WITH_REVISION,
  )("should clear needsSync for accepted $entityName using pushRevision from response", async ({
    getRepo,
    makeEntity,
    payloadKey,
    pushRevision,
  }) => {
    const entity = makeEntity() as { id: string };
    const repository = getRepo(ctx) as unknown as ReturnType<
      typeof createEntityRepoMock
    >;
    asMock(repository.getNeedingSync).mockResolvedValue([entity]);
    asMock(repository.getById).mockResolvedValue(entity);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(
        makePushResponse(
          {
            [payloadKey]: [{ id: entity.id, status: "accepted" }],
          } as PushResponse["results"],
          pushRevision,
        ),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: entity.id,
        needsSync: false,
        revision: pushRevision,
      }),
    );
  });

  describe("created/accepted", () => {
    it("should clear needsSync and set revision when updated_at is unchanged", async () => {
      const task = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        needsSync: true,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue({
        ...task,
        updated_at: "2026-01-01T10:00:00.000Z",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 7),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t1", needsSync: false, revision: 7 }),
      );
    });

    it("should keep needsSync and set revision when updated_at changed during push", async () => {
      const task = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        needsSync: true,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue({
        ...task,
        updated_at: "2026-01-01T10:00:01.000Z",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse({ tasks: [{ id: "t1", status: "accepted" }] }, 8),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t1", needsSync: true, revision: 8 }),
      );
    });
  });

  describe("conflict", () => {
    it("should not call update when status is CONFLICT but server_record is absent", async () => {
      const task = makeTask({ id: "t1", needsSync: true });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(task);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            tasks: [{ id: "t1", status: PUSH_RESULT_STATUS.CONFLICT }],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).not.toHaveBeenCalled();
    });

    it("should overwrite local record with server_record and clear needsSync", async () => {
      const task = makeTask({ id: "t1", needsSync: true });
      const serverTask = makeTask({
        id: "t1",
        name: "Server version",
        revision: 9,
        needsSync: false,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(task);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            tasks: [
              { id: "t1", status: "conflict", server_record: serverTask },
            ],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
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
      asMock(ctx.goalRepository.getNeedingSync).mockResolvedValue([goal]);
      asMock(ctx.goalRepository.getById).mockResolvedValue(goal);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            goals: [
              { id: "g1", status: "conflict", server_record: serverGoal },
            ],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.goalRepository.update).toHaveBeenCalledWith(
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
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(task);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 20),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
        SYNC_META_KEYS.LAST_KNOWN_REVISION,
        20,
      );
    });

    it("should not update last_known_revision if push response has no top-level revision (all conflict)", async () => {
      const task = makeTask({ id: "t1" });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(task);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            tasks: [{ id: "t1", status: "conflict", server_record: task }],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.syncMetaRepository.setValue).not.toHaveBeenCalled();
    });
  });

  describe("rejected and unknown statuses", () => {
    it("should not call update when task result status is REJECTED", async () => {
      const task = makeTask({ id: "t1", needsSync: true });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(task);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            tasks: [{ id: "t1", status: PUSH_RESULT_STATUS.REJECTED }],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).not.toHaveBeenCalled();
    });

    it("should not call update when task result has unknown status", async () => {
      const task = makeTask({ id: "t1", needsSync: true });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(task);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            // biome-ignore lint/suspicious/noExplicitAny: testing unknown status
            tasks: [{ id: "t1", status: "unknown_status" as any }],
          }),
        ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).not.toHaveBeenCalled();
    });

    it.each([
      { entityName: "goal", payloadKey: "goals" as const },
      { entityName: "context", payloadKey: "contexts" as const },
      { entityName: "checklist_item", payloadKey: "checklist_items" as const },
    ])("should not call update for $entityName when status is REJECTED", async ({
      payloadKey,
    }) => {
      const task = makeTask({ id: "t1", needsSync: true });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(
          makePushResponse({
            [payloadKey]: [
              { id: "entity-1", status: PUSH_RESULT_STATUS.REJECTED },
            ],
          } as PushResponse["results"]),
        ),
      });
      const service = createService(ctx);

      await service.push();

      const repoMap = {
        goals: ctx.goalRepository,
        contexts: ctx.contextRepository,
        checklist_items: ctx.checklistRepository,
      } as const;
      expect(asMock(repoMap[payloadKey].update)).not.toHaveBeenCalled();
    });
  });

  describe("sentTimestamps fallback", () => {
    it("should set needsSync=true when push result id is absent from sentTimestamps", async () => {
      // Push task "t1", but server returns result for "server-id" (not in sentTimestamps).
      // sentTimestamps.get("server-id") returns undefined → fallback "" → timestampUnchanged = false → needsSync = true.
      const pushedTask = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        needsSync: true,
      });
      const serverAssignedTask = makeTask({
        id: "server-id",
        updated_at: "2026-01-01T10:00:00.000Z",
        needsSync: false,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([pushedTask]);
      asMock(ctx.taskRepository.getById).mockImplementation((id: string) =>
        Promise.resolve(id === "server-id" ? serverAssignedTask : undefined),
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { tasks: [{ id: "server-id", status: "accepted" }] },
              5,
            ),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "server-id", needsSync: true }),
      );
    });
  });

  describe("edge cases", () => {
    it("should skip update when getById returns undefined for created/accepted record", async () => {
      const task = makeTask({ id: "t1", needsSync: true });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue(undefined);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 5),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).not.toHaveBeenCalled();
    });

    it("should not enter conflict branch for created record even if server_record is present", async () => {
      const task = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        needsSync: true,
      });
      const serverTask = makeTask({ id: "t1", name: "Server Version" });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      asMock(ctx.taskRepository.getById).mockResolvedValue({
        ...task,
        updated_at: "2026-01-01T10:00:00.000Z",
      });
      ctx.mockSyncAdapter = createMockSyncAdapter({
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
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ revision: 5, needsSync: false }),
      );
      expect(ctx.taskRepository.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: "Server Version" }),
      );
    });
  });

  it("should send push when only ideas are needsSync", async () => {
    const idea = makeIdea({ id: "i1" });
    asMock(ctx.ideaRepository.getNeedingSync).mockResolvedValue([idea]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse()),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalled();
  });

  describe("undefined results for entity types", () => {
    it("should not throw when push response has no results for any entity type", async () => {
      const task = makeTask({ id: "t1" });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue({
          ok: true,
          revision: 1,
          results: {},
          server_time: "2026-01-01T00:00:00.000Z",
        }),
      });
      const service = createService(ctx);

      await expect(service.push()).resolves.not.toThrow();
    });

    it("should not call update when tasks result is undefined in push response", async () => {
      const task = makeTask({ id: "t1" });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(makePushResponse({})),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).not.toHaveBeenCalled();
    });

    it.each([
      {
        entityName: "tasks",
        setupRepo: (context: SyncTestContext) => {
          context.taskRepository = withNeedingSync(context.taskRepository, [
            makeTask({ id: "t1" }),
          ]);
        },
        getUpdateMock: (context: SyncTestContext) =>
          asMock(context.taskRepository.update),
      },
      {
        entityName: "goals",
        setupRepo: (context: SyncTestContext) => {
          context.goalRepository = withNeedingSync(context.goalRepository, [
            makeGoal({ id: "g1" }),
          ]);
        },
        getUpdateMock: (context: SyncTestContext) =>
          asMock(context.goalRepository.update),
      },
      {
        entityName: "contexts",
        setupRepo: (context: SyncTestContext) => {
          context.contextRepository = withNeedingSync(
            context.contextRepository,
            [makeContext({ id: "ctx1", name: "Home", sort_order: 0 })],
          );
        },
        getUpdateMock: (context: SyncTestContext) =>
          asMock(context.contextRepository.update),
      },
      {
        entityName: "categories",
        setupRepo: (context: SyncTestContext) => {
          context.categoryRepository = withNeedingSync(
            context.categoryRepository,
            [makeCategory({ id: "cat1", name: "Work" })],
          );
        },
        getUpdateMock: (context: SyncTestContext) =>
          asMock(context.categoryRepository.update),
      },
      {
        entityName: "checklist_items",
        setupRepo: (context: SyncTestContext) => {
          context.checklistRepository = withNeedingSync(
            context.checklistRepository,
            [makeChecklistItem({ id: "ci1", task_id: "t1", name: "Item" })],
          );
        },
        getUpdateMock: (context: SyncTestContext) =>
          asMock(context.checklistRepository.update),
      },
      {
        entityName: "ideas",
        setupRepo: (context: SyncTestContext) => {
          context.ideaRepository = withNeedingSync(context.ideaRepository, [
            makeIdea({ id: "i1" }),
          ]);
        },
        getUpdateMock: (context: SyncTestContext) =>
          asMock(context.ideaRepository.update),
      },
    ])("should not call update for $entityName when result is undefined in push response", async ({
      setupRepo,
      getUpdateMock,
    }) => {
      setupRepo(ctx);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(makePushResponse({})),
      });
      const service = createService(ctx);

      await service.push();

      expect(getUpdateMock(ctx)).not.toHaveBeenCalled();
    });
  });

  describe("empty array results", () => {
    it("should not call update for tasks when results.tasks is empty array", async () => {
      const task = makeTask({ id: "t1" });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([task]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(makePushResponse({ tasks: [] })),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).not.toHaveBeenCalled();
    });

    it("should not call clearNeedsSyncByKey when settings results is empty array", async () => {
      const setting = {
        key: "theme",
        value: "dark",
        updated_at: "",
        needsSync: true,
      };
      asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([
        setting,
      ]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(makePushResponse({ settings: [] })),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.settingsRepository.clearNeedsSyncByKey).not.toHaveBeenCalled();
    });

    it("should not call clearNeedsSyncByKey when settings results is undefined in push response", async () => {
      const setting = {
        key: "theme",
        value: "dark",
        updated_at: "",
        needsSync: true,
      };
      asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([
        setting,
      ]);
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi.fn().mockResolvedValue(makePushResponse({})),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.settingsRepository.clearNeedsSyncByKey).not.toHaveBeenCalled();
    });
  });
});
