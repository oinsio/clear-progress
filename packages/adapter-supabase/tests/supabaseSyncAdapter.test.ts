// implements FR8 of add-supabase-ui
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { ApiAuthError, ApiValidationError, SupabaseSyncAdapter } from "../src";

function createMockSupabaseClient(overrides?: {
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

describe("SupabaseSyncAdapter with SupabaseClient", () => {
  describe("constructor accepts SupabaseClient", () => {
    it("should create adapter from SupabaseClient instance", () => {
      const client = createMockSupabaseClient();
      const adapter = new SupabaseSyncAdapter(client);

      expect(adapter).toBeInstanceOf(SupabaseSyncAdapter);
    });
  });

  describe("functions.invoke() usage", () => {
    it("should call functions.invoke('ping') for ping()", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: {
            ok: true,
            app: "clear-progress",
            version: "1.0.0",
            initialized: true,
          },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.ping();

      expect(client.functions.invoke).toHaveBeenCalledWith("ping", {
        body: {},
      });
    });

    it("should call functions.invoke('init') for init()", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: { ok: true },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.init();

      expect(client.functions.invoke).toHaveBeenCalledWith("init", {
        body: {},
      });
    });

    it("should call functions.invoke('pull') with request body for pull()", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: {
            ok: true,
            current_revision: 5,
            purge_revision: 0,
            server_time: "2025-01-15T10:30:00.000Z",
            tasks: [],
            goals: [],
            ideas: [],
            contexts: [],
            categories: [],
            checklist_items: [],
            settings: [],
          },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.pull({ since_revision: 5 });

      expect(client.functions.invoke).toHaveBeenCalledWith("pull", {
        body: { since_revision: 5 },
      });
    });

    it("should call functions.invoke('push') with request body for push()", async () => {
      const pushRequest = { tasks: [{ id: "task-1", name: "Test" }] };
      const client = createMockSupabaseClient({
        invokeResult: {
          data: {
            ok: true,
            revision: 6,
            results: {},
            server_time: "2025-01-15T10:30:00.000Z",
          },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.push(pushRequest as never);

      expect(client.functions.invoke).toHaveBeenCalledWith("push", {
        body: pushRequest,
      });
    });

    it("should call functions.invoke('upload-cover') for uploadCover()", async () => {
      const request = {
        goal_id: "goal-1",
        filename: "cover.png",
        mime_type: "image/png",
        data: "base64data",
        data_hash: "hash123",
      };
      const client = createMockSupabaseClient({
        invokeResult: {
          data: { ok: true, file_id: "file-1", reused: false },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.uploadCover(request);

      expect(client.functions.invoke).toHaveBeenCalledWith("upload-cover", {
        body: request,
      });
    });

    it("should call functions.invoke('upload-covers') for uploadCovers()", async () => {
      const request = {
        covers: [
          {
            local_id: "local-1",
            goal_id: "goal-1",
            filename: "cover.png",
            mime_type: "image/png",
            data: "base64data",
            data_hash: "hash123",
          },
        ],
      };
      const client = createMockSupabaseClient({
        invokeResult: {
          data: {
            ok: true,
            results: [
              { local_id: "local-1", goal_id: "goal-1", file_id: "file-1" },
            ],
          },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.uploadCovers(request);

      expect(client.functions.invoke).toHaveBeenCalledWith("upload-covers", {
        body: request,
      });
    });

    it("should call functions.invoke('get-cover') for getCover()", async () => {
      const request = { file_ids: ["file-1"] };
      const client = createMockSupabaseClient({
        invokeResult: {
          data: { ok: true, covers: [] },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.getCover(request);

      expect(client.functions.invoke).toHaveBeenCalledWith("get-cover", {
        body: request,
      });
    });

    it("should call functions.invoke('delete-cover') for deleteCover()", async () => {
      const request = { file_id: "file-1", goal_id: "goal-1" };
      const client = createMockSupabaseClient({
        invokeResult: {
          data: { ok: true, deleted: true, ref_count: 0 },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.deleteCover(request);

      expect(client.functions.invoke).toHaveBeenCalledWith("delete-cover", {
        body: request,
      });
    });

    it("should call functions.invoke('purge') for purge()", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: {
            ok: true,
            purged: {
              tasks: 0,
              goals: 0,
              contexts: 0,
              categories: 0,
              checklist_items: 0,
              ideas: 0,
            },
            purge_revision: 1,
          },
          error: null,
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await adapter.purge();

      expect(client.functions.invoke).toHaveBeenCalledWith("purge", {
        body: {},
      });
    });
  });

  describe("response validation", () => {
    it("should throw ApiValidationError when response does not match schema", async () => {
      const client = createMockSupabaseClient({
        invokeResult: { data: { invalid: "response" }, error: null },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.ping()).rejects.toThrow(ApiValidationError);
    });
  });

  describe("auth error handling (4.2)", () => {
    it("should throw ApiAuthError when functions.invoke returns 401 error", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: { message: "Unauthorized", status: 401 },
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.init()).rejects.toThrow(ApiAuthError);
    });

    it("should throw ApiAuthError when error context has status 401", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: { message: "JWT expired", context: { status: 401 } },
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.pull({ since_revision: 0 })).rejects.toThrow(
        ApiAuthError,
      );
    });

    it("should throw generic error for non-401 errors", async () => {
      const client = createMockSupabaseClient({
        invokeResult: {
          data: null,
          error: { message: "Internal Server Error", status: 500 },
        },
      });
      const adapter = new SupabaseSyncAdapter(client);

      await expect(adapter.init()).rejects.toThrow("Internal Server Error");
      await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
    });
  });

  it("should use String(error) when error has no message property", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: "raw string error",
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    const rejection = adapter.init();
    await expect(rejection).rejects.toBeInstanceOf(Error);
    await expect(adapter.init()).rejects.toMatchObject({
      message: "raw string error",
    });
  });

  it("should use String(error) when error is a number", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: 42,
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({ message: "42" });
  });

  it("should use error.message when error is object with message property", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "specific error text", status: 500 },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({
      message: "specific error text",
    });
  });

  it("should use String(error) when error is object without message", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { status: 500 },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({
      message: "[object Object]",
    });
  });

  it("should not treat null error context as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Some error", context: null },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Some error");
    await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
  });

  it("should not treat non-object error as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: null,
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    // null error means no error — should proceed to validation
    await expect(adapter.init()).rejects.toThrow(ApiValidationError);
  });
});

describe("error message and name verification", () => {
  it("should set ApiAuthError name to 'ApiAuthError'", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Unauthorized", status: 401 },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toMatchObject({
      name: "ApiAuthError",
      message: "Authentication required: token is missing, expired, or invalid",
    });
  });

  it("should set ApiValidationError name to 'ApiValidationError'", async () => {
    const client = createMockSupabaseClient({
      invokeResult: { data: { invalid: "data" }, error: null },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.ping()).rejects.toMatchObject({
      name: "ApiValidationError",
      message: 'Invalid API response for "ping"',
    });
  });
});

describe("ping without active session (4.3)", () => {
  it("should succeed even without active session", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: {
          ok: true,
          app: "clear-progress",
          version: "1.0.0",
          initialized: false,
        },
        error: null,
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    const result = await adapter.ping();

    expect(result).toEqual({
      ok: true,
      app: "clear-progress",
      version: "1.0.0",
      initialized: false,
    });
    expect(client.functions.invoke).toHaveBeenCalledWith("ping", {
      body: {},
    });
  });
});

describe("isAuthError edge cases", () => {
  it("should not treat error with context.status !== 401 as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Forbidden", context: { status: 403 } },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Forbidden");
    await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
  });

  it("should not treat error with non-object context as auth error", async () => {
    const client = createMockSupabaseClient({
      invokeResult: {
        data: null,
        error: { message: "Error with string context", context: "not-object" },
      },
    });
    const adapter = new SupabaseSyncAdapter(client);

    await expect(adapter.init()).rejects.toThrow("Error with string context");
    await expect(adapter.init()).rejects.not.toThrow(ApiAuthError);
  });
});
