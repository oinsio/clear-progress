// implements FR9 of fix-push-poison-pill
// Server-side Zod validation of incoming push records

import type { z } from "npm:zod@3";

import {
  WireAttachmentSchema,
  WireCategorySchema,
  WireChecklistItemSchema,
  WireContextSchema,
  WireGoalSchema,
  WireIdeaSchema,
  WireSettingSchema,
  WireTaskSchema,
} from "./wireSchemas.ts";

export interface RejectedRecord {
  id: string;
  status: "rejected";
  reason: string;
}

interface ValidationResult {
  validRecords: unknown[];
  rejectedResults: RejectedRecord[];
}

const ENTITY_TYPE_SCHEMAS: Record<string, z.ZodType> = {
  tasks: WireTaskSchema,
  goals: WireGoalSchema,
  contexts: WireContextSchema,
  categories: WireCategorySchema,
  ideas: WireIdeaSchema,
  checklist_items: WireChecklistItemSchema,
  attachments: WireAttachmentSchema,
};

const SETTING_SCHEMA = WireSettingSchema;

function extractRecordId(record: unknown): string {
  if (typeof record === "object" && record !== null) {
    if ("id" in record && typeof (record as { id: unknown }).id === "string") {
      return (record as { id: string }).id;
    }
    if (
      "key" in record &&
      typeof (record as { key: unknown }).key === "string"
    ) {
      return (record as { key: string }).key;
    }
  }
  return "unknown";
}

function formatZodErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const fieldPath = issue.path.join(".") || "_root";
    fieldErrors[fieldPath] = issue.message;
  }
  return fieldErrors;
}

/**
 * Validates records for a given entity type against the corresponding Wire schema.
 * Returns valid records and rejected results separately.
 */
export function validateEntityRecords(
  entityType: string,
  records: unknown[],
): ValidationResult {
  const schema = ENTITY_TYPE_SCHEMAS[entityType];
  if (!schema) {
    return {
      validRecords: records,
      rejectedResults: [],
    };
  }

  const validRecords: unknown[] = [];
  const rejectedResults: RejectedRecord[] = [];

  for (const record of records) {
    const parseResult = schema.safeParse(record);
    if (parseResult.success) {
      validRecords.push(record);
    } else {
      const recordId = extractRecordId(record);
      const fieldErrors = formatZodErrors(parseResult.error.issues);
      rejectedResults.push({
        id: recordId,
        status: "rejected",
        reason: `Zod validation failed: ${JSON.stringify(fieldErrors)}`,
      });
    }
  }

  return { validRecords, rejectedResults };
}

/**
 * Validates setting records against the WireSetting schema.
 * Returns valid records and rejected results separately.
 */
export function validateSettingRecords(records: unknown[]): ValidationResult {
  const validRecords: unknown[] = [];
  const rejectedResults: RejectedRecord[] = [];

  for (const record of records) {
    const parseResult = SETTING_SCHEMA.safeParse(record);
    if (parseResult.success) {
      validRecords.push(record);
    } else {
      const settingKey = extractRecordId(record);
      const fieldErrors = formatZodErrors(parseResult.error.issues);
      rejectedResults.push({
        id: settingKey,
        status: "rejected",
        reason: `Zod validation failed: ${JSON.stringify(fieldErrors)}`,
      });
    }
  }

  return { validRecords, rejectedResults };
}

/**
 * Logs rejected records via console.warn.
 * implements FR9 of fix-push-poison-pill
 */
export function logRejectedRecords(
  userId: string,
  entityType: string,
  rejectedResults: RejectedRecord[],
): void {
  if (rejectedResults.length === 0) return;

  const details = rejectedResults
    .map(
      (rejected) =>
        `  ${entityType}/${rejected.id}: Zod validation failed\n    fields: ${rejected.reason.replace("Zod validation failed: ", "")}`,
    )
    .join("\n");

  console.warn(
    `[push] User ${userId}: ${rejectedResults.length} records rejected\n${details}`,
  );
}

/**
 * Logs records rejected by the RPC call.
 * implements FR9 of fix-push-poison-pill
 */
export function logRpcRejectedRecords(
  userId: string,
  entityType: string,
  rpcResults: Array<{
    id?: string;
    key?: string;
    status: string;
    reason?: string;
  }>,
): void {
  const rejectedByRpc = rpcResults.filter(
    (result) => result.status === "rejected",
  );
  if (rejectedByRpc.length === 0) return;

  const details = rejectedByRpc
    .map((result) => {
      const recordId = result.id ?? result.key ?? "unknown";
      return `  ${entityType}/${recordId}: ${result.reason ?? "unknown reason"}`;
    })
    .join("\n");

  console.warn(
    `[push] User ${userId}: ${rejectedByRpc.length} records rejected by RPC\n${details}`,
  );
}
