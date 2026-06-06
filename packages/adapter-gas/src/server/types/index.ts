// Shared types for GAS backend

export type Box = "inbox" | "today" | "week" | "later";
export type GoalStatus =
  | "planning"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";
export type PushItemStatus = "created" | "accepted" | "conflict" | "rejected";

interface BaseEntity {
  id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  revision: number;
}

interface SortableEntity extends BaseEntity {
  sort_order: number;
}

interface NamedEntity extends SortableEntity {
  name: string;
}

export interface Task extends SortableEntity {
  name: string;
  description: string;
  box: Box;
  goal_id: string;
  context_id: string;
  category_id: string;
  is_completed: boolean;
  completed_at: string;
  repeat_rule: string;
  is_hidden: boolean;
  next_date: string;
  appear_date: string;
  original_task_id: string;
}

export interface Goal extends SortableEntity {
  name: string;
  description: string;
  cover_hash: string;
  status: GoalStatus;
}

export interface Context extends NamedEntity {}

export interface Category extends NamedEntity {}

export interface Idea extends NamedEntity {
  description: string;
}

/** Implements FR6 of add-file-attachments */
export interface Attachment extends SortableEntity {
  entity_type: string;
  entity_id: string;
  data_hash: string;
  filename: string;
  mime_type: string;
  file_size: number;
}

export interface ChecklistItem extends SortableEntity {
  task_id: string;
  name: string;
  is_completed: boolean;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface PushItemResult {
  id: string;
  status: PushItemStatus;
  server_record?:
    | Task
    | Goal
    | Context
    | Category
    | Idea
    | ChecklistItem
    | Attachment;
  reason?: string;
}

export interface PushSettingResult {
  key: string;
  status: PushItemStatus;
  server_record?: Setting;
  reason?: string;
}
