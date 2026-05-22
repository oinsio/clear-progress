import Dexie, { type EntityTable } from "dexie";
import { DB_NAME, SYNC_META_KEYS } from "@/constants";
import type {
  Category,
  ChecklistItem,
  Context,
  CoverRecord,
  Goal,
  Idea,
  PendingCoverRecord,
  Setting,
  SyncMeta,
  Task,
} from "@/types/entities";
import { DB_SCHEMA, DB_SCHEMA_V4, DB_SCHEMA_V5 } from "./schema";

const V1_SCHEMA = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, updated_at",
  goals: "id, status, is_deleted, sort_order, updated_at",
  contexts: "id, is_deleted, sort_order, updated_at",
  categories: "id, is_deleted, sort_order, updated_at",
  checklist_items: "id, task_id, is_deleted, sort_order, updated_at",
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
  // implements FR8 of content-addressable-covers
  covers!: EntityTable<CoverRecord, "data_hash">;
  pending_covers!: EntityTable<PendingCoverRecord, "data_hash">;
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
          await tx
            .table(tableName)
            .toCollection()
            .modify({ needsSync: true, revision: 0 });
        }
        await tx.table("settings").toCollection().modify({ needsSync: true });
        await tx
          .table("sync_meta")
          .put({ key: SYNC_META_KEYS.LAST_KNOWN_REVISION, value: 0 });
      });
    this.version(5)
      .stores(DB_SCHEMA_V4)
      .upgrade(async (tx) => {
        await tx
          .table("ideas")
          .toCollection()
          .modify({ needsSync: true, revision: 0 });
      });
    this.version(6)
      .stores(DB_SCHEMA_V4)
      .upgrade(async (tx) => {
        const tasks = await tx.table("tasks").toArray();
        for (const task of tasks) {
          const updates: Partial<Task> = {
            is_hidden: false,
            next_date: "",
            appear_date: "",
          };
          // Сбросить старые правила повторения (несовместимый формат)
          if (task.repeat_rule) {
            updates.repeat_rule = "";
            console.log(
              `Reset repeat_rule for task ${task.id} due to format change`,
            );
          }
          await tx.table("tasks").update(task.id, updates);
        }
      });
    this.version(7)
      .stores(DB_SCHEMA_V4)
      .upgrade(async (tx) => {
        await tx.table("tasks").toCollection().modify({ original_task_id: "" });
      });
    this.version(8)
      .stores(DB_SCHEMA_V4)
      .upgrade(async (tx) => {
        // Переименовать поле _dirty → needsSync во всех таблицах
        const tables = [
          "tasks",
          "goals",
          "contexts",
          "categories",
          "checklist_items",
          "ideas",
          "settings",
        ];
        for (const tableName of tables) {
          await tx
            .table(tableName)
            .toCollection()
            .modify((record: Record<string, unknown>) => {
              record.needsSync = record._dirty ?? false;
              delete record._dirty;
            });
        }
      });
    // implements FR8 of content-addressable-covers
    this.version(9)
      .stores(DB_SCHEMA_V5)
      .upgrade(async (tx) => {
        await tx.table("covers").clear();
        await tx.table("pending_covers").clear();
      });
  }
}

export const db = new ClearProgressDatabase();
