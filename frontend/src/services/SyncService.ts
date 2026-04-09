import type {
  Task,
  Goal,
  Context,
  Category,
  ChecklistItem,
  Idea,
  Setting,
} from "@/types/entities";
import type { PushResponseData } from "@/types/api";
import { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import {
  PUSH_RESULT_STATUS,
  LOCAL_COVER_ID_PREFIX,
  SYNC_META_KEYS,
} from "@/constants";
import { db } from "@/db/database";

export class SyncService {
  private syncMutex: Promise<void> = Promise.resolve();

  constructor(
    private readonly apiClient: ApiClient,
    private readonly syncMetaRepository: SyncMetaRepository,
    private readonly taskRepository: TaskRepository,
    private readonly goalRepository: GoalRepository,
    private readonly contextRepository: ContextRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly ideaRepository: IdeaRepository,
    private readonly settingsRepository: SettingsRepository,
  ) {}

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const prev = this.syncMutex;
    this.syncMutex = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async pull(): Promise<void> {
    return this.withLock(() => this._pull());
  }

  async push(force = false): Promise<void> {
    return this.withLock(() => this._push(force));
  }

  private async _pull(): Promise<void> {
    const sinceRevision = await this.syncMetaRepository.getValue(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
    );

    const pullResponse = await this.apiClient.pull({
      since_revision: sinceRevision,
    });

    if (!pullResponse.ok) {
      throw new Error("Pull failed");
    }

    await Promise.all([
      this.taskRepository.applyServerRecords(pullResponse.data.tasks),
      this.goalRepository.applyServerRecords(pullResponse.data.goals),
      this.contextRepository.applyServerRecords(pullResponse.data.contexts),
      this.categoryRepository.applyServerRecords(pullResponse.data.categories),
      this.checklistRepository.applyServerRecords(
        pullResponse.data.checklist_items,
      ),
      this.ideaRepository.applyServerRecords(pullResponse.data.ideas),
      this.settingsRepository.bulkUpsert(pullResponse.settings),
    ]);

    await this.syncMetaRepository.setValue(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      pullResponse.current_revision,
    );
  }

  private async _push(force = false): Promise<void> {
    const [
      tasks,
      goals,
      contexts,
      categories,
      checklist_items,
      ideas,
      settings,
    ] = force
      ? await Promise.all([
          this.taskRepository.getAll(),
          this.goalRepository.getAll(),
          this.contextRepository.getAll(),
          this.categoryRepository.getAll(),
          this.checklistRepository.getAll(),
          this.ideaRepository.getAll(),
          this.settingsRepository.getAll(),
        ])
      : await Promise.all([
          this.taskRepository.getDirty(),
          this.goalRepository.getDirty(),
          this.contextRepository.getDirty(),
          this.categoryRepository.getDirty(),
          this.checklistRepository.getDirty(),
          this.ideaRepository.getDirty(),
          this.settingsRepository.getDirty(),
        ]);

    if (!force) {
      const hasChanges =
        tasks.length > 0 ||
        goals.length > 0 ||
        contexts.length > 0 ||
        categories.length > 0 ||
        checklist_items.length > 0 ||
        ideas.length > 0 ||
        settings.length > 0;

      if (!hasChanges) return;
    }

    const sentVersions = new Map<string, number>([
      ...tasks.map((task) => [task.id, task.version] as [string, number]),
      ...goals.map((goal) => [goal.id, goal.version] as [string, number]),
      ...contexts.map(
        (context) => [context.id, context.version] as [string, number],
      ),
      ...categories.map(
        (category) => [category.id, category.version] as [string, number],
      ),
      ...checklist_items.map(
        (item) => [item.id, item.version] as [string, number],
      ),
      ...ideas.map((idea) => [idea.id, idea.version] as [string, number]),
    ]);

    const stripDirty = <T extends { _dirty?: boolean }>(
      records: T[],
    ): Omit<T, "_dirty">[] =>
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      records.map(({ _dirty: _, ...rest }) => rest as Omit<T, "_dirty">);

    const goalsForPush = goals.map((goal) =>
      goal.cover_file_id.startsWith(LOCAL_COVER_ID_PREFIX)
        ? { ...goal, cover_file_id: "" }
        : goal,
    );

    const pushResponse = await this.apiClient.push({
      changes: {
        tasks: stripDirty(tasks) as Task[],
        goals: stripDirty(goalsForPush) as Goal[],
        contexts: stripDirty(contexts) as Context[],
        categories: stripDirty(categories) as Category[],
        checklist_items: stripDirty(checklist_items) as ChecklistItem[],
        ideas: stripDirty(ideas) as Idea[],
        settings: stripDirty(settings) as Setting[],
      },
    });

    if (!pushResponse.ok) {
      throw new Error("Push failed");
    }

    await this._applyPushResults(
      pushResponse.results,
      sentVersions,
      pushResponse.revision,
    );

    if (pushResponse.revision !== undefined) {
      await this.syncMetaRepository.setValue(
        SYNC_META_KEYS.LAST_KNOWN_REVISION,
        pushResponse.revision,
      );
    }
  }

  private async _applyPushResults(
    results: PushResponseData,
    sentVersions: Map<string, number>,
    pushRevision: number | undefined,
  ): Promise<void> {
    await Promise.all([
      this._applyEntityPushResults(
        results.tasks ?? [],
        sentVersions,
        this.taskRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.goals ?? [],
        sentVersions,
        this.goalRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.contexts ?? [],
        sentVersions,
        this.contextRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.categories ?? [],
        sentVersions,
        this.categoryRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.checklist_items ?? [],
        sentVersions,
        this.checklistRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.ideas ?? [],
        sentVersions,
        this.ideaRepository,
        pushRevision,
      ),
      this._applySettingsPushResults(results.settings ?? []),
    ]);
  }

  private async _applySettingsPushResults(
    results: PushResponseData["settings"],
  ): Promise<void> {
    if (!results || results.length === 0) return;

    const acceptedKeys = results
      .filter(
        (result) =>
          result.status === PUSH_RESULT_STATUS.ACCEPTED ||
          result.status === PUSH_RESULT_STATUS.CREATED,
      )
      .map((result) => result.id);

    if (acceptedKeys.length > 0) {
      await this.settingsRepository.clearDirtyByKey(acceptedKeys);
    }
  }

  private async _applyEntityPushResults<
    T extends {
      id: string;
      _dirty: boolean;
      version: number;
      revision: number;
    },
  >(
    results: PushResponseData["tasks"],
    sentVersions: Map<string, number>,
    repository: {
      getById(id: string): Promise<T | undefined>;
      update(record: T): Promise<void>;
    },
    pushRevision: number | undefined,
  ): Promise<void> {
    if (!results || results.length === 0) return;

    for (const result of results) {
      if (
        result.status === PUSH_RESULT_STATUS.CONFLICT &&
        result.server_record
      ) {
        await repository.update({
          ...(result.server_record as unknown as T),
          _dirty: false,
        });
        continue;
      }

      if (
        result.status === PUSH_RESULT_STATUS.CREATED ||
        result.status === PUSH_RESULT_STATUS.ACCEPTED
      ) {
        const currentRecord = await repository.getById(result.id);
        if (!currentRecord) continue;

        const sentVersion = sentVersions.get(result.id) ?? 0;
        const versionUnchanged = currentRecord.version === sentVersion;

        await repository.update({
          ...currentRecord,
          revision: pushRevision ?? currentRecord.revision,
          _dirty: !versionUnchanged,
        });
      }
    }
  }

  async resetAndPull(): Promise<void> {
    // 1. Сбросить revision в 0
    await this.syncMetaRepository.setValue(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      0,
    );

    // 2. Пометить все записи как не-dirty (чтобы pull перезаписал их)
    await db.tasks.toCollection().modify({ _dirty: false });
    await db.goals.toCollection().modify({ _dirty: false });
    await db.contexts.toCollection().modify({ _dirty: false });
    await db.categories.toCollection().modify({ _dirty: false });
    await db.checklist_items.toCollection().modify({ _dirty: false });
    await db.ideas.toCollection().modify({ _dirty: false });
    await db.settings.toCollection().modify({ _dirty: false });

    // 3. Получить полное состояние с сервера
    await this.pull();
  }
}
