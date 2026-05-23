// implements FR6 of content-addressable-covers
import type { PendingCoverRecord } from "@/types/entities";
import { db } from "../database";

export class PendingCoverRepository {
  async getAll(): Promise<PendingCoverRecord[]> {
    return db.pending_covers.toArray();
  }

  async getByHash(dataHash: string): Promise<PendingCoverRecord | undefined> {
    return db.pending_covers.get(dataHash);
  }

  async save(record: PendingCoverRecord): Promise<void> {
    await db.pending_covers.put(record);
  }

  async delete(dataHash: string): Promise<void> {
    await db.pending_covers.delete(dataHash);
  }
}
