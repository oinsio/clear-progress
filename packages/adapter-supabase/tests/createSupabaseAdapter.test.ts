import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createSupabaseAdapter, SupabaseSyncAdapter } from "../src";

function createMockSupabaseClient(
  url = "https://xxxxx.supabase.co",
): SupabaseClient {
  return {
    supabaseUrl: url,
    functions: {
      invoke: async () => ({ data: null, error: null }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  } as unknown as SupabaseClient;
}

describe("createSupabaseAdapter", () => {
  it("should return a SupabaseSyncAdapter instance", () => {
    const client = createMockSupabaseClient();
    const adapter = createSupabaseAdapter(client);

    expect(adapter).toBeInstanceOf(SupabaseSyncAdapter);
  });
});
