import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const UUIDSchema = z.string().regex(UUID_REGEX);

export const ISOTimestampSchema = z.string().regex(ISO_TIMESTAMP_REGEX);

export const ISODateSchema = z.string().regex(ISO_DATE_REGEX);

export const ISOTimestampOrEmptySchema = z.union([
  ISOTimestampSchema,
  z.literal(""),
]);

export const ISODateOrEmptySchema = z.union([ISODateSchema, z.literal("")]);

export const BoxSchema = z.enum(["inbox", "today", "week", "later"]);
export type Box = z.infer<typeof BoxSchema>;

export const GoalStatusSchema = z.enum([
  "planning",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

/** Implements FR5 of add-file-attachments */
export const EntityTypeSchema = z.enum(["task", "goal", "idea"]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const PushResultStatusSchema = z.enum([
  "created",
  "accepted",
  "conflict",
  "rejected",
]);
export type PushResultStatus = z.infer<typeof PushResultStatusSchema>;
