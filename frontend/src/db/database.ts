import Dexie, { type EntityTable } from "dexie";
import type {
  Task,
  Goal,
  Context,
  Category,
  ChecklistItem,
  Idea,
  Setting,
  SyncMeta,
  CoverRecord,
  PendingCoverRecord,
} from "@/types/entities";
import { DB_NAME, SYNC_META_KEYS } from "@/constants";
import { DB_SCHEMA, DB_SCHEMA_V4 } from "./schema";

const V1_SCHEMA = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, version, updated_at",
  goals: "id, status, is_deleted, sort_order, version, updated_at",
  contexts: "id, is_deleted, sort_order, version, updated_at",
  categories: "id, is_deleted, sort_order, version, updated_at",
  checklist_items: "id, task_id, is_deleted, sort_order, version, updated_at",
  settings: "key, updated_at",
};

export class ClearProgressDatabase extends Dexie {
  tasks!: EntityTable<Task, "id">;
  goals!: EntityTable<Goal, "id">;
  contexts!: EntityTable<Context, "id">;
  categories!: EntityTable<Category, "id">;
  checklist_items!: EntityTable<ChecklistItem, "id">;
  ideas!: EntityTable<Idea, "id">;
  settings!: EntityTable<Setting, "key">;
  covers!: EntityTable<CoverRecord, "file_id">;
  pending_covers!: EntityTable<PendingCoverRecord, "local_id">;
  sync_meta!: EntityTable<SyncMeta, "key">;

  constructor() {
    super(DB_NAME);
    this.version(1).stores(V1_SCHEMA);
    this.version(2).stores(DB_SCHEMA);
    this.version(3).stores({ pending_covers: "local_id, goal_id, data_hash" });
    this.version(4)
      .stores(DB_SCHEMA_V4)
      .upgrade(async (tx) => {
        const entityTables = [
          "tasks",
          "goals",
          "contexts",
          "categories",
          "checklist_items",
        ];
        for (const tableName of entityTables) {
          await tx.table(tableName).toCollection().modify({ _dirty: true, revision: 0 });
        }
        await tx.table("settings").toCollection().modify({ _dirty: true });
        await tx
          .table("sync_meta")
          .put({ key: SYNC_META_KEYS.LAST_KNOWN_REVISION, value: 0 });
      });
    this.version(5)
      .stores(DB_SCHEMA_V4)
      .upgrade(async (tx) => {
        await tx.table("ideas").toCollection().modify({ _dirty: true, revision: 0 });
      });
  }
}

export const db = new ClearProgressDatabase();
