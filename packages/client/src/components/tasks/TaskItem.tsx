import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  Check,
  EyeOff,
  FileText,
  GripVertical,
  ListChecks,
  MapPin,
  Paperclip,
  Repeat,
  RotateCcw,
  Tag,
  Target,
} from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LONG_PRESS_MOVE_THRESHOLD_PX,
  LONG_PRESS_THRESHOLD_MS,
  SWIPE_SNAP_BACK_DURATION_MS,
  TASK_COMPLETE_ANIMATION_DELAY_MS,
} from "@/constants";
import { useAttachmentCount } from "@/hooks/useAttachmentCount";
import { useChecklist } from "@/hooks/useChecklist";
import { useHasTouchPointer } from "@/hooks/useHasTouchPointer";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { useLongPress } from "@/hooks/useLongPress";
import { usePanelSide } from "@/hooks/usePanelSide";
import { getCachedDayBoundary } from "@/hooks/useSettings";
import { useShowCheckbox } from "@/hooks/useShowCheckbox";
import { useSwipeAction } from "@/hooks/useSwipeAction";
import { cn } from "@/shared/lib/cn";
import { formatAppearDate, formatCompletedAt } from "@/shared/lib/utils";
import type { Box } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { TaskQuickActions } from "./TaskQuickActions";

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
  isFocusDimmed?: boolean;
  focusDimmedOpacity?: number;
}

const ENTITY_TYPE_TASK = "task" as const;

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
  isFocusDimmed = false,
  focusDimmedOpacity,
}: TaskItemProps) {
  const { t } = useTranslation();
  const { progress: checklistProgress, hasUnsyncedItems } = useChecklist(
    task.id,
  );
  const { attachmentCount, hasUnsyncedAttachments } = useAttachmentCount(
    ENTITY_TYPE_TASK,
    task.id,
  );
  const isTaskUnsynced = useIsUnsynced(task);
  const isUnsynced =
    isTaskUnsynced || hasUnsyncedItems || hasUnsyncedAttachments;
  const isDesktop = useIsDesktop();
  const showCheckbox = useShowCheckbox();
  const hasTouchPointer = useHasTouchPointer();
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

  const isSwipeEnabled = hasTouchPointer;
  const { translateX, isThresholdReached } = useSwipeAction(
    containerRef,
    () => onComplete(task.id),
    isSwipeEnabled,
  );

  return (
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
        isFocusDimmed && !task.is_hidden && "transition-opacity",
        task.is_hidden && "opacity-50",
      )}
      style={
        isFocusDimmed && !task.is_hidden && focusDimmedOpacity !== undefined
          ? { opacity: focusDimmedOpacity / 100 }
          : undefined
      }
    >
      {/* Swipe action background */}
      {isSwipeEnabled && (
        <div
          aria-hidden="true"
          data-testid="swipe-background"
          className={cn(
            "absolute inset-0 flex items-center pl-4 transition-opacity",
            task.is_completed ? "bg-amber-500" : "bg-green-500",
            translateX === 0
              ? "opacity-0"
              : isThresholdReached
                ? "opacity-100"
                : "opacity-70",
          )}
        >
          {task.is_completed ? (
            <RotateCcw className="w-5 h-5 text-white" />
          ) : (
            <Check className="w-5 h-5 text-white" />
          )}
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
          {showCheckbox && (
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
          )}
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
                {formatCompletedAt(
                  task.completed_at,
                  undefined,
                  getCachedDayBoundary(),
                )}
              </span>
            )}
            {task.is_hidden && task.appear_date && (
              <span
                data-testid="task-item-appear-date"
                className="text-xs text-gray-500 mt-0.5"
              >
                {t("task.appearDate", {
                  date: formatAppearDate(task.appear_date),
                })}
              </span>
            )}
            {/* Implements FR6-FR10, UX3, UX4, NFR-A2 of task-detail-page-ui-improvements */}
            {((task.description && !task.is_completed) ||
              checklistProgress.total > 0 ||
              attachmentCount > 0 ||
              task.goal_id ||
              task.context_id ||
              task.category_id ||
              task.repeat_rule ||
              task.is_hidden) && (
              <span className="flex items-center gap-2 mt-0.5">
                {task.description && !task.is_completed && (
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                {checklistProgress.total > 0 && (
                  <span
                    data-testid="checklist-badge"
                    className="flex items-center gap-0.5 text-gray-400"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {checklistProgress.completed}/{checklistProgress.total}
                    </span>
                  </span>
                )}
                {attachmentCount > 0 && (
                  <span
                    data-testid="attachment-badge"
                    className="flex items-center gap-0.5 text-gray-400"
                  >
                    <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-xs">{attachmentCount}</span>
                  </span>
                )}
                {task.goal_id && (
                  <Target
                    data-testid="goal-indicator"
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {task.context_id && (
                  <MapPin
                    data-testid="context-indicator"
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {task.category_id && (
                  <Tag
                    data-testid="category-indicator"
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {task.repeat_rule && (
                  <Repeat
                    data-testid="repeat-rule-indicator"
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                  />
                )}
                {task.is_hidden && (
                  <EyeOff
                    data-testid="hidden-task-indicator"
                    className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
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
              <GripVertical className="w-4 h-4" />
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
  );
}
