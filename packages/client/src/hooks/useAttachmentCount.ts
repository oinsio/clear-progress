/**
 * Implements FR11, NFR-P1 of task-detail-page-ui-improvements
 * Implements FR1, NFR-P1 of fix-nonsync-indication-for-attachments
 */
import type { EntityType } from "@clear-progress/contract";
import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/db/database";

export interface UseAttachmentCountReturn {
  attachmentCount: number;
  hasUnsyncedAttachments: boolean;
  isLoading: boolean;
}

/**
 * Implements FR11, NFR-P1 of task-detail-page-ui-improvements
 * Implements FR1, NFR-P1 of fix-nonsync-indication-for-attachments
 */
export function useAttachmentCount(
  entityType: EntityType,
  entityId: string,
): UseAttachmentCountReturn {
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [hasUnsyncedAttachments, setHasUnsyncedAttachments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setAttachmentCount(0);
      setHasUnsyncedAttachments(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const subscription = liveQuery(async () => {
      const baseQuery = db.attachments
        .where("[entity_type+entity_id]")
        .equals([entityType, entityId])
        .filter((attachment) => !attachment.is_deleted);

      const [count, unsyncedCount] = await Promise.all([
        baseQuery.count(),
        baseQuery.filter((attachment) => attachment.needsSync).count(),
      ]);

      return { count, unsyncedCount };
    }).subscribe({
      next: ({ count, unsyncedCount }) => {
        setAttachmentCount(count);
        setHasUnsyncedAttachments(unsyncedCount > 0);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [entityType, entityId]);

  return { attachmentCount, hasUnsyncedAttachments, isLoading };
}
