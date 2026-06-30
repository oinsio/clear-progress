import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditableDescription } from "@/components/ui/EditableDescription";
import { useRepeatRuleChangeDialog } from "@/hooks/useRepeatRuleChangeDialog";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/shared/lib/cn";
import type { Box, RepeatRule } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { formatRepeatRuleLabel, isRepeatRuleInvalid } from "@/utils/repeatRule";
import { DrillDownRow } from "./DrillDownRow";
import { type SelectorOption, TaskDetailSelector } from "./TaskDetailSelector";
import {
  BOX_ICONS,
  BOX_OPTIONS,
  SELECTOR_TYPE,
  type SelectorType,
  TASK_DETAIL_ICONS,
} from "./taskEditShared";

interface TaskDetailsTabProps {
  task: Task;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  description: string;
  setDescription: (value: string) => void;
  selectedBox: Box;
  setSelectedBox: (box: Box) => void;
  selectedGoalId: string;
  setSelectedGoalId: (id: string) => void;
  selectedGoalName: string;
  selectedContextId: string;
  setSelectedContextId: (id: string) => void;
  selectedContextName: string;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  selectedCategoryName: string;
  selectedRepeatRule: RepeatRule | null;
  setSelectedRepeatRule: (rule: RepeatRule | null) => void;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  openSelector: SelectorType | null;
  onOpenSelector: (selector: SelectorType) => void;
  onCloseSelector: () => void;
}

