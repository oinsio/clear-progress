import { z } from "zod";

import {
  WireCategorySchema,
  WireChecklistItemSchema,
  WireContextSchema,
  WireGoalSchema,
  WireIdeaSchema,
  WireSettingSchema,
  WireTaskSchema,
} from "./entities";
import {
  ISOTimestampSchema,
  PushResultStatusSchema,
  UUIDSchema,
} from "./primitives";

// --- Ping / Init ---

export const PingResponseSchema = z.object({
  ok: z.boolean(),
  app: z.string(),
  version: z.string(),
  initialized: z.boolean(),
});

export const InitResponseSchema = z.object({
  ok: z.boolean(),
});

// --- Pull ---

export const PullResponseSchema = z.object({
  ok: z.boolean(),
  tasks: z.array(WireTaskSchema),
  goals: z.array(WireGoalSchema),
  contexts: z.array(WireContextSchema),
  categories: z.array(WireCategorySchema),
  ideas: z.array(WireIdeaSchema),
  checklist_items: z.array(WireChecklistItemSchema),
  settings: z.array(WireSettingSchema),
  current_revision: z.number().int().nonnegative(),
  purge_revision: z.number().int().nonnegative(),
  server_time: ISOTimestampSchema,
});

// --- Push ---

const WireEntitySchema = z.union([
  WireTaskSchema,
  WireGoalSchema,
  WireContextSchema,
  WireCategorySchema,
  WireIdeaSchema,
  WireChecklistItemSchema,
]);

export const PushItemResultSchema = z.object({
  id: UUIDSchema,
  status: PushResultStatusSchema,
  server_record: WireEntitySchema.optional(),
  reason: z.string().optional(),
});

export const PushSettingResultSchema = z.object({
  key: z.string(),
  status: PushResultStatusSchema,
  server_record: WireSettingSchema.optional(),
  reason: z.string().optional(),
});

export const PushResponseSchema = z.object({
  ok: z.boolean(),
  revision: z.number().int().nonnegative().optional(),
  results: z.object({
    tasks: z.array(PushItemResultSchema).optional(),
    goals: z.array(PushItemResultSchema).optional(),
    contexts: z.array(PushItemResultSchema).optional(),
    categories: z.array(PushItemResultSchema).optional(),
    ideas: z.array(PushItemResultSchema).optional(),
    checklist_items: z.array(PushItemResultSchema).optional(),
    settings: z.array(PushSettingResultSchema).optional(),
  }),
  server_time: ISOTimestampSchema,
});

// --- Covers ---

export const UploadCoverResponseSchema = z.object({
  ok: z.boolean(),
  file_id: z.string(),
  reused: z.boolean(),
});

export const UploadCoverBatchResultSchema = z.object({
  local_id: z.string(),
  goal_id: z.string(),
  file_id: z.string().optional(),
  reused: z.boolean().optional(),
  error: z.string().optional(),
});

export const UploadCoversResponseSchema = z.object({
  ok: z.boolean(),
  results: z.array(UploadCoverBatchResultSchema),
});

export const GetCoverResultSchema = z.object({
  file_id: z.string(),
  mime_type: z.string().optional(),
  data: z.string().optional(),
  error: z.string().optional(),
});

export const GetCoverResponseSchema = z.object({
  ok: z.boolean(),
  covers: z.array(GetCoverResultSchema),
});

export const DeleteCoverResponseSchema = z.object({
  ok: z.boolean(),
  deleted: z.boolean(),
  ref_count: z.number().int().nonnegative(),
});

// --- Purge ---

export const PurgeResponseSchema = z.object({
  ok: z.boolean(),
  purged: z.object({
    tasks: z.number().int().nonnegative(),
    goals: z.number().int().nonnegative(),
    contexts: z.number().int().nonnegative(),
    categories: z.number().int().nonnegative(),
    checklist_items: z.number().int().nonnegative(),
    ideas: z.number().int().nonnegative(),
  }),
  purge_revision: z.number().int().nonnegative(),
});
