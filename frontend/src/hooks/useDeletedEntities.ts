import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "@/db/database";
import type {
  Task,
  Goal,
  Context,
  Category,
  ChecklistItem,
} from "@/types/entities";

export interface DeletedEntities {
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  checklistItems: ChecklistItem[];
  taskTitleMap: Map<string, string>;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useDeletedEntities(): DeletedEntities {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [taskTitleMap, setTaskTitleMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let loadedCount = 0;
    const totalSubscriptions = 6;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalSubscriptions) {
        setIsLoading(false);
      }
    };

    const tasksSubscription = liveQuery(() =>
      db.tasks.filter((task) => task.is_deleted).toArray(),
    ).subscribe({
      next: (deletedTasks) => {
        setTasks(deletedTasks);
        checkAllLoaded();
      },
    });

    const goalsSubscription = liveQuery(() =>
      db.goals.filter((goal) => goal.is_deleted).toArray(),
    ).subscribe({
      next: (deletedGoals) => {
        setGoals(deletedGoals);
        checkAllLoaded();
      },
    });

    const contextsSubscription = liveQuery(() =>
      db.contexts.filter((ctx) => ctx.is_deleted).toArray(),
    ).subscribe({
      next: (deletedContexts) => {
        setContexts(deletedContexts);
        checkAllLoaded();
      },
    });

    const categoriesSubscription = liveQuery(() =>
      db.categories.filter((cat) => cat.is_deleted).toArray(),
    ).subscribe({
      next: (deletedCategories) => {
        setCategories(deletedCategories);
        checkAllLoaded();
      },
    });

    const checklistItemsSubscription = liveQuery(() =>
      db.checklist_items.filter((item) => item.is_deleted).toArray(),
    ).subscribe({
      next: (deletedChecklistItems) => {
        setChecklistItems(deletedChecklistItems);
        checkAllLoaded();
      },
    });

    const allTasksSubscription = liveQuery(() => db.tasks.toArray()).subscribe({
      next: (allTasks) => {
        const newTaskTitleMap = new Map<string, string>(
          allTasks.map((task) => [task.id, task.title]),
        );
        setTaskTitleMap(newTaskTitleMap);
        checkAllLoaded();
      },
    });

    return () => {
      tasksSubscription.unsubscribe();
      goalsSubscription.unsubscribe();
      contextsSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
      checklistItemsSubscription.unsubscribe();
      allTasksSubscription.unsubscribe();
    };
  }, []);

  const noopReload = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return {
    tasks,
    goals,
    contexts,
    categories,
    checklistItems,
    taskTitleMap,
    isLoading,
    reload: noopReload,
  };
}
