import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { useChecklist } from "./useChecklist";
import {
  checklistService,
  mockSchedulePush,
  setupBeforeEach,
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

describe("useChecklist — loading & query", () => {
  setupBeforeEach();

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() =>
      useChecklist(crypto.randomUUID(), checklistService),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after items are fetched", async () => {
    const taskId = crypto.randomUUID();
    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when task has no checklist items", async () => {
    const taskId = crypto.randomUUID();
    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it("should return items after loading", async () => {
    const taskId = crypto.randomUUID();
    const items = [
      buildChecklistItem({ task_id: taskId }),
      buildChecklistItem({ task_id: taskId }),
    ];
    await db.checklist_items.bulkAdd(items);

    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
  });

  it("should return progress after loading", async () => {
    const taskId = crypto.randomUUID();
    await db.checklist_items.bulkAdd([
      buildChecklistItem({ task_id: taskId, is_completed: true }),
      buildChecklistItem({ task_id: taskId, is_completed: true }),
      buildChecklistItem({ task_id: taskId, is_completed: false }),
    ]);

    const { result } = renderHook(() => useChecklist(taskId, checklistService));
    await waitFor(() =>
      expect(result.current.progress).toEqual({ completed: 2, total: 3 }),
    );
  });

  it("should only return items for the given taskId", async () => {
    const taskId1 = crypto.randomUUID();
    const taskId2 = crypto.randomUUID();
    await db.checklist_items.bulkAdd([
      buildChecklistItem({ task_id: taskId1 }),
      buildChecklistItem({ task_id: taskId2 }),
      buildChecklistItem({ task_id: taskId1 }),
    ]);

    const { result } = renderHook(() =>
      useChecklist(taskId1, checklistService),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.every((item) => item.task_id === taskId1)).toBe(
      true,
    );
  });
});
