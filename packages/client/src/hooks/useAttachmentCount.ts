/** Implements FR11, NFR-P1 of task-detail-page-ui-improvements */
import type { EntityType } from "@clear-progress/contract";
import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/db/database";

export interface UseAttachmentCountReturn {
  attachmentCount: number;
  isLoading: boolean;
}

/** Implements FR11, NFR-P1 of task-detail-page-ui-improvements */
export function useAttachmentCount(
  entityType: EntityType,
  entityId: string,
): UseAttachmentCountReturn {
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setAttachmentCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const subscription = liveQuery(() =>
      db.attachments
        .where("[entity_type+entity_id]")
        .equals([entityType, entityId])
        .filter((attachment) => !attachment.is_deleted)
        .count(),
    ).subscribe({
      next: (count) => {
        setAttachmentCount(count);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [entityType, entityId]);

  return { attachmentCount, isLoading };
}
