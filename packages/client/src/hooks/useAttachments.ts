/** Implements FR5 of add-file-attachments */
import type { EntityType } from "@clear-progress/contract";
import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { Attachment } from "@/types/entities";

const defaultAttachmentRepository = new AttachmentRepository();

export interface UseAttachmentsReturn {
  attachments: Attachment[];
  isLoading: boolean;
}

/** Implements FR5 of add-file-attachments */
export function useAttachments(
  entityType: EntityType,
  entityId: string,
  attachmentRepository: AttachmentRepository = defaultAttachmentRepository,
): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setAttachments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const subscription = liveQuery(() =>
      attachmentRepository.getByEntityTypeAndId(entityType, entityId),
    ).subscribe({
      next: (entityAttachments) => {
        setAttachments(entityAttachments);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [entityType, entityId, attachmentRepository]);

  return { attachments, isLoading };
}
