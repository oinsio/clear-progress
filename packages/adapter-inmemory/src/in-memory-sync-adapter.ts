import type {
  DeleteFileRequest,
  DeleteFileResponse,
  GetFileRequest,
  GetFileResponse,
  InitResponse,
  PingResponse,
  PullRequest,
  PullResponse,
  PurgeResponse,
  PushItemResult,
  PushRequest,
  PushResponse,
  PushSettingResult,
  SyncAdapter,
  TableCursor,
  UploadFileRequest,
  UploadFileResponse,
  UploadFilesRequest,
  UploadFilesResponse,
  WireAttachment,
  WireCategory,
  WireChecklistItem,
  WireContext,
  WireGoal,
  WireIdea,
  WireSetting,
  WireTask,
} from "@clear-progress/contract";
import {
  ALLOWED_FILE_MIME_TYPES,
  MAX_FILE_BATCH_SIZE,
} from "@clear-progress/contract";

const APP_NAME = "inmemory";
const APP_VERSION = "0.1.0";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_BOXES = new Set(["inbox", "today", "week", "later"]);

interface FileMetadata {
  filename: string;
  mime_type: string;
  data: string;
  data_hash: string;
}

type EntityWithId =
  | WireTask
  | WireGoal
  | WireContext
  | WireCategory
  | WireIdea
  | WireChecklistItem
  | WireAttachment;

// implements FR7 of fix-pull-pagination
export class InMemorySyncAdapter implements SyncAdapter {
  private tasks = new Map<string, WireTask>();
  private goals = new Map<string, WireGoal>();
  private contexts = new Map<string, WireContext>();
  private categories = new Map<string, WireCategory>();
  private ideas = new Map<string, WireIdea>();
  private checklistItems = new Map<string, WireChecklistItem>();
  private attachments = new Map<string, WireAttachment>();
  private settings = new Map<string, WireSetting>();
  private files = new Map<string, FileMetadata>(); // data_hash → metadata

  private nextRevision = 1;
  private purgeRevision = 0;
  private initialized = false;
  private readonly maxRowsPerTable: number;

  constructor(options: { maxRowsPerTable?: number } = {}) {
    this.maxRowsPerTable = options.maxRowsPerTable ?? Infinity;
  }

  async ping(): Promise<PingResponse> {
    return {
      ok: true,
      app: APP_NAME,
      version: APP_VERSION,
      initialized: this.initialized,
    };
  }

  async init(): Promise<InitResponse> {
    this.initialized = true;
    return { ok: true };
  }

  // implements FR7, FR8 of fix-pull-pagination
  async pull(request: PullRequest): Promise<PullResponse> {
    const requestCursors = request.cursors ?? {};
    const sinceRevision = request.since_revision;

    const allTasks = this.filterAndSort(
      this.tasks,
      sinceRevision,
      requestCursors["tasks"],
    );
    const allGoals = this.filterAndSort(
      this.goals,
      sinceRevision,
      requestCursors["goals"],
    );
    const allContexts = this.filterAndSort(
      this.contexts,
      sinceRevision,
      requestCursors["contexts"],
    );
    const allCategories = this.filterAndSort(
      this.categories,
      sinceRevision,
      requestCursors["categories"],
    );
    const allIdeas = this.filterAndSort(
      this.ideas,
      sinceRevision,
      requestCursors["ideas"],
    );
    const allChecklistItems = this.filterAndSort(
      this.checklistItems,
      sinceRevision,
      requestCursors["checklist_items"],
    );
    const allAttachments = this.filterAndSort(
      this.attachments,
      sinceRevision,
      requestCursors["attachments"],
    );

    const allEntityArrays = [
      allTasks,
      allGoals,
      allContexts,
      allCategories,
      allIdeas,
      allChecklistItems,
      allAttachments,
    ];

    const hasMore = allEntityArrays.some(
      (entities) => entities.length > this.maxRowsPerTable,
    );

    const tasks = allTasks.slice(0, this.maxRowsPerTable);
    const goals = allGoals.slice(0, this.maxRowsPerTable);
    const contexts = allContexts.slice(0, this.maxRowsPerTable);
    const categories = allCategories.slice(0, this.maxRowsPerTable);
    const ideas = allIdeas.slice(0, this.maxRowsPerTable);
    const checklistItems = allChecklistItems.slice(0, this.maxRowsPerTable);
    const attachments = allAttachments.slice(0, this.maxRowsPerTable);

    const truncatedArrays = [
      tasks,
      goals,
      contexts,
      categories,
      ideas,
      checklistItems,
      attachments,
    ];

    let currentRevision: number;
    if (hasMore) {
      const maxRevisions = truncatedArrays
        .filter((entities) => entities.length > 0)
        .map((entities) => entities[entities.length - 1]!.revision);
      currentRevision =
        maxRevisions.length > 0
          ? Math.min(...maxRevisions)
          : this.nextRevision - 1;
    } else {
      currentRevision = this.nextRevision - 1;
    }

    const responseCursors: Record<string, TableCursor> = {};
    if (hasMore) {
      const tableNames = [
        "tasks",
        "goals",
        "contexts",
        "categories",
        "ideas",
        "checklist_items",
        "attachments",
      ];
      tableNames.forEach((tableName, index) => {
        const allEntities = allEntityArrays[index]!;
        const truncated = truncatedArrays[index]!;
        if (allEntities.length > this.maxRowsPerTable && truncated.length > 0) {
          const lastEntity = truncated[truncated.length - 1]!;
          responseCursors[tableName] = {
            revision: lastEntity.revision,
            last_id: lastEntity.id,
          };
        }
      });
    }

    let settings = Array.from(this.settings.values());
    const settingsUpdatedAt = request.settings_updated_at;
    if (settingsUpdatedAt) {
      settings = settings.filter(
        (setting) => setting.updated_at > settingsUpdatedAt,
      );
    }

    return {
      ok: true,
      tasks,
      goals,
      contexts,
      categories,
      ideas,
      checklist_items: checklistItems,
      attachments,
      settings,
      current_revision: currentRevision,
      purge_revision: this.purgeRevision,
      has_more: hasMore,
      server_time: new Date().toISOString(),
      ...(Object.keys(responseCursors).length > 0 && {
        cursors: responseCursors,
      }),
    };
  }

