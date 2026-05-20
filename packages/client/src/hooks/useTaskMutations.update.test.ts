import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTaskMutations } from "./useTaskMutations";
import {
  createTestContext,
  type TestContext,
} from "./useTaskMutations.test-utils";

const mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
  }),
}));

describe("useTaskMutations > updateTask", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    mockSchedulePush.mockClear();
  });

  it("should call update with the id and changes", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.updateTask("task-1", { name: "New name" });
    });

    expect(ctx.mockTaskService.update).toHaveBeenCalledWith("task-1", {
      name: "New name",
    });
  });

  it("should call reload after update", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.updateTask("task-1", {
        description: "new description",
      });
    });

    expect(ctx.onReload).toHaveBeenCalledOnce();
  });

  it("should call schedulePush after updating a task", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.updateTask("task-1", { name: "New name" });
    });

    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });
});
