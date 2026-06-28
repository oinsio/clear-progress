/**
 * Tests for useRestoreEntity hook.
 * Implements FR20 of swipeable-item.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { useRestoreEntity } from "./useRestoreEntity";

let mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
    lastSyncedAt: null,
  }),
}));

describe("useRestoreEntity", () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.goals.clear();
    await db.ideas.clear();
    await db.contexts.clear();
    await db.categories.clear();
    await db.checklist_items.clear();
    mockSchedulePush = vi.fn();
  });

  it("should restore a deleted task and schedule push", async () => {
    const task = buildTask({ is_deleted: true, syncStatus: "synced" as const });
    await db.tasks.add(task);

    const { result } = renderHook(() => useRestoreEntity());

    await act(async () => {
      await result.current.restoreTask(task.id);
    });

    const restored = await db.tasks.get(task.id);
    expect(restored?.is_deleted).toBe(false);
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should restore a deleted goal and schedule push", async () => {
    const goal = buildGoal({ is_deleted: true, syncStatus: "synced" as const });
    await db.goals.add(goal);

    const { result } = renderHook(() => useRestoreEntity());

    await act(async () => {
      await result.current.restoreGoal(goal.id);
    });

    const restored = await db.goals.get(goal.id);
    expect(restored?.is_deleted).toBe(false);
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should restore a deleted idea and schedule push", async () => {
    const idea = buildIdea({ is_deleted: true, syncStatus: "synced" as const });
    await db.ideas.add(idea);

    const { result } = renderHook(() => useRestoreEntity());

    await act(async () => {
      await result.current.restoreIdea(idea.id);
    });

    const restored = await db.ideas.get(idea.id);
    expect(restored?.is_deleted).toBe(false);
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should restore a deleted context and schedule push", async () => {
    const context = buildContext({
      is_deleted: true,
      syncStatus: "synced" as const,
    });
    await db.contexts.add(context);

    const { result } = renderHook(() => useRestoreEntity());

    await act(async () => {
      await result.current.restoreContext(context.id);
    });

    const restored = await db.contexts.get(context.id);
    expect(restored?.is_deleted).toBe(false);
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should restore a deleted category and schedule push", async () => {
    const category = buildCategory({
      is_deleted: true,
      syncStatus: "synced" as const,
    });
    await db.categories.add(category);

    const { result } = renderHook(() => useRestoreEntity());

    await act(async () => {
      await result.current.restoreCategory(category.id);
    });

    const restored = await db.categories.get(category.id);
    expect(restored?.is_deleted).toBe(false);
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should restore a deleted checklist item and schedule push", async () => {
    const task = buildTask();
    await db.tasks.add(task);
    const item = buildChecklistItem({
      task_id: task.id,
      is_deleted: true,
      syncStatus: "synced" as const,
    });
    await db.checklist_items.add(item);

    const { result } = renderHook(() => useRestoreEntity());

    await act(async () => {
      await result.current.restoreChecklistItem(item.id);
    });

    const restored = await db.checklist_items.get(item.id);
    expect(restored?.is_deleted).toBe(false);
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update callbacks when schedulePush changes", () => {
    const { result, rerender } = renderHook(() => useRestoreEntity());

    const firstRestoreTask = result.current.restoreTask;
    const firstRestoreGoal = result.current.restoreGoal;
    const firstRestoreIdea = result.current.restoreIdea;
    const firstRestoreContext = result.current.restoreContext;
    const firstRestoreCategory = result.current.restoreCategory;
    const firstRestoreChecklistItem = result.current.restoreChecklistItem;

    mockSchedulePush = vi.fn();
    rerender();

    expect(result.current.restoreTask).not.toBe(firstRestoreTask);
    expect(result.current.restoreGoal).not.toBe(firstRestoreGoal);
    expect(result.current.restoreIdea).not.toBe(firstRestoreIdea);
    expect(result.current.restoreContext).not.toBe(firstRestoreContext);
    expect(result.current.restoreCategory).not.toBe(firstRestoreCategory);
    expect(result.current.restoreChecklistItem).not.toBe(
      firstRestoreChecklistItem,
    );
  });
});
