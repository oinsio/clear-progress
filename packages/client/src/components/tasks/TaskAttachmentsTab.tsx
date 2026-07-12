/** Implements UX1, FR5 of add-file-attachments */
import { ENTITY_TYPE } from "@/constants";
import { EntityAttachments } from "../shared/EntityAttachments";

interface TaskAttachmentsTabProps {
  taskId: string;
}

/** Implements UX1, FR5 of add-file-attachments */
export function TaskAttachmentsTab({ taskId }: TaskAttachmentsTabProps) {
  return (
    <div className="px-4 py-3">
      <EntityAttachments entityType={ENTITY_TYPE.TASK} entityId={taskId} />
    </div>
  );
}
