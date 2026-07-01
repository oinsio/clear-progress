import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { BOX } from "@/constants";
import { useTaskMutations } from "./useTaskMutations";
import {
  createTestContext,
  type TestContext,
} from "./useTaskMutations.test-utils";

vi.mock(
  "@/app/providers/AlertProvider",
  async () => import("@/app/providers/__mocks__/AlertProvider"),
);
vi.mock(
  "@/app/providers/SyncProvider",
  async () => import("@/app/providers/__mocks__/SyncProvider"),
);

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
