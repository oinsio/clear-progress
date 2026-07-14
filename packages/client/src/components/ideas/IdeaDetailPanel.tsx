/** Implements UX4 of add-file-attachments */
import { FileText, Trash2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EditableDescription } from "@/components/ui/EditableDescription";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { cn } from "@/shared/lib/cn";
import type { Idea } from "@/types/entities";
import { IdeaAttachmentsSection } from "./IdeaAttachmentsSection";

interface IdeaDetailPanelProps {
  idea: Idea;
  onUpdate: (id: string, changes: Partial<Idea>) => Promise<void>;
  onDelete: (id: string) => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function IdeaDetailPanel({
  idea,
  onUpdate,
  onDelete,
  onClose,
  className,
  style,
}: IdeaDetailPanelProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(idea.name);
  const [description, setDescription] = useState(idea.description);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const nameTextareaRef = useAutoResizeTextarea(name);

  useEffect(() => {
    setName(idea.name);
    setDescription(idea.description);
    setIsConfirmingDelete(false);
  }, [idea.name, idea.description]);

  const handleNameBlur = useCallback(async () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== idea.name) {
      await onUpdate(idea.id, { name: trimmedName });
    }
  }, [name, idea.name, idea.id, onUpdate]);

  const handleDescriptionBlur = useCallback(async () => {
    if (description !== idea.description) {
      await onUpdate(idea.id, { description });
    }
  }, [description, idea.description, idea.id, onUpdate]);

  const handleDeleteClick = useCallback(() => {
    setIsConfirmingDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(idea.id);
    onClose();
  }, [idea.id, onDelete, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  return (
    <div
      data-testid="idea-detail-panel"
      className={cn(
        "border-l border-gray-100 flex flex-col h-full bg-white overflow-hidden relative",
        className,
      )}
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label={t("idea.deleteLabel")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-[1.125rem] h-[1.125rem]" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              {t("common.name")}
            </label>
            <textarea
              ref={nameTextareaRef}
              rows={1}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => void handleNameBlur()}
              placeholder={t("idea.namePlaceholder")}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none overflow-hidden"
              data-testid="idea-detail-name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" aria-hidden="true" />
              {t("idea.descriptionLabel")}
            </label>
            <EditableDescription
              value={description}
              onChange={setDescription}
              onBlur={() => void handleDescriptionBlur()}
              placeholder={t("idea.descriptionPlaceholder")}
              data-test-id="idea-detail-description"
            />
          </div>

          {/* Attachments */}
          <IdeaAttachmentsSection ideaId={idea.id} />
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {isConfirmingDelete && (
        <div
          data-testid="idea-detail-delete-confirm"
          className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-4 px-6"
        >
          <p className="text-base font-medium text-gray-800 text-center">
            {t("idea.deleteConfirmName")}
          </p>
          <p className="text-sm text-gray-500 text-center">{idea.name}</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              data-testid="idea-detail-delete-cancel"
              onClick={handleDeleteCancel}
              aria-label={t("common.cancel")}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              data-testid="idea-detail-delete-confirm-btn"
              onClick={handleDeleteConfirm}
              aria-label={t("common.delete")}
              className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
