import { useCallback, useState } from "react";
import type { RepeatRule } from "@/types/common";
import type { Task } from "@/types/entities";
import { serializeRepeatRule } from "@/utils/repeatRule";
import {
  computeRuleChangeUpdates,
  shouldRecalculateNextDate,
} from "@/utils/repeatRuleChange";

interface PendingRuleChange {
  newRule: RepeatRule;
  nextDate: string;
  appearDate: string;
}

/**
 * Implements FR6, UX1, UX2 of repeating-task-rule-change.
 * Manages confirmation dialog state for repeat rule changes
 * that affect next_date recalculation.
 */
export function useRepeatRuleChangeDialog(
  task: Task,
  selectedRepeatRule: RepeatRule | null,
  setSelectedRepeatRule: (rule: RepeatRule | null) => void,
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>,
  onCloseSelector: () => void,
) {
  const [pendingRuleChange, setPendingRuleChange] =
    useState<PendingRuleChange | null>(null);

  const handleRepeatChange = useCallback(
    async (rule: RepeatRule | null) => {
      const oldRule = selectedRepeatRule;

      if (!rule) {
        setSelectedRepeatRule(null);
        onCloseSelector();
        await onUpdate(task.id, { repeat_rule: "" });
        return;
      }

      if (!oldRule || !task.next_date) {
        setSelectedRepeatRule(rule);
        onCloseSelector();
        await onUpdate(task.id, {
          repeat_rule: serializeRepeatRule(rule),
        });
        return;
      }

      const { next_date, appear_date } = computeRuleChangeUpdates(
        oldRule,
        rule,
        task.next_date,
      );

      if (!shouldRecalculateNextDate(oldRule, rule)) {
        setSelectedRepeatRule(rule);
        onCloseSelector();
        await onUpdate(task.id, {
          repeat_rule: serializeRepeatRule(rule),
          next_date,
          appear_date,
        });
        return;
      }

      onCloseSelector();
      setPendingRuleChange({
        newRule: rule,
        nextDate: next_date,
        appearDate: appear_date,
      });
    },
    [
      task.id,
      task.next_date,
      onUpdate,
      selectedRepeatRule,
      setSelectedRepeatRule,
      onCloseSelector,
    ],
  );

  const handleRuleChangeConfirm = useCallback(async () => {
    if (!pendingRuleChange) return;
    const { newRule, nextDate, appearDate } = pendingRuleChange;
    setSelectedRepeatRule(newRule);
    setPendingRuleChange(null);
    await onUpdate(task.id, {
      repeat_rule: serializeRepeatRule(newRule),
      next_date: nextDate,
      appear_date: appearDate,
    });
  }, [pendingRuleChange, task.id, onUpdate, setSelectedRepeatRule]);

  const handleRuleChangeCancel = useCallback(() => {
    setPendingRuleChange(null);
  }, []);

  return {
    pendingRuleChange,
    handleRepeatChange,
    handleRuleChangeConfirm,
    handleRuleChangeCancel,
  };
}
