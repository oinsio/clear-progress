import {
  FileText,
  Inbox,
  MapPin,
  Pencil,
  Repeat,
  Tag,
  Target,
} from "lucide-react";
import * as React from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BOX, BOX_FILTER_I18N_KEYS } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Box, RepeatRule } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { LaterBoxIcon, TodayBoxIcon, WeekBoxIcon } from "./BoxIcons";
import { RepeatRuleSelector } from "./RepeatRuleSelector";

type QuickActionMode =
  | "none"
  | "description"
  | "goal"
  | "box"
  | "context"
  | "category"
  | "repeat";

interface TaskQuickActionsProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onOpenEdit: () => void;
}

const INBOX_BOX_OPTIONS: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];
const TASK_BOX_OPTIONS: Box[] = [BOX.TODAY, BOX.WEEK, BOX.LATER];

const BOX_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }: { className?: string }) => (
    <Inbox className={className} />
  ),
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

export function TaskQuickActions({
  task,
  goals,
  contexts,
  categories,
  onUpdate,
  onMove,
  onOpenEdit,
}: TaskQuickActionsProps) {
  const { t } = useTranslation();
  const [activeMode, setActiveMode] = useState<QuickActionMode>("none");
  const [descriptionValue, setDescriptionValue] = useState(task.description);

  const handleModeToggle = useCallback((mode: QuickActionMode) => {
    setActiveMode((current) => (current === mode ? "none" : mode));
  }, []);

  const handleDescriptionSave = useCallback(async () => {
    await onUpdate(task.id, { description: descriptionValue });
    setActiveMode("none");
  }, [task.id, descriptionValue, onUpdate]);

  const handleDescriptionToggle = useCallback(async () => {
    if (activeMode === "description") {
      await handleDescriptionSave();
    } else {
      setDescriptionValue(task.description);
      setActiveMode("description");
    }
  }, [activeMode, task.description, handleDescriptionSave]);

  const handleDescriptionKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        await handleDescriptionSave();
      } else if (event.key === "Escape") {
        setActiveMode("none");
      }
    },
    [handleDescriptionSave],
  );

  const handleGoalSelect = useCallback(
    async (goalId: string) => {
      await onUpdate(task.id, { goal_id: goalId });
      setActiveMode("none");
    },
    [task.id, onUpdate],
  );

  const handleContextSelect = useCallback(
    async (contextId: string) => {
      await onUpdate(task.id, { context_id: contextId });
      setActiveMode("none");
    },
    [task.id, onUpdate],
  );

  const handleCategorySelect = useCallback(
    async (categoryId: string) => {
      await onUpdate(task.id, { category_id: categoryId });
      setActiveMode("none");
    },
    [task.id, onUpdate],
  );

  const handleBoxSelect = useCallback(
    async (box: Box) => {
      await onMove(task.id, box);
      setActiveMode("none");
    },
    [task.id, onMove],
  );

  const descriptionButtonClass = cn(
    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
    activeMode === "description"
      ? "bg-accent/15 text-accent"
      : task.description
        ? "text-accent hover:bg-accent/10"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
  );

  const contextButtonClass = cn(
    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
    activeMode === "context"
      ? "bg-accent/15 text-accent"
      : task.context_id
        ? "text-accent hover:bg-accent/10"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
  );

  const categoryButtonClass = cn(
    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
    activeMode === "category"
      ? "bg-accent/15 text-accent"
      : task.category_id
        ? "text-accent hover:bg-accent/10"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
  );

  const goalButtonClass = cn(
    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
    activeMode === "goal"
      ? "bg-accent/15 text-accent"
      : task.goal_id
        ? "text-accent hover:bg-accent/10"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
  );

  const repeatButtonClass = cn(
    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
    activeMode === "repeat"
      ? "bg-accent/15 text-accent"
      : task.repeat_rule
        ? "text-accent hover:bg-accent/10"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
  );

  const handleRepeatChange = useCallback(
    async (rule: RepeatRule | null) => {
      await onUpdate(task.id, {
        repeat_rule: rule ? JSON.stringify(rule) : "",
      });
      setActiveMode("none");
    },
    [task.id, onUpdate],
  );

  const handleRepeatBack = useCallback(() => {
    setActiveMode("none");
  }, []);

  return (
    <div
      data-testid="task-quick-actions"
      className="border-t border-gray-100 bg-gray-50"
    >
      {/* Action icons row */}
      <div className="flex items-center gap-1 px-3 py-1.5">
        <button
          type="button"
          aria-label={t("task.editDescription")}
          aria-pressed={activeMode === "description"}
          onClick={handleDescriptionToggle}
          className={descriptionButtonClass}
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label={t("task.selectGoal")}
          aria-pressed={activeMode === "goal"}
          onClick={() => handleModeToggle("goal")}
          className={goalButtonClass}
        >
          <Target className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label={t("task.moveToBox")}
          aria-pressed={activeMode === "box"}
          onClick={() => handleModeToggle("box")}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
            activeMode === "box"
              ? "bg-accent/15 text-accent"
              : "text-accent hover:bg-accent/10",
          )}
        >
          {React.createElement(BOX_ICONS[task.box], { className: "w-5 h-5" })}
        </button>
        <button
          type="button"
          aria-label={t("task.selectContext")}
          aria-pressed={activeMode === "context"}
          onClick={() => handleModeToggle("context")}
          className={contextButtonClass}
        >
          <MapPin className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label={t("task.selectCategory")}
          aria-pressed={activeMode === "category"}
          onClick={() => handleModeToggle("category")}
          className={categoryButtonClass}
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label={t("task.selectRepeat")}
          aria-pressed={activeMode === "repeat"}
          onClick={() => handleModeToggle("repeat")}
          className={repeatButtonClass}
        >
          <Repeat className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label={t("task.fullEdit")}
          onClick={onOpenEdit}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
            "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
          )}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Description panel */}
      {activeMode === "description" && (
        <div className="px-3 pb-2">
          <textarea
            data-testid="quick-description-input"
            value={descriptionValue}
            onChange={(event) => setDescriptionValue(event.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            onBlur={() => void handleDescriptionSave()}
            placeholder={t("taskEdit.descriptionPlaceholder")}
            rows={3}
            className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
          />
        </div>
      )}

      {/* Goal picker */}
      {activeMode === "goal" && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          <button
            type="button"
            aria-label={t("selector.noGoal")}
            onClick={() => handleGoalSelect("")}
            className={cn(
              "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
              task.goal_id === ""
                ? "bg-accent/10 text-accent font-medium"
                : "text-gray-500 hover:bg-gray-100",
            )}
          >
            {t("selector.noGoal")}
          </button>
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => handleGoalSelect(goal.id)}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                task.goal_id === goal.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {goal.name}
            </button>
          ))}
        </div>
      )}

      {/* Context picker */}
      {activeMode === "context" && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          <button
            type="button"
            aria-label={t("selector.noContext")}
            onClick={() => handleContextSelect("")}
            className={cn(
              "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
              task.context_id === ""
                ? "bg-accent/10 text-accent font-medium"
                : "text-gray-500 hover:bg-gray-100",
            )}
          >
            {t("selector.noContext")}
          </button>
          {contexts.map((context) => (
            <button
              key={context.id}
              type="button"
              onClick={() => handleContextSelect(context.id)}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                task.context_id === context.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {context.name}
            </button>
          ))}
        </div>
      )}

      {/* Category picker */}
      {activeMode === "category" && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          <button
            type="button"
            aria-label={t("selector.noCategory")}
            onClick={() => handleCategorySelect("")}
            className={cn(
              "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
              task.category_id === ""
                ? "bg-accent/10 text-accent font-medium"
                : "text-gray-500 hover:bg-gray-100",
            )}
          >
            {t("selector.noCategory")}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategorySelect(category.id)}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                task.category_id === category.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Box picker */}
      {activeMode === "box" && (
        <div className="px-3 pb-2 flex gap-1">
          {(task.box === BOX.INBOX ? INBOX_BOX_OPTIONS : TASK_BOX_OPTIONS).map(
            (box) => {
              const BoxIcon = BOX_ICONS[box];
              const isCurrentBox = task.box === box;
              return (
                <button
                  key={box}
                  type="button"
                  aria-label={t(BOX_FILTER_I18N_KEYS[box])}
                  aria-pressed={isCurrentBox}
                  onClick={() => handleBoxSelect(box)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                    isCurrentBox
                      ? "text-accent"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <BoxIcon className="w-7 h-7" />
                </button>
              );
            },
          )}
        </div>
      )}

      {/* Repeat rule selector */}
      {activeMode === "repeat" && (
        <div className="pb-2">
          <RepeatRuleSelector
            value={task.repeat_rule ? JSON.parse(task.repeat_rule) : null}
            onChange={handleRepeatChange}
            onBack={handleRepeatBack}
          />
        </div>
      )}
    </div>
  );
}
