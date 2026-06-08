import { createGasAdapter } from "@clear-progress/adapter-gas";
import { createSupabaseAdapter } from "@clear-progress/adapter-supabase";
import type { SyncAdapter } from "@clear-progress/contract";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { FileRepository } from "@/db/repositories/FileRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { AttachmentService } from "./AttachmentService";
import { getConnectionConfig } from "./connectionService";
import { FileService } from "./FileService";
import { FileSyncService } from "./FileSyncService";
import { GoalService } from "./GoalService";
import { IdeaService } from "./IdeaService";
import { DexieLocalFileRefCounter } from "./LocalFileRefCounter";
import { OnboardingService } from "./OnboardingService";
import { SyncService } from "./SyncService";
import { getSupabaseClient } from "./supabaseClientManager";
import { TaskService } from "./TaskService";
import { getAccessToken } from "./tokenManager";

// implements FR9, D3 of add-supabase-ui
function createSyncAdapter(): SyncAdapter {
  const config = getConnectionConfig();
  if (!config) {
    throw new Error("No backend configured");
  }
  switch (config.type) {
    case "gas":
      return createGasAdapter(config.url, getAccessToken);
    case "supabase":
      return createSupabaseAdapter(getSupabaseClient());
  }
}

let _defaultSyncAdapter: SyncAdapter | null = null;

export function getDefaultSyncAdapter(): SyncAdapter {
  if (!_defaultSyncAdapter) {
    _defaultSyncAdapter = createSyncAdapter();
  }
  return _defaultSyncAdapter;
}

// For backward compatibility and immediate use in module scope
export const defaultSyncAdapter = (() => {
  try {
    return createSyncAdapter();
  } catch {
    // Return a placeholder that will be replaced on first getDefaultSyncAdapter() call
    return null as unknown as SyncAdapter;
  }
})();

const defaultAttachmentRepository = new AttachmentRepository();
export const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
  undefined,
  defaultAttachmentRepository,
);
const defaultGoalRepository = new GoalRepository();
export const defaultGoalService = new GoalService(
  defaultGoalRepository,
  defaultAttachmentRepository,
);
export const defaultIdeaService = new IdeaService(
  new IdeaRepository(),
  defaultAttachmentRepository,
);
export const defaultFileService = new FileService(
  defaultSyncAdapter,
  new FileRepository(),
  new PendingFileRepository(),
  new DexieLocalFileRefCounter(
    defaultGoalRepository,
    defaultAttachmentRepository,
  ),
);
export const defaultAttachmentService = new AttachmentService(
  defaultAttachmentRepository,
  defaultFileService,
);
export const defaultFileSyncService = new FileSyncService(
  defaultSyncAdapter,
  new PendingFileRepository(),
  new FileRepository(),
  new GoalRepository(),
  new AttachmentRepository(),
);
export const defaultSyncService = new SyncService(
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
);
export const defaultOnboardingService = new OnboardingService(
  new GoalRepository(),
  new TaskRepository(),
  new ChecklistRepository(),
);
