import type React from "react";
import { useCallback, useState } from "react";
import { useFileUrl } from "@/hooks/useFileUrl";
import type { Attachment } from "@/types/entities";
import { AttachmentListItem } from "./AttachmentListItem";
import { FileLightbox } from "./FileLightbox";

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete: (attachmentId: string) => void;
  isReadOnly?: boolean;
}

/** Implements FR11, FR12 of add-file-attachments */
export function AttachmentList({
  attachments,
  onDelete,
  isReadOnly = false,
}: AttachmentListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null,
  );
  const [triggerRef, setTriggerRef] =
    useState<React.RefObject<HTMLElement | null> | null>(null);

  const handlePreview = useCallback(
    (
      attachment: Attachment,
      buttonRef: React.RefObject<HTMLElement | null>,
    ) => {
      setPreviewAttachment(attachment);
      setTriggerRef(buttonRef);
    },
    [],
  );

  const handleCloseLightbox = useCallback(() => {
    setPreviewAttachment(null);
    setTriggerRef(null);
  }, []);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <ul
        className="flex flex-col gap-2"
        data-testid="attachment-list"
        aria-label="Attachments"
      >
        {attachments.map((attachment) => (
          <AttachmentListItem
            key={attachment.id}
            attachment={attachment}
            onDelete={onDelete}
            onPreview={handlePreview}
            isReadOnly={isReadOnly}
          />
        ))}
      </ul>

      {previewAttachment && triggerRef && (
        <LightboxWithUrl
          attachment={previewAttachment}
          triggerRef={triggerRef}
          onClose={handleCloseLightbox}
        />
      )}
    </>
  );
}

interface LightboxWithUrlProps {
  attachment: Attachment;
  triggerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

function LightboxWithUrl({
  attachment,
  triggerRef,
  onClose,
}: LightboxWithUrlProps) {
  const { url } = useFileUrl(attachment.data_hash);

  if (!url) return null;

  return (
    <FileLightbox
      url={url}
      mimeType={attachment.mime_type}
      filename={attachment.filename}
      onClose={onClose}
      triggerRef={triggerRef}
    />
  );
}
