import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";
import {
  asMock,
  createMockSyncAdapter,
  createService,
  ENTITY_TEST_CASES,
  getPushCallArg,
  makeGoal,
  makeTask,
  type SyncTestContext,
  setupEmptyRepositories,
  setupEntityForPush,
  setupSyncTestContext,
  withGetAll,
  withGetById,
} from "./SyncService.test-helpers";

describe("SyncService — push basics", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  it("should call getNeedingSync on all repositories", async () => {
    const needsSyncTask = makeTask();
    setupEntityForPush(ctx, "task", needsSyncTask);
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.getNeedingSync).toHaveBeenCalledOnce();
    expect(ctx.goalRepository.getNeedingSync).toHaveBeenCalledOnce();
    expect(ctx.contextRepository.getNeedingSync).toHaveBeenCalledOnce();
    expect(ctx.categoryRepository.getNeedingSync).toHaveBeenCalledOnce();
    expect(ctx.checklistRepository.getNeedingSync).toHaveBeenCalledOnce();
    expect(ctx.settingsRepository.getNeedingSync).toHaveBeenCalledOnce();
  });

  // implements FR1 of spec-sync-protocol
  it("should collect all records when force = true", async () => {
    const allTasks = [
      makeTask({ id: "t1", needsSync: true }),
      makeTask({ id: "t2", needsSync: false }),
    ];
    const allGoals = [
      makeGoal({ id: "g1", needsSync: true }),
      makeGoal({ id: "g2", needsSync: false }),
    ];
    setupEmptyRepositories(ctx);
    ctx.taskRepository = withGetById(
      withGetAll(ctx.taskRepository, allTasks),
      allTasks,
    );
    ctx.goalRepository = withGetById(
      withGetAll(ctx.goalRepository, allGoals),
      allGoals,
    );
    const service = createService(ctx);

    await service.push(true);

    expect(ctx.taskRepository.getAll).toHaveBeenCalled();
    expect(ctx.taskRepository.getNeedingSync).not.toHaveBeenCalled();
    expect(ctx.goalRepository.getAll).toHaveBeenCalled();
    expect(ctx.goalRepository.getNeedingSync).not.toHaveBeenCalled();
    const pushCall = getPushCallArg(ctx.mockSyncAdapter);
    expect(pushCall.tasks).toHaveLength(2);
    expect(pushCall.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "t1" }),
        expect.objectContaining({ id: "t2" }),
      ]),
    );
    expect(pushCall.goals).toHaveLength(2);
    expect(pushCall.goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "g1" }),
        expect.objectContaining({ id: "g2" }),
      ]),
    );
  });

  it("should not call apiClient.push when no needsSync records exist", async () => {
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).not.toHaveBeenCalled();
  });

  it("should strip needsSync from records before sending to apiClient", async () => {
    const needsSyncTask = makeTask({ needsSync: true });
    setupEntityForPush(ctx, "task", needsSyncTask);
    const service = createService(ctx);

    await service.push();

    const pushCall = getPushCallArg(ctx.mockSyncAdapter);
    expect(pushCall.tasks[0].needsSync).toBeUndefined();
  });

  it.each([
    ["strips local cover_file_id", `${LOCAL_COVER_ID_PREFIX}local-uuid`, ""],
    ["keeps remote cover_file_id", "remote-file-id", "remote-file-id"],
  ])("should %s before sending goal to server", async (_, cover_file_id, expected) => {
    const needsSyncGoal = makeGoal({ cover_file_id, needsSync: true });
    setupEntityForPush(ctx, "goal", needsSyncGoal);
    const service = createService(ctx);

    await service.push();

    const pushCall = getPushCallArg(ctx.mockSyncAdapter);
    expect(pushCall.goals[0].cover_file_id).toBe(expected);
  });

  // implements FR6 of spec-sync-protocol
  it("should include soft-deleted records in push", async () => {
    const deletedTask = makeTask({
      id: "t1",
      is_deleted: true,
      needsSync: true,
    });
    setupEntityForPush(ctx, "task", deletedTask);
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks: expect.arrayContaining([
          expect.objectContaining({ id: "t1", is_deleted: true }),
        ]),
      }),
    );
  });

  it.each(
    ENTITY_TEST_CASES.map((testCase) => ({
      entityName: testCase.payloadKey,
      setup: testCase.setupRepo,
      makeEntity: testCase.makeEntity,
    })),
  )("should send push when only $entityName are needsSync", async ({
    setup,
    makeEntity,
  }) => {
    setup(ctx, [makeEntity()]);
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalled();
  });

  it("should throw if push response is not ok", async () => {
    const needsSyncTask = makeTask();
    asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([
      needsSyncTask,
    ]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue({ ok: false, results: {} }),
    });
    const service = createService(ctx);

    await expect(service.push()).rejects.toThrow("Push failed");
  });
});
