import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
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

describe("useTaskMutations > moveTask", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    mockSchedulePush.mockClear();
  });

  it("should call moveToBox with the id and target box", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.moveTask("task-1", BOX.TODAY);
    });

    expect(ctx.mockTaskService.moveToBox).toHaveBeenCalledWith(
      "task-1",
      BOX.TODAY,
    );
  });

  it("should call reload after moveTask", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.moveTask("task-1", BOX.WEEK);
    });

    expect(ctx.onReload).toHaveBeenCalledOnce();
  });

  it.each([
    BOX.INBOX,
    BOX.TODAY,
    BOX.WEEK,
    BOX.LATER,
  ])("should move to %s box correctly", async (box) => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.moveTask("task-1", box);
    });

    expect(ctx.mockTaskService.moveToBox).toHaveBeenCalledWith("task-1", box);
  });

  it("should call schedulePush after moving a task", async () => {
    const { result } = renderHook(() =>
      useTaskMutations(ctx.mockTaskService, ctx.onReload),
    );

    await act(async () => {
      await result.current.moveTask("task-1", BOX.TODAY);
    });

    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });
});
