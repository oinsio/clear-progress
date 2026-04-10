import { useState, useCallback } from "react";
import type { Task, Goal, Idea } from "@/types/entities";
import { TaskService } from "@/services/TaskService";
import { GoalService } from "@/services/GoalService";
import { IdeaService } from "@/services/IdeaService";
import {
  defaultTaskService,
  defaultGoalService,
  defaultIdeaService,
} from "@/services/defaultServices";

export interface UseSearchReturn {
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  isSearching: boolean;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useSearch(
  taskService: TaskService = defaultTaskService,
  goalService: GoalService = defaultGoalService,
  ideaService: IdeaService = defaultIdeaService,
): UseSearchReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!query) {
        setTasks([]);
        setGoals([]);
        setIdeas([]);
        return;
      }
      setIsSearching(true);
      try {
        const [foundTasks, foundGoals, foundIdeas] = await Promise.all([
          taskService.searchByTitle(query),
          goalService.searchByTitle(query),
          ideaService.searchByTitle(query),
        ]);
        setTasks(foundTasks);
        setGoals(foundGoals);
        setIdeas(foundIdeas);
      } catch (error) {
        console.error("Search failed:", error);
        setTasks([]);
        setGoals([]);
        setIdeas([]);
      } finally {
        setIsSearching(false);
      }
    },
    [taskService, goalService, ideaService],
  );

  const clear = useCallback(() => {
    setTasks([]);
    setGoals([]);
    setIdeas([]);
  }, []);

  return { tasks, goals, ideas, isSearching, search, clear };
}
