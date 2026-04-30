import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleMinus,
  Pause,
  Pencil,
  Play,
  Plus,
  Square,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { FocusGoalReplacementDialog } from "@/components/goals/FocusGoalReplacementDialog";
import { GoalCoverPicker } from "@/components/goals/GoalCoverPicker";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { AddTaskInput } from "@/components/tasks/AddTaskInput";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { RightFilterPanel } from "@/components/tasks/RightFilterPanel";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { EditableDescription } from "@/components/ui/EditableDescription";
import { LinkedText } from "@/components/ui/LinkedText";
import { ROUTES } from "@/constants";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useCoverPreview } from "@/hooks/useCoverPreview";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useFocusedGoals } from "@/hooks/useFocusedGoals";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoal } from "@/hooks/useGoal";
import { useGoals } from "@/hooks/useGoals";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useRightPanelNavigation } from "@/hooks/useRightPanelNavigation";
import { useSettings } from "@/hooks/useSettings";
import { useTasksByBox } from "@/hooks/useTasksByBox";
import {
  defaultCoverService,
  defaultTaskService,
} from "@/services/defaultServices";
import { cn } from "@/shared/lib/cn";
import type { Box, GoalStatus } from "@/types/common";
import type { Goal, Task } from "@/types/entities";

interface GoalStatusOption {
  status: GoalStatus;
  icon: LucideIcon;
}

const STATUS_OPTIONS: GoalStatusOption[] = [
  { status: "cancelled", icon: CircleMinus },
  { status: "paused", icon: Pause },
  { status: "planning", icon: Square },
  { status: "in_progress", icon: Play },
  { status: "completed", icon: Check },
];

