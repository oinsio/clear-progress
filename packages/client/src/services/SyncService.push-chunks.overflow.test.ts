import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUSH_CHUNK_SIZE } from "@/constants";
import { db } from "@/db/database";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  asMock,
  createMockSyncAdapter,
  createService,
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

describe("SyncService — push chunks — overflow and ordering", () => {
  let ctx: SyncTestContext;

  beforeEach(async () => {
    ctx = setupSyncTestContext();
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({}, 10)),
    });
    await db.tasks.clear();
    await db.checklist_items.clear();
    await db.tasks.put(makeTask({ id: "t0", needsSync: false }));
    await db.tasks.put(makeTask({ id: "task-id", needsSync: false }));
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

  async function setupTasksAndGoalsThenPush(
    taskCount: number,
    goalCount: number,
  ) {
    const tasks = Array.from({ length: taskCount }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    const goals = Array.from({ length: goalCount }, (_, i) =>
      makeGoal({ id: `goal-${i}` }),
    );
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, tasks);
    ctx.goalRepository = withNeedingSync(ctx.goalRepository, goals);
    const service = createService(ctx);

    await service.push();

    return asMock(ctx.mockSyncAdapter.push).mock.calls;
  }

  it("should fill goals before tasks and split tasks across chunks", async () => {
    const pushCalls = await setupTasksAndGoalsThenPush(PUSH_CHUNK_SIZE - 1, 5);

    expect(pushCalls).toHaveLength(2);
    expect(pushCalls[0][0].goals).toHaveLength(5);
    expect(pushCalls[0][0].tasks).toHaveLength(PUSH_CHUNK_SIZE - 5);
    expect(pushCalls[1][0].goals).toHaveLength(0);
    expect(pushCalls[1][0].tasks).toHaveLength(4);
  });

  it("should place all goals in first chunk and split remaining tasks", async () => {
    const pushCalls = await setupTasksAndGoalsThenPush(190, 20);

    expect(pushCalls).toHaveLength(2);
    expect(pushCalls[0][0].goals).toHaveLength(20);
    expect(pushCalls[0][0].tasks).toHaveLength(180);
    expect(pushCalls[1][0].tasks).toHaveLength(10);
  });

  it("should not exceed PUSH_CHUNK_SIZE in any chunk with many mixed entities", async () => {
    const tasks = Array.from({ length: 150 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    const goals = Array.from({ length: 100 }, (_, i) =>
      makeGoal({ id: `goal-${i}` }),
    );
    const contexts = Array.from({ length: 60 }, (_, i) =>
      makeContext({ id: `ctx-${i}`, name: `Context ${i}`, sort_order: i }),
    );
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, tasks);
    ctx.goalRepository = withNeedingSync(ctx.goalRepository, goals);
    ctx.contextRepository = withNeedingSync(ctx.contextRepository, contexts);
    const service = createService(ctx);

    await service.push();

    const pushCalls = asMock(ctx.mockSyncAdapter.push).mock.calls;
    for (const [payload] of pushCalls) {
      const totalInChunk =
        payload.tasks.length +
        payload.goals.length +
        payload.contexts.length +
        payload.categories.length +
        payload.checklist_items.length +
        payload.ideas.length +
        payload.settings.length;
      expect(totalInChunk).toBeLessThanOrEqual(PUSH_CHUNK_SIZE);
    }
  });

  // implements NFR-R2 of remove-version-field
  it.each([
    {
      description: "extra contexts overflow into second chunk",
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
      description: "contexts and categories together exceed chunk size",
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
      description: "extra checklist_items push tasks into second chunk",
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
      description: "extra ideas push tasks into second chunk",
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
      description: "settings overflow into second chunk",
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
      description: "ideas and settings together exceed chunk size",
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
    setupOverrides();
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledTimes(2);
  });

  it("should split settings into second chunk when checklist_items reduce remaining space", async () => {
    const tasks = Array.from({ length: 198 }, (_, i) =>
      makeTask({ id: `task-${i}` }),
    );
    ctx.taskRepository = withNeedingSync(ctx.taskRepository, tasks);
    ctx.checklistRepository = withNeedingSync(ctx.checklistRepository, [
      makeChecklistItem({ id: "ci-space", task_id: "t0", name: "Item" }),
    ]);
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
    const service = createService(ctx);

    await service.push();

    const pushCalls = asMock(ctx.mockSyncAdapter.push).mock.calls;
    expect(pushCalls).toHaveLength(2);

    const firstChunkSettings = pushCalls[0][0].settings;
    const secondChunkSettings = pushCalls[1][0].settings;
    expect(firstChunkSettings.length + secondChunkSettings.length).toBe(2);
    expect(secondChunkSettings.length).toBeGreaterThan(0);
  });
});
