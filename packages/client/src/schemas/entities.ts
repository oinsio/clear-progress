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

export const ClientTaskSchema = WireTaskSchema.extend({
  needsSync: z.boolean(),
});
export type ClientTask = z.infer<typeof ClientTaskSchema>;

export const ClientGoalSchema = WireGoalSchema.extend({
  needsSync: z.boolean(),
});
export type ClientGoal = z.infer<typeof ClientGoalSchema>;

export const ClientIdeaSchema = WireIdeaSchema.extend({
  needsSync: z.boolean(),
});
export type ClientIdea = z.infer<typeof ClientIdeaSchema>;

export const ClientContextSchema = WireContextSchema.extend({
  needsSync: z.boolean(),
});
export type ClientContext = z.infer<typeof ClientContextSchema>;

export const ClientCategorySchema = WireCategorySchema.extend({
  needsSync: z.boolean(),
});
export type ClientCategory = z.infer<typeof ClientCategorySchema>;

export const ClientChecklistItemSchema = WireChecklistItemSchema.extend({
  needsSync: z.boolean(),
});
export type ClientChecklistItem = z.infer<typeof ClientChecklistItemSchema>;

export const ClientSettingSchema = WireSettingSchema.extend({
  needsSync: z.boolean(),
});
export type ClientSetting = z.infer<typeof ClientSettingSchema>;

/** Implements FR5 of add-file-attachments */
export const ClientAttachmentSchema = WireAttachmentSchema.extend({
  needsSync: z.boolean(),
});
export type ClientAttachment = z.infer<typeof ClientAttachmentSchema>;