  private filterAndSort<T extends { revision: number; id: string }>(
    store: Map<string, T>,
    sinceRevision: number,
    cursor?: TableCursor,
  ): T[] {
    return Array.from(store.values())
      .filter((entity) => {
        if (cursor) {
          return (
            entity.revision > cursor.revision ||
            (entity.revision === cursor.revision && entity.id > cursor.last_id)
          );
        }
        return entity.revision > sinceRevision;
      })
      .sort((a, b) =>
        a.revision !== b.revision
          ? a.revision - b.revision
          : a.id.localeCompare(b.id),
      );
  }

  async push(request: PushRequest): Promise<PushResponse> {
    const revision = this.nextRevision;
    const results: PushResponse["results"] = {};

    if (request.tasks) {
      results.tasks = request.tasks.map((task) =>
        this.pushEntity(this.tasks, task, revision),
      );
    }

    if (request.goals) {
      results.goals = request.goals.map((goal) =>
        this.pushEntity(this.goals, goal, revision),
      );
    }

    if (request.contexts) {
      results.contexts = request.contexts.map((context) =>
        this.pushEntity(this.contexts, context, revision),
      );
    }

    if (request.categories) {
      results.categories = request.categories.map((category) =>
        this.pushEntity(this.categories, category, revision),
      );
    }

    if (request.ideas) {
      results.ideas = request.ideas.map((idea) =>
        this.pushEntity(this.ideas, idea, revision),
      );
    }

    if (request.checklist_items) {
      results.checklist_items = request.checklist_items.map((item) =>
        this.pushEntity(this.checklistItems, item, revision),
      );
    }

    if (request.attachments) {
      results.attachments = request.attachments.map((attachment) =>
        this.pushEntity(this.attachments, attachment, revision),
      );
    }

    if (request.settings) {
      results.settings = request.settings.map((setting) =>
        this.pushSetting(setting),
      );
    }

    this.nextRevision++;

    return {
      ok: true,
      revision,
      results,
      server_time: new Date().toISOString(),
    };
  }

  private pushEntity<T extends EntityWithId>(
    store: Map<string, T>,
    entity: T,
    revision: number,
  ): PushItemResult {
    const validationError = this.validateEntity(entity);
    if (validationError) {
      return { id: entity.id, status: "rejected", reason: validationError };
    }

    const existing = store.get(entity.id);

    if (!existing) {
      const updated = { ...entity, revision };
      store.set(entity.id, updated);
      return { id: entity.id, status: "created" };
    }

    if (existing.updated_at > entity.updated_at) {
      return {
        id: entity.id,
        status: "conflict",
        server_record: existing,
      };
    }

    const updated = { ...entity, revision };
    store.set(entity.id, updated);
    return { id: entity.id, status: "accepted" };
  }

