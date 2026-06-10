import { Pin, Trash2, X } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttachments } from "@/hooks/useAttachments";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useChecklist } from "@/hooks/useChecklist";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useTaskEditLabels } from "@/hooks/useTaskEditLabels";
import { useTaskFormState } from "@/hooks/useTaskFormState";
import { cn } from "@/shared/lib/cn";
import type { Box } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { parseRepeatRule } from "@/utils/repeatRule";
import { TaskAttachmentsTab } from "./TaskAttachmentsTab";
import { TaskChecklistTab } from "./TaskChecklistTab";
import { TaskDetailsTab } from "./TaskDetailsTab";
import {
  ACTIVE_TAB,
  type ActiveTab,
  type SelectorType,
  TAB_ICONS,
} from "./taskEditShared";

const ENTITY_TYPE_TASK = "task" as const;

interface TaskDetailPanelProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onClose: () => void;
  onDuplicate: (id: string) => Promise<void>;
  className?: string;
  style?: React.CSSProperties;
}

export function TaskDetailPanel({
  task,
  goals,
  contexts,
  categories,
  onUpdate,
  onMove,
  onDelete,
  onClose,
  onDuplicate,
  className,
  style,
}: TaskDetailPanelProps) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const { isDetailPanelPinned, setDetailPanelPinned } = useDetailPanelPinned();
  const {
    name,
    setName,
    description,
    setDescription,
    selectedGoalId,
    setSelectedGoalId,
    selectedContextId,
    setSelectedContextId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedBox,
    setSelectedBox,
    selectedRepeatRule,
    setSelectedRepeatRule,
  } = useTaskFormState(task);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ACTIVE_TAB.DETAILS);
  const [openSelector, setOpenSelector] = useState<SelectorType | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const nameTextareaRef = useAutoResizeTextarea(name);

  const {
    items,
    progress,
    createItem,
    toggleItem,
    deleteItem,
    updateItem,
    reorderItems,
  } = useChecklist(task.id);

  const { attachments } = useAttachments(ENTITY_TYPE_TASK, task.id);
  const attachmentCount = attachments.length;

  const DetailsTabIcon = TAB_ICONS.details;
  const ChecklistTabIcon = TAB_ICONS.checklist;
  const AttachmentsTabIcon = TAB_ICONS.attachments;

  // Reset state when selected task changes
  useEffect(() => {
    setName(task.name);
    setDescription(task.description);
    setSelectedGoalId(task.goal_id);
    setSelectedContextId(task.context_id);
    setSelectedCategoryId(task.category_id);
    setSelectedBox(task.box);
    setSelectedRepeatRule(parseRepeatRule(task.repeat_rule));
    setActiveTab(ACTIVE_TAB.DETAILS);
    setOpenSelector(null);
    setIsConfirmingDelete(false);
  }, [
    task.name,
    task.description,
    task.goal_id,
    task.context_id,
    task.category_id,
    task.box,
    task.repeat_rule,
    setName,
    setDescription,
    setSelectedGoalId,
    setSelectedContextId,
    setSelectedCategoryId,
    setSelectedBox,
    setSelectedRepeatRule,
  ]);

  const handleNameBlur = useCallback(async () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== task.name) {
      await onUpdate(task.id, { name: trimmedName });
    }
  }, [name, task.name, task.id, onUpdate]);

  const {
    selectedGoalName,
    selectedContextName,
    selectedCategoryName,
    checklistTabLabel,
  } = useTaskEditLabels(
    selectedGoalId,
    selectedContextId,
    selectedCategoryId,
    goals,
    contexts,
    categories,
    progress,
  );

  return (
    <div
      data-testid="task-detail-panel"
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
          onClick={() => setIsConfirmingDelete(true)}
          aria-label={t("taskDetail.delete")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          {isDesktop && (
            <button
              type="button"
              data-testid="pin-detail-panel-button"
              onClick={() => setDetailPanelPinned(!isDetailPanelPinned)}
              aria-label={
                isDetailPanelPinned
                  ? t("taskDetail.unpin")
                  : t("taskDetail.pin")
              }
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Pin
                className={cn(
                  "w-4 h-4 transition-transform",
                  isDetailPanelPinned ? "fill-current" : "rotate-45",
                )}
              />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("taskDetail.close")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-[1.125rem] h-[1.125rem]" />
          </button>
        </div>
      </div>

      {/* Name field */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <label className="text-xs font-medium text-gray-500 mb-1 block">
          {t("taskEdit.fieldName")}
        </label>
        <textarea
          ref={nameTextareaRef}
          rows={1}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => void handleNameBlur()}
          placeholder={t("task.namePlaceholder")}
          className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none overflow-hidden"
          data-testid="task-detail-name"
        />
      </div>

      {/* Tab switcher */}
      <div className="flex px-4 pt-3 pb-1 gap-2 flex-shrink-0">
        <button
          type="button"
          data-testid="tab-details"
          onClick={() => setActiveTab(ACTIVE_TAB.DETAILS)}
          className={cn(
            "flex-1 py-1.5 text-sm rounded-full border transition-colors flex items-center justify-center gap-1.5",
            activeTab === ACTIVE_TAB.DETAILS
              ? "bg-accent text-white border-accent"
              : "text-accent border-accent/40 hover:bg-accent/5",
          )}
        >
          <DetailsTabIcon className="w-4 h-4" aria-hidden="true" />
          {t("taskEdit.tabDetails")}
        </button>
        <button
          type="button"
          data-testid="tab-checklist"
          onClick={() => setActiveTab(ACTIVE_TAB.CHECKLIST)}
          className={cn(
            "flex-1 py-1.5 text-sm rounded-full border transition-colors flex items-center justify-center gap-1.5",
            activeTab === ACTIVE_TAB.CHECKLIST
              ? "bg-accent text-white border-accent"
              : "text-accent border-accent/40 hover:bg-accent/5",
          )}
        >
          <ChecklistTabIcon className="w-4 h-4" aria-hidden="true" />
          {checklistTabLabel}
        </button>
        <button
          type="button"
          data-testid="tab-attachments"
          onClick={() => setActiveTab(ACTIVE_TAB.ATTACHMENTS)}
          className={cn(
            "flex-1 py-1.5 text-sm rounded-full border transition-colors flex items-center justify-center gap-1.5",
            activeTab === ACTIVE_TAB.ATTACHMENTS
              ? "bg-accent text-white border-accent"
              : "text-accent border-accent/40 hover:bg-accent/5",
          )}
        >
          <AttachmentsTabIcon className="w-4 h-4" aria-hidden="true" />
          {t("task.tabs.attachments")}
          {attachmentCount > 0 && (
            <span className="ml-1 text-xs">({attachmentCount})</span>
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === ACTIVE_TAB.DETAILS && (
          <TaskDetailsTab
            task={task}
            onUpdate={onUpdate}
            onMove={onMove}
            onDuplicate={onDuplicate}
            description={description}
            setDescription={setDescription}
            selectedBox={selectedBox}
            setSelectedBox={setSelectedBox}
            selectedGoalId={selectedGoalId}
            setSelectedGoalId={setSelectedGoalId}
            selectedGoalName={selectedGoalName}
            selectedContextId={selectedContextId}
            setSelectedContextId={setSelectedContextId}
            selectedContextName={selectedContextName}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedCategoryName={selectedCategoryName}
            selectedRepeatRule={selectedRepeatRule}
            setSelectedRepeatRule={setSelectedRepeatRule}
            goals={goals}
            contexts={contexts}
            categories={categories}
            openSelector={openSelector}
            onOpenSelector={setOpenSelector}
            onCloseSelector={() => setOpenSelector(null)}
          />
        )}

        {activeTab === ACTIVE_TAB.CHECKLIST && (
          <TaskChecklistTab
            items={items}
            createItem={createItem}
            toggleItem={toggleItem}
            deleteItem={deleteItem}
            updateItem={updateItem}
            reorderItems={reorderItems}
          />
        )}

        {activeTab === ACTIVE_TAB.ATTACHMENTS && (
          <TaskAttachmentsTab taskId={task.id} />
        )}
      </div>

      {/* Delete confirmation overlay */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-base font-medium text-gray-800 text-center">
            {t("taskEdit.deleteConfirmName")}
          </p>
          <p className="text-sm text-gray-500 text-center">{task.name}</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("taskEdit.deleteConfirmCancel")}
            </button>
            <button
              type="button"
              data-testid="task-detail-delete-confirm-btn"
              onClick={() => onDelete(task.id)}
              className="flex-1 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
            >
              {t("taskEdit.deleteConfirmOk")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
