// implements FR8 of add-supabase-ui
import { describe, expect, it } from "vitest";
import { SupabaseSyncAdapter } from "../src";
import { createMockSupabaseClient } from "./supabaseSyncAdapter-test-utils";

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
          data: { ok: true, data_hash: "hash123", reused: false },
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
              { local_id: "local-1", goal_id: "goal-1", data_hash: "hash123" },
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
      const request = { hashes: ["hash123"] };
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
      const request = { hash: "hash123", goal_id: "goal-1" };
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
