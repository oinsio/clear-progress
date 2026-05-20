import { beforeEach, describe, expect, it, vi } from "vitest";
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
    it("should set needsSync=true when push result id is absent from sentTimestamps", async () => {
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
            tasks: [{ id: "t1", status: "created", server_record: serverTask }],
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
});
