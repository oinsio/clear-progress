/**
 * Goal detail page — layout component.
 * Delegates state to useGoalDetailState, card rendering to GoalCardViewMode/GoalCardEditMode.
 * Implements FR1-FR5 of goal-detail-card-refactor.
 * Implements FR4, FR5, FR6 of extend-pin-to-entity-pages.
 */
import { ArrowLeft, CheckSquare, Pin } from "lucide-react";
import { CommandBar } from "@/components/command-bar";
import { FocusGoalReplacementDialog } from "@/components/goals/FocusGoalReplacementDialog";
import { GoalCardEditMode } from "@/components/goals/GoalCardEditMode";
import { GoalCardViewMode } from "@/components/goals/GoalCardViewMode";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { BOX_FILTER_ALL, FULL_BOX_FILTER_ORDER, ROUTES } from "@/constants";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";
import { useGoalDetailState } from "@/hooks/useGoalDetailState";
import { cn } from "@/shared/lib/cn";
import type { Box } from "@/types/common";
import type { Goal } from "@/types/entities";

export default function GoalDetailPage() {
  const state = useGoalDetailState();
  const { isDetailPanelPinned } = useDetailPanelPinned();

  const showDetailColumn =
    state.isDesktop && (isDetailPanelPinned || state.selectedTask);

  if (!state.isLoading && !state.goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{state.t("goal.notFound")}</p>
      </div>
    );
  }

  const sidebarMode =
    state.isFocused && state.isFocusedGoalsVisible ? null : "goals";
  const activeFocusedGoalId =
    state.isFocused && state.isFocusedGoalsVisible ? state.goal?.id : undefined;

  return (
    <SidebarShell
      mode={sidebarMode}
      onModeChange={state.handleModeChange}
      activeFocusedGoalId={activeFocusedGoalId}
    >
      <div
        data-testid="goal-detail-page"
        ref={state.splitContainerRef}
        className="flex flex-1 overflow-hidden"
      >
        {/* Main content column */}
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            !state.isDesktop && state.selectedTask && "hidden",
          )}
          style={
            showDetailColumn
              ? { width: `${state.ratio * 100}%`, flexShrink: 0 }
              : { flex: "1 1 0" }
          }
        >
          <CommandBar
            filter={{
              boxes: FULL_BOX_FILTER_ORDER,
              activeBox: state.activeBox,
              onBoxChange: state.handleBoxChange,
            }}
            eyeToggle={{
              isVisible: state.showHidden,
              onToggle: state.toggleShowHidden,
            }}
            entityIcon={CheckSquare}
            placeholder={state.commandBarPlaceholder}
            onSubmit={state.handleCommandBarSubmit}
          />

          {/* Header */}
          <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              aria-label={state.t("goal.back")}
              onClick={() => state.navigate(ROUTES.GOALS)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-accent">
              {state.t("selector.goal")}
            </h1>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <div className="xl:max-w-3xl xl:mx-auto">
              {/* Goal card */}
              {state.goal && (
                <div
                  data-testid="goal-card"
                  className={cn(
                    "border-b border-gray-100 relative border-l-2 transition-colors",
                    state.isUnsynced
                      ? "border-l-amber-400"
                      : "border-l-transparent",
                    state.isEditing && "pb-2",
                  )}
                >
                  {state.isEditing ? (
                    <GoalCardEditMode
                      goalId={state.goal.id}
                      coverPreviewSrc={state.coverPreviewSrc}
                      editName={state.editName}
                      editDescription={state.editDescription}
                      editStatus={state.editStatus}
                      isSaving={state.isSaving}
                      saveError={state.saveError}
                      canSave={state.canSave}
                      isConfirmingDelete={state.isConfirmingDelete}
                      onNameChange={state.setEditName}
                      onDescriptionChange={state.setEditDescription}
                      onStatusChange={state.handleStatusChange}
                      onCoverSelect={state.handleCoverSelect}
                      onCoverRemove={state.handleCoverRemove}
                      onSave={() => void state.handleSave()}
                      onCancel={state.handleCancelEdit}
                      onDeleteRequest={() => state.setIsConfirmingDelete(true)}
                      onDeleteConfirm={() => void state.handleDeleteConfirm()}
                      onDeleteCancel={() => state.setIsConfirmingDelete(false)}
                    />
                  ) : (
                    <GoalCardViewMode
                      goal={state.goal}
                      existingCoverUrl={state.existingCoverUrl}
                      isFocused={state.isFocused}
                      showCompleted={state.showCompleted}
                      onFocusToggle={() => void state.handleFocusToggle()}
                      onShowCompletedToggle={state.handleShowCompletedToggle}
                      onStartEdit={state.handleStartEdit}
                    />
                  )}
                </div>
              )}

              {/* Active tasks by box */}
              {state.activeBox === BOX_FILTER_ALL ? (
                <BoxSectionList
                  isLoading={state.isLoading}
                  tasksByBox={state.tasksByBox}
                  goals={state.goals}
                  contexts={state.contexts}
                  categories={state.categories}
                  onComplete={state.handleCompleteTask}
                  onUpdate={state.updateTask}
                  onMove={state.moveTask}
                  onDelete={state.handleDeletePanelTask}
                  onReorder={state.handleReorderTasks}
                  onSelect={state.handleTaskSelect}
                  selectedTaskId={state.selectedTaskId}
                  isFocusMode={state.isFocusMode}
                  focusDimmedOpacity={state.focusOpacity}
                  expandedTaskId={state.expandedTaskId}
                  onExpand={state.handleTaskExpand}
                />
              ) : (
                <TaskList
                  tasks={state.tasksByBox[state.activeBox as Box]}
                  goals={state.goals}
                  contexts={state.contexts}
                  categories={state.categories}
                  onComplete={state.handleCompleteTask}
                  onUpdate={state.updateTask}
                  onMove={state.moveTask}
                  onDelete={state.handleDeletePanelTask}
                  onReorder={(taskId, newSortOrder) =>
                    state.handleReorderTasks(
                      state.activeBox as Box,
                      taskId,
                      newSortOrder,
                    )
                  }
                  onSelect={state.handleTaskSelect}
                  selectedTaskId={state.selectedTaskId}
                  isFocusMode={state.isFocusMode}
                  focusDimmedOpacity={state.focusOpacity}
                  expandedTaskId={state.expandedTaskId}
                  onExpand={state.handleTaskExpand}
                />
              )}

              {/* Completed tasks section */}
              {state.showCompleted && state.completedTasks.length > 0 && (
                <section>
                  <h2 className="px-4 py-2 text-sm font-semibold text-accent bg-white border-b border-gray-100 sticky top-0 z-10">
                    {state.t("goal.completedSection", {
                      count: state.completedTasks.length,
                    })}
                  </h2>
                  <TaskList
                    tasks={state.completedTasks}
                    goals={state.goals}
                    contexts={state.contexts}
                    categories={state.categories}
                    onComplete={state.handleCompleteTask}
                    onUpdate={state.updateTask}
                    onMove={state.moveTask}
                    onDelete={state.handleDeletePanelTask}
                    onSelect={state.handleTaskSelect}
                    selectedTaskId={state.selectedTaskId}
                    isFocusMode={state.isFocusMode}
                    focusDimmedOpacity={state.focusOpacity}
                    expandedTaskId={state.expandedTaskId}
                    onExpand={state.handleTaskExpand}
                  />
                </section>
              )}
            </div>
          </main>
        </div>

        {/* Resize handle between task list and detail panel */}
        {showDetailColumn && (
          <div
            className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-accent/30 active:bg-accent/50 transition-colors"
            onMouseDown={state.handleResizeMouseDown}
          />
        )}

        {/* Task detail panel */}
        {state.selectedTask && (
          <TaskDetailPanel
            task={state.selectedTask}
            goals={state.goals}
            contexts={state.contexts}
            categories={state.categories}
            onUpdate={state.updateTask}
            onMove={state.moveTask}
            onDelete={state.handleDeletePanelTask}
            onDuplicate={state.handleDuplicatePanelTask}
            onClose={state.handleDetailPanelClose}
            style={
              state.isDesktop
                ? { width: `${(1 - state.ratio) * 100}%`, flexShrink: 0 }
                : { flex: "1 1 0" }
            }
          />
        )}

        {showDetailColumn && !state.selectedTask && (
          <div
            data-testid="detail-panel-empty-state"
            className="flex flex-col items-center justify-center text-gray-400"
            style={
              state.isDesktop
                ? { width: `${(1 - state.ratio) * 100}%`, flexShrink: 0 }
                : { flex: "1 1 0" }
            }
          >
            <Pin className="mb-2 h-8 w-8" />
            <p className="text-sm">{state.t("taskDetail.emptyState")}</p>
          </div>
        )}
      </div>

      {/* Focus goal replacement dialog */}
      {state.isReplacementDialogOpen && state.goal && (
        <FocusGoalReplacementDialog
          isOpen={state.isReplacementDialogOpen}
          goalToAdd={state.goal}
          focusedGoals={state.focusedGoalIds
            .map((goalId) => state.goals.find((goal) => goal.id === goalId))
            .filter((goal): goal is Goal => goal !== undefined)}
          onReplace={state.handleReplace}
          onClose={() => state.setIsReplacementDialogOpen(false)}
        />
      )}
    </SidebarShell>
  );
}
