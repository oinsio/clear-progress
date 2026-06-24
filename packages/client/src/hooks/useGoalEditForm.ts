/**
 * Custom hook encapsulating edit form state and handlers for the goal detail card.
 * Implements FR2 of goal-detail-card-refactor.
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { MAX_COVER_SIZE_BYTES, ROUTES } from "@/constants";
import { useFilePreview } from "@/hooks/useFilePreview";
import { defaultFileService } from "@/services/defaultServices";
import type { GoalStatus } from "@/types/common";
import type { Goal } from "@/types/entities";

const UPLOAD_ERROR_CODE = {
  INVALID_TYPE: "INVALID_TYPE",
  UNRECOGNIZED_FORMAT: "UNRECOGNIZED_FORMAT",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
} as const;

/** Implements FR6 of fix-file-mime-detection */
function mapUploadErrorToMessage(
  errorCode: string,
  t: (key: string) => string,
): string {
  switch (errorCode) {
    case UPLOAD_ERROR_CODE.INVALID_TYPE:
      return t("goal.cover.errorType");
    case UPLOAD_ERROR_CODE.UNRECOGNIZED_FORMAT:
      return t("goal.cover.errorUnrecognized");
    case UPLOAD_ERROR_CODE.FILE_TOO_LARGE:
      return t("goal.cover.errorSize");
    default:
      return t("goal.cover.errorNetwork");
  }
}

interface UseGoalEditFormParams {
  goalId: string | undefined;
  goal: Goal | undefined;
  existingCoverUrl: string | null;
  updateGoal: (changes: Partial<Goal>) => Promise<void>;
  deleteGoal: () => Promise<void>;
  reloadGoal: () => Promise<void>;
  navigate: (path: string) => void;
}

export function useGoalEditForm({
  goalId,
  goal,
  existingCoverUrl,
  updateGoal,
  deleteGoal,
  reloadGoal,
  navigate,
}: UseGoalEditFormParams) {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<GoalStatus>("planning");
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const coverPreviewSrc = useFilePreview({
    pendingCoverFile,
    isCoverRemoved,
    existingCoverUrl,
  });

  const handleStartEdit = useCallback(() => {
    setEditName(goal?.name ?? "");
    setEditDescription(goal?.description ?? "");
    setEditStatus(goal?.status ?? "planning");
    setPendingCoverFile(null);
    setIsCoverRemoved(false);
    setSaveError(null);
    setIsConfirmingDelete(false);
    setIsEditing(true);
  }, [goal]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError(null);
    setIsConfirmingDelete(false);
  }, []);

  const handleCoverSelect = useCallback((file: File) => {
    setPendingCoverFile(file);
    setIsCoverRemoved(false);
  }, []);

  const handleCoverRemove = useCallback(() => {
    setPendingCoverFile(null);
    setIsCoverRemoved(true);
  }, []);

  const canSave = editName.trim().length > 0 && !isSaving;

  const handleSave = useCallback(async () => {
    if (!canSave || !goalId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const originalCoverFileId = goal?.cover_hash ?? "";
      let newCoverFileId = originalCoverFileId;

      if (pendingCoverFile) {
        const uploadResult = await defaultFileService.uploadFile(
          pendingCoverFile,
          goalId,
          MAX_COVER_SIZE_BYTES,
        );
        newCoverFileId = uploadResult.data_hash;
        if (originalCoverFileId && originalCoverFileId !== newCoverFileId) {
          void defaultFileService.deleteFile(originalCoverFileId, goalId);
        }
      } else if (isCoverRemoved) {
        newCoverFileId = "";
        if (originalCoverFileId) {
          void defaultFileService.deleteFile(originalCoverFileId, goalId);
        }
      }

      await updateGoal({
        name: editName.trim(),
        description: editDescription.trim(),
        cover_hash: newCoverFileId,
        status: editStatus,
      });
      void reloadGoal();
      setIsEditing(false);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "";
      setSaveError(mapUploadErrorToMessage(errorCode, t));
    } finally {
      setIsSaving(false);
    }
  }, [
    canSave,
    goalId,
    goal,
    pendingCoverFile,
    isCoverRemoved,
    updateGoal,
    editName,
    editDescription,
    editStatus,
    reloadGoal,
    t,
  ]);

  const handleStatusChange = useCallback((newStatus: GoalStatus) => {
    setEditStatus(newStatus);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteGoal();
    navigate(ROUTES.GOALS);
  }, [deleteGoal, navigate]);

  return {
    isEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editStatus,
    coverPreviewSrc,
    isSaving,
    saveError,
    canSave,
    isConfirmingDelete,
    setIsConfirmingDelete,
    handleStartEdit,
    handleCancelEdit,
    handleCoverSelect,
    handleCoverRemove,
    handleSave,
    handleStatusChange,
    handleDeleteConfirm,
  };
}
