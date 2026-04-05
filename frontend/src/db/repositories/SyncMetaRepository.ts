import { db } from "@/db/database";

export class SyncMetaRepository {
  async getValue(key: string): Promise<number> {
    const record = await db.sync_meta.get(key);
    return record?.value ?? 0;
  }

  async setValue(key: string, value: number): Promise<void> {
    await db.sync_meta.put({ key, value });
  }
}
