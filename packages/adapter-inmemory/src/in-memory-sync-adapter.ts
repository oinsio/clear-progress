import type {
  SyncAdapter,
  PingResponse,
  InitResponse,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  PushItemResult,
  PushSettingResult,
  UploadCoverRequest,
  UploadCoverResponse,
  UploadCoversRequest,
  UploadCoversResponse,
  GetCoverRequest,
  GetCoverResponse,
  DeleteCoverRequest,
  DeleteCoverResponse,
  PurgeResponse,
  WireTask,
  WireGoal,
  WireContext,
  WireCategory,
  WireIdea,
  WireChecklistItem,
  WireSetting,
} from "@clear-progress/contract";

const APP_NAME = "inmemory";
const APP_VERSION = "0.1.0";

interface CoverMetadata {
  file_id: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string;
  data_hash: string;
}

type EntityWithId = WireTask | WireGoal | WireContext | WireCategory | WireIdea | WireChecklistItem;

export class InMemorySyncAdapter implements SyncAdapter {
  private tasks = new Map<string, WireTask>();
  private goals = new Map<string, WireGoal>();
  private contexts = new Map<string, WireContext>();
  private categories = new Map<string, WireCategory>();
  private ideas = new Map<string, WireIdea>();
  private checklistItems = new Map<string, WireChecklistItem>();
  private settings = new Map<string, WireSetting>();
  private covers = new Map<string, CoverMetadata>();

  private nextRevision = 1;
  private purgeRevision = 0;
  private initialized = false;

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

  async pull(request: PullRequest): Promise<PullResponse> {
    const tasks = Array.from(this.tasks.values()).filter(
      (task) => task.revision > request.since_revision,
    );
    const goals = Array.from(this.goals.values()).filter(
      (goal) => goal.revision > request.since_revision,
    );
    const contexts = Array.from(this.contexts.values()).filter(
      (context) => context.revision > request.since_revision,
    );
    const categories = Array.from(this.categories.values()).filter(
      (category) => category.revision > request.since_revision,
    );
    const ideas = Array.from(this.ideas.values()).filter(
      (idea) => idea.revision > request.since_revision,
    );
    const checklistItems = Array.from(this.checklistItems.values()).filter(
      (item) => item.revision > request.since_revision,
    );

    let settings = Array.from(this.settings.values());
    if (request.settings_updated_at) {
      settings = settings.filter(
        (setting) => setting.updated_at > request.settings_updated_at!,
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
      settings,
      current_revision: this.nextRevision - 1,
      purge_revision: this.purgeRevision,
      server_time: new Date().toISOString(),
    };
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

  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse> {
    const fileId = crypto.randomUUID();
    const metadata: CoverMetadata = {
      file_id: fileId,
      goal_id: request.goal_id,
      filename: request.filename,
      mime_type: request.mime_type,
      data: request.data,
      data_hash: request.data_hash,
    };
    this.covers.set(fileId, metadata);

    return {
      ok: true,
      file_id: fileId,
      reused: false,
    };
  }

  async uploadCovers(request: UploadCoversRequest): Promise<UploadCoversResponse> {
    const results = request.covers.map((cover) => {
      const fileId = crypto.randomUUID();
      const metadata: CoverMetadata = {
        file_id: fileId,
        goal_id: cover.goal_id,
        filename: cover.filename,
        mime_type: cover.mime_type,
        data: cover.data,
        data_hash: cover.data_hash,
      };
      this.covers.set(fileId, metadata);

      return {
        local_id: cover.local_id,
        goal_id: cover.goal_id,
        file_id: fileId,
        reused: false,
      };
    });

    return {
      ok: true,
      results,
    };
  }

  async getCover(request: GetCoverRequest): Promise<GetCoverResponse> {
    const covers = request.file_ids.map((fileId) => {
      const metadata = this.covers.get(fileId);
      if (!metadata) {
        return {
          file_id: fileId,
          error: "File not found",
        };
      }
      return {
        file_id: fileId,
        mime_type: metadata.mime_type,
        data: metadata.data,
      };
    });

    return {
      ok: true,
      covers,
    };
  }

  async deleteCover(request: DeleteCoverRequest): Promise<DeleteCoverResponse> {
    const deleted = this.covers.delete(request.file_id);
    return {
      ok: true,
      deleted,
      ref_count: 0,
    };
  }

  async purge(): Promise<PurgeResponse> {
    const purged = {
      tasks: this.purgeDeleted(this.tasks),
      goals: this.purgeDeleted(this.goals),
      contexts: this.purgeDeleted(this.contexts),
      categories: this.purgeDeleted(this.categories),
      ideas: this.purgeDeleted(this.ideas),
      checklist_items: this.purgeDeleted(this.checklistItems),
    };

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
}
