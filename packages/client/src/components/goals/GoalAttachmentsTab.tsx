/** Implements UX2, UX3 of add-file-attachments */
import { ENTITY_TYPE } from "@/constants";
import { EntityAttachments } from "../shared/EntityAttachments";

const I18N_PREFIX = "goal.attachments";

interface GoalAttachmentsTabProps {
  goalId: string;
}

/** Implements UX2, UX3 of add-file-attachments */
export function GoalAttachmentsTab({ goalId }: GoalAttachmentsTabProps) {
  return (
    <div className="px-4 py-3">
      <EntityAttachments
        entityType={ENTITY_TYPE.GOAL}
        entityId={goalId}
        i18nPrefix={I18N_PREFIX}
      />
    </div>
  );
}
