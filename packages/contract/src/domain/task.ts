import type { Box } from "./common";

export interface WireTask {
  id: string;
  name: string;
  description: string;
  box: Box;
  goal_id: string;
  context_id: string;
  category_id: string;
  is_completed: boolean;
  completed_at: string; // ISOTimestamp or ""
  repeat_rule: string; // JSON string or ""
  is_hidden: boolean;
  next_date: string; // ISODate or ""
  appear_date: string; // ISODate or ""
  original_task_id: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  revision: number;
}
