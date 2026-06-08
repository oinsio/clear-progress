/**
 * View mode card for goal detail page.
 * Renders cover circle, status badge, action buttons, name, and collapsible details section
 * (description + read-only attachments).
 * Implements FR1, FR3, FR4, FR5 of goal-detail-card-refactor.
 * Implements UX2, UX3 of add-file-attachments.
 */
import {
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Pencil,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import defaultCoverSvg from "@/assets/default-goal-cover.svg";
import { CoverLightbox } from "@/components/goals/CoverLightbox";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { AttachmentList } from "@/components/shared/AttachmentList";
import { LinkedText } from "@/components/ui/LinkedText";
import { useAttachments } from "@/hooks/useAttachments";
import { cn } from "@/shared/lib/cn";
import type { Goal } from "@/types/entities";

const ENTITY_TYPE_GOAL = "goal" as const;
const NOOP_DELETE = () => {};

interface GoalCardViewModeProps {
  goal: Goal;
  existingCoverUrl: string | null;
  isFocused: boolean;
  showCompleted: boolean;
  onFocusToggle: () => void;
  onShowCompletedToggle: () => void;
  onStartEdit: () => void;
}

export function GoalCardViewMode({
  goal,
  existingCoverUrl,
  isFocused,
  showCompleted,
  onFocusToggle,
  onShowCompletedToggle,
  onStartEdit,
}: GoalCardViewModeProps) {
  const { t } = useTranslation();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] =
    useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const coverCircleRef = useRef<HTMLButtonElement>(null);

  const hasRealCover = Boolean(existingCoverUrl);

  const { attachments } = useAttachments(ENTITY_TYPE_GOAL, goal.id);
  const hasAttachments = attachments.length > 0;
  const hasDescription = Boolean(goal.description);

  const shouldShowChevron =
    hasAttachments || isDescriptionOverflowing || isDetailsExpanded;

  useLayoutEffect(() => {
    const description = goal.description;
    const element = descriptionRef.current;
    if (!element || !description || isDetailsExpanded) return;

    const checkOverflow = () => {
      setIsDescriptionOverflowing(element.scrollHeight > element.clientHeight);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [goal.description, isDetailsExpanded]);

  return (
    <div className="flex flex-col px-4 py-4 gap-2">
      {/* Row 1: cover + status + actions */}
      <div className="flex items-center gap-3">
        {/* Cover */}
        {hasRealCover ? (
          <button
            ref={coverCircleRef}
            type="button"
            data-testid="cover-circle"
            aria-label={t("goal.cover.viewFull")}
            onClick={() => setIsLightboxOpen(true)}
            className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          >
            <img
              src={existingCoverUrl ?? defaultCoverSvg}
              alt={goal.name}
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          <div
            data-testid="cover-circle"
            className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
          >
            <img
              src={defaultCoverSvg}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <GoalStatusBadge status={goal.status} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Toggle focus button */}
          <button
            type="button"
            aria-label={
              isFocused ? t("goal.removeFromFocus") : t("goal.addToFocus")
            }
            aria-pressed={isFocused}
            data-testid="focus-icon"
            onClick={onFocusToggle}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isFocused
                ? "text-accent bg-accent/10 hover:bg-accent/20"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            )}
          >
            <Crosshair className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Toggle completed tasks button */}
          <button
            type="button"
            aria-label={
              showCompleted ? t("goal.hideCompleted") : t("goal.showCompleted")
            }
            data-testid="toggle-completed-button"
            onClick={onShowCompletedToggle}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              showCompleted
                ? "text-green-600 bg-green-50 hover:bg-green-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            )}
          >
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Edit goal button */}
          <button
            type="button"
            aria-label={t("goal.editName")}
            data-testid="edit-goal-button"
            onClick={onStartEdit}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Row 2: name */}
      <p className="text-sm text-gray-800 font-medium leading-snug">
        {goal.name}
      </p>

      {/* Row 3: collapsible details (description + attachments) */}
      {(hasDescription || hasAttachments) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-1">
            {hasDescription && (
              <div
                ref={descriptionRef}
                className={cn(
                  "flex-1 min-w-0",
                  !isDetailsExpanded && "line-clamp-2",
                )}
              >
                <LinkedText
                  text={goal.description}
                  className="text-xs text-gray-500 leading-snug whitespace-pre-wrap"
                />
              </div>
            )}
            {!hasDescription && <div className="flex-1" />}
            {shouldShowChevron && (
              <button
                type="button"
                data-testid="details-toggle"
                aria-expanded={isDetailsExpanded}
                aria-label={
                  isDetailsExpanded
                    ? t("goal.collapseDetails")
                    : t("goal.expandDetails")
                }
                onClick={() => setIsDetailsExpanded((previous) => !previous)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isDetailsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Attachments (read-only, shown only when expanded) */}
          {isDetailsExpanded && hasAttachments && (
            <div className="mt-1" data-testid="view-mode-attachments">
              <AttachmentList
                attachments={attachments}
                onDelete={NOOP_DELETE}
                isReadOnly
              />
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && existingCoverUrl && (
        <CoverLightbox
          imageUrl={existingCoverUrl}
          imageAlt={goal.name}
          onClose={() => setIsLightboxOpen(false)}
          triggerRef={coverCircleRef}
        />
      )}
    </div>
  );
}
