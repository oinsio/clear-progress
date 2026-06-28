// implements FR5 of fix-push-poison-pill

import { RECORD_SYNC_STATUS } from "@/constants";
import type {
  Attachment,
  Category,
  ChecklistItem,
  Context,
  Goal,
  Idea,
  Setting,
  Task,
} from "@/types/entities";
import type { HealableEntityType, SyncAlert } from "./push-self-healing";
import { healRecord } from "./push-self-healing";

export interface PreValidationResult {
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  checklistItems: ChecklistItem[];
  ideas: Idea[];
  attachments: Attachment[];
  settings: Setting[];
  alerts: SyncAlert[];
}

interface EntityRepoUpdater {
  update(record: Record<string, unknown>): Promise<void>;
}

interface PreValidationRepositories {
  taskRepository: EntityRepoUpdater;
  goalRepository: EntityRepoUpdater;
  contextRepository: EntityRepoUpdater;
  categoryRepository: EntityRepoUpdater;
  checklistRepository: EntityRepoUpdater;
  ideaRepository: EntityRepoUpdater;
  attachmentRepository: EntityRepoUpdater;
}

/**
 * Validates records via Zod before push and handles healing/rejection.
 *
 * Implements FR5 of fix-push-poison-pill
 *
 * - `valid` records pass through unchanged
 * - `healed` records are updated in DB with healed values + syncStatus: "pending"
 * - `rejected` records are updated in DB with syncStatus: "rejected" and excluded from push
 */
export async function preValidateRecords(
  tasks: Task[],
  goals: Goal[],
  contexts: Context[],
  categories: Category[],
  checklistItems: ChecklistItem[],
  ideas: Idea[],
  attachments: Attachment[],
  settings: Setting[],
  repositories: PreValidationRepositories,
): Promise<PreValidationResult> {
  const allAlerts: SyncAlert[] = [];

  const validTasks = await filterAndHeal(
    tasks,
    "task",
    repositories.taskRepository,
    allAlerts,
  );
  const validGoals = await filterAndHeal(
    goals,
    "goal",
    repositories.goalRepository,
    allAlerts,
  );
  const validContexts = await filterAndHeal(
    contexts,
    "context",
    repositories.contextRepository,
    allAlerts,
  );
  const validCategories = await filterAndHeal(
    categories,
    "category",
    repositories.categoryRepository,
    allAlerts,
  );
  const validChecklistItems = await filterAndHeal(
    checklistItems,
    "checklist_item",
    repositories.checklistRepository,
    allAlerts,
  );
  const validIdeas = await filterAndHeal(
    ideas,
    "idea",
    repositories.ideaRepository,
    allAlerts,
  );
  const validAttachments = await filterAndHeal(
    attachments,
    "attachment",
    repositories.attachmentRepository,
    allAlerts,
  );

  return {
    tasks: validTasks,
    goals: validGoals,
    contexts: validContexts,
    categories: validCategories,
    checklistItems: validChecklistItems,
    ideas: validIdeas,
    attachments: validAttachments,
    settings, // settings are not Zod-validated on client
    alerts: allAlerts,
  };
}

async function filterAndHeal<T extends { syncStatus: string }>(
  records: T[],
  entityType: HealableEntityType,
  repository: EntityRepoUpdater,
  allAlerts: SyncAlert[],
): Promise<T[]> {
  const validRecords: T[] = [];

  for (const record of records) {
    // Strip syncStatus before validation
    const { syncStatus: _, ...recordWithoutSync } = record as T & {
      syncStatus: string;
    };
    const healResult = healRecord(
      recordWithoutSync as Record<string, unknown>,
      entityType,
    );

    if (healResult.status === "valid") {
      validRecords.push(record);
      continue;
    }

    if (healResult.status === "healed") {
      const healedRecord = {
        ...record,
        ...healResult.record,
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      } as T;
      await repository.update(
        healedRecord as unknown as Record<string, unknown>,
      );
      validRecords.push(healedRecord);
      allAlerts.push(...healResult.alerts);
      continue;
    }

    // status === "rejected" — mark as rejected and exclude from push
    try {
      await repository.update({
        ...record,
        syncStatus: RECORD_SYNC_STATUS.REJECTED,
      } as unknown as Record<string, unknown>);
    } catch {
      // Record may be too corrupted for the client schema validator.
      // Persist only syncStatus via raw Dexie put to avoid crashing the sync.
      const { db } = await import("@/db/database");
      const recordId =
        (record as Record<string, unknown>).id ??
        (record as Record<string, unknown>).key;
      if (recordId) {
        const tableName =
          entityType === "checklist_item"
            ? "checklist_items"
            : `${entityType}s`;
        const table = db.table(tableName);
        await table.update(recordId, {
          syncStatus: RECORD_SYNC_STATUS.REJECTED,
        });
      }
    }
  }

  return validRecords;
}
