import { useState, useCallback, useEffect, useRef } from "react";
import {
  Check,
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
import {
  SWIPE_FLY_OUT_DURATION_MS,
  SWIPE_COLLAPSE_DURATION_MS,
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
      onComplete(task.id);
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
  const { progress, isThresholdReached, phase } = useSwipeToComplete(
    containerRef,
    () => onComplete(task.id),
    isSwipeEnabled,
  );

  // Spring effect for icon when threshold is reached
  const [iconScale, setIconScale] = useState(1);
  useEffect(() => {
    if (isThresholdReached && phase === "swiping") {
      setIconScale(1.2);
      const timer = setTimeout(() => setIconScale(1), 150);
      return () => clearTimeout(timer);
    }
  }, [isThresholdReached, phase]);

  return (
    <>
      <div
        ref={containerRef}
        data-testid="task-item"
        style={{
          maxHeight: phase === "completing" ? 0 : undefined,
          marginTop: phase === "completing" ? 0 : undefined,
          marginBottom: phase === "completing" ? 0 : undefined,
          overflow: "hidden",
          transition:
            phase === "completing"
              ? `max-height ${SWIPE_COLLAPSE_DURATION_MS}ms ease-out, margin ${SWIPE_COLLAPSE_DURATION_MS}ms ease-out`
              : "none",
        }}
        className={cn(
          "relative",
          panelSide === "left"
            ? "border-b border-gray-100 border-l-2 transition-colors hover:bg-gray-50"
            : "border-b border-gray-100 border-l-[4px] md:border-l-2 transition-colors hover:bg-gray-50",
          isUnsynced
            ? "border-l-amber-400"
            : isSelected
              ? "border-l-accent"
              : "border-l-transparent",
          isSelected && "bg-accent/5",
        )}
      >
        {/* Swipe-to-complete background */}
        {isSwipeEnabled && (
          <div
            aria-hidden="true"
            data-testid="swipe-background"
            style={{
              opacity:
                progress < 0.3 ? 0 : progress < 1.0 ? 0.4 + progress * 0.6 : 1,
              backgroundColor:
                progress < 0.3 ? "rgb(229, 231, 235)" : "rgb(34, 197, 94)",
            }}
            className="absolute inset-0 flex items-center pl-4 transition-opacity"
          >
            <Check
              size={20}
              className="text-white transition-transform"
              style={{
                transform: `scale(${iconScale * (0.5 + progress * 0.5)})`,
                opacity: Math.min(progress * 1.5, 1),
              }}
            />
          </div>
        )}

        {/* Swipe content wrapper */}
        <div
          style={{
            transform:
              phase === "completing" ? "translateX(110%)" : undefined,
            opacity: phase === "completing" ? 0 : 1,
            transition:
              phase === "completing"
                ? `transform ${SWIPE_FLY_OUT_DURATION_MS}ms ease-in, opacity ${SWIPE_FLY_OUT_DURATION_MS}ms ease-in`
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
                task.is_completed
                  ? "bg-accent border-accent"
                  : "border-gray-300 hover:border-accent",
              )}
            />
            <button
              type="button"
              data-testid="task-item-body"
              onClick={handleBodyClick}
              className="flex flex-col flex-1 min-w-0 text-left"
            >
              <span
                data-testid="task-item-title"
                className={cn(
                  "text-sm",
                  task.is_completed && "line-through text-gray-400",
                )}
              >
                {task.title}
              </span>
              {task.is_completed && task.completed_at && (
                <span
                  data-testid="task-item-completed-at"
                  className="text-xs text-accent mt-0.5"
                >
                  {formatCompletedAt(task.completed_at)}
                </span>
              )}
              {((task.notes && !task.is_completed) ||
                checklistProgress.total > 0 ||
                task.repeat_rule) && (
                <span className="flex items-center gap-2 mt-0.5">
                  {task.notes && !task.is_completed && (
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
