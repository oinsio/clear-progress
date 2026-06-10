import {
  AlignLeft,
  Copy,
  EyeOff,
  FileText,
  Inbox,
  ListChecks,
  MapPin,
  Paperclip,
  Repeat,
  Tag,
  Target,
} from "lucide-react";
import type * as React from "react";
import { BOX } from "@/constants";
import type { Box } from "@/types/common";
import { LaterBoxIcon, TodayBoxIcon, WeekBoxIcon } from "./BoxIcons";

export const ACTIVE_TAB = {
  DETAILS: "details",
  CHECKLIST: "checklist",
  ATTACHMENTS: "attachments",
} as const;

export type ActiveTab = (typeof ACTIVE_TAB)[keyof typeof ACTIVE_TAB];

export const BOX_OPTIONS: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

export const BOX_ICONS: Record<Box, React.FC<{ className?: string }>> = {
  [BOX.INBOX]: ({ className }: { className?: string }) => (
    <Inbox className={className} />
  ),
  [BOX.TODAY]: TodayBoxIcon,
  [BOX.WEEK]: WeekBoxIcon,
  [BOX.LATER]: LaterBoxIcon,
};

/** Implements FR1-FR8 of icons-for-task-detail */
export const TASK_DETAIL_ICONS = {
  description: FileText,
  goal: Target,
  context: MapPin,
  category: Tag,
  repeat: Repeat,
  hide: EyeOff,
  duplicate: Copy,
} as const;

/** Implements FR9-FR11 of icons-for-task-detail */
export const TAB_ICONS = {
  details: AlignLeft,
  checklist: ListChecks,
  attachments: Paperclip,
} as const;

export const SELECTOR_TYPE = {
  GOAL: "goal",
  CONTEXT: "context",
  CATEGORY: "category",
  REPEAT: "repeat",
  HIDE: "hide",
} as const;

export type SelectorType = (typeof SELECTOR_TYPE)[keyof typeof SELECTOR_TYPE];

export const SELECTOR_TITLE_KEYS: Record<SelectorType, string> = {
  [SELECTOR_TYPE.GOAL]: "selector.goal",
  [SELECTOR_TYPE.CONTEXT]: "selector.context",
  [SELECTOR_TYPE.CATEGORY]: "selector.category",
  [SELECTOR_TYPE.REPEAT]: "taskEdit.fieldRepeat",
  [SELECTOR_TYPE.HIDE]: "selector.hide",
};

export const CHECKLIST_ITEM_VARIANT = {
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export type ChecklistItemVariant =
  (typeof CHECKLIST_ITEM_VARIANT)[keyof typeof CHECKLIST_ITEM_VARIANT];

export function resolveEntityName(
  id: string,
  entities: Array<{ id: string; name: string }>,
  fallback: string,
): string {
  return id
    ? (entities.find((entity) => entity.id === id)?.name ?? fallback)
    : fallback;
}
