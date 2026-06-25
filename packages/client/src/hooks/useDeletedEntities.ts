import { liveQuery } from "dexie";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/db/database";
import type {
  Category,
  ChecklistItem,
  Context,
  Goal,
  Idea,
  Task,
} from "@/types/entities";

/** Implements FR19 of swipeable-item */
export interface DeletedEntities {
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  contexts: Context[];
  categories: Category[];
  checklistItems: ChecklistItem[];
  taskNameMap: Map<string, string>;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useDeletedEntities(): DeletedEntities {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [taskNameMap, setTaskNameMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let loadedCount = 0;
    const totalSubscriptions = 7;

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

    const ideasSubscription = liveQuery(() =>
      db.ideas.filter((idea) => idea.is_deleted).toArray(),
    ).subscribe({
      next: (deletedIdeas) => {
        setIdeas(deletedIdeas);
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
        const newTaskNameMap = new Map<string, string>(
          allTasks.map((task) => [task.id, task.name]),
        );
        setTaskNameMap(newTaskNameMap);
        checkAllLoaded();
      },
    });

    return () => {
      tasksSubscription.unsubscribe();
      goalsSubscription.unsubscribe();
      ideasSubscription.unsubscribe();
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
    ideas,
    contexts,
    categories,
    checklistItems,
    taskNameMap,
    isLoading,
    reload: noopReload,
  };
}
