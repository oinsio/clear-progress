import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { SyncAdapter, WireTask, WireGoal, WireContext } from "../../src";

function createWireTask(overrides: Partial<WireTask> = {}): WireTask {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test task",
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
    version: 1,
    revision: 0,
    ...overrides,
  };
}

function createWireGoal(overrides: Partial<WireGoal> = {}): WireGoal {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test goal",
    description: "",
    cover_file_id: "",
    status: "planning",
    sort_order: 0,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    revision: 0,
    ...overrides,
  };
}

function createWireContext(overrides: Partial<WireContext> = {}): WireContext {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test context",
    sort_order: 0,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    revision: 0,
    ...overrides,
  };
}

export function syncAdapterContract(
  setup: () => Promise<SyncAdapter> | SyncAdapter,
  teardown?: () => Promise<void> | void,
): void {
  describe("SyncAdapter contract", () => {
    let adapter: SyncAdapter;

    beforeEach(async () => {
      adapter = await setup();
    });

    afterEach(async () => {
      await teardown?.();
    });

    describe("Lifecycle", () => {
      it("should return ok:true and initialized:false before init", async () => {
        const response = await adapter.ping();
        expect(response.ok).toBe(true);
        expect(response.initialized).toBe(false);
      });

      it("should return ok:true on init", async () => {
        const response = await adapter.init();
        expect(response.ok).toBe(true);
      });

      it("should return initialized:true after init", async () => {
        await adapter.init();
        const response = await adapter.ping();
        expect(response.initialized).toBe(true);
      });

      it("should be idempotent (init twice)", async () => {
        await adapter.init();
        const response = await adapter.init();
        expect(response.ok).toBe(true);
      });
    });

    describe("Pull (empty state)", () => {
      it("should return empty arrays for fresh state", async () => {
        await adapter.init();
        const response = await adapter.pull({ since_revision: 0 });
        expect(response.ok).toBe(true);
        expect(response.tasks).toEqual([]);
        expect(response.goals).toEqual([]);
        expect(response.contexts).toEqual([]);
        expect(response.categories).toEqual([]);
        expect(response.ideas).toEqual([]);
        expect(response.checklist_items).toEqual([]);
        expect(response.settings).toEqual([]);
        expect(response.current_revision).toBe(0);
        expect(response.purge_revision).toBe(0);
      });
    });

    describe("Push + Pull round-trip", () => {
      it("should return pushed task in pull", async () => {
        await adapter.init();
        const task = createWireTask({ name: "Test task" });
        await adapter.push({ tasks: [task] });

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.tasks).toHaveLength(1);
        expect(pullResponse.tasks[0]?.name).toBe("Test task");
      });

      it("should assign revision to accepted records", async () => {
        await adapter.init();
        const task = createWireTask({ name: "Test" });
        const pushResponse = await adapter.push({ tasks: [task] });

        expect(pushResponse.results.tasks?.[0]?.status).toBe("created");
        expect(pushResponse.revision).toBeGreaterThan(0);
      });

      it("should filter old records with since_revision", async () => {
        await adapter.init();

        const task1 = createWireTask({ name: "Task 1" });
        const push1 = await adapter.push({ tasks: [task1] });
        const rev1 = push1.revision!;

        const task2 = createWireTask({ name: "Task 2" });
        await adapter.push({ tasks: [task2] });

        const response = await adapter.pull({ since_revision: rev1 });
        expect(response.tasks).toHaveLength(1);
        expect(response.tasks[0]?.name).toBe("Task 2");
      });
    });

    describe("Conflict resolution", () => {
      it("should detect conflict (last-write-wins by updated_at)", async () => {
        await adapter.init();

        const task = createWireTask({
          name: "Original",
          updated_at: "2026-01-01T00:00:00.000Z",
        });
        await adapter.push({ tasks: [task] });

        const serverUpdate = {
          ...task,
          name: "Server version",
          updated_at: "2026-01-02T00:00:00.000Z",
        };
        await adapter.push({ tasks: [serverUpdate] });

        const staleUpdate = {
          ...task,
          name: "Client version",
          updated_at: "2026-01-01T12:00:00.000Z",
        };
        const response = await adapter.push({ tasks: [staleUpdate] });

        expect(response.results.tasks?.[0]?.status).toBe("conflict");
        expect(response.results.tasks?.[0]?.server_record).toBeDefined();
      });
    });

    describe("Multiple entity types", () => {
      it("should push and pull tasks + goals + contexts", async () => {
        await adapter.init();

        const task = createWireTask({ name: "Task" });
        const goal = createWireGoal({ name: "Goal" });
        const context = createWireContext({ name: "Context" });

        await adapter.push({ tasks: [task], goals: [goal], contexts: [context] });

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.tasks).toHaveLength(1);
        expect(pullResponse.goals).toHaveLength(1);
        expect(pullResponse.contexts).toHaveLength(1);
      });
    });

    describe("Settings", () => {
      it("should push and pull settings", async () => {
        await adapter.init();

        const setting = {
          key: "test_key",
          value: "test_value",
          updated_at: "2026-01-01T00:00:00.000Z",
        };
        await adapter.push({ settings: [setting] });

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.settings).toHaveLength(1);
        expect(pullResponse.settings[0]?.key).toBe("test_key");
      });

      it("should filter settings by updated_at", async () => {
        await adapter.init();

        const setting1 = {
          key: "key1",
          value: "value1",
          updated_at: "2026-01-01T00:00:00.000Z",
        };
        const setting2 = {
          key: "key2",
          value: "value2",
          updated_at: "2026-01-02T00:00:00.000Z",
        };
        await adapter.push({ settings: [setting1, setting2] });

        const pullResponse = await adapter.pull({
          since_revision: 0,
          settings_updated_at: "2026-01-01T12:00:00.000Z",
        });
        expect(pullResponse.settings).toHaveLength(1);
        expect(pullResponse.settings[0]?.key).toBe("key2");
      });
    });

    describe("Covers", () => {
      it("should upload cover and return file_id", async () => {
        await adapter.init();
        const response = await adapter.uploadCover({
          goal_id: "goal-1",
          filename: "cover.jpg",
          mime_type: "image/jpeg",
          data: btoa("fake-image-data"),
          data_hash: "abc123",
        });
        expect(response.ok).toBe(true);
        expect(response.file_id).toBeDefined();
      });

      it("should get uploaded cover", async () => {
        await adapter.init();
        const uploadResponse = await adapter.uploadCover({
          goal_id: "goal-1",
          filename: "cover.jpg",
          mime_type: "image/jpeg",
          data: btoa("fake-image-data"),
          data_hash: "abc123",
        });

        const getResponse = await adapter.getCover({
          file_ids: [uploadResponse.file_id],
        });
        expect(getResponse.ok).toBe(true);
        expect(getResponse.covers).toHaveLength(1);
        expect(getResponse.covers[0]?.file_id).toBe(uploadResponse.file_id);
      });

      it("should delete cover", async () => {
        await adapter.init();
        const uploadResponse = await adapter.uploadCover({
          goal_id: "goal-1",
          filename: "cover.jpg",
          mime_type: "image/jpeg",
          data: btoa("fake-image-data"),
          data_hash: "abc123",
        });

        const deleteResponse = await adapter.deleteCover({
          file_id: uploadResponse.file_id,
          goal_id: "goal-1",
        });
        expect(deleteResponse.ok).toBe(true);
      });

      it("should upload multiple covers", async () => {
        await adapter.init();
        const response = await adapter.uploadCovers({
          covers: [
            {
              local_id: "local-1",
              goal_id: "goal-1",
              filename: "cover1.jpg",
              mime_type: "image/jpeg",
              data: btoa("fake-image-1"),
              data_hash: "hash1",
            },
            {
              local_id: "local-2",
              goal_id: "goal-2",
              filename: "cover2.jpg",
              mime_type: "image/jpeg",
              data: btoa("fake-image-2"),
              data_hash: "hash2",
            },
          ],
        });
        expect(response.ok).toBe(true);
        expect(response.results).toHaveLength(2);
      });
    });

    describe("Purge", () => {
      it("should remove soft-deleted records", async () => {
        await adapter.init();

        const task = createWireTask({ name: "To delete", is_deleted: true });
        await adapter.push({ tasks: [task] });

        const purgeResponse = await adapter.purge();
        expect(purgeResponse.ok).toBe(true);
        expect(purgeResponse.purged.tasks).toBe(1);

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.tasks).toHaveLength(0);
      });

      it("should increment purge_revision", async () => {
        await adapter.init();

        const task = createWireTask({ is_deleted: true });
        await adapter.push({ tasks: [task] });

        const purgeResponse = await adapter.purge();
        expect(purgeResponse.purge_revision).toBe(1);

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.purge_revision).toBe(1);
      });

      it("should not remove non-deleted records", async () => {
        await adapter.init();

        const task1 = createWireTask({ name: "Keep", is_deleted: false });
        const task2 = createWireTask({ name: "Delete", is_deleted: true });
        await adapter.push({ tasks: [task1, task2] });

        await adapter.purge();

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.tasks).toHaveLength(1);
        expect(pullResponse.tasks[0]?.name).toBe("Keep");
      });
    });
  });
}
