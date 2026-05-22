// implements FR8, FR11, FR3, M2 of add-supabase-adapter
import type { WireTask } from "@clear-progress/contract";
import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SupabaseSyncAdapter } from "../src";

const ENTITY_TABLES = [
  "tasks",
  "goals",
  "ideas",
  "contexts",
  "categories",
  "checklist_items",
  "settings",
  "sync_meta",
  "covers",
] as const;

const supabaseFunctionsUrl = process.env.TEST_SUPABASE_URL;
const tokenA = process.env.TEST_SUPABASE_TOKEN_A;
const tokenB = process.env.TEST_SUPABASE_TOKEN_B;
const supabaseProjectUrl = process.env.TEST_SUPABASE_PROJECT_URL;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY;

function decodeUserId(jwt: string): string {
  const payloadBase64 = jwt.split(".")[1] ?? "";
  const decoded = JSON.parse(
    Buffer.from(payloadBase64, "base64").toString("utf-8"),
  ) as { sub: string };
  return decoded.sub;
}

function makeTask(id: string): WireTask {
  const now = new Date().toISOString();
  return {
    id,
    name: `Task ${id}`,
    description: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    is_hidden: false,
    next_date: "",
    appear_date: "",
    original_task_id: "",
    sort_order: 0,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
  };
}

if (
  supabaseFunctionsUrl &&
  tokenA &&
  tokenB &&
  supabaseProjectUrl &&
  serviceKey
) {
  const adminClient = createClient(supabaseProjectUrl, serviceKey);
  const userAId = decodeUserId(tokenA);
  const userBId = decodeUserId(tokenB);

  async function teardownUser(userId: string): Promise<void> {
    for (const table of ENTITY_TABLES) {
      await adminClient.from(table).delete().eq("user_id", userId);
    }
  }

  describe("Multi-user isolation", () => {
    let adapterA: SupabaseSyncAdapter;
    let adapterB: SupabaseSyncAdapter;

    beforeEach(async () => {
      const clientA = createClient(supabaseProjectUrl, serviceKey, {
        accessToken: async () => tokenA,
      });
      const clientB = createClient(supabaseProjectUrl, serviceKey, {
        accessToken: async () => tokenB,
      });
      adapterA = new SupabaseSyncAdapter(clientA);
      adapterB = new SupabaseSyncAdapter(clientB);
      await teardownUser(userAId);
      await teardownUser(userBId);
      await adapterA.init();
      await adapterB.init();
    });

    afterEach(async () => {
      await teardownUser(userAId);
      await teardownUser(userBId);
    });

    // FR8, M2
    it("each user's pull returns only their own records", async () => {
      const taskAId = crypto.randomUUID();
      const taskBId = crypto.randomUUID();

      await adapterA.push({ tasks: [makeTask(taskAId)] });
      await adapterB.push({ tasks: [makeTask(taskBId)] });

      const pullA = await adapterA.pull({ since_revision: 0 });
      const pullB = await adapterB.pull({ since_revision: 0 });

      const taskIdsA = pullA.tasks.map((task) => task.id);
      const taskIdsB = pullB.tasks.map((task) => task.id);

      expect(taskIdsA).toContain(taskAId);
      expect(taskIdsA).not.toContain(taskBId);

      expect(taskIdsB).toContain(taskBId);
      expect(taskIdsB).not.toContain(taskAId);
    });

    // FR11, M2
    it("User A cannot read User B's covers", async () => {
      const goalId = crypto.randomUUID();
      const coverData = Buffer.from("fake-image-bytes").toString("base64");
      const dataHash = `hash-${crypto.randomUUID()}`;

      const uploadResult = await adapterB.uploadCover({
        goal_id: goalId,
        filename: "cover.png",
        mime_type: "image/png",
        data: coverData,
        data_hash: dataHash,
      });

      expect(uploadResult.ok).toBe(true);
      const coverResponse = await adapterA.getCover({ hashes: [dataHash] });

      // User A should not be able to retrieve User B's cover
      const coverResult = coverResponse.covers[0];
      expect(coverResult).toBeDefined();
      expect(coverResult?.data).toBeUndefined();
      expect(coverResult?.error).toBeDefined();
    });

    // FR3, FR8
    it("User A's push does not affect User B's revision counter", async () => {
      const pullBBefore = await adapterB.pull({ since_revision: 0 });
      const revisionBefore = pullBBefore.current_revision;

      await adapterA.push({ tasks: [makeTask(crypto.randomUUID())] });

      const pullBAfter = await adapterB.pull({ since_revision: 0 });
      expect(pullBAfter.current_revision).toBe(revisionBefore);
    });
  });
} else {
  describe.skip("Multi-user isolation tests (requires TEST_SUPABASE_URL, TEST_SUPABASE_TOKEN_A, TEST_SUPABASE_TOKEN_B, TEST_SUPABASE_PROJECT_URL, TEST_SUPABASE_SERVICE_KEY)", () => {
    it("skipped", () => {});
  });
}
