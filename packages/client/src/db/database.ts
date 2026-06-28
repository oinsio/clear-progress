import Dexie, { type EntityTable } from "dexie";
import { DB_NAME, RECORD_SYNC_STATUS } from "@/constants";
import type {
  Attachment,
  Category,
  ChecklistItem,
  Context,
  FileRecord,
  Goal,
  Idea,
  PendingFileRecord,
  Setting,
  SyncMeta,
  Task,
} from "@/types/entities";
import { DB_SCHEMA_V1, DB_SCHEMA_V2 } from "./schema";

export class ClearProgressDatabase extends Dexie {
  tasks!: EntityTable<Task, "id">;
  goals!: EntityTable<Goal, "id">;
  contexts!: EntityTable<Context, "id">;
  categories!: EntityTable<Category, "id">;
  checklist_items!: EntityTable<ChecklistItem, "id">;
  ideas!: EntityTable<Idea, "id">;
  settings!: EntityTable<Setting, "key">;
  files!: EntityTable<FileRecord, "data_hash">;
  pending_files!: EntityTable<PendingFileRecord, "data_hash">;
  attachments!: EntityTable<Attachment, "id">;
  sync_meta!: EntityTable<SyncMeta, "key">;

  constructor() {
    super(DB_NAME);
    this.version(1).stores(DB_SCHEMA_V1);

    // implements FR6 of fix-push-poison-pill
    this.version(2)
      .stores(DB_SCHEMA_V2)
      .upgrade(async (transaction) => {
        const entityTables = [
          "tasks",
          "goals",
          "contexts",
          "categories",
          "checklist_items",
          "ideas",
          "attachments",
          "settings",
        ] as const;

        for (const tableName of entityTables) {
          await transaction
            .table(tableName)
            .toCollection()
            .modify((record: Record<string, unknown>) => {
              record.syncStatus = record.needsSync
                ? RECORD_SYNC_STATUS.PENDING
                : RECORD_SYNC_STATUS.SYNCED;
              delete record.needsSync;
            });
        }
      });
  }
}

export const db = new ClearProgressDatabase();
