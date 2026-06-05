/**
 * Goal detail page — layout component.
 * Delegates state to useGoalDetailState, card rendering to GoalCardViewMode/GoalCardEditMode.
 * Implements FR1-FR5 of goal-detail-card-refactor.
 */
import { ArrowLeft, CheckSquare } from "lucide-react";
import { CommandBar } from "@/components/command-bar";
import { FocusGoalReplacementDialog } from "@/components/goals/FocusGoalReplacementDialog";
import { GoalCardEditMode } from "@/components/goals/GoalCardEditMode";
import { GoalCardViewMode } from "@/components/goals/GoalCardViewMode";
import { BoxSectionList } from "@/components/tasks/BoxSectionList";
import { Sidebar } from "@/components/tasks/Sidebar";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { FULL_BOX_FILTER_ORDER, ROUTES } from "@/constants";
import { useGoalDetailState } from "@/hooks/useGoalDetailState";
import { cn } from "@/shared/lib/cn";
import type { Goal } from "@/types/entities";

export default function GoalDetailPage() {
  const state = useGoalDetailState();

  if (!state.isLoading && !state.goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">{state.t("goal.notFound")}</p>
      </div>
    );
  }

  return (
    <div
      data-testid="goal-detail-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      <div
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
            state.isDesktop && state.selectedTask
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
        {state.isDesktop && state.selectedTask && (
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
      </div>

      {/* Focus goal replacement dialog */}
      {state.isReplacementDialogOpen && state.goal && (
        <FocusGoalReplacementDialog
          isOpen={state.isReplacementDialogOpen}
          goalToAdd={state.goal}
          focusedGoals={state.focusedGoalIds
            .map((goalId) => state.goals.find((g) => g.id === goalId))
            .filter((g): g is Goal => g !== undefined)}
          onReplace={state.handleReplace}
          onClose={() => state.setIsReplacementDialogOpen(false)}
        />
      )}

      {/* Right filter panel */}
      <Sidebar
        mode={state.isFocused && state.isFocusedGoalsVisible ? null : "goals"}
        isOpen={state.isPanelOpen}
        side={state.panelSide}
        activeFocusedGoalId={
          state.isFocused && state.isFocusedGoalsVisible
            ? state.goal?.id
            : undefined
        }
        onToggle={state.togglePanelOpen}
        onModeChange={state.handleModeChange}
      />
    </div>
  );
}
