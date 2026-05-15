import type { PushResponse, SyncAdapter } from "@clear-progress/contract";
import {
  LOCAL_COVER_ID_PREFIX,
  PUSH_CHUNK_SIZE,
  PUSH_RESULT_STATUS,
  STORAGE_KEYS,
  SYNC_META_KEYS,
} from "@/constants";
import { db } from "@/db/database";
import type { CategoryRepository } from "@/db/repositories/CategoryRepository";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { SyncMetaRepository } from "@/db/repositories/SyncMetaRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { Temporal } from "@/lib/temporal";
import type { PurgeResponse } from "@/types/api";
import type {
  Category,
  ChecklistItem,
  Context,
  Goal,
  Idea,
  Setting,
  Task,
} from "@/types/entities";

export class SyncService {
  private syncMutex: Promise<void> = Promise.resolve();

  constructor(
    private readonly syncAdapter: SyncAdapter,
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
    const settingsUpdatedAt =
      localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT) ?? undefined;

    const pullResponse = await this.syncAdapter.pull({
      since_revision: sinceRevision,
      settings_updated_at: settingsUpdatedAt,
    });

    if (!pullResponse.ok) {
      throw new Error("Pull failed");
    }

    // Проверить purge_revision
    const localPurgeRevision = await this.syncMetaRepository.getValue(
      SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
    );

    if (pullResponse.purge_revision > localPurgeRevision) {
      // Кто-то другой вызвал purge — удалить локальные soft-deleted записи
      await this._purgeLocalDeletedRecords();
      await this.syncMetaRepository.setValue(
        SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
        pullResponse.purge_revision,
      );
    }

    await Promise.all([
      this.taskRepository.applyServerRecords(pullResponse.tasks),
      this.goalRepository.applyServerRecords(pullResponse.goals),
      this.contextRepository.applyServerRecords(pullResponse.contexts),
      this.categoryRepository.applyServerRecords(pullResponse.categories),
      this.checklistRepository.applyServerRecords(pullResponse.checklist_items),
      this.ideaRepository.applyServerRecords(pullResponse.ideas),
      this.settingsRepository.bulkUpsert(pullResponse.settings),
    ]);

    // Update settings_updated_at
    // Use numeric comparison via Temporal.Instant.compare instead of
    // lexicographic comparison, since ISO 8601 strings can have different numbers
    // of decimal places (0 vs. 3), which breaks string comparison.
    if (pullResponse.settings.length > 0) {
      const maxUpdatedAt = pullResponse.settings.reduce((max, setting) => {
        if (!max) return setting.updated_at;
        return Temporal.Instant.compare(
          Temporal.Instant.from(setting.updated_at),
          Temporal.Instant.from(max),
        ) > 0
          ? setting.updated_at
          : max;
      }, settingsUpdatedAt ?? "");
      localStorage.setItem(STORAGE_KEYS.SETTINGS_UPDATED_AT, maxUpdatedAt);
    }

    await this.syncMetaRepository.setValue(
      SYNC_META_KEYS.LAST_KNOWN_REVISION,
      pullResponse.current_revision,
    );

    // Уведомить о завершении синхронизации
    window.dispatchEvent(new CustomEvent("sync_complete"));
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
          this.taskRepository.getNeedingSync(),
          this.goalRepository.getNeedingSync(),
          this.contextRepository.getNeedingSync(),
          this.categoryRepository.getNeedingSync(),
          this.checklistRepository.getNeedingSync(),
          this.ideaRepository.getNeedingSync(),
          this.settingsRepository.getNeedingSync(),
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

    const sentTimestamps = new Map<string, string>([
      ...tasks.map((task) => [task.id, task.updated_at] as [string, string]),
      ...goals.map((goal) => [goal.id, goal.updated_at] as [string, string]),
      ...contexts.map(
        (context) => [context.id, context.updated_at] as [string, string],
      ),
      ...categories.map(
        (category) => [category.id, category.updated_at] as [string, string],
      ),
      ...checklist_items.map(
        (item) => [item.id, item.updated_at] as [string, string],
      ),
      ...ideas.map((idea) => [idea.id, idea.updated_at] as [string, string]),
    ]);

    const stripDirty = <T extends { needsSync?: boolean }>(
      records: T[],
    ): Omit<T, "needsSync">[] =>
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      records.map(({ needsSync: _, ...rest }) => rest as Omit<T, "needsSync">);

    const goalsForPush = goals.map((goal) =>
      goal.cover_file_id.startsWith(LOCAL_COVER_ID_PREFIX)
        ? { ...goal, cover_file_id: "" }
        : goal,
    );

    // Split into chunks
    const chunks = this._createPushChunks(
      tasks,
      goalsForPush,
      contexts,
      categories,
      checklist_items,
      ideas,
      settings,
    );

