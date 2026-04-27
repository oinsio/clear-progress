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
import { ApiClient } from "./ApiClient";
import { CoverService } from "./CoverService";
import { CoverSyncService } from "./CoverSyncService";
import { GoalService } from "./GoalService";
import { IdeaService } from "./IdeaService";
import { SyncService } from "./SyncService";
import { TaskService } from "./TaskService";

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
