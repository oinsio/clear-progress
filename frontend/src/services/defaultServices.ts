import { TaskService } from "./TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { GoalService } from "./GoalService";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { IdeaService } from "./IdeaService";
import { CoverService } from "./CoverService";
import { CoverRepository } from "@/db/repositories/CoverRepository";
import { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { CoverSyncService } from "./CoverSyncService";
import { ApiClient } from "./ApiClient";
import { SyncService } from "./SyncService";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";

export const defaultApiClient = new ApiClient();

export const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
);
export const defaultGoalService = new GoalService(new GoalRepository());
export const defaultIdeaService = new IdeaService(new IdeaRepository());
export const defaultCoverService = new CoverService(
  new ApiClient(),
  new CoverRepository(),
  new PendingCoverRepository(),
);
export const defaultCoverSyncService = new CoverSyncService(
  new ApiClient(),
  new PendingCoverRepository(),
  new CoverRepository(),
  new GoalRepository(),
);
export const defaultSyncService = new SyncService(
  new ApiClient(),
  new SyncMetaRepository(),
  new TaskRepository(),
  new GoalRepository(),
  new ContextRepository(),
  new CategoryRepository(),
  new ChecklistRepository(),
  new IdeaRepository(),
  new SettingsRepository(),
);
