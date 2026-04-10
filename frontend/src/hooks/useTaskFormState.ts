import { useState } from "react";
import type { Task } from "@/types/entities";
import type { Box, RepeatRule } from "@/types/common";
import { parseRepeatRule } from "@/utils/repeatRule";

export function useTaskFormState(task: Task) {
  const [title, setTitle] = useState(task.name);
  const [notes, setNotes] = useState(task.description);
  const [selectedGoalId, setSelectedGoalId] = useState(task.goal_id);
  const [selectedContextId, setSelectedContextId] = useState(task.context_id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    task.category_id,
  );
  const [selectedBox, setSelectedBox] = useState<Box>(task.box);
  const [selectedRepeatRule, setSelectedRepeatRule] =
    useState<RepeatRule | null>(() => parseRepeatRule(task.repeat_rule));

  return {
    name: title,
    setName: setTitle,
    description: notes,
    setDescription: setNotes,
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
  };
}
