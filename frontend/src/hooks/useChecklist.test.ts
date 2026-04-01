import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChecklist } from "./useChecklist";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ChecklistService } from "@/services/ChecklistService";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";

const mockSchedulePush = vi.fn();

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

const checklistService = new ChecklistService(new ChecklistRepository());

async function setupWithItem(overrides: Parameters<typeof buildChecklistItem>[0] = {}) {
  const taskId = overrides.task_id ?? "task-1";
  const item = buildChecklistItem({ task_id: taskId, ...overrides });
  await db.checklist_items.add(item);
  const { result } = renderHook(() => useChecklist(taskId, checklistService));
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  return { item, taskId, result };
}

describe("useChecklist", () => {
  beforeEach(async () => {
    await db.checklist_items.clear();
    mockSchedulePush.mockClear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useChecklist("task-1", checklistService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after items are fetched", async () => {
    const { result } = renderHook(() => useChecklist("task-1", checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when task has no checklist items", async () => {
    const { result } = renderHook(() => useChecklist("task-1", checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it("should return items after loading", async () => {
    const taskId = "task-1";
    const items = [
      buildChecklistItem({ task_id: taskId }),
      buildChecklistItem({ task_id: taskId }),
    ];
    await db.checklist_items.bulkAdd(items);

    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
  });

  it("should return progress after loading", async () => {
    const taskId = "task-1";
    await db.checklist_items.bulkAdd([
      buildChecklistItem({ task_id: taskId, is_completed: true }),
      buildChecklistItem({ task_id: taskId, is_completed: true }),
      buildChecklistItem({ task_id: taskId, is_completed: false }),
    ]);

    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.progress).toEqual({ completed: 2, total: 3 }));
  });

  it("should add new item when createItem is called", async () => {
    const taskId = "task-1";
    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createItem("New item");
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].title).toBe("New item");
  });

  it("should schedule push when createItem is called", async () => {
    const { result } = renderHook(() => useChecklist("task-1", checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createItem("New item");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should toggle item completion when toggleItem is called", async () => {
    const { item, result } = await setupWithItem({ is_completed: false });

    await act(async () => {
      await result.current.toggleItem(item.id);
    });

    await waitFor(() => expect(result.current.items[0].is_completed).toBe(true));
  });

  it("should schedule push when toggleItem is called", async () => {
    const { item, result } = await setupWithItem();

    await act(async () => {
      await result.current.toggleItem(item.id);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should remove item from list when deleteItem is called", async () => {
    const { item, result } = await setupWithItem();

    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });

  it("should schedule push when deleteItem is called", async () => {
    const { item, result } = await setupWithItem();

    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update item title when updateItem is called", async () => {
    const { item, result } = await setupWithItem({ title: "Old title" });

    await act(async () => {
      await result.current.updateItem(item.id, "Updated title");
    });

    await waitFor(() => expect(result.current.items[0].title).toBe("Updated title"));
  });

  it("should schedule push when updateItem is called", async () => {
    const { item, result } = await setupWithItem();

    await act(async () => {
      await result.current.updateItem(item.id, "Updated");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should reorder items when reorderItems is called", async () => {
    const taskId = "task-1";
    const item1 = buildChecklistItem({ task_id: taskId, sort_order: 0 });
    const item2 = buildChecklistItem({ task_id: taskId, sort_order: 1 });
    await db.checklist_items.bulkAdd([item1, item2]);

    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => {
      await result.current.reorderItems([item2, item1]);
    });

    await waitFor(() => expect(result.current.items[0].id).toBe(item2.id));
  });

  it("should schedule push when reorderItems is called", async () => {
    const taskId = "task-1";
    const items = [
      buildChecklistItem({ task_id: taskId, sort_order: 0 }),
      buildChecklistItem({ task_id: taskId, sort_order: 1 }),
    ];
    await db.checklist_items.bulkAdd(items);

    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => {
      await result.current.reorderItems([items[1], items[0]]);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should only return items for the given taskId", async () => {
    await db.checklist_items.bulkAdd([
      buildChecklistItem({ task_id: "task-1" }),
      buildChecklistItem({ task_id: "task-2" }),
      buildChecklistItem({ task_id: "task-1" }),
    ]);

    const { result } = renderHook(() => useChecklist("task-1", checklistService));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.every((item) => item.task_id === "task-1")).toBe(true);
  });

  it("should reactively update when items change from another source", async () => {
    const taskId = "task-1";
    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(0);

    // Simulate external write (e.g. from another component instance)
    await act(async () => {
      const item = buildChecklistItem({ task_id: taskId });
      await db.checklist_items.add(item);
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
  });
});
