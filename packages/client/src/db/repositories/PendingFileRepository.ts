/** Implements FR4 of add-file-attachments */
import type { PendingFileRecord } from "@/types/entities";
import { db } from "../database";

export class PendingFileRepository {
  async getAll(): Promise<PendingFileRecord[]> {
    return db.pending_files.toArray();
  }

  async getByHash(dataHash: string): Promise<PendingFileRecord | undefined> {
    return db.pending_files.get(dataHash);
  }

  async save(record: PendingFileRecord): Promise<void> {
    await db.pending_files.put(record);
  }

  async delete(dataHash: string): Promise<void> {
    await db.pending_files.delete(dataHash);
  }
}
