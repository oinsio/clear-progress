import { beforeEach, describe, expect, it, vi } from "vitest";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  ENTITY_TEST_CASES,
  makeCategory,
  makeChecklistItem,
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

describe("SyncService — push chunks", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  function setupBaselineEntities() {
    ctx.taskRepository = withNeedingSync(
      ctx.taskRepository,
      Array.from({ length: 100 }, (_, i) => makeTask({ id: `task-${i}` })),
    );
    ctx.goalRepository = withNeedingSync(
      ctx.goalRepository,
      Array.from({ length: 50 }, (_, i) => makeGoal({ id: `goal-${i}` })),
    );
    ctx.contextRepository = withNeedingSync(
      ctx.contextRepository,
      Array.from({ length: 49 }, (_, i) =>
        makeContext({ id: `ctx-${i}`, name: `Context ${i}`, sort_order: i }),
      ),
    );
  }

  function setup200Tasks() {
    const tasks = Array.from({ length: 200 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    ctx.taskRepository = withGetById(
      withNeedingSync(ctx.taskRepository, tasks),
      tasks,
    );
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({}, 10)),
    });
  }

  it("should call apiClient.push twice when total records exceed chunk size", async () => {
    const tasks = Array.from({ length: 201 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    ctx.taskRepository = withGetById(
      withNeedingSync(ctx.taskRepository, tasks),
      tasks,
    );
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({}, 10)),
    });
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

  it("should preserve revision from first chunk when second chunk has no revision", async () => {
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

    expect(ctx.syncMetaRepository.setValue).toHaveBeenCalledWith(
      "last_known_revision",
      10,
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
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({}, 20)),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(2);
  });

  it.each(
    ENTITY_TEST_CASES.map((testCase) => ({
      entityName: testCase.entityName,
      payloadKey: testCase.payloadKey,
      setupEntity: () => testCase.setupRepo(ctx, [testCase.makeEntity()]),
      expectedIdOrKey: testCase.expectedIdOrKey,
    })),
  )("should send $entityName in second chunk when 200 tasks fill first chunk", async ({
    payloadKey,
    setupEntity,
    expectedIdOrKey,
  }) => {
    setup200Tasks();
    setupEntity();
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

  // implements NFR-R2 of remove-version-field
  it.each([
    {
      description: "goals push contexts into second chunk",
      setupOverrides: () => {
        ctx.contextRepository = withNeedingSync(
          ctx.contextRepository,
          Array.from({ length: 51 }, (_, i) =>
            makeContext({
              id: `ctx-${i}`,
              name: `Context ${i}`,
              sort_order: i,
            }),
          ),
        );
      },
    },
    {
      description: "contexts push categories into second chunk",
      setupOverrides: () => {
        ctx.contextRepository = withNeedingSync(
          ctx.contextRepository,
          Array.from({ length: 50 }, (_, i) =>
            makeContext({
              id: `ctx-${i}`,
              name: `Context ${i}`,
              sort_order: i,
            }),
          ),
        );
        ctx.categoryRepository = withNeedingSync(ctx.categoryRepository, [
          makeCategory({ id: "cat1", name: "Work" }),
        ]);
      },
    },
    {
      description: "many categories overflow into second chunk",
      setupOverrides: () => {
        ctx.categoryRepository = withNeedingSync(
          ctx.categoryRepository,
          Array.from({ length: 100 }, (_, i) =>
            makeCategory({
              id: `cat-${i}`,
              name: `Category ${i}`,
              sort_order: i,
            }),
          ),
        );
      },
    },
    {
      description: "categories push checklist_items into second chunk",
      setupOverrides: () => {
        ctx.categoryRepository = withNeedingSync(ctx.categoryRepository, [
          makeCategory({ id: "cat1", name: "Work" }),
        ]);
        ctx.checklistRepository = withNeedingSync(ctx.checklistRepository, [
          makeChecklistItem({ id: "ci1", task_id: "t0", name: "Item" }),
        ]);
      },
    },
    {
      description: "many checklist_items overflow into second chunk",
      setupOverrides: () => {
        ctx.checklistRepository = withNeedingSync(
          ctx.checklistRepository,
          Array.from({ length: 100 }, (_, i) =>
            makeChecklistItem({
              id: `ci-${i}`,
              name: `Item ${i}`,
              sort_order: i,
            }),
          ),
        );
      },
    },
    {
      description: "checklist_items push ideas into second chunk",
      setupOverrides: () => {
        ctx.checklistRepository = withNeedingSync(ctx.checklistRepository, [
          makeChecklistItem({ id: "ci1", task_id: "t0", name: "Item" }),
        ]);
        ctx.ideaRepository = withNeedingSync(ctx.ideaRepository, [makeIdea()]);
      },
    },
    {
      description: "many ideas overflow into second chunk",
      setupOverrides: () => {
        ctx.ideaRepository = withNeedingSync(
          ctx.ideaRepository,
          Array.from({ length: 100 }, (_, i) => makeIdea({ id: `idea-${i}` })),
        );
      },
    },
    {
      description: "ideas push settings into second chunk",
      setupOverrides: () => {
        ctx.settingsRepository = withNeedingSync(ctx.settingsRepository, [
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
        ]);
      },
    },
    {
      description:
        "ideas assignment undercounts allowing settings into second chunk",
      setupOverrides: () => {
        ctx.ideaRepository = withNeedingSync(ctx.ideaRepository, [makeIdea()]);
        ctx.settingsRepository = withNeedingSync(ctx.settingsRepository, [
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
        ]);
      },
    },
  ])("should produce 2 chunks when $description", async ({
    setupOverrides,
  }) => {
    setupBaselineEntities();
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({}, 10)),
    });
    setupOverrides();
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(2);
  });
});
