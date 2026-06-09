import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { useChecklist } from "./useChecklist";
import {
  checklistService,
  mockSchedulePush,
  setupBeforeEach,
  setupWithItem,
  setupWithTwoItems,
} from "./useChecklist.test-utils";

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

describe("useChecklist — mutations", () => {
  setupBeforeEach();

  it("should add new item when createItem is called", async () => {
    const taskId = crypto.randomUUID();
    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createItem("New item");
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].name).toBe("New item");
  });

  it("should schedule push when createItem is called", async () => {
    const taskId = crypto.randomUUID();
    const { result } = renderHook(() => useChecklist(taskId, checklistService));
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

    await waitFor(() =>
      expect(result.current.items[0].is_completed).toBe(true),
    );
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

  it("should update item name when updateItem is called", async () => {
    const { item, result } = await setupWithItem({ name: "Old name" });

    await act(async () => {
      await result.current.updateItem(item.id, "Updated name");
    });

    await waitFor(() =>
      expect(result.current.items[0].name).toBe("Updated name"),
    );
  });

  it("should schedule push when updateItem is called", async () => {
    const { item, result } = await setupWithItem();

    await act(async () => {
      await result.current.updateItem(item.id, "Updated");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should reorder items when reorderItems is called", async () => {
    const { item2, result } = await setupWithTwoItems();

    // Move item2 before item1 by giving it a key before item1's key
    await act(async () => {
      await result.current.reorderItems(item2.id, "Zz");
    });

    await waitFor(() => expect(result.current.items[0].id).toBe(item2.id));
  });

  it("should schedule push when reorderItems is called", async () => {
    const { item2, result } = await setupWithTwoItems();

    await act(async () => {
      await result.current.reorderItems(item2.id, "Zz");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should reactively update when items change from another source", async () => {
    const taskId = crypto.randomUUID();
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
