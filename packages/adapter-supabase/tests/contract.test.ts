// implements FR2, M1 of add-supabase-adapter
import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { createClient } from "@supabase/supabase-js";
import { describe, it } from "vitest";
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
const testToken = process.env.TEST_SUPABASE_TOKEN;
const supabaseProjectUrl = process.env.TEST_SUPABASE_PROJECT_URL;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY;

function decodeUserId(jwt: string): string {
  const payloadBase64 = jwt.split(".")[1] ?? "";
  const decoded = JSON.parse(
    Buffer.from(payloadBase64, "base64").toString("utf-8"),
  ) as { sub: string };
  return decoded.sub;
}

if (supabaseFunctionsUrl && testToken && supabaseProjectUrl && serviceKey) {
  const adminClient = createClient(supabaseProjectUrl, serviceKey);
  const testUserId = decodeUserId(testToken);

  async function teardown(): Promise<void> {
    for (const table of ENTITY_TABLES) {
      await adminClient.from(table).delete().eq("user_id", testUserId);
    }
  }

  syncAdapterContract(async () => {
    const userClient = createClient(supabaseProjectUrl, serviceKey, {
      accessToken: async () => testToken,
    });
    return new SupabaseSyncAdapter(userClient);
  }, teardown);
} else {
  describe.skip("Supabase adapter contract tests (requires TEST_SUPABASE_URL, TEST_SUPABASE_TOKEN, TEST_SUPABASE_PROJECT_URL, TEST_SUPABASE_SERVICE_KEY)", () => {
    it("skipped", () => {});
  });
}
