import type React from "react";
import { useTranslation } from "react-i18next";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { ENTITY_TYPE, FINISHED_GOAL_STATUSES } from "@/constants";
import { useAttachmentCount } from "@/hooks/useAttachmentCount";
import { useFileUrl } from "@/hooks/useFileUrl";
import { usePanelSide } from "@/hooks/usePanelSide";
import { getCachedDayBoundary } from "@/hooks/useSettings";
import { cn } from "@/shared/lib/cn";
import { formatShortDateTime } from "@/shared/lib/utils";
import type { Goal } from "@/types/entities";
import {
  getEffectiveSyncStatus,
  getSyncStatusBorderClass,
} from "@/utils/syncStatusBorder";
import { GoalStatusBadge } from "./GoalStatusBadge";

interface GoalItemProps {
  goal: Goal;
  taskCount: number;
  onNavigate: (id: string) => void;
  nodeRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  dragHandle?: React.ReactNode;
}

export function GoalItem({
  goal,
  taskCount,
  onNavigate,
  nodeRef,
  style,
  dragHandle,
}: GoalItemProps) {
  const { t } = useTranslation();
  const isFinished = FINISHED_GOAL_STATUSES.has(goal.status);
  /** Implements FR4 of fix-nonsync-indication-for-attachments */
  const { hasUnsyncedAttachments } = useAttachmentCount(
    ENTITY_TYPE.GOAL,
    goal.id,
  );
  const effectiveSyncStatus = getEffectiveSyncStatus(
    goal.syncStatus,
    hasUnsyncedAttachments,
  );
  const { panelSide } = usePanelSide();
  const { url: coverUrl } = useFileUrl(goal.cover_hash);
  return (
    <li
      ref={nodeRef}
      style={style}
      data-testid="goal-item"
      className={cn(
        panelSide === "left"
          ? "flex items-center border-b border-gray-100 bg-white border-l-2 transition-colors hover:bg-gray-50"
          : "flex items-center border-b border-gray-100 bg-white border-l-[4px] md:border-l-2 transition-colors hover:bg-gray-50",
        getSyncStatusBorderClass(effectiveSyncStatus),
      )}
    >
      {/* Main clickable area */}
      <button
        type="button"
        data-testid="goal-navigate-button"
        className="flex flex-1 items-center gap-3 px-4 py-3 text-left min-w-0"
        onClick={() => onNavigate(goal.id)}
      >
        {/* Cover */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            data-testid={coverUrl ? "goal-cover-img" : "goal-cover-placeholder"}
            src={coverUrl ?? defaultCoverSvg}
            alt={coverUrl ? goal.name : ""}
            aria-hidden={!coverUrl}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name + status + task count */}
        <div className="flex-1">
          <p className="text-sm text-gray-800 font-medium leading-snug break-words">
            {goal.name}
          </p>
          <div className="mt-1">
            <GoalStatusBadge status={goal.status} />
          </div>
          {taskCount > 0 && (
            <span
              data-testid="goal-task-count"
              className="text-xs text-gray-400 mt-0.5 block"
            >
              {t("common.taskCount")} {taskCount}
            </span>
          )}
          {isFinished && goal.updated_at && (
            <span
              data-testid="goal-item-finished-at"
              className="text-xs text-gray-400 mt-0.5 block"
            >
              {formatShortDateTime(
                goal.updated_at,
                undefined,
                getCachedDayBoundary(),
              )}
            </span>
          )}
        </div>
      </button>

      {/* Drag handle (injected from parent when DnD is active) */}
      {dragHandle}
    </li>
  );
}
