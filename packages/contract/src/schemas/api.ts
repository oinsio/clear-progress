import { z } from "zod";

import {
  WireAttachmentSchema,
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
  attachments: z.array(WireAttachmentSchema), // implements FR6 of add-file-attachments
  settings: z.array(WireSettingSchema),
  current_revision: z.number().int().nonnegative(),
  purge_revision: z.number().int().nonnegative(),
  server_time: ISOTimestampSchema,
  has_more: z.boolean(), // implements FR4 of fix-pull-pagination
});

// --- Push ---

const WireEntitySchema = z.union([
  WireTaskSchema,
  WireGoalSchema,
  WireContextSchema,
  WireCategorySchema,
  WireIdeaSchema,
  WireChecklistItemSchema,
  WireAttachmentSchema,
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
    attachments: z.array(PushItemResultSchema).optional(), // implements FR6 of add-file-attachments
    settings: z.array(PushSettingResultSchema).optional(),
  }),
  server_time: ISOTimestampSchema,
});

// --- Files ---

/** Implements FR4 of add-file-attachments */
export const UploadFileResponseSchema = z.object({
  ok: z.boolean(),
  data_hash: z.string(),
  reused: z.boolean(),
});

/** Implements FR4 of add-file-attachments */
export const UploadFileBatchResultSchema = z.object({
  local_id: z.string(),
  goal_id: z.string(),
  ok: z.boolean(),
  data_hash: z.string().optional(),
  reused: z.boolean().optional(),
  error: z.string().optional(),
  error_code: z.string().optional(),
});

/** Implements FR4 of add-file-attachments */
export const UploadFilesResponseSchema = z.object({
  ok: z.boolean(),
  results: z.array(UploadFileBatchResultSchema),
});

/** Implements FR4 of add-file-attachments */
export const GetFileResultSchema = z.object({
  hash: z.string(),
  mime_type: z.string().optional(),
  data: z.string().optional(),
  error: z.string().optional(),
});

/** Implements FR4 of add-file-attachments */
export const GetFileResponseSchema = z.object({
  ok: z.boolean(),
  files: z.array(GetFileResultSchema),
});

/** Implements FR4 of add-file-attachments */
export const DeleteFileResponseSchema = z.object({
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
    attachments: z.number().int().nonnegative(), // implements FR6 of add-file-attachments
  }),
  purge_revision: z.number().int().nonnegative(),
});
