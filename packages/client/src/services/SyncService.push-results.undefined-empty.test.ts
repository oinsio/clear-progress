import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("SyncService — push results > undefined results for entity types", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

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
        context.contextRepository = withNeedingSync(context.contextRepository, [
          makeContext({ id: "ctx1", name: "Home", sort_order: "0" }),
        ]);
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

describe("SyncService — push results > empty array results", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

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
    asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([setting]);
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
    asMock(ctx.settingsRepository.getNeedingSync).mockResolvedValue([setting]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse({})),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.settingsRepository.clearNeedsSyncByKey).not.toHaveBeenCalled();
  });
});
