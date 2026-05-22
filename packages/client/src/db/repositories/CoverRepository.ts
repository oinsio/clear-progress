// implements FR5 of content-addressable-covers
import type { CoverRecord } from "@/types/entities";
import { db } from "../database";

export class CoverRepository {
  async getAll(): Promise<CoverRecord[]> {
    return db.covers.toArray();
  }

  async getByHash(dataHash: string): Promise<CoverRecord | undefined> {
    return db.covers.get(dataHash);
  }

  async save(record: CoverRecord): Promise<void> {
    await db.covers.put(record);
  }

  async delete(dataHash: string): Promise<void> {
    await db.covers.delete(dataHash);
  }
}
