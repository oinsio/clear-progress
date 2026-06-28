// implements FR1 of fix-push-poison-pill

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
import type { z } from "zod";
import type { Clock } from "@/lib/temporal";
import { systemClock } from "@/lib/temporal";
import { tryHealField } from "./fieldHealer";
import { healMissingBox, healMissingName, healSortOrder } from "./healingRules";
import type { HealableEntityType, HealResult, SyncAlert } from "./types";

const SCHEMA_MAP: Record<HealableEntityType, z.ZodTypeAny> = {
  task: WireTaskSchema,
  goal: WireGoalSchema,
  idea: WireIdeaSchema,
  context: WireContextSchema,
  category: WireCategorySchema,
  checklist_item: WireChecklistItemSchema,
  attachment: WireAttachmentSchema,
  setting: WireSettingSchema,
};

// Fields that are unhealable — if invalid, the record is rejected
const UNHEALABLE_FIELDS = new Set(["id", "box", "status", "entity_type"]);

/**
 * Validates a record against its Wire schema and attempts to heal
 * fixable validation errors. Unhealable errors cause rejection.
 *
 * Implements FR1 of fix-push-poison-pill
 *
 * @param record - The record to validate (without syncStatus)
 * @param entityType - The entity type for schema selection
 * @param clock - Clock for timestamp generation (defaults to systemClock)
 * @returns HealResult with status, healed record, and any alerts
 */
export function healRecord(
  record: Record<string, unknown>,
  entityType: HealableEntityType,
  clock: Clock = systemClock,
): HealResult {
  // Phase 1: Apply business-rule fixes that Zod schemas don't enforce
  const {
    record: preHealedRecord,
    alerts: preAlerts,
    wasPreHealed,
  } = applyBusinessRuleHealing(record, entityType);

  // Phase 2: Zod schema validation
  const schema = SCHEMA_MAP[entityType];
  const parseResult = schema.safeParse(preHealedRecord);

  if (parseResult.success) {
    if (wasPreHealed) {
      return { status: "healed", record: preHealedRecord, alerts: preAlerts };
    }
    return { status: "valid", record, alerts: [] };
  }

  // Phase 3: Attempt to heal Zod validation errors
  const healedRecord = { ...preHealedRecord };
  const alerts: SyncAlert[] = [...preAlerts];
  let hasUnhealableError = false;

  for (const issue of parseResult.error.issues) {
    const fieldName = issue.path[0] as string;

    if (UNHEALABLE_FIELDS.has(fieldName)) {
      // Special case: empty box can be healed to inbox
      if (fieldName === "box" && preHealedRecord[fieldName] === "") {
        healedRecord[fieldName] = healMissingBox();
        continue;
      }
      hasUnhealableError = true;
      break;
    }

    const isHealed = tryHealField(
      fieldName,
      healedRecord,
      entityType,
      alerts,
      clock,
    );

    if (!isHealed) {
      hasUnhealableError = true;
      break;
    }
  }

  if (hasUnhealableError) {
    return { status: "rejected", record, alerts: [] };
  }

  // Re-validate after healing to ensure the record is now valid
  const revalidation = schema.safeParse(healedRecord);
  if (!revalidation.success) {
    return { status: "rejected", record, alerts: [] };
  }

  return { status: "healed", record: healedRecord, alerts };
}

/**
 * Applies business-rule healing for cases that Zod schemas accept
 * but are logically invalid (e.g., empty name, empty sort_order).
 */
function applyBusinessRuleHealing(
  record: Record<string, unknown>,
  entityType: HealableEntityType,
): {
  record: Record<string, unknown>;
  alerts: SyncAlert[];
  wasPreHealed: boolean;
} {
  const healedRecord = { ...record };
  const alerts: SyncAlert[] = [];
  let wasPreHealed = false;

  // Heal empty name for entities that have a name field
  if (hasNameField(entityType) && healedRecord.name === "") {
    const healResult = healMissingName();
    healedRecord.name = healResult.value;
    alerts.push(healResult.alert);
    wasPreHealed = true;
  }

  // Heal empty sort_order for entities that have it
  if (hasSortOrderField(entityType) && healedRecord.sort_order === "") {
    healedRecord.sort_order = healSortOrder();
    wasPreHealed = true;
  }

  return { record: healedRecord, alerts, wasPreHealed };
}

const ENTITIES_WITH_NAME: Set<HealableEntityType> = new Set([
  "task",
  "goal",
  "idea",
  "context",
  "category",
  "checklist_item",
]);

const ENTITIES_WITH_SORT_ORDER: Set<HealableEntityType> = new Set([
  "task",
  "goal",
  "idea",
  "context",
  "category",
  "checklist_item",
  "attachment",
]);

function hasNameField(entityType: HealableEntityType): boolean {
  return ENTITIES_WITH_NAME.has(entityType);
}

function hasSortOrderField(entityType: HealableEntityType): boolean {
  return ENTITIES_WITH_SORT_ORDER.has(entityType);
}
