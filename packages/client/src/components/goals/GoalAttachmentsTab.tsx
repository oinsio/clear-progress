/** Implements UX2, UX3 of add-file-attachments */
import { EntityAttachments } from "../shared/EntityAttachments";

const ENTITY_TYPE_GOAL = "goal" as const;
const I18N_PREFIX = "goal.attachments";

interface GoalAttachmentsTabProps {
  goalId: string;
}

/** Implements UX2, UX3 of add-file-attachments */
export function GoalAttachmentsTab({ goalId }: GoalAttachmentsTabProps) {
  return (
    <div className="px-4 py-3">
      <EntityAttachments
        entityType={ENTITY_TYPE_GOAL}
        entityId={goalId}
        i18nPrefix={I18N_PREFIX}
      />
    </div>
  );
}
