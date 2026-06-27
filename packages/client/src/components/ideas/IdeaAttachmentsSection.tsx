/** Implements UX4, FR5 of add-file-attachments */
import { useTranslation } from "react-i18next";
import { ENTITY_TYPE } from "@/constants";
import { EntityAttachments } from "../shared/EntityAttachments";

const I18N_PREFIX = "idea.attachments";

interface IdeaAttachmentsSectionProps {
  ideaId: string;
}

/** Implements UX4, FR5 of add-file-attachments */
export function IdeaAttachmentsSection({
  ideaId,
}: IdeaAttachmentsSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">
        {t("task.tabs.attachments")}
      </label>

      <EntityAttachments
        entityType={ENTITY_TYPE.IDEA}
        entityId={ideaId}
        i18nPrefix={I18N_PREFIX}
      />
    </div>
  );
}
