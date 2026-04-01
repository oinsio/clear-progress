import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { ChecklistItem } from "@/types/entities";
import { ChecklistService, type ChecklistProgress } from "@/services/ChecklistService";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultChecklistService = new ChecklistService(new ChecklistRepository());

export interface UseChecklistReturn {
  items: ChecklistItem[];
  progress: ChecklistProgress;
  hasUnsyncedItems: boolean;
  isLoading: boolean;
  reload: () => Promise<void>;
  createItem: (title: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, title: string) => Promise<void>;
  reorderItems: (items: ChecklistItem[]) => Promise<void>;
}

export function useChecklist(
  taskId: string,
  checklistService: ChecklistService = defaultChecklistService,
): UseChecklistReturn {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress>({
    completed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush, lastSyncedAt } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(async () => {
      const [taskItems, taskProgress] = await Promise.all([
        checklistService.getByTaskId(taskId),
        checklistService.getProgress(taskId),
      ]);
      return { taskItems, taskProgress };
    }).subscribe({
      next: ({ taskItems, taskProgress }) => {
        setItems(taskItems);
        setProgress(taskProgress);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [checklistService, taskId]);

  const createItem = useCallback(
    async (title: string) => {
      await checklistService.create(taskId, title);
      schedulePush();
    },
    [checklistService, taskId, schedulePush],
  );

  const toggleItem = useCallback(
    async (id: string) => {
      await checklistService.toggle(id);
      schedulePush();
    },
    [checklistService, schedulePush],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await checklistService.softDelete(id);
      schedulePush();
    },
    [checklistService, schedulePush],
  );

  const updateItem = useCallback(
    async (id: string, title: string) => {
      await checklistService.update(id, { title });
      schedulePush();
    },
    [checklistService, schedulePush],
  );

  const reorderItems = useCallback(
    async (reorderedItems: ChecklistItem[]) => {
      await checklistService.reorderItems(reorderedItems);
      schedulePush();
    },
    [checklistService, schedulePush],
  );

  const hasUnsyncedItems = items.some(
    (item) => lastSyncedAt === null || item.updated_at > lastSyncedAt,
  );

  const reload = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return { items, progress, hasUnsyncedItems, isLoading, reload, createItem, toggleItem, deleteItem, updateItem, reorderItems };
}
