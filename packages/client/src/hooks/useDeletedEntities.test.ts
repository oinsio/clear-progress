/**
 * Tests for useDeletedEntities hook.
 * Implements FR19 of swipeable-item.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { useDeletedEntities } from "./useDeletedEntities";

function expectAllEntitiesEmpty(result: {
  current: ReturnType<typeof useDeletedEntities>;
}) {
  expect(result.current.tasks).toEqual([]);
  expect(result.current.goals).toEqual([]);
  expect(result.current.ideas).toEqual([]);
  expect(result.current.contexts).toEqual([]);
  expect(result.current.categories).toEqual([]);
  expect(result.current.checklistItems).toEqual([]);
}

describe("useDeletedEntities", () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.goals.clear();
    await db.ideas.clear();
    await db.contexts.clear();
    await db.categories.clear();
    await db.checklist_items.clear();
  });

  it("should start with isLoading true and empty arrays before subscriptions fire", () => {
    const { result } = renderHook(() => useDeletedEntities());

    expect(result.current.isLoading).toBe(true);
    expectAllEntitiesEmpty(result);
    expect(result.current.taskNameMap.size).toBe(0);
  });

  it("should set isLoading to false after all subscriptions load", async () => {
    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty arrays when no deleted entities exist", async () => {
    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expectAllEntitiesEmpty(result);
  });

  it("should return only deleted tasks", async () => {
    const deletedTask = buildTask({ name: "Deleted", is_deleted: true });
    await db.tasks.add(deletedTask);
    await db.tasks.add(buildTask({ name: "Active", is_deleted: false }));

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(result.current.tasks[0].id).toBe(deletedTask.id);
  });

  it("should return only deleted goals", async () => {
    const deletedGoal = buildGoal({ name: "Deleted", is_deleted: true });
    await db.goals.add(deletedGoal);
    await db.goals.add(buildGoal({ name: "Active", is_deleted: false }));

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.goals).toHaveLength(1));
    expect(result.current.goals[0].id).toBe(deletedGoal.id);
  });

  it("should return only deleted ideas", async () => {
    const deletedIdea = buildIdea({ name: "Deleted", is_deleted: true });
    await db.ideas.add(deletedIdea);
    await db.ideas.add(buildIdea({ name: "Active", is_deleted: false }));

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.ideas).toHaveLength(1));
    expect(result.current.ideas[0].id).toBe(deletedIdea.id);
  });

  it("should return only deleted contexts", async () => {
    const deletedContext = buildContext({ name: "Deleted", is_deleted: true });
    await db.contexts.add(deletedContext);
    await db.contexts.add(buildContext({ name: "Active", is_deleted: false }));

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.contexts).toHaveLength(1));
    expect(result.current.contexts[0].id).toBe(deletedContext.id);
  });

  it("should return only deleted categories", async () => {
    const deletedCategory = buildCategory({
      name: "Deleted",
      is_deleted: true,
    });
    await db.categories.add(deletedCategory);
    await db.categories.add(
      buildCategory({ name: "Active", is_deleted: false }),
    );

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.categories).toHaveLength(1));
    expect(result.current.categories[0].id).toBe(deletedCategory.id);
  });

  it("should return only deleted checklist items", async () => {
    const task = buildTask();
    await db.tasks.add(task);
    const deletedItem = buildChecklistItem({
      task_id: task.id,
      name: "Deleted",
      is_deleted: true,
    });
    await db.checklist_items.add(deletedItem);
    await db.checklist_items.add(
      buildChecklistItem({
        task_id: task.id,
        name: "Active",
        is_deleted: false,
      }),
    );

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.checklistItems).toHaveLength(1));
    expect(result.current.checklistItems[0].id).toBe(deletedItem.id);
  });

  it("should build taskNameMap from all tasks", async () => {
    const task = buildTask({ name: "My Task" });
    await db.tasks.add(task);

    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.taskNameMap.size).toBe(1));
    expect(result.current.taskNameMap.get(task.id)).toBe("My Task");
  });

  it("should reactively update when a deleted task is added", async () => {
    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(0);

    await act(async () => {
      await db.tasks.add(buildTask({ is_deleted: true }));
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  });

  it("should provide a reload function", async () => {
    const { result } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.reload).toBe("function");
    await result.current.reload();
  });

  it("should unsubscribe from all queries on unmount", async () => {
    const { result, unmount } = renderHook(() => useDeletedEntities());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    unmount();

    // After unmount, adding data should not cause errors
    await db.tasks.add(buildTask({ is_deleted: true }));
  });
});
