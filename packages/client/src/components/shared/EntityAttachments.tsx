/** Implements UX1, UX2, UX4, FR5 of add-file-attachments, FR6 of attachment-drag-and-drop */

import type { EntityType } from "@clear-progress/contract";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSync } from "@/app/providers/SyncProvider";
import { useAttachments } from "@/hooks/useAttachments";
import { defaultAttachmentService } from "@/services/defaultServices";
import type { Attachment } from "@/types/entities";
import { AttachFileButton } from "./AttachFileButton";
import { AttachmentList } from "./AttachmentList";
import { ConfirmDialog } from "./ConfirmDialog";
import { FileDropZone } from "./FileDropZone";

interface EntityAttachmentsProps {
  entityType: EntityType;
  entityId: string;
}

/** Implements UX1, UX2, UX4, FR5 of add-file-attachments, FR6 of attachment-drag-and-drop */
export function EntityAttachments({
  entityType,
  entityId,
}: EntityAttachmentsProps) {
  const { t } = useTranslation();
  const { schedulePush } = useSync();
  const { attachments } = useAttachments(entityType, entityId);
  const [deletingAttachment, setDeletingAttachment] =
    useState<Attachment | null>(null);

  const handleFileSelected = useCallback(
    async (file: File) => {
      await defaultAttachmentService.attachFile(file, entityType, entityId);
      schedulePush();
    },
    [entityType, entityId, schedulePush],
  );

  const handleFilesAccepted = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        await defaultAttachmentService.attachFile(file, entityType, entityId);
      }
      schedulePush();
    },
    [entityType, entityId, schedulePush],
  );

  const handleDeleteRequest = useCallback(
    (attachmentId: string) => {
      const found = attachments.find(
        (attachment) => attachment.id === attachmentId,
      );
      if (found) {
        setDeletingAttachment(found);
      }
    },
    [attachments],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingAttachment) return;
    await defaultAttachmentService.deleteAttachment(deletingAttachment.id);
    setDeletingAttachment(null);
    schedulePush();
  }, [deletingAttachment, schedulePush]);

  const handleDeleteCancel = useCallback(() => {
    setDeletingAttachment(null);
  }, []);

  return (
    <FileDropZone onFilesAccepted={handleFilesAccepted}>
      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          {t("attachment.empty")}
        </p>
      ) : (
        <AttachmentList
          attachments={attachments}
          onDelete={handleDeleteRequest}
        />
      )}

      <AttachFileButton
        onFileSelected={handleFileSelected}
        className={attachments.length > 0 ? "mt-3" : ""}
      />

      {deletingAttachment && (
        <ConfirmDialog
          title={t("attachment.confirmDelete")}
          message={t("attachment.confirmDeleteMessage")}
          confirmLabel={t("attachment.confirmDeleteButton")}
          variant="danger"
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={handleDeleteCancel}
        />
      )}
    </FileDropZone>
  );
}
