import { createGasAdapter } from "@clear-progress/adapter-gas";
import { createSupabaseAdapter } from "@clear-progress/adapter-supabase";
import type { SyncAdapter } from "@clear-progress/contract";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CoverRepository } from "@/db/repositories/CoverRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { CoverService } from "./CoverService";
import { CoverSyncService } from "./CoverSyncService";
import { getConnectionConfig } from "./connectionService";
import { GoalService } from "./GoalService";
import { IdeaService } from "./IdeaService";
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

export const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
);
export const defaultGoalService = new GoalService(new GoalRepository());
export const defaultIdeaService = new IdeaService(new IdeaRepository());
export const defaultCoverService = new CoverService(
  defaultSyncAdapter,
  new CoverRepository(),
  new PendingCoverRepository(),
);
export const defaultCoverSyncService = new CoverSyncService(
  defaultSyncAdapter,
  new PendingCoverRepository(),
  new CoverRepository(),
  new GoalRepository(),
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
);
