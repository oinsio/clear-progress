import { useState, useCallback, useEffect, useRef } from "react";
import {
  Check,
  EyeOff,
  FileText,
  GripVertical,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { Task, Goal, Context, Category } from "@/types/entities";
import type { Box } from "@/types/common";
import { cn } from "@/shared/lib/cn";
import { formatCompletedAt } from "@/shared/lib/utils";
import { TaskQuickActions } from "./TaskQuickActions";
import { useChecklist } from "@/hooks/useChecklist";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSwipeToComplete } from "@/hooks/useSwipeToComplete";
import { useLongPress } from "@/hooks/useLongPress";
import {
  SWIPE_SNAP_BACK_DURATION_MS,
  LONG_PRESS_THRESHOLD_MS,
  LONG_PRESS_MOVE_THRESHOLD_PX,
  TASK_COMPLETE_ANIMATION_DELAY_MS,
} from "@/constants";
import * as React from "react";

export interface DragHandleProps {
  ref: (element: HTMLElement | null) => void;
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: SyntheticListenerMap | undefined;
}

interface TaskItemProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  dragHandleProps?: DragHandleProps;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  isExpanded?: boolean;
  onExpand?: (id: string | null) => void;
}

export function TaskItem({
  task,
  goals,
  contexts,
  categories,
  onComplete,
  onUpdate,
  onMove,
  dragHandleProps,
  onSelect,
  isSelected,
  isExpanded = false,
  onExpand,
}: TaskItemProps) {
  const { t } = useTranslation();
  const { progress: checklistProgress, hasUnsyncedItems } = useChecklist(
    task.id,
  );
  const isTaskUnsynced = useIsUnsynced(task);
  const isUnsynced = isTaskUnsynced || hasUnsyncedItems;
  const isDesktop = useIsDesktop();
  const { panelSide } = usePanelSide();
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (isDesktop && isExpanded && onExpand) {
      onExpand(null);
    }
  }, [isDesktop, isExpanded, onExpand]);

  const handleBodyClick = useCallback(() => {
    if (isDesktop && onSelect) {
      onSelect(task.id);
    } else if (onExpand) {
      onExpand(isExpanded ? null : task.id);
    }
  }, [isDesktop, onSelect, task.id, isExpanded, onExpand]);

  const handleLongPress = useCallback(() => {
    if (!isDesktop && onSelect) {
      onSelect(task.id);
      if (onExpand) {
        onExpand(null);
      }
    }
  }, [isDesktop, onSelect, task.id, onExpand]);

  const longPressHandlers = useLongPress({
    onLongPress: handleLongPress,
    onClick: handleBodyClick,
    threshold: LONG_PRESS_THRESHOLD_MS,
    moveThreshold: LONG_PRESS_MOVE_THRESHOLD_PX,
  });

  const handleOpenEdit = useCallback(() => {
    if (onSelect) {
      onSelect(task.id);
    }
    if (onExpand) {
      onExpand(null);
    }
  }, [onSelect, task.id, onExpand]);

  const handleCompleteClick = useCallback(() => {
    if (task.is_completed) {
      setIsConfirmingRestore(true);
    } else {
      setIsCompleting(true);
      setTimeout(() => {
        onComplete(task.id);
      }, TASK_COMPLETE_ANIMATION_DELAY_MS);
    }
  }, [task.is_completed, task.id, onComplete]);

  const handleRestoreConfirm = useCallback(() => {
    onComplete(task.id);
    setIsConfirmingRestore(false);
  }, [task.id, onComplete]);

  const handleRestoreCancel = useCallback(() => {
    setIsConfirmingRestore(false);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isExpanded || isConfirmingRestore) && containerRef.current) {
      containerRef.current.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [isExpanded, isConfirmingRestore]);

  const isSwipeEnabled = !isDesktop && !task.is_completed;
  const { translateX, isThresholdReached } = useSwipeToComplete(
    containerRef,
    () => onComplete(task.id),
    isSwipeEnabled,
  );

  return (
    <>
      <div
        ref={containerRef}
        data-testid="task-item"
        className={cn(
          "relative overflow-hidden",
          panelSide === "left"
            ? "border-b border-gray-100 border-l-2 transition-colors hover:bg-gray-50"
            : "border-b border-gray-100 border-l-[4px] md:border-l-2 transition-colors hover:bg-gray-50",
          isUnsynced
            ? "border-l-amber-400"
            : isSelected
              ? "border-l-accent"
              : "border-l-transparent",
          isSelected && "bg-accent/5",
          task.is_hidden && "opacity-50",
        )}
      >
        {/* Swipe-to-complete background */}
        {isSwipeEnabled && (
          <div
            aria-hidden="true"
            data-testid="swipe-background"
            className={cn(
              "absolute inset-0 bg-green-500 flex items-center pl-4 transition-opacity",
              translateX === 0
                ? "opacity-0"
                : isThresholdReached
                  ? "opacity-100"
                  : "opacity-70",
            )}
          >
            <Check size={20} className="text-white" />
          </div>
        )}

        {/* Swipe content wrapper */}
        <div
          style={{
            transform: `translateX(${translateX}px)`,
            transition:
              translateX === 0
                ? `transform ${SWIPE_SNAP_BACK_DURATION_MS}ms ease-out`
                : "none",
          }}
        >
          {/* Main task row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              aria-label={
                task.is_completed ? t("task.noncomplete") : t("task.complete")
              }
              onClick={handleCompleteClick}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors self-start mt-0.5",
                "flex items-center justify-center",
                task.is_completed || isCompleting
                  ? "bg-accent/20 border-accent"
                  : "border-gray-300 hover:border-accent",
              )}
            >
              {(task.is_completed || isCompleting) && (
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  className="text-accent"
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw-check"
                    style={{ strokeDasharray: 20 }}
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              data-testid="task-item-body"
              {...longPressHandlers}
              className="flex flex-col flex-1 min-w-0 text-left select-none [-webkit-touch-callout:none]"
            >
              <span
                data-testid="task-item-name"
                className={cn(
                  "text-sm",
                  task.is_completed && "line-through text-gray-400",
                )}
              >
                {task.name}
              </span>
              {task.is_completed && task.completed_at && (
                <span
                  data-testid="task-item-completed-at"
                  className="text-xs text-accent mt-0.5"
                >
                  {formatCompletedAt(task.completed_at)}
                </span>
              )}
              {task.is_hidden && task.appear_date && (
                <span
                  data-testid="task-item-appear-date"
                  className="text-xs text-gray-500 mt-0.5"
                >
                  {t("repeat.appearDate", {
                    date: new Date(task.appear_date).toLocaleDateString(),
                  })}
                </span>
              )}
              {((task.description && !task.is_completed) ||
                checklistProgress.total > 0 ||
                task.repeat_rule ||
                task.is_hidden) && (
                <span className="flex items-center gap-2 mt-0.5">
                  {task.description && !task.is_completed && (
                    <FileText
                      size={12}
                      className="text-gray-400 flex-shrink-0"
                    />
                  )}
                  {checklistProgress.total > 0 && (
                    <span
                      data-testid="checklist-badge"
                      className="flex items-center gap-0.5 text-gray-400"
                    >
                      <ListChecks size={10} />
                      <span className="text-[10px]">
                        {checklistProgress.completed}/{checklistProgress.total}
                      </span>
                    </span>
                  )}
                  {task.repeat_rule && (
                    <RotateCcw
                      data-testid="repeat-rule-indicator"
                      size={10}
                      className="text-gray-400 flex-shrink-0"
                    />
                  )}
                  {task.is_hidden && (
                    <EyeOff
                      data-testid="hidden-task-indicator"
                      size={10}
                      className="text-gray-400 flex-shrink-0"
                    />
                  )}
                </span>
              )}
            </button>
            {dragHandleProps && (
              <button
                data-no-swipe="true"
                type="button"
                ref={dragHandleProps.ref}
                aria-label={t("task.drag")}
                className="flex-shrink-0 text-gray-300 cursor-grab active:cursor-grabbing touch-none"
                {...dragHandleProps.attributes}
                {...dragHandleProps.listeners}
              >
                <GripVertical size={16} />
              </button>
            )}
          </div>

          {/* Restore confirmation panel */}
          {isConfirmingRestore && (
            <div
              data-testid="restore-confirmation"
              className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100"
            >
              <span className="text-sm text-gray-600">
                {t("task.restoreConfirm")}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-label={t("task.cancel")}
                  onClick={handleRestoreCancel}
                  className="text-sm text-gray-500"
                >
                  {t("task.cancel")}
                </button>
                <button
                  type="button"
                  aria-label={t("task.restore")}
                  onClick={handleRestoreConfirm}
                  className="text-sm text-accent font-medium"
                >
                  {t("task.restore")}
                </button>
              </div>
            </div>
          )}

          {/* Quick actions panel */}
          {isExpanded && (
            <TaskQuickActions
              task={task}
              goals={goals}
              contexts={contexts}
              categories={categories}
              onUpdate={onUpdate}
              onMove={onMove}
              onOpenEdit={handleOpenEdit}
            />
          )}
        </div>
      </div>
    </>
  );
}
