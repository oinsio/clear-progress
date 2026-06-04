import { vi } from "vitest";
import type { UseCategoriesReturn } from "@/hooks/useCategories";
import type { UseCompletedTasksReturn } from "@/hooks/useCompletedTasks";
import type { UseContextsReturn } from "@/hooks/useContexts";
import type { UseGoalsReturn } from "@/hooks/useGoals";
import type { UseIdeasReturn } from "@/hooks/useIdeas";
import type { UseTasksReturn } from "@/hooks/useTasks";
import type { Task } from "@/types/entities";

export function buildTasksHook(
  overrides: Partial<UseTasksReturn> = {},
): UseTasksReturn {
  return {
    tasks: [],
    isLoading: false,
    createTask: vi.fn().mockResolvedValue(undefined),
    completeTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue(undefined),
    reorderTasks: vi.fn(),
    duplicateTask: vi.fn().mockResolvedValue({} as Task),
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function buildGoalsHook(
  overrides: Partial<UseGoalsReturn> = {},
): UseGoalsReturn {
  return {
    goals: [],
    isLoading: false,
    reloadGoals: vi.fn().mockResolvedValue(undefined),
    createGoal: vi.fn().mockResolvedValue(undefined),
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    reorderGoals: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function buildContextsHook(
  overrides: Partial<UseContextsReturn> = {},
): UseContextsReturn {
  return {
    contexts: [],
    isLoading: false,
    createContext: vi.fn(),
    updateContext: vi.fn(),
    deleteContext: vi.fn(),
    reorderContexts: vi.fn(),
    ...overrides,
  };
}

export function buildCategoriesHook(
  overrides: Partial<UseCategoriesReturn> = {},
): UseCategoriesReturn {
  return {
    categories: [],
    isLoading: false,
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    reorderCategories: vi.fn(),
    ...overrides,
  };
}

export function buildIdeasHook(
  overrides: Partial<UseIdeasReturn> = {},
): UseIdeasReturn {
  return {
    ideas: [],
    isLoading: false,
    reloadIdeas: vi.fn().mockResolvedValue(undefined),
    createIdea: vi.fn().mockResolvedValue(undefined),
    updateIdea: vi.fn().mockResolvedValue(undefined),
    deleteIdea: vi.fn().mockResolvedValue(undefined),
    reorderIdeas: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function buildCompletedTasksHook(
  overrides: Partial<UseCompletedTasksReturn> = {},
): UseCompletedTasksReturn {
  return {
    completedTasks: [],
    isLoading: false,
    reload: vi.fn(),
    ...overrides,
  };
}
