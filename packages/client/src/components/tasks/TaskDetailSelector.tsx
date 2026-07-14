import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import type { Box, RepeatRule } from "@/types/common";
import type { Task } from "@/types/entities";
import { HideTaskPanel } from "./HideTaskPanel";
import { RepeatRuleSelector } from "./RepeatRuleSelector";
import {
  SELECTOR_TITLE_KEYS,
  SELECTOR_TYPE,
  type SelectorType,
} from "./taskEditShared";

interface SelectorOption {
  id: string;
  label: string;
}

interface SelectorOptionListProps {
  options: SelectorOption[];
  selectedId: string;
  noSelectionLabel: string;
  onSelect: (id: string) => void;
}

function SelectorOptionList({
  options,
  selectedId,
  noSelectionLabel,
  onSelect,
}: SelectorOptionListProps) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
          selectedId === ""
            ? "bg-accent/10 text-accent font-medium"
            : "text-gray-500 hover:bg-gray-100",
        )}
      >
        {noSelectionLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={cn(
            "text-left text-sm px-3 py-2.5 rounded-lg transition-colors",
            selectedId === option.id
              ? "bg-accent/10 text-accent font-medium"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface TaskDetailSelectorProps {
  task: Task;
  openSelector: SelectorType;
  selectedRepeatRule: RepeatRule | null;
  selectedGoalId: string;
  selectedContextId: string;
  selectedCategoryId: string;
  goalOptions: SelectorOption[];
  contextOptions: SelectorOption[];
  categoryOptions: SelectorOption[];
  defaultBox: Box;
  onClose: () => void;
  onGoalChange: (id: string) => void;
  onContextChange: (id: string) => void;
  onCategoryChange: (id: string) => void;
  onRepeatChange: (rule: RepeatRule | null) => void;
  onHide: (date: string) => void;
  onUnhide: () => void;
}

export type { SelectorOption };

export function TaskDetailSelector({
  task,
  openSelector,
  selectedRepeatRule,
  selectedGoalId,
  selectedContextId,
  selectedCategoryId,
  goalOptions,
  contextOptions,
  categoryOptions,
  defaultBox,
  onClose,
  onGoalChange,
  onContextChange,
  onCategoryChange,
  onRepeatChange,
  onHide,
  onUnhide,
}: TaskDetailSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      {/* Selector header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.back")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-[1.125rem] h-[1.125rem]" />
        </button>
        <h3 className="text-base font-semibold text-gray-800">
          {t(SELECTOR_TITLE_KEYS[openSelector])}
        </h3>
      </div>

      {/* Selector content */}
      <div className="flex-1 overflow-y-auto">
        {openSelector === SELECTOR_TYPE.REPEAT ? (
          <RepeatRuleSelector
            value={selectedRepeatRule}
            onChange={(rule) => void onRepeatChange(rule)}
            onBack={onClose}
            defaultBox={defaultBox}
          />
        ) : (
          <>
            {openSelector === SELECTOR_TYPE.GOAL && (
              <SelectorOptionList
                options={goalOptions}
                selectedId={selectedGoalId}
                noSelectionLabel={t("selector.noGoal")}
                onSelect={(id) => void onGoalChange(id)}
              />
            )}
            {openSelector === SELECTOR_TYPE.CONTEXT && (
              <SelectorOptionList
                options={contextOptions}
                selectedId={selectedContextId}
                noSelectionLabel={t("selector.noContext")}
                onSelect={(id) => void onContextChange(id)}
              />
            )}
            {openSelector === SELECTOR_TYPE.CATEGORY && (
              <SelectorOptionList
                options={categoryOptions}
                selectedId={selectedCategoryId}
                noSelectionLabel={t("selector.noCategory")}
                onSelect={(id) => void onCategoryChange(id)}
              />
            )}
            {openSelector === SELECTOR_TYPE.HIDE && (
              <div className="px-4 py-3">
                <HideTaskPanel
                  isHidden={task.is_hidden}
                  appearDate={task.appear_date}
                  onHide={onHide}
                  onUnhide={onUnhide}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
