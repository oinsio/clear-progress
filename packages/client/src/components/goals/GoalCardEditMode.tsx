/**
 * Edit mode card for goal detail page.
 * Renders cover picker, name input (always visible), Details/Attachments tabs, footer buttons.
 * Implements FR2 of goal-detail-card-refactor.
 * Implements UX2, UX3 of add-file-attachments.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GoalAttachmentsTab } from "@/components/goals/GoalAttachmentsTab";
import { GoalCoverPicker } from "@/components/goals/GoalCoverPicker";
import { TAB_ICONS } from "@/components/tasks/taskEditShared";
import { ENTITY_TYPE } from "@/constants";
import { useAttachmentCount } from "@/hooks/useAttachmentCount";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { cn } from "@/shared/lib/cn";
import type { GoalStatus } from "@/types/common";
import { GoalEditDetailsTab } from "./GoalEditDetailsTab";

const GOAL_EDIT_TAB = {
  DETAILS: "details",
  ATTACHMENTS: "attachments",
} as const;

type GoalEditTab = (typeof GOAL_EDIT_TAB)[keyof typeof GOAL_EDIT_TAB];

interface GoalCardEditModeProps {
  goalId: string;
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
  goalId,
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
  const { attachmentCount } = useAttachmentCount(ENTITY_TYPE.GOAL, goalId);
  const editNameTextareaRef = useAutoResizeTextarea(editName);
  const [activeTab, setActiveTab] = useState<GoalEditTab>(
    GOAL_EDIT_TAB.DETAILS,
  );

  return (
    <div className="px-4 pt-4 flex flex-col gap-4">
      {/* Top section: Cover + Name (always visible) */}
      <div className="flex items-center gap-3">
        <GoalCoverPicker
          previewSrc={coverPreviewSrc}
          onFileSelect={onCoverSelect}
          onRemove={onCoverRemove}
        />
        <div className="flex-1">
          <label htmlFor="goal-edit-name" className="sr-only">
            {t("common.name")}
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

      {/* Tab switcher — Implements FR5 of task-detail-page-ui-improvements */}
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="goal-tab-details"
          onClick={() => setActiveTab(GOAL_EDIT_TAB.DETAILS)}
          className={cn(
            "py-1.5 text-sm rounded-full border transition-colors flex items-center justify-center gap-1.5",
            activeTab === GOAL_EDIT_TAB.DETAILS
              ? "flex-1 bg-accent text-white border-accent"
              : "flex-shrink-0 px-3 text-accent border-accent/40 hover:bg-accent/5",
          )}
        >
          <TAB_ICONS.details className="w-4 h-4" aria-hidden="true" />
          {activeTab === GOAL_EDIT_TAB.DETAILS && t("common.details")}
        </button>
        <button
          type="button"
          data-testid="goal-tab-attachments"
          onClick={() => setActiveTab(GOAL_EDIT_TAB.ATTACHMENTS)}
          className={cn(
            "py-1.5 text-sm rounded-full border transition-colors flex items-center justify-center gap-1.5",
            activeTab === GOAL_EDIT_TAB.ATTACHMENTS
              ? "flex-1 bg-accent text-white border-accent"
              : "flex-shrink-0 px-3 text-accent border-accent/40 hover:bg-accent/5",
          )}
        >
          <TAB_ICONS.attachments className="w-4 h-4" aria-hidden="true" />
          {activeTab === GOAL_EDIT_TAB.ATTACHMENTS && t("common.attachments")}
          {attachmentCount > 0 && (
            <span
              className="text-xs"
              aria-label={t("taskEdit.attachmentsBadgeAriaLabel", {
                count: attachmentCount,
              })}
            >
              {attachmentCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === GOAL_EDIT_TAB.DETAILS && (
        <GoalEditDetailsTab
          editDescription={editDescription}
          editStatus={editStatus}
          onDescriptionChange={onDescriptionChange}
          onStatusChange={onStatusChange}
        />
      )}

      {activeTab === GOAL_EDIT_TAB.ATTACHMENTS && (
        <GoalAttachmentsTab goalId={goalId} />
      )}

      {/* Save error */}
      {saveError && (
        <p
          data-testid="goal-save-error"
          className="text-sm text-red-500"
          role="alert"
        >
          {saveError}
        </p>
      )}

      {/* Footer buttons (always visible) */}
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          onClick={onDeleteRequest}
          aria-label={t("common.delete")}
          data-testid="goal-delete-button"
          className="flex-1 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          {t("common.delete")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("common.cancel")}
          className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          aria-label={t("common.save")}
          data-testid="goal-save-button"
          className="flex-1 py-2.5 text-sm text-white bg-accent rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? t("goal.cover.uploading") : t("common.save")}
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
              aria-label={t("common.cancel")}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              data-testid="goal-delete-confirm-btn"
              onClick={onDeleteConfirm}
              aria-label={t("common.delete")}
              className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