export function TaskDetailsTab({
  task,
  onUpdate,
  onMove,
  onDuplicate,
  description,
  setDescription,
  selectedBox,
  setSelectedBox,
  selectedGoalId,
  setSelectedGoalId,
  selectedGoalName,
  selectedContextId,
  setSelectedContextId,
  selectedContextName,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedCategoryName,
  selectedRepeatRule,
  setSelectedRepeatRule,
  goals,
  contexts,
  categories,
  openSelector,
  onOpenSelector,
  onCloseSelector,
}: TaskDetailsTabProps) {
  const { t } = useTranslation();
  const { defaultBox } = useSettings();
  const DescriptionIcon = TASK_DETAIL_ICONS.description;
  const DuplicateIcon = TASK_DETAIL_ICONS.duplicate;

  // Implements FR3, UX1 of detect-invalid-repeat-rule
  const isInvalidRule = isRepeatRuleInvalid(task);

  // Implements FR6, UX1, UX2 of repeating-task-rule-change
  const {
    pendingRuleChange,
    handleRepeatChange,
    handleRuleChangeConfirm,
    handleRuleChangeCancel,
  } = useRepeatRuleChangeDialog(
    task,
    selectedRepeatRule,
    setSelectedRepeatRule,
    onUpdate,
    onCloseSelector,
  );

  const handleDescriptionBlur = useCallback(async () => {
    if (description !== task.description) {
      await onUpdate(task.id, { description });
    }
  }, [description, task.description, task.id, onUpdate]);
  const handleBoxChange = useCallback(
    async (box: Box) => {
      setSelectedBox(box);
      await onMove(task.id, box);
    },
    [task.id, onMove, setSelectedBox],
  );

  const handleGoalChange = useCallback(
    async (goalId: string) => {
      setSelectedGoalId(goalId);
      onCloseSelector();
      await onUpdate(task.id, { goal_id: goalId });
    },
    [task.id, onUpdate, setSelectedGoalId, onCloseSelector],
  );

  const handleContextChange = useCallback(
    async (contextId: string) => {
      setSelectedContextId(contextId);
      onCloseSelector();
      await onUpdate(task.id, { context_id: contextId });
    },
    [task.id, onUpdate, setSelectedContextId, onCloseSelector],
  );

  const handleCategoryChange = useCallback(
    async (categoryId: string) => {
      setSelectedCategoryId(categoryId);
      onCloseSelector();
      await onUpdate(task.id, { category_id: categoryId });
    },
    [task.id, onUpdate, setSelectedCategoryId, onCloseSelector],
  );

  const handleHide = useCallback(
    async (date: string) => {
      await onUpdate(task.id, { is_hidden: true, appear_date: date });
      onCloseSelector();
    },
    [task.id, onUpdate, onCloseSelector],
  );
  const handleUnhide = useCallback(async () => {
    await onUpdate(task.id, { is_hidden: false, appear_date: "" });
    onCloseSelector();
  }, [task.id, onUpdate, onCloseSelector]);
  const handleDuplicateTask = useCallback(async () => {
    await onDuplicate(task.id);
  }, [task.id, onDuplicate]);

  const goalOptions: SelectorOption[] = goals.map((goal) => ({
    id: goal.id,
    label: goal.name,
  }));
  const contextOptions: SelectorOption[] = contexts.map((context) => ({
    id: context.id,
    label: context.name,
  }));
  const categoryOptions: SelectorOption[] = categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));

  // Implements FR6, UX1, UX2 of repeating-task-rule-change
  if (pendingRuleChange) {
    return (
      <ConfirmDialog
        title={t("repeat.confirmChangeTitle")}
        message={t("repeat.confirmChangeMessage", {
          nextDate: pendingRuleChange.nextDate,
        })}
        confirmLabel={t("repeat.confirmChangeButton")}
        onConfirm={() => void handleRuleChangeConfirm()}
        onCancel={handleRuleChangeCancel}
      />
    );
  }

  if (openSelector !== null) {
    return (
      <TaskDetailSelector
        task={task}
        openSelector={openSelector}
        selectedRepeatRule={selectedRepeatRule}
        selectedGoalId={selectedGoalId}
        selectedContextId={selectedContextId}
        selectedCategoryId={selectedCategoryId}
        goalOptions={goalOptions}
        contextOptions={contextOptions}
        categoryOptions={categoryOptions}
        defaultBox={defaultBox}
        onClose={onCloseSelector}
        onGoalChange={(id) => void handleGoalChange(id)}
        onContextChange={(id) => void handleContextChange(id)}
        onCategoryChange={(id) => void handleCategoryChange(id)}
        onRepeatChange={(rule) => void handleRepeatChange(rule)}
        onHide={handleHide}
        onUnhide={handleUnhide}
      />
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
          <DescriptionIcon className="w-4 h-4" aria-hidden="true" />
          {t("taskEdit.fieldDescription")}
        </label>
        <EditableDescription
          value={description}
          onChange={setDescription}
          onBlur={() => void handleDescriptionBlur()}
          placeholder={t("taskEdit.descriptionPlaceholder")}
          data-test-id="task-detail-description"
        />
      </div>

      {/* Box selector */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">
          {t("taskEdit.fieldBox")}
        </label>
        <div className="flex gap-1">
          {BOX_OPTIONS.map((box) => {
            const BoxIcon = BOX_ICONS[box];
            const isBoxSelected = selectedBox === box;
            return (
              <button
                key={box}
                type="button"
                aria-label={t(`box.${box}`)}
                aria-pressed={isBoxSelected}
                onClick={() => void handleBoxChange(box)}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                  isBoxSelected
                    ? "text-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                )}
              >
                <BoxIcon className="w-7 h-7" />
              </button>
            );
          })}
        </div>
      </div>

      {goals.length > 0 && (
        <DrillDownRow
          icon={TASK_DETAIL_ICONS.goal}
          label={t("selector.goal")}
          value={selectedGoalName}
          hasValue={!!selectedGoalId}
          onClick={() => onOpenSelector(SELECTOR_TYPE.GOAL)}
          testId="task-detail-goal-select"
        />
      )}

      {contexts.length > 0 && (
        <DrillDownRow
          icon={TASK_DETAIL_ICONS.context}
          label={t("selector.context")}
          value={selectedContextName}
          hasValue={!!selectedContextId}
          onClick={() => onOpenSelector(SELECTOR_TYPE.CONTEXT)}
        />
      )}

      {categories.length > 0 && (
        <DrillDownRow
          icon={TASK_DETAIL_ICONS.category}
          label={t("selector.category")}
          value={selectedCategoryName}
          hasValue={!!selectedCategoryId}
          onClick={() => onOpenSelector(SELECTOR_TYPE.CATEGORY)}
        />
      )}

      <DrillDownRow
        icon={TASK_DETAIL_ICONS.repeat}
        label={t("taskEdit.fieldRepeat")}
        value={
          isInvalidRule
            ? t("repeat.ruleNotRecognized")
            : selectedRepeatRule
              ? formatRepeatRuleLabel(selectedRepeatRule, t)
              : t("repeat.none")
        }
        hasValue={!!selectedRepeatRule || isInvalidRule}
        valueClassName={isInvalidRule ? "text-amber-600" : undefined}
        onClick={() => onOpenSelector(SELECTOR_TYPE.REPEAT)}
        testId="repeat-rule-row"
      />

      {!task.repeat_rule && (
        <DrillDownRow
          icon={TASK_DETAIL_ICONS.hide}
          label={t("task.hideUntil")}
          value={task.is_hidden ? task.appear_date : ""}
          hasValue={task.is_hidden}
          onClick={() => onOpenSelector(SELECTOR_TYPE.HIDE)}
        />
      )}

      {/* Duplicate button */}
      <button
        type="button"
        onClick={() => void handleDuplicateTask()}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm text-accent border border-accent/40 rounded-lg hover:bg-accent/5 transition-colors mt-2"
      >
        <DuplicateIcon className="w-4 h-4" aria-hidden="true" />
        {t("taskEdit.duplicateButton")}
      </button>
    </div>
  );
}
