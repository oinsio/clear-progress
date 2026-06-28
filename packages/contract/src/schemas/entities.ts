import { z } from "zod";

import {
  BoxSchema,
  EntityTypeSchema,
  GoalStatusSchema,
  ISODateOrEmptySchema,
  ISOTimestampOrEmptySchema,
  ISOTimestampSchema,
  UUIDSchema,
} from "./primitives";

// implements FR2 of fix-push-poison-pill
export const UUIDOrEmptySchema = z.union([UUIDSchema, z.literal("")]);

export const WireTaskSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  box: BoxSchema,
  goal_id: UUIDOrEmptySchema, // implements FR2 of fix-push-poison-pill
  context_id: UUIDOrEmptySchema, // implements FR2 of fix-push-poison-pill
  category_id: UUIDOrEmptySchema, // implements FR2 of fix-push-poison-pill
  is_completed: z.boolean(),
  completed_at: ISOTimestampOrEmptySchema,
  repeat_rule: z.string(),
  is_hidden: z.boolean(),
  next_date: ISODateOrEmptySchema,
  appear_date: ISODateOrEmptySchema,
  original_task_id: UUIDOrEmptySchema, // implements FR2 of fix-push-poison-pill
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireTask = z.infer<typeof WireTaskSchema>;

// implements FR1 of content-addressable-covers
export const WireGoalSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  cover_hash: z.string(),
  status: GoalStatusSchema,
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireGoal = z.infer<typeof WireGoalSchema>;

export const WireIdeaSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  description: z.string(),
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireIdea = z.infer<typeof WireIdeaSchema>;

export const WireContextSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireContext = z.infer<typeof WireContextSchema>;

export const WireCategorySchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireCategory = z.infer<typeof WireCategorySchema>;

export const WireChecklistItemSchema = z.object({
  id: UUIDSchema,
  task_id: UUIDSchema,
  name: z.string(),
  is_completed: z.boolean(),
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireChecklistItem = z.infer<typeof WireChecklistItemSchema>;

/** Implements FR5 of add-file-attachments */
export const WireAttachmentSchema = z.object({
  id: UUIDSchema,
  entity_type: EntityTypeSchema,
  entity_id: UUIDSchema,
  data_hash: z.string(),
  filename: z.string(),
  mime_type: z.string(),
  file_size: z.number(),
  sort_order: z.string(),
  is_deleted: z.boolean(),
  created_at: ISOTimestampSchema,
  updated_at: ISOTimestampSchema,
  revision: z.number().int().nonnegative(),
});
export type WireAttachment = z.infer<typeof WireAttachmentSchema>;

export const WireSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  updated_at: ISOTimestampSchema,
});
export type WireSetting = z.infer<typeof WireSettingSchema>;