export default function GoalDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    goal,
    isLoading: isGoalLoading,
    reload: reloadGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
  } = useGoal(id ?? "");
  const { url: existingCoverUrl } = useCoverUrl(goal?.cover_file_id ?? "");
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
  } = useGoalTasks(id ?? "");
  const { goals } = useGoals();
  const {
    focusedGoalIds,
    addGoalToFocus,
    removeGoalFromFocus,
    replaceGoalInFocus,
  } = useFocusedGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const { isFocusMode, focusOpacity } = useFocusMode();
  const { filterBarPosition } = useFilterBarPosition();
  const isDesktop = useIsDesktop();
  const {
    ratio,
    containerRef: splitContainerRef,
    handleResizeMouseDown,
  } = usePanelSplit();

  const { defaultBox } = useSettings();
  const isUnsynced = useIsUnsynced(goal ?? { updated_at: "" });

  // view state
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isReplacementDialogOpen, setIsReplacementDialogOpen] = useState(false);

  // edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const coverPreviewSrc = useCoverPreview({
    pendingCoverFile,
    isCoverRemoved,
    existingCoverUrl,
  });

  const editNameTextareaRef = useAutoResizeTextarea(editName);

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
      // Если не нашли — запрашиваем из БД (для только что созданных задач)
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
    async (id: string) => {
      const recurringId = await completeTask(id);
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

  const handleReorderTasks = useCallback(
    async (_box: Box, orderedTasks: Task[]) => {
      await reorderTasks(orderedTasks);
    },
    [reorderTasks],
  );

  const handleStartEdit = useCallback(() => {
    setEditName(goal?.name ?? "");
    setEditDescription(goal?.description ?? "");
    setPendingCoverFile(null);
    setIsCoverRemoved(false);
    setSaveError(null);
    setIsConfirmingDelete(false);
    setIsEditing(true);
  }, [goal]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError(null);
    setIsConfirmingDelete(false);
  }, []);

  const handleCoverSelect = useCallback((file: File) => {
    setPendingCoverFile(file);
    setIsCoverRemoved(false);
  }, []);

  const handleCoverRemove = useCallback(() => {
    setPendingCoverFile(null);
    setIsCoverRemoved(true);
  }, []);

  const canSave = editName.trim().length > 0 && !isSaving;

  const handleSave = useCallback(async () => {
    if (!canSave || !id) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const originalCoverFileId = goal?.cover_file_id ?? "";
      let newCoverFileId = originalCoverFileId;

      if (pendingCoverFile) {
        const result = await defaultCoverService.uploadCover(
          pendingCoverFile,
          id,
        );
        newCoverFileId = result.file_id;
        if (originalCoverFileId && originalCoverFileId !== newCoverFileId) {
          void defaultCoverService.deleteCover(originalCoverFileId, id);
        }
      } else if (isCoverRemoved) {
        newCoverFileId = "";
        if (originalCoverFileId) {
          void defaultCoverService.deleteCover(originalCoverFileId, id);
        }
      }

      await updateGoal({
        name: editName.trim(),
        description: editDescription.trim(),
        cover_file_id: newCoverFileId,
      });
      void reloadGoal();
      setIsEditing(false);
    } catch {
      setSaveError(t("goal.cover.uploadError"));
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    id,
    goal,
    pendingCoverFile,
    isCoverRemoved,
    updateGoal,
    editName,
    editDescription,
    reloadGoal,
    t,
  ]);

  const handleStatusChange = useCallback(
    async (newStatus: GoalStatus) => {
      await updateGoalStatus(newStatus);
    },
    [updateGoalStatus],
  );

  const handleDeleteConfirm = useCallback(async () => {
    await deleteGoal();
    navigate(ROUTES.GOALS);
  }, [deleteGoal, navigate]);

  const isFocused = goal ? focusedGoalIds.includes(goal.id) : false;

  const handleFocusToggle = useCallback(async () => {
    if (!goal) return;

    if (isFocused) {
      await removeGoalFromFocus(goal.id);
    } else {
      const result = await addGoalToFocus(goal.id);
      if (result === "limit_reached") {
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

  const handleModeChange = useRightPanelNavigation();

  if (!isLoading && !goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{t("goal.notFound")}</p>
      </div>
    );
  }

  const activeStatus = goal?.status ?? "planning";

  return (
    <div
      data-testid="goal-detail-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">
        {/* Main content column */}
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            !isDesktop && selectedTask && "hidden",
          )}
          style={
            isDesktop && selectedTask
              ? { width: `${ratio * 100}%`, flexShrink: 0 }
              : { flex: "1 1 0" }
          }
        >
          {/* Action bar — top position (above header) */}
          {filterBarPosition === "top" && (
            <div className="flex items-center justify-end border-b border-gray-200 bg-white px-3 py-2">
              <button
                type="button"
                aria-label={t("task.add")}
                data-testid="add-task-button"
                onClick={() => setIsAddingTask(true)}
                className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Header */}
          <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              aria-label={t("goal.back")}
              onClick={() => navigate(ROUTES.GOALS)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-accent">
              {t("selector.goal")}
            </h1>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <div className="xl:max-w-3xl xl:mx-auto">
              {/* Goal card */}
              {goal && (
                <div
                  data-testid="goal-card"
                  className={cn(
                    "border-b border-gray-100 relative border-l-2 transition-colors",
                    isUnsynced ? "border-l-amber-400" : "border-l-transparent",
                    isEditing && "pb-2",
                  )}
                >
                  {isEditing ? (
                    /* Edit mode */
                    <div className="px-4 pt-4 flex flex-col gap-4">
                      {/* Cover + Name row */}
                      <div className="flex items-center gap-3">
                        <GoalCoverPicker
                          previewSrc={coverPreviewSrc}
                          onFileSelect={handleCoverSelect}
                          onRemove={handleCoverRemove}
                        />
                        <div className="flex-1">
                          <label htmlFor="goal-edit-name" className="sr-only">
                            {t("goal.nameLabel")}
                          </label>
                          <textarea
                            ref={editNameTextareaRef}
                            id="goal-edit-name"
                            rows={1}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder={t("goal.namePlaceholder")}
                            className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none overflow-hidden"
                            data-testid="goal-name-input"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label
                          htmlFor="goal-edit-description"
                          className="text-xs font-medium text-gray-500 mb-1 block"
                        >
                          {t("goal.descriptionLabel")}
                        </label>
                        <EditableDescription
                          value={editDescription}
                          onChange={setEditDescription}
                          placeholder={t("goal.descriptionPlaceholder")}
                          data-test-id="goal-description-input"
                        />
                      </div>

                      {/* Status segmented control */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-2 block">
                          {t("goal.statusLabel")}
                        </label>
                        <div className="flex rounded-full border border-accent overflow-hidden">
                          {STATUS_OPTIONS.map(
                            ({ status: optionStatus, icon: StatusIcon }) => {
                              const isSelected = activeStatus === optionStatus;
                              return (
                                <button
                                  key={optionStatus}
                                  type="button"
                                  aria-label={t(`goal.status.${optionStatus}`)}
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    void handleStatusChange(optionStatus)
                                  }
                                  className={cn(
                                    "flex-1 flex items-center justify-center py-3 transition-colors",
                                    isSelected
                                      ? "bg-accent text-white"
                                      : "text-accent bg-white hover:bg-accent/10",
                                  )}
                                >
                                  <StatusIcon size={18} />
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>

                      {/* Save error */}
                      {saveError && (
                        <p
                          data-testid="goal-save-error"
                          className="text-sm text-red-500"
                        >
                          {saveError}
                        </p>
                      )}

                      {/* Footer buttons */}
                      <div className="flex gap-2 pb-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(true)}
                          aria-label={t("goal.delete")}
                          data-testid="goal-delete-button"
                          className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          {t("goal.delete")}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          aria-label={t("goal.cancel")}
                          className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          {t("goal.cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSave()}
                          disabled={!canSave}
                          aria-label={t("goal.save")}
                          data-testid="goal-save-button"
                          className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isSaving
                            ? t("goal.cover.uploading")
                            : t("goal.save")}
                        </button>
                      </div>

                      {/* Delete confirmation overlay */}
                      {isConfirmingDelete && (
                        <div
                          data-testid="goal-delete-confirm"
                          className="absolute inset-0 bg-white/95 rounded-b-none flex flex-col items-center justify-center gap-4 px-6 z-10"
                        >
                          <p className="text-base font-medium text-gray-800 text-center">
                            {t("goal.deleteConfirmName")}
                          </p>
                          <p className="text-sm text-gray-500 text-center">
                            {editName}
                          </p>
                          <div className="flex gap-3 w-full">
                            <button
                              type="button"
                              data-testid="goal-delete-cancel"
                              onClick={() => setIsConfirmingDelete(false)}
                              aria-label={t("goal.cancel")}
                              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              {t("goal.cancel")}
                            </button>
                            <button
                              type="button"
                              data-testid="goal-delete-confirm-btn"
                              onClick={() => void handleDeleteConfirm()}
                              aria-label={t("goal.delete")}
                              className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
                            >
                              {t("goal.delete")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-start gap-3 px-4 py-4">
                      {/* Cover */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                          src={existingCoverUrl ?? defaultCoverSvg}
                          alt={existingCoverUrl ? goal.name : ""}
                          aria-hidden={!existingCoverUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Name + description + status */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium leading-snug">
                          {goal.name}
                        </p>
                        {goal.description && (
                          <LinkedText
                            text={goal.description}
                            className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug"
                          />
                        )}
                        <div className="mt-1">
                          <GoalStatusBadge status={goal.status} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Toggle completed tasks button */}
                        <button
                          type="button"
                          aria-label={
                            showCompleted
                              ? t("goal.hideCompleted")
                              : t("goal.showCompleted")
                          }
                          data-testid="toggle-completed-button"
                          onClick={() => setShowCompleted((prev) => !prev)}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                            showCompleted
                              ? "text-green-600 bg-green-50 hover:bg-green-100"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          <CheckCheck className="w-4 h-4" aria-hidden="true" />
                        </button>

                        {/* Toggle focus button */}
                        <button
                          type="button"
                          aria-label={
                            isFocused
                              ? t("goal.removeFromFocus")
                              : t("goal.addToFocus")
                          }
                          data-testid="toggle-focus-button"
                          onClick={() => void handleFocusToggle()}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                            isFocused
                              ? "text-accent bg-accent/10 hover:bg-accent/20"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          <Target className="w-4 h-4" aria-hidden="true" />
                        </button>

                        {/* Edit goal button */}
                        <button
                          type="button"
                          aria-label={t("goal.editName")}
                          data-testid="edit-goal-button"
                          onClick={handleStartEdit}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inline task creation input */}
              {isAddingTask && (
                <AddTaskInput
                  targetBox={t(`box.${defaultBox}`)}
                  onAdd={async (name) => {
                    await handleCreateTask(name, defaultBox, "");
                    setIsAddingTask(false);
                  }}
                  onCancel={() => setIsAddingTask(false)}
                />
              )}

              {/* Active tasks by box */}
              <BoxSectionList
                isLoading={isLoading}
                tasksByBox={tasksByBox}
                goals={goals}
                contexts={contexts}
                categories={categories}
                onAddPromptClick={() => setIsAddingTask(true)}
                onComplete={handleCompleteTask}
                onUpdate={updateTask}
                onMove={moveTask}
                onDelete={deleteTask}
                onReorder={handleReorderTasks}
                onSelect={handleTaskSelect}
                selectedTaskId={selectedTaskId}
                isFocusMode={isFocusMode}
                focusDimmedOpacity={focusOpacity}
                expandedTaskId={expandedTaskId}
                onExpand={handleTaskExpand}
              />

              {/* Completed tasks section */}
              {showCompleted && completedTasks.length > 0 && (
                <section>
                  <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-white border-b border-gray-100 sticky top-0 z-10">
                    {t("goal.completedSection", {
                      count: completedTasks.length,
                    })}
                  </h2>
                  <TaskList
                    tasks={completedTasks}
                    goals={goals}
                    contexts={contexts}
                    categories={categories}
                    onComplete={handleCompleteTask}
                    onUpdate={updateTask}
                    onMove={moveTask}
                    onDelete={deleteTask}
                    onSelect={handleTaskSelect}
                    selectedTaskId={selectedTaskId}
                    isFocusMode={isFocusMode}
                    focusDimmedOpacity={focusOpacity}
                    expandedTaskId={expandedTaskId}
                    onExpand={handleTaskExpand}
                  />
                </section>
              )}
            </div>
          </main>

          {/* Action bar — bottom position (default) */}
          {filterBarPosition === "bottom" && (
            <div className="flex items-center justify-end border-t border-gray-200 bg-white px-3 py-2">
              <button
                type="button"
                aria-label={t("task.add")}
                data-testid="add-task-button"
                onClick={() => setIsAddingTask(true)}
                className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Resize handle between task list and detail panel */}
        {isDesktop && selectedTask && (
          <div
            className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-accent/30 active:bg-accent/50 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Task detail panel */}
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onUpdate={updateTask}
            onDelete={(taskId) => {
              setSelectedTaskId(null);
              void deleteTask(taskId);
            }}
            onDuplicate={async (taskId) => {
              const newTask = await duplicateTask(taskId);
              setSelectedTaskId(newTask.id);
              setSelectedTask(newTask);
            }}
            onClose={handleDetailPanelClose}
            style={
              isDesktop
                ? { width: `${(1 - ratio) * 100}%`, flexShrink: 0 }
                : { flex: "1 1 0" }
            }
          />
        )}
      </div>

      {/* Focus goal replacement dialog */}
      {isReplacementDialogOpen && goal && (
        <FocusGoalReplacementDialog
          isOpen={isReplacementDialogOpen}
          goalToAdd={goal}
          focusedGoals={focusedGoalIds
            .map((id) => goals.find((g) => g.id === id))
            .filter((g): g is Goal => g !== undefined)}
          onReplace={handleReplace}
          onClose={() => setIsReplacementDialogOpen(false)}
        />
      )}

      {/* Right filter panel */}
      <RightFilterPanel
        mode="goals"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
