/** Implements UX1, FR5 of add-file-attachments */
import { EntityAttachments } from "../shared/EntityAttachments";

const ENTITY_TYPE_TASK = "task" as const;
const I18N_PREFIX = "task.attachments";

interface TaskAttachmentsTabProps {
  taskId: string;
}

/** Implements UX1, FR5 of add-file-attachments */
export function TaskAttachmentsTab({ taskId }: TaskAttachmentsTabProps) {
  return (
    <div className="px-4 py-3">
      <EntityAttachments
        entityType={ENTITY_TYPE_TASK}
        entityId={taskId}
        i18nPrefix={I18N_PREFIX}
      />
    </div>
  );
}
