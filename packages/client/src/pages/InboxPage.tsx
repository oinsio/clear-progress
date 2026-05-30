/**
 * InboxPage — displays and manages tasks in the inbox box.
 * Implements FR1 of refactor-task-pages
 */
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddTaskInput } from "@/components/tasks/AddTaskInput";
import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";
import { TaskSection } from "@/components/tasks/TaskSection";
import { BOX } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoals } from "@/hooks/useGoals";
import { useTaskCompletion } from "@/hooks/useTaskCompletion";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/entities";

export default function InboxPage() {
  const { t } = useTranslation();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { filterBarPosition } = useFilterBarPosition();

  const {
    tasks: inboxTasks,
    completeTask: completeInbox,
    deleteTask: deleteInbox,
    createTask: createInboxTask,
    updateTask: updateInbox,
    moveTask: moveInbox,
    reorderTasks: reorderInbox,
    duplicateTask: duplicateInbox,
  } = useTasks(BOX.INBOX);

  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { isFocusMode, focusOpacity } = useFocusMode();

  const {
    selectedTaskId,
    expandedTaskId,
    selectedTask,
    setSelectedTaskId,
    setExpandedTaskId,
    handleTaskSelect,
    handleTaskExpand,
    handleDetailPanelClose,
  } = useTaskSelection({
    taskArrays: [inboxTasks],
  });

  const handleCompleteInbox = useTaskCompletion({
    completeFn: completeInbox,
    selectedTaskId,
    expandedTaskId,
    setSelectedTaskId,
    setExpandedTaskId,
  });

  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      if (changes.box && changes.box !== BOX.INBOX) {
        await moveInbox(id, changes.box);
      } else {
        await updateInbox(id, changes);
      }
    },
    [moveInbox, updateInbox],
  );

  const handleDuplicateTask = useCallback(
    async (id: string) => {
      const newTask = await duplicateInbox(id);
      setSelectedTaskId(newTask.id);
    },
    [duplicateInbox, setSelectedTaskId],
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      setSelectedTaskId(null);
      void deleteInbox(id);
    },
    [deleteInbox, setSelectedTaskId],
  );

  const handleAddTask = useCallback(() => {
    setIsAddingTask(true);
  }, []);

  const handleAddTaskSubmit = useCallback(
    async (name: string) => {
      await createInboxTask(name);
      setIsAddingTask(false);
    },
    [createInboxTask],
  );

  const handleAddTaskCancel = useCallback(() => {
    setIsAddingTask(false);
  }, []);

  const activeTasks = inboxTasks.filter((task) => !task.is_completed);

  const addButton = (position: "top" | "bottom") => (
    <div
      className={`flex items-center justify-end ${position === "bottom" ? "safe-area-bottom border-t" : "border-b"} border-gray-200 bg-white px-3 py-2`}
    >
      <button
        type="button"
        aria-label={t("task.add")}
        data-testid="add-task-button"
        onClick={handleAddTask}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md transition-colors hover:bg-accent/80 active:bg-accent/70"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div
      data-testid="inbox-page"
      className="flex flex-1 flex-col overflow-hidden"
    >
      <TaskPageLayout
        sidebarMode="inbox"
        selectedTask={selectedTask}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onCloseDetailPanel={handleDetailPanelClose}
        topToolbar={filterBarPosition === "top" ? addButton("top") : undefined}
        bottomToolbar={
          filterBarPosition === "bottom" ? addButton("bottom") : undefined
        }
      >
        {isAddingTask && (
          <AddTaskInput
            targetBox={t(`box.${BOX.INBOX}`)}
            onAdd={handleAddTaskSubmit}
            onCancel={handleAddTaskCancel}
          />
        )}
        <TaskSection
          key="inbox"
          sectionKey="inbox"
          label={t("section.inbox")}
          tasks={activeTasks}
          goals={goals}
          contexts={contexts}
          categories={categories}
          onComplete={handleCompleteInbox}
          onUpdate={handleUpdateTask}
          onMove={moveInbox}
          onDelete={deleteInbox}
          onReorder={reorderInbox}
          emptyMessage={t("task.emptyInbox")}
          onEmptyClick={handleAddTask}
          onSelect={handleTaskSelect}
          selectedTaskId={selectedTaskId}
          isFocusMode={isFocusMode}
          focusDimmedOpacity={focusOpacity}
          expandedTaskId={expandedTaskId}
          onExpand={handleTaskExpand}
        />
      </TaskPageLayout>
    </div>
  );
}