    let lastRevision: number | undefined;

    // Send chunks sequentially
    for (const chunk of chunks) {
      const pushResponse = await this.syncAdapter.push({
        tasks: stripDirty(chunk.tasks) as Task[],
        goals: stripDirty(chunk.goals) as Goal[],
        contexts: stripDirty(chunk.contexts) as Context[],
        categories: stripDirty(chunk.categories) as Category[],
        checklist_items: stripDirty(chunk.checklist_items) as ChecklistItem[],
        ideas: stripDirty(chunk.ideas) as Idea[],
        settings: stripDirty(chunk.settings) as Setting[],
      });

      if (!pushResponse.ok) {
        throw new Error("Push failed");
      }

      await this._applyPushResults(
        pushResponse.results,
        sentTimestamps,
        pushResponse.revision,
      );

      if (pushResponse.revision !== undefined) {
        lastRevision = pushResponse.revision;
      }
    }

    if (lastRevision !== undefined) {
      await this.syncMetaRepository.setValue(
        SYNC_META_KEYS.LAST_KNOWN_REVISION,
        lastRevision,
      );
    }
  }

  private _createPushChunks(
    tasks: Task[],
    goals: Goal[],
    contexts: Context[],
    categories: Category[],
    checklist_items: ChecklistItem[],
    ideas: Idea[],
    settings: Setting[],
  ): Array<{
    tasks: Task[];
    goals: Goal[];
    contexts: Context[];
    categories: Category[];
    checklist_items: ChecklistItem[];
    ideas: Idea[];
    settings: Setting[];
  }> {
    const allRecords = [
      ...tasks,
      ...goals,
      ...contexts,
      ...categories,
      ...checklist_items,
      ...ideas,
      ...settings,
    ];

    const totalCount = allRecords.length;

    if (totalCount <= PUSH_CHUNK_SIZE) {
      return [
        {
          tasks,
          goals,
          contexts,
          categories,
          checklist_items,
          ideas,
          settings,
        },
      ];
    }

    const chunks: Array<{
      tasks: Task[];
      goals: Goal[];
      contexts: Context[];
      categories: Category[];
      checklist_items: ChecklistItem[];
      ideas: Idea[];
      settings: Setting[];
    }> = [];

    const remainingTasks = [...tasks];
    const remainingGoals = [...goals];
    const remainingContexts = [...contexts];
    const remainingCategories = [...categories];
    const remainingChecklistItems = [...checklist_items];
    const remainingIdeas = [...ideas];
    const remainingSettings = [...settings];

    while (
      remainingTasks.length > 0 ||
      remainingGoals.length > 0 ||
      remainingContexts.length > 0 ||
      remainingCategories.length > 0 ||
      remainingChecklistItems.length > 0 ||
      remainingIdeas.length > 0 ||
      remainingSettings.length > 0
    ) {
      const chunk = {
        tasks: [] as Task[],
        goals: [] as Goal[],
        contexts: [] as Context[],
        categories: [] as Category[],
        checklist_items: [] as ChecklistItem[],
        ideas: [] as Idea[],
        settings: [] as Setting[],
      };

      let chunkSize = 0;

      // Fill chunk with records from each type
      const takeFromArray = <T>(arr: T[], remaining: number): T[] => {
        const toTake = Math.min(arr.length, remaining);
        return arr.splice(0, toTake);
      };

      chunk.tasks = takeFromArray(remainingTasks, PUSH_CHUNK_SIZE - chunkSize);
      chunkSize += chunk.tasks.length;

      if (chunkSize < PUSH_CHUNK_SIZE) {
        chunk.goals = takeFromArray(
          remainingGoals,
          PUSH_CHUNK_SIZE - chunkSize,
        );
        chunkSize += chunk.goals.length;
      }

      if (chunkSize < PUSH_CHUNK_SIZE) {
        chunk.contexts = takeFromArray(
          remainingContexts,
          PUSH_CHUNK_SIZE - chunkSize,
        );
        chunkSize += chunk.contexts.length;
      }

      if (chunkSize < PUSH_CHUNK_SIZE) {
        chunk.categories = takeFromArray(
          remainingCategories,
          PUSH_CHUNK_SIZE - chunkSize,
        );
        chunkSize += chunk.categories.length;
      }

      if (chunkSize < PUSH_CHUNK_SIZE) {
        chunk.checklist_items = takeFromArray(
          remainingChecklistItems,
          PUSH_CHUNK_SIZE - chunkSize,
        );
        chunkSize += chunk.checklist_items.length;
      }

      if (chunkSize < PUSH_CHUNK_SIZE) {
        chunk.ideas = takeFromArray(
          remainingIdeas,
          PUSH_CHUNK_SIZE - chunkSize,
        );
        chunkSize += chunk.ideas.length;
      }

      if (chunkSize < PUSH_CHUNK_SIZE) {
        chunk.settings = takeFromArray(
          remainingSettings,
          PUSH_CHUNK_SIZE - chunkSize,
        );
        chunkSize += chunk.settings.length;
      }

      chunks.push(chunk);
    }

    return chunks;
  }

  private async _applyPushResults(
    results: PushResponse["results"],
    sentTimestamps: Map<string, string>,
    pushRevision: number | undefined,
  ): Promise<void> {
    await Promise.all([
      this._applyEntityPushResults(
        results.tasks ?? [],
        sentTimestamps,
        this.taskRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.goals ?? [],
        sentTimestamps,
        this.goalRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.contexts ?? [],
        sentTimestamps,
        this.contextRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.categories ?? [],
        sentTimestamps,
        this.categoryRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.checklist_items ?? [],
        sentTimestamps,
        this.checklistRepository,
        pushRevision,
      ),
      this._applyEntityPushResults(
        results.ideas ?? [],
        sentTimestamps,
        this.ideaRepository,
        pushRevision,
      ),
      this._applySettingsPushResults(results.settings ?? []),
    ]);
  }

  private async _applySettingsPushResults(
    results: PushResponse["results"]["settings"],
  ): Promise<void> {
    if (!results || results.length === 0) return;

    const acceptedKeys = results
      .filter(
        (result) =>
          result.status === PUSH_RESULT_STATUS.ACCEPTED ||
          result.status === PUSH_RESULT_STATUS.CREATED,
      )
      .map((result) => result.key);

    if (acceptedKeys.length > 0) {
      await this.settingsRepository.clearNeedsSyncByKey(acceptedKeys);
    }
  }

  private async _applyEntityPushResults<
    T extends {
      id: string;
      needsSync: boolean;
      updated_at: string;
      revision: number;
    },
  >(
    results: PushResponse["results"]["tasks"],
    sentTimestamps: Map<string, string>,
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
          needsSync: false,
        });
        continue;
      }

      if (
        result.status === PUSH_RESULT_STATUS.CREATED ||
        result.status === PUSH_RESULT_STATUS.ACCEPTED
      ) {
        const currentRecord = await repository.getById(result.id);
        if (!currentRecord) continue;

        const sentTimestamp = sentTimestamps.get(result.id) ?? "";
        const timestampUnchanged = currentRecord.updated_at === sentTimestamp;

        await repository.update({
          ...currentRecord,
          revision: pushRevision ?? currentRecord.revision,
          needsSync: !timestampUnchanged,
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

    // Сбросить settings_updated_at для полного pull settings
    localStorage.removeItem(STORAGE_KEYS.SETTINGS_UPDATED_AT);

    // 2. Пометить все записи как не-needsSync (чтобы pull перезаписал их)
    await db.tasks.toCollection().modify({ needsSync: false });
    await db.goals.toCollection().modify({ needsSync: false });
    await db.contexts.toCollection().modify({ needsSync: false });
    await db.categories.toCollection().modify({ needsSync: false });
    await db.checklist_items.toCollection().modify({ needsSync: false });
    await db.ideas.toCollection().modify({ needsSync: false });
    await db.settings.toCollection().modify({ needsSync: false });

    // 3. Получить полное состояние с сервера
    await this.pull();
  }

  private async _purgeLocalDeletedRecords(): Promise<void> {
    await db.transaction(
      "rw",
      [
        db.tasks,
        db.goals,
        db.contexts,
        db.categories,
        db.checklist_items,
        db.ideas,
      ],
      async () => {
        await db.tasks.filter((t) => t.is_deleted).delete();
        await db.goals.filter((g) => g.is_deleted).delete();
        await db.contexts.filter((c) => c.is_deleted).delete();
        await db.categories.filter((c) => c.is_deleted).delete();
        await db.checklist_items.filter((i) => i.is_deleted).delete();
        await db.ideas.filter((i) => i.is_deleted).delete();
      },
    );
  }

  async purge(): Promise<PurgeResponse["purged"]> {
    return this.withLock(() => this._purge());
  }

  private async _purge(): Promise<PurgeResponse["purged"]> {
    // 1. Вызвать API purge
    const response = await this.syncAdapter.purge();

    if (!response.ok) {
      throw new Error("Purge failed");
    }

    // 2. Удалить локальные soft-deleted записи
    await this._purgeLocalDeletedRecords();

    // 3. Обновить last_known_purge_revision
    await this.syncMetaRepository.setValue(
      SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
      response.purge_revision,
    );

    // 4. Сделать pull для синхронизации (обновит current_revision)
    await this._pull();

    // 5. Вернуть статистику для UI
    return response.purged;
  }
}
