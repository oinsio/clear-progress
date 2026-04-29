import { z } from "zod";

import {
  BoxSchema,
  GoalStatusSchema,
  ISODateOrEmptySchema,
  ISOTimestampOrEmptySchema,
  ISOTimestampSchema,
  UUIDSchema,
} from "./primitives";

export const WireTaskSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  box: BoxSchema,
  goal_id: z.string(),
  context_id: z.string(),
  category_id: z.string(),
  is_completed: z.boolean(),
  completed_at: ISOTimestampOrEmptySchema,
  repeat_rule: z.string(),
  is_hidden: z.boolean(),
  next_date: ISODateOrEmptySchema,
  appear_date: ISODateOrEmptySchema,
  original_task_id: z.string(),
  sort_order: z.number(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  version: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});
export type WireTask = z.infer<typeof WireTaskSchema>;

export const WireGoalSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  cover_file_id: z.string(),
  status: GoalStatusSchema,
  sort_order: z.number(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  version: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});
export type WireGoal = z.infer<typeof WireGoalSchema>;

export const WireIdeaSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  sort_order: z.number(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  version: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});
export type WireIdea = z.infer<typeof WireIdeaSchema>;

export const WireContextSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  sort_order: z.number(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  version: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});
export type WireContext = z.infer<typeof WireContextSchema>;

export const WireCategorySchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  sort_order: z.number(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  version: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});
export type WireCategory = z.infer<typeof WireCategorySchema>;

export const WireChecklistItemSchema = z.object({
  id: UUIDSchema,
  task_id: UUIDSchema,
  name: z.string(),
  is_completed: z.boolean(),
  sort_order: z.number(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  version: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});
export type WireChecklistItem = z.infer<typeof WireChecklistItemSchema>;

export const WireSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  updated_at: ISOTimestampSchema,
});
export type WireSetting = z.infer<typeof WireSettingSchema>;
