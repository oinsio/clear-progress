import Dexie, { type EntityTable } from "dexie";
import { DB_NAME } from "@/constants";
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
import { DB_SCHEMA } from "./schema";
import { DB_SCHEMA_V1 } from "./schemaV1";

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
    this.version(2)
      .stores(DB_SCHEMA)
      .upgrade(async (tx) => {
        const coverRecords = await tx.table("covers").toArray();
        const pendingCoverRecords = await tx.table("pending_covers").toArray();

        await tx.table("files").bulkAdd(coverRecords);
        await tx.table("pending_files").bulkAdd(pendingCoverRecords);
      });
  }
}

export const db = new ClearProgressDatabase();
