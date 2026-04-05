import { describe, it, expect, beforeEach } from "vitest";
import { SyncMetaRepository } from "./SyncMetaRepository";
import { db } from "@/db/database";
import { SYNC_META_KEYS } from "@/constants";

describe("SyncMetaRepository", () => {
  let repo: SyncMetaRepository;

  beforeEach(async () => {
    repo = new SyncMetaRepository();
    await db.sync_meta.clear();
  });

  it("should return 0 when key does not exist", async () => {
    const result = await repo.getValue(SYNC_META_KEYS.LAST_KNOWN_REVISION);
    expect(result).toBe(0);
  });

  it("should return stored value", async () => {
    await repo.setValue(SYNC_META_KEYS.LAST_KNOWN_REVISION, 42);
    const result = await repo.getValue(SYNC_META_KEYS.LAST_KNOWN_REVISION);
    expect(result).toBe(42);
  });

  it("should overwrite existing value", async () => {
    await repo.setValue(SYNC_META_KEYS.LAST_KNOWN_REVISION, 10);
    await repo.setValue(SYNC_META_KEYS.LAST_KNOWN_REVISION, 99);
    const result = await repo.getValue(SYNC_META_KEYS.LAST_KNOWN_REVISION);
    expect(result).toBe(99);
  });
});
