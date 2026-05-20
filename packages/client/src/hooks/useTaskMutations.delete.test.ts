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

describe("useTaskMutations > deleteTask", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    mockSchedulePush.mockClear();
  });

  it("should call softDelete with the task id", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.deleteTask("task-1");
    });

    expect(ctx.mockTaskService.softDelete).toHaveBeenCalledWith("task-1");
  });

  it("should call reload after deleteTask", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.deleteTask("task-1");
    });

    expect(ctx.onReload).toHaveBeenCalledOnce();
  });

  it("should call schedulePush after deleting a task", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.deleteTask("task-1");
    });

    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });
});
