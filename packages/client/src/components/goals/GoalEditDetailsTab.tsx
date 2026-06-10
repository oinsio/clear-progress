/**
 * Details tab content for GoalCardEditMode.
 * Renders description input and status segmented control.
 * Implements FR2 of goal-detail-card-refactor.
 */
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Check,
  CircleMinus,
  FileText,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { EditableDescription } from "@/components/ui/EditableDescription";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";

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

interface GoalEditDetailsTabProps {
  editDescription: string;
  editStatus: GoalStatus;
  onDescriptionChange: (description: string) => void;
  onStatusChange: (status: GoalStatus) => void;
}

export function GoalEditDetailsTab({
  editDescription,
  editStatus,
  onDescriptionChange,
  onStatusChange,
}: GoalEditDetailsTabProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Description */}
      <div>
        <label
          htmlFor="goal-edit-description"
          className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1"
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          {t("goal.descriptionLabel")}
        </label>
        <EditableDescription
          value={editDescription}
          onChange={onDescriptionChange}
          placeholder={t("goal.descriptionPlaceholder")}
          data-test-id="goal-description-input"
        />
      </div>

      {/* Status segmented control */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-2">
          <Activity className="w-4 h-4" aria-hidden="true" />
          {t("goal.statusLabel")}
        </label>
        <div className="flex rounded-full border border-accent overflow-hidden">
          {STATUS_OPTIONS.map(({ status: optionStatus, icon: StatusIcon }) => {
            const isSelected = editStatus === optionStatus;
            return (
              <button
                key={optionStatus}
                type="button"
                aria-label={t(`goal.status.${optionStatus}`)}
                aria-pressed={isSelected}
                onClick={() => onStatusChange(optionStatus)}
                className={cn(
                  "flex-1 flex items-center justify-center py-3 transition-colors",
                  isSelected
                    ? "bg-accent text-white"
                    : "text-accent bg-white hover:bg-accent/10",
                )}
              >
                <StatusIcon className="w-[1.125rem] h-[1.125rem]" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
