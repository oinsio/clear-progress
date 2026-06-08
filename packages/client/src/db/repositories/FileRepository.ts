/** Implements FR4 of add-file-attachments */
import type { FileRecord } from "@/types/entities";
import { db } from "../database";

export class FileRepository {
  async getAll(): Promise<FileRecord[]> {
    return db.files.toArray();
  }

  async getByHash(dataHash: string): Promise<FileRecord | undefined> {
    return db.files.get(dataHash);
  }

  async save(record: FileRecord): Promise<void> {
    await db.files.put(record);
  }

  async delete(dataHash: string): Promise<void> {
    await db.files.delete(dataHash);
  }
}
