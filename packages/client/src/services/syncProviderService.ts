// SyncProvider's shared sync infrastructure: the SyncService singleton, the
// last-sync persistence helper, and the alert-mapping helper reused by both the
// regular and the full-sync flows. Extracted from SyncProvider.tsx (task 6.3a
// of configurable-sync-timing) to keep that file under the file-size limit.
import { STORAGE_KEYS } from "@/constants";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { defaultSyncAdapter } from "@/services/defaultServices";
import { setPreference } from "@/services/localPreferencesService";
import { RecurringTaskDeduplicator } from "@/services/RecurringTaskDeduplicator";
import { SyncService } from "@/services/SyncService";
import type { AppAlert } from "@/types/alerts";

export const syncService = new SyncService(
  defaultSyncAdapter,
  new SyncMetaRepository(),
  new TaskRepository(),
  new GoalRepository(),
  new ContextRepository(),
  new CategoryRepository(),
  new ChecklistRepository(),
  new IdeaRepository(),
  new SettingsRepository(),
  new AttachmentRepository(),
  new RecurringTaskDeduplicator(
    new TaskRepository(),
    new ChecklistRepository(),
  ),
);

export function persistLastSync(timestamp: string): void {
  setPreference(STORAGE_KEYS.LAST_SYNC, timestamp);
}

// implements FR7, FR8 of fix-push-poison-pill
export function mapSyncServiceAlerts(): AppAlert[] {
  return syncService.lastSyncAlerts.map((syncAlert) => ({
    type: "sync" as const,
    messageKey: syncAlert.messageKey,
    params: syncAlert.params,
  }));
}
