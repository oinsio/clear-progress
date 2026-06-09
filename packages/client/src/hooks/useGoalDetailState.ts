/**
 * Custom hook encapsulating all state management and handlers for GoalDetailPage.
 * Implements FR1-FR5 of goal-detail-card-refactor.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { BOX_FILTER_ALL, ROUTES } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useFileUrl } from "@/hooks/useFileUrl";
import { useFocusedGoals } from "@/hooks/useFocusedGoals";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoal } from "@/hooks/useGoal";
import { useGoalEditForm } from "@/hooks/useGoalEditForm";
import { useGoals } from "@/hooks/useGoals";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { useMenuOrder } from "@/hooks/useMenuOrder";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useShowHidden } from "@/hooks/useShowHidden";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { useTargetBox } from "@/hooks/useTargetBox";
import { useTasksByBox } from "@/hooks/useTasksByBox";
import { defaultTaskService } from "@/services/defaultServices";
import type { Box, BoxFilter } from "@/types/common";
import type { Task } from "@/types/entities";

export function useGoalDetailState() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    goal,
    isLoading: isGoalLoading,
    reload: reloadGoal,
    updateGoal,
    deleteGoal,
  } = useGoal(id ?? "");
  const { url: existingCoverUrl } = useFileUrl(goal?.cover_hash ?? "");
  const { showHidden, toggleShowHidden } = useShowHidden();
  const {
    tasks,
    completedTasks,
    isLoading: isTasksLoading,
    createTask,
    completeTask,
    updateTask,
    moveTask,
    deleteTask,
    duplicateTask,
    reorderTasks,
  } = useGoalTasks(id ?? "", { showHidden });
  const { goals } = useGoals();
  const {
    focusedGoalIds,
    addGoalToFocus,
    removeGoalFromFocus,
    replaceGoalInFocus,
  } = useFocusedGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { menuOrder } = useMenuOrder();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const { isFocusMode, focusOpacity } = useFocusMode();
  const isDesktop = useIsDesktop();
  const {
    ratio,
    containerRef: splitContainerRef,
    handleResizeMouseDown,
  } = usePanelSplit();

  const isUnsynced = useIsUnsynced(goal ?? { needsSync: false });
  const [activeBox, setActiveBox] = useState<BoxFilter>(BOX_FILTER_ALL);
  const targetBox = useTargetBox(activeBox);

  // view state
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false);

  // edit form (delegated to dedicated hook)
  const editForm = useGoalEditForm({
    goalId: id,
    goal,
    existingCoverUrl,
    updateGoal,
    deleteGoal,
    reloadGoal,
    navigate,
  });

  const hasLoadedRef = useRef(false);
  const isLoading = isGoalLoading || isTasksLoading;

  useEffect(() => {
    if (!isGoalLoading) {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      } else if (!goal) {
        navigate(ROUTES.GOALS);
      }
    }
  }, [isGoalLoading, goal, navigate]);

  const tasksByBox = useTasksByBox(tasks);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTask(null);
      return;
    }

    const allTasks = [...tasks, ...completedTasks];
    const found = allTasks.find((task) => task.id === selectedTaskId);

    if (found) {
      setSelectedTask(found);
    } else {
      void (async () => {
        const task = await defaultTaskService.getById(selectedTaskId);
        if (task) setSelectedTask(task);
      })();
    }
  }, [selectedTaskId, tasks, completedTasks]);

  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTaskId((previous) => (previous === taskId ? null : taskId));
  }, []);

  const handleTaskExpand = useCallback((taskId: string | null) => {
    setExpandedTaskId(taskId);
  }, []);

  const handleDetailPanelClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      const recurringId = await completeTask(taskId);
      if (recurringId) setSelectedTaskId(recurringId);
    },
    [completeTask],
  );

  const handleCreateTask = useCallback(
    async (name: string, box: Box, description: string) => {
      await createTask(name, box, description);
    },
    [createTask],
  );

  const handleBoxChange = useCallback((box: BoxFilter) => {
    setActiveBox(box);
  }, []);

  const handleCommandBarSubmit = useCallback(
    (name: string) => {
      void handleCreateTask(name, targetBox, "");
    },
    [handleCreateTask, targetBox],
  );

  const commandBarPlaceholder = t(`commandBar.placeholder.${targetBox}`);

  const handleReorderTasks = useCallback(
    async (_box: Box, taskId: string, newSortOrder: string) => {
      await reorderTasks(taskId, newSortOrder);
    },
    [reorderTasks],
  );

  const isFocused = goal ? focusedGoalIds.includes(goal.id) : false;

  const isFocusedGoalsVisible = menuOrder.some(
    (entry) => entry.mode === "focused_goals" && entry.visible,
  );

  const handleFocusToggle = useCallback(async () => {
    if (!goal) return;

    if (isFocused) {
      await removeGoalFromFocus(goal.id);
    } else {
      const focusResult = await addGoalToFocus(goal.id);
      if (focusResult === "limit_reached") {
        setIsReplacementDialogOpen(true);
      }
    }
  }, [goal, isFocused, addGoalToFocus, removeGoalFromFocus]);

  const handleReplace = useCallback(
    async (oldGoalId: string) => {
      if (!goal) return;
      await replaceGoalInFocus(oldGoalId, goal.id);
      setIsReplacementDialogOpen(false);
    },
    [goal, replaceGoalInFocus],
  );

  const handleModeChange = useSidebarNavigation();

  const handleShowCompletedToggle = useCallback(() => {
    setShowCompleted((previous) => !previous);
  }, []);

  const handleDeletePanelTask = useCallback(
    (taskId: string) => {
      setSelectedTaskId(null);
      void deleteTask(taskId);
    },
    [deleteTask],
  );

  const handleDuplicatePanelTask = useCallback(
    async (taskId: string) => {
      const newTask = await duplicateTask(taskId);
      setSelectedTaskId(newTask.id);
      setSelectedTask(newTask);
    },
    [duplicateTask],
  );

  return {
    // routing
    navigate,
    // goal data
    goal,
    existingCoverUrl,
    isLoading,
    isUnsynced,
    // task data
    tasks,
    completedTasks,
    tasksByBox,
    goals,
    contexts,
    categories,
    // panel & layout
    isDesktop,
    ratio,
    splitContainerRef,
    handleResizeMouseDown,
    panelSide,
    isPanelOpen,
    togglePanelOpen,
    // focus
    isFocusMode,
    focusOpacity,
    isFocused,
    isFocusedGoalsVisible,
    focusedGoalIds,
    // view state
    showCompleted,
    selectedTaskId,
    selectedTask,
    expandedTaskId,
    isReplacementDialogOpen,
    setIsReplacementDialogOpen,
    // edit form (spread from dedicated hook)
    ...editForm,
    // command bar
    activeBox,
    showHidden,
    toggleShowHidden,
    commandBarPlaceholder,
    handleCommandBarSubmit,
    handleBoxChange,
    // handlers
    handleFocusToggle,
    handleShowCompletedToggle,
    handleReplace,
    handleModeChange,
    handleTaskSelect,
    handleTaskExpand,
    handleDetailPanelClose,
    handleCompleteTask,
    handleReorderTasks,
    updateTask,
    moveTask,
    handleDeletePanelTask,
    handleDuplicatePanelTask,
    // i18n
    t,
  };
}
