import { beforeEach, describe, expect, it, vi } from "vitest";

// Skip Zod pre-validation — these tests use non-UUID IDs
vi.mock("@/services/pushPreValidator", () => ({
  preValidateRecords: (
    tasks: unknown[],
    goals: unknown[],
    contexts: unknown[],
    categories: unknown[],
    checklistItems: unknown[],
    ideas: unknown[],
    attachments: unknown[],
    settings: unknown[],
  ) =>
    Promise.resolve({
      tasks,
      goals,
      contexts,
      categories,
      checklistItems,
      ideas,
      attachments,
      settings,
      alerts: [],
    }),
}));

import {
  asMock,
  createMockSyncAdapter,
  createService,
  makeIdea,
  makePushResponse,
  makeTask,
  type SyncTestContext,
  setupSyncTestContext,
} from "./SyncService.test-helpers";

describe("SyncService — push results > edge cases", () => {
  let ctx: SyncTestContext;

  beforeEach(() => {
    ctx = setupSyncTestContext();
  });

  describe("sentTimestamps fallback", () => {
    it("should set syncStatus=true when push result id is absent from sentTimestamps", async () => {
      const pushedTask = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        syncStatus: "pending" as const,
      });
      const serverAssignedTask = makeTask({
        id: "server-id",
        updated_at: "2026-01-01T10:00:00.000Z",
        syncStatus: "synced" as const,
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
        expect.objectContaining({
          id: "server-id",
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should set syncStatus=false when result id is absent from sentTimestamps and updated_at is empty", async () => {
      const pushedTask = makeTask({
        id: "t1",
        updated_at: "2026-01-01T10:00:00.000Z",
        syncStatus: "pending" as const,
      });
      const localRecord = makeTask({
        id: "server-assigned-id",
        updated_at: "",
        syncStatus: "synced" as const,
        revision: 1,
      });
      asMock(ctx.taskRepository.getNeedingSync).mockResolvedValue([pushedTask]);
      asMock(ctx.taskRepository.getById).mockImplementation((id: string) =>
        Promise.resolve(id === "server-assigned-id" ? localRecord : undefined),
      );
      ctx.mockSyncAdapter = createMockSyncAdapter({
        push: vi
          .fn()
          .mockResolvedValue(
            makePushResponse(
              { tasks: [{ id: "server-assigned-id", status: "accepted" }] },
              5,
            ),
          ),
      });
      const service = createService(ctx);

      await service.push();

      expect(ctx.taskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "server-assigned-id",
          syncStatus: "synced" as const,
        }),
      );
    });
  });

  it("should skip update when getById returns undefined for created/accepted record", async () => {
    const task = makeTask({ id: "t1", syncStatus: "pending" as const });
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
      syncStatus: "pending" as const,
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
            tasks: [{ id: "t1", status: "created", server_record: serverTask }],
          },
          5,
        ),
      ),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 5, syncStatus: "synced" as const }),
    );
    expect(ctx.taskRepository.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "Server Version" }),
    );
  });

  it("should send push when only ideas are syncStatus", async () => {
    const idea = makeIdea({ id: "i1" });
    asMock(ctx.ideaRepository.getNeedingSync).mockResolvedValue([idea]);
    ctx.mockSyncAdapter = createMockSyncAdapter({
      push: vi.fn().mockResolvedValue(makePushResponse()),
    });
    const service = createService(ctx);

    await service.push();

    expect(ctx.mockSyncAdapter.push).toHaveBeenCalled();
  });
});
