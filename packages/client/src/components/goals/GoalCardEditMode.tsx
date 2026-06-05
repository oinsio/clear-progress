/**
 * Edit mode card for goal detail page.
 * Renders cover picker, name/description inputs, status control, save/delete buttons.
 * Implements FR2 of goal-detail-card-refactor.
 */
import type { LucideIcon } from "lucide-react";
import { Check, CircleMinus, Pause, Play, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GoalCoverPicker } from "@/components/goals/GoalCoverPicker";
import { EditableDescription } from "@/components/ui/EditableDescription";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
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

interface GoalCardEditModeProps {
  coverPreviewSrc: string | null;
  editName: string;
  editDescription: string;
  editStatus: GoalStatus;
  isSaving: boolean;
  saveError: string | null;
  canSave: boolean;
  isConfirmingDelete: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onStatusChange: (status: GoalStatus) => void;
  onCoverSelect: (file: File) => void;
  onCoverRemove: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function GoalCardEditMode({
  coverPreviewSrc,
  editName,
  editDescription,
  editStatus,
  isSaving,
  saveError,
  canSave,
  isConfirmingDelete,
  onNameChange,
  onDescriptionChange,
  onStatusChange,
  onCoverSelect,
  onCoverRemove,
  onSave,
  onCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: GoalCardEditModeProps) {
  const { t } = useTranslation();
  const editNameTextareaRef = useAutoResizeTextarea(editName);

  return (
    <div className="px-4 pt-4 flex flex-col gap-4">
      {/* Cover + Name row */}
      <div className="flex items-center gap-3">
        <GoalCoverPicker
          previewSrc={coverPreviewSrc}
          onFileSelect={onCoverSelect}
          onRemove={onCoverRemove}
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
            onChange={(e) => onNameChange(e.target.value)}
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
          onChange={onDescriptionChange}
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

      {/* Save error */}
      {saveError && (
        <p data-testid="goal-save-error" className="text-sm text-red-500">
          {saveError}
        </p>
      )}

      {/* Footer buttons */}
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          onClick={onDeleteRequest}
          aria-label={t("goal.delete")}
          data-testid="goal-delete-button"
          className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          {t("goal.delete")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("goal.cancel")}
          className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {t("goal.cancel")}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          aria-label={t("goal.save")}
          data-testid="goal-save-button"
          className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? t("goal.cover.uploading") : t("goal.save")}
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
          <p className="text-sm text-gray-500 text-center">{editName}</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              data-testid="goal-delete-cancel"
              onClick={onDeleteCancel}
              aria-label={t("goal.cancel")}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("goal.cancel")}
            </button>
            <button
              type="button"
              data-testid="goal-delete-confirm-btn"
              onClick={onDeleteConfirm}
              aria-label={t("goal.delete")}
              className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
            >
              {t("goal.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
