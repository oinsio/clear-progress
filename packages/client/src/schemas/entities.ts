import {
  WireAttachmentSchema,
  WireCategorySchema,
  WireChecklistItemSchema,
  WireContextSchema,
  WireGoalSchema,
  WireIdeaSchema,
  WireSettingSchema,
  WireTaskSchema,
} from "@clear-progress/contract";
import { z } from "zod";

// implements FR6 of fix-push-poison-pill
export const RecordSyncStatusSchema = z.enum(["synced", "pending", "rejected"]);

export const ClientTaskSchema = WireTaskSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientTask = z.infer<typeof ClientTaskSchema>;

export const ClientGoalSchema = WireGoalSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientGoal = z.infer<typeof ClientGoalSchema>;

export const ClientIdeaSchema = WireIdeaSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientIdea = z.infer<typeof ClientIdeaSchema>;

export const ClientContextSchema = WireContextSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientContext = z.infer<typeof ClientContextSchema>;

export const ClientCategorySchema = WireCategorySchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientCategory = z.infer<typeof ClientCategorySchema>;

export const ClientChecklistItemSchema = WireChecklistItemSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientChecklistItem = z.infer<typeof ClientChecklistItemSchema>;

export const ClientSettingSchema = WireSettingSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientSetting = z.infer<typeof ClientSettingSchema>;

/** Implements FR5 of add-file-attachments */
export const ClientAttachmentSchema = WireAttachmentSchema.extend({
  syncStatus: RecordSyncStatusSchema,
});
export type ClientAttachment = z.infer<typeof ClientAttachmentSchema>;
