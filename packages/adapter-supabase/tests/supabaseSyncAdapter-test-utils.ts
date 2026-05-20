// implements FR8 of add-supabase-ui
import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";

export function createMockSupabaseClient(overrides?: {
  invokeResult?: { data: unknown; error: unknown };
}): SupabaseClient {
  const defaultResult = { data: { ok: true }, error: null };
  const invokeResult = overrides?.invokeResult ?? defaultResult;

  return {
    supabaseUrl: "https://xxxxx.supabase.co",
    functions: {
      invoke: vi.fn().mockResolvedValue(invokeResult),
    },
  } as unknown as SupabaseClient;
}
