import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  ENTITY_TEST_CASES,
  makeCategory,
  makeContext,
  makeGoal,
  makeIdea,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupEmptyRepositories,
  setupSyncTestContext,
  withGetById,
  withNeedingSync,
} from "./SyncService.test-helpers";

describe("SyncService — push chunks — basic", () => {
  let ctx: SyncTestContext;

  beforeEach(async () => {
    ctx = setupSyncTestContext();
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({}, 10)),
    });
    await db.tasks.clear();
    await db.checklist_items.clear();
  });

  function setup200Tasks() {
    const tasks = Array.from({ length: 200 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    ctx.taskRepository = withGetById(
      withNeedingSync(ctx.taskRepository, tasks),
      tasks,
    );
  }

  it("should call apiClient.push twice when total records exceed chunk size", async () => {
    const tasks = Array.from({ length: 201 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    ctx.taskRepository = withGetById(
      withNeedingSync(ctx.taskRepository, tasks),
      tasks,
    );
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(2);
  });

  it("should call apiClient.push once when total records equal chunk size", async () => {
    setup200Tasks();
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(1);
  });

  it("should not update last_known_revision in push (pull handles it)", async () => {
    const tasks = Array.from({ length: 201 }, (_, i) =>
      makeTask({ id: `task-${i}`, updated_at: "2026-01-01T10:00:00.000Z" }),
    );
    ctx.taskRepository = withGetById(
      withNeedingSync(ctx.taskRepository, tasks),
      tasks,
    );
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi
        .fn()
        .mockResolvedValueOnce(makePushResponse({}, 10))
        .mockResolvedValueOnce(makePushResponse({})),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.syncMetaRepository.setValue).not.toHaveBeenCalledWith(
      "last_known_revision",
      expect.anything(),
    );
  });

  it("should split mixed entity types across chunks correctly", async () => {
    const tasks = Array.from({ length: 150 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    ctx.taskRepository = withGetById(
      withNeedingSync(ctx.taskRepository, tasks),
      tasks,
    );
    const goals = Array.from({ length: 150 }, (_, i) =>
      makeGoal({ id: `goal-${i}` }),
    );
    ctx.goalRepository = withGetById(
      withNeedingSync(ctx.goalRepository, goals),
      goals,
    );
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(2);
  });

  it.each(
    ENTITY_TEST_CASES,
  )("should send $entityName in second chunk when 200 tasks fill first chunk", async ({
    payloadKey,
    setupRepo,
    makeEntity,
    expectedIdOrKey,
  }) => {
    setup200Tasks();
    await db.tasks.put(makeTask({ id: "t0", needsSync: false }));
    setupRepo(ctx, [makeEntity()]);
    const service = createService(ctx);

    await service.push();

    const pushCalls = asMock(ctx.mockSyncAdapter.push).mock.calls;
    const allEntitiesSent = pushCalls.flatMap(
      (call) =>
        (call[0] as Record<string, Array<{ id?: string; key?: string }>>)[
          payloadKey
        ] ?? [],
    );
    expect(pushCalls).toHaveLength(2);
    expect(allEntitiesSent).toHaveLength(1);
    expect(allEntitiesSent[0].id ?? allEntitiesSent[0].key).toBe(
      expectedIdOrKey,
    );
  });

  it("should call push when force=true even if no records exist", async () => {
    setupEmptyRepositories(ctx);
    const service = createService(ctx);

    await service.push(true);

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(1);
  });

  it("should include all entities in one chunk when totalCount equals PUSH_CHUNK_SIZE", async () => {
    const tasks = Array.from({ length: 100 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    const goals = Array.from({ length: 100 }, (_, i) =>
      makeGoal({ id: `goal-${i}` }),
    );
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, tasks);
    ctx.goalRepository = withNeedingSync(ctx.goalRepository, goals);
    const service = createService(ctx);

    await service.push();

    const pushCalls = asMock(ctx.mockSyncAdapter.push).mock.calls;
    expect(pushCalls).toHaveLength(1);
    expect(pushCalls[0][0].tasks).toHaveLength(100);
    expect(pushCalls[0][0].goals).toHaveLength(100);
  });

  it.each([
    {
      entityName: "goals",
      payloadKey: "goals",
      setupRepo: (context: SyncTestContext) => {
        context.goalRepository = withNeedingSync(context.goalRepository, [
          makeGoal({ id: "goal-only-1" }),
        ]);
      },
    },
    {
      entityName: "contexts",
      payloadKey: "contexts",
      setupRepo: (context: SyncTestContext) => {
        context.contextRepository = withNeedingSync(context.contextRepository, [
          makeContext({ id: "ctx-only-1", name: "Home", sort_order: 0 }),
        ]);
      },
    },
    {
      entityName: "categories",
      payloadKey: "categories",
      setupRepo: (context: SyncTestContext) => {
        context.categoryRepository = withNeedingSync(
          context.categoryRepository,
          [makeCategory({ id: "cat-only-1", name: "Work" })],
        );
      },
    },
    {
      entityName: "ideas",
      payloadKey: "ideas",
      setupRepo: (context: SyncTestContext) => {
        context.ideaRepository = withNeedingSync(context.ideaRepository, [
          makeIdea({ id: "idea-only-1" }),
        ]);
      },
    },
  ])("should send push when only $entityName need sync", async ({
    payloadKey,
    setupRepo,
  }) => {
    setupRepo(ctx);
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledOnce();
    const pushPayload = asMock(ctx.mockSyncAdapter.push).mock.calls[0][0];
    expect((pushPayload as Record<string, unknown[]>)[payloadKey]).toHaveLength(
      1,
    );
  });

  it("should accumulate chunkSize correctly across all entity types in one chunk", async () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    const goals = Array.from({ length: 5 }, (_, i) =>
      makeGoal({ id: `goal-${i}` }),
    );
    const settings = [
      {
        key: "theme",
        value: "dark",
        updated_at: toISOTimestamp(),
        needsSync: true,
      },
      {
        key: "lang",
        value: "en",
        updated_at: toISOTimestamp(),
        needsSync: true,
      },
      {
        key: "tz",
        value: "UTC",
        updated_at: toISOTimestamp(),
        needsSync: true,
      },
    ];
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, tasks);
    ctx.goalRepository = withNeedingSync(ctx.goalRepository, goals);
    ctx.settingsRepository = withNeedingSync(ctx.settingsRepository, settings);
    const service = createService(ctx);

    await service.push();

    const pushCalls = asMock(ctx.mockSyncAdapter.push).mock.calls;
    expect(pushCalls).toHaveLength(1);
    expect(pushCalls[0][0].tasks).toHaveLength(10);
    expect(pushCalls[0][0].goals).toHaveLength(5);
    expect(pushCalls[0][0].settings).toHaveLength(3);
  });
});
