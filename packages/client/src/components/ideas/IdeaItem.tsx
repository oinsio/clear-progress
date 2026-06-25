/**
 * Implements FR3 of fix-nonsync-indication-for-attachments
 */
import { Pencil } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { DescriptionMarkdown } from "@/components/ui/DescriptionMarkdown";
import { ENTITY_TYPE } from "@/constants";
import { useAttachmentCount } from "@/hooks/useAttachmentCount";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelSide } from "@/hooks/usePanelSide";
import { cn } from "@/shared/lib/cn";
import type { Idea } from "@/types/entities";

interface IdeaItemProps {
  idea: Idea;
  nodeRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  dragHandle?: React.ReactNode;
  onEdit?: () => void;
}

export function IdeaItem({
  idea,
  nodeRef,
  style,
  dragHandle,
  onEdit,
}: IdeaItemProps) {
  const isIdeaUnsynced = useIsUnsynced(idea);
  const { hasUnsyncedAttachments } = useAttachmentCount(
    ENTITY_TYPE.IDEA,
    idea.id,
  );
  const isUnsynced = isIdeaUnsynced || hasUnsyncedAttachments;
  const { panelSide } = usePanelSide();
  const { t } = useTranslation();

  return (
    <li
      ref={nodeRef}
      style={style}
      data-testid="idea-item"
      className={cn(
        panelSide === "left"
          ? "flex items-center border-b border-gray-100 bg-white border-l-2 transition-colors hover:bg-gray-50"
          : "flex items-center border-b border-gray-100 bg-white border-l-[4px] md:border-l-2 transition-colors hover:bg-gray-50",
        isUnsynced ? "border-l-amber-400" : "border-l-transparent",
      )}
    >
      {/* Edit button */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("idea.edit")}
          className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors"
          data-testid="idea-edit-button"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      {/* Main content */}
      <div className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug break-words">
            {idea.name}
          </p>
          {idea.description && (
            <DescriptionMarkdown
              text={idea.description}
              className="text-xs text-gray-500 mt-1 leading-snug"
            />
          )}
        </div>
      </div>

      {/* Drag handle (if provided) */}
      {dragHandle}
    </li>
  );
}