  private validateEntity(entity: EntityWithId): string | undefined {
    if (!UUID_REGEX.test(entity.id)) {
      return "Invalid UUID format";
    }

    if ("name" in entity && entity.name.trim() === "") {
      return "Name must not be blank";
    }

    if ("box" in entity && !VALID_BOXES.has(entity.box)) {
      return `Invalid box value: ${entity.box}`;
    }

    return undefined;
  }

  private pushSetting(setting: WireSetting): PushSettingResult {
    const existing = this.settings.get(setting.key);

    if (!existing) {
      this.settings.set(setting.key, setting);
      return { key: setting.key, status: "created" };
    }

    if (existing.updated_at > setting.updated_at) {
      return {
        key: setting.key,
        status: "conflict",
        server_record: existing,
      };
    }

    this.settings.set(setting.key, setting);
    return { key: setting.key, status: "accepted" };
  }

  private storeFile(file: {
    filename: string;
    mime_type: string;
    data: string;
    data_hash: string;
  }): boolean {
    const existing = this.files.get(file.data_hash);
    if (existing) {
      return true;
    }

    const metadata: FileMetadata = {
      filename: file.filename,
      mime_type: file.mime_type,
      data: file.data,
      data_hash: file.data_hash,
    };
    this.files.set(file.data_hash, metadata);
    return false;
  }

  async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
    const reused = this.storeFile(request);
    return { ok: true, data_hash: request.data_hash, reused };
  }

  async uploadFiles(request: UploadFilesRequest): Promise<UploadFilesResponse> {
    if (request.files.length > MAX_FILE_BATCH_SIZE) {
      return { ok: false, results: [] };
    }

    const allowedMimeTypes = new Set<string>(ALLOWED_FILE_MIME_TYPES);

    const results = request.files.map((file) => {
      if (!allowedMimeTypes.has(file.mime_type)) {
        return {
          local_id: file.local_id,
          goal_id: file.goal_id,
          error: `Invalid mime type: ${file.mime_type}`,
        };
      }

      const reused = this.storeFile(file);
      return {
        local_id: file.local_id,
        goal_id: file.goal_id,
        data_hash: file.data_hash,
        reused,
      };
    });

    return { ok: true, results };
  }

  async getFile(request: GetFileRequest): Promise<GetFileResponse> {
    const files = request.hashes.map((hash) => {
      const metadata = this.files.get(hash);
      if (!metadata) {
        return {
          hash,
          error: "File not found",
        };
      }
      return {
        hash,
        mime_type: metadata.mime_type,
        data: metadata.data,
      };
    });

    return {
      ok: true,
      files,
    };
  }

  async deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    const goalRefs = this.countGoalReferences(request.hash);
    const attachmentRefs = this.countAttachmentReferences(request.hash);
    const totalRefs = goalRefs + attachmentRefs;

    if (totalRefs > 0) {
      return { ok: true, deleted: false, ref_count: totalRefs };
    }

    this.files.delete(request.hash);
    return { ok: true, deleted: true, ref_count: 0 };
  }

  private countGoalReferences(hash: string): number {
    let count = 0;
    for (const goal of this.goals.values()) {
      if (goal.cover_hash === hash) {
        count++;
      }
    }
    return count;
  }

  private countAttachmentReferences(hash: string): number {
    let count = 0;
    for (const attachment of this.attachments.values()) {
      if (attachment.data_hash === hash) {
        count++;
      }
    }
    return count;
  }

  async purge(): Promise<PurgeResponse> {
    const purged = {
      tasks: this.purgeDeleted(this.tasks),
      goals: this.purgeDeleted(this.goals),
      contexts: this.purgeDeleted(this.contexts),
      categories: this.purgeDeleted(this.categories),
      ideas: this.purgeDeleted(this.ideas),
      checklist_items: this.purgeDeleted(this.checklistItems),
      attachments: this.purgeDeleted(this.attachments),
    };

    this.purgeOrphanedFiles();

    this.purgeRevision++;

    return {
      ok: true,
      purged,
      purge_revision: this.purgeRevision,
    };
  }

  private purgeDeleted<T extends { id: string; is_deleted: boolean }>(
    store: Map<string, T>,
  ): number {
    let count = 0;
    for (const [id, entity] of store.entries()) {
      if (entity.is_deleted) {
        store.delete(id);
        count++;
      }
    }
    return count;
  }

  private purgeOrphanedFiles(): void {
    for (const [hash] of this.files.entries()) {
      const goalRefs = this.countGoalReferences(hash);
      const attachmentRefs = this.countAttachmentReferences(hash);
      if (goalRefs + attachmentRefs === 0) {
        this.files.delete(hash);
      }
    }
  }
}
