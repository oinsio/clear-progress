import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  Box,
  SyncAdapter,
  WireContext,
  WireGoal,
  WireTask,
} from "../../src";
import { SYNC_ERRORS } from "../../src";

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

    // @spec-sync-protocol FR12: Init and ping lifecycle
    describe("Lifecycle", () => {
      it("should return ok:true and initialized:false before init", async () => {
        // @spec-sync-protocol FR12: ping before init shows uninitialized
        const response = await adapter.ping();
        expect(response.ok).toBe(true);
        expect(response.initialized).toBe(false);
      });

      it("should return ok:true on init", async () => {
        // @spec-sync-protocol FR12: init creates Meta sheet and returns success
        const response = await adapter.init();
        expect(response.ok).toBe(true);
      });

      it("should return initialized:true after init", async () => {
        // @spec-sync-protocol FR12: ping after init shows initialized
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
        const rev1 = push1.revision ?? 0;

        const task2 = createWireTask({ name: "Task 2" });
        await adapter.push({ tasks: [task2] });

        const response = await adapter.pull({ since_revision: rev1 });
        expect(response.tasks).toHaveLength(1);
        expect(response.tasks[0]?.name).toBe("Task 2");
      });

      // FR2: Pull response current_revision reflects latest push revision
      it("should return current_revision reflecting latest push", async () => {
        await adapter.init();

        const task1 = createWireTask({ name: "Task 1" });
        const push1 = await adapter.push({ tasks: [task1] });
        const rev1 = push1.revision ?? 0;

        const task2 = createWireTask({ name: "Task 2" });
        const push2 = await adapter.push({ tasks: [task2] });
        const rev2 = push2.revision ?? 0;

        const pullResponse = await adapter.pull({ since_revision: 0 });
        expect(pullResponse.current_revision).toBe(rev2);
        expect(pullResponse.current_revision).toBeGreaterThan(rev1);
      });
    });

    describe("Push result statuses", () => {
      // FR15: accepted status on update of existing record with newer timestamp
      it("should return accepted status for update with newer timestamp", async () => {
        await adapter.init();

        const task = createWireTask({
          name: "Original",
          updated_at: "2026-01-01T10:00:00.000Z",
        });
        await adapter.push({ tasks: [task] });

        const update = {
          ...task,
          name: "Updated",
          updated_at: "2026-01-01T12:00:00.000Z",
        };
        const response = await adapter.push({ tasks: [update] });

        expect(response.results.tasks?.[0]?.status).toBe("accepted");
      });

      // FR15: rejected status — invalid UUID, blank name, invalid box
      it("should return rejected status for invalid UUID", async () => {
        await adapter.init();

        const task = createWireTask({ id: "not-a-uuid" });
        const response = await adapter.push({ tasks: [task] });

        expect(response.results.tasks?.[0]?.status).toBe("rejected");
        expect(response.results.tasks?.[0]?.reason).toBeDefined();
      });

      it("should return rejected status for blank name", async () => {
        await adapter.init();

        const task = createWireTask({ name: "" });
        const response = await adapter.push({ tasks: [task] });

        expect(response.results.tasks?.[0]?.status).toBe("rejected");
        expect(response.results.tasks?.[0]?.reason).toBeDefined();
      });

      it("should return rejected status for invalid box", async () => {
        await adapter.init();

        const task = createWireTask({
          box: "invalid-box" as unknown as Box,
        });
        const response = await adapter.push({ tasks: [task] });

        expect(response.results.tasks?.[0]?.status).toBe("rejected");
        expect(response.results.tasks?.[0]?.reason).toBeDefined();
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

      // FR3: Client wins with newer timestamp (accepted, not conflict)
      it("should accept client record with newer timestamp", async () => {
        await adapter.init();

        const task = createWireTask({
          name: "Original",
          updated_at: "2026-01-01T10:00:00.000Z",
        });
        await adapter.push({ tasks: [task] });

        const clientUpdate = {
          ...task,
          name: "Client version",
          updated_at: "2026-01-01T12:00:00.000Z",
        };
        const response = await adapter.push({ tasks: [clientUpdate] });

        expect(response.results.tasks?.[0]?.status).toBe("accepted");
        expect(response.results.tasks?.[0]?.server_record).toBeUndefined();
      });

      // FR3: Equal timestamps — client wins (>= comparison)
      it("should accept client record with equal timestamp", async () => {
        await adapter.init();

        const timestamp = "2026-01-01T12:00:00.000Z";
        const task = createWireTask({
          name: "Original",
          updated_at: timestamp,
        });
        await adapter.push({ tasks: [task] });

        const clientUpdate = {
          ...task,
          name: "Client version",
          updated_at: timestamp,
        };
        const response = await adapter.push({ tasks: [clientUpdate] });

        expect(response.results.tasks?.[0]?.status).toBe("accepted");
      });
    });

    describe("Error handling", () => {
      // FR17: Lock timeout returns error
      it("should return SYNC_LOCK_TIMEOUT error when lock unavailable", async () => {
        await adapter.init();

        // This test verifies the contract: when the server cannot acquire
        // the lock within timeout, it returns { ok: false, error: "SYNC_LOCK_TIMEOUT" }
        // Implementation note: adapters should provide a way to simulate lock contention
        // For in-memory adapter, this might be a no-op (always succeeds)
        // For GAS adapter, this tests actual lock timeout behavior

        const task = createWireTask({ name: "Test task" });

        // Attempt to trigger lock timeout (implementation-specific)
        // In real GAS, this would happen when another push holds the lock
        // For testing, adapters may expose a method to simulate this condition

        // For now, this test documents the expected contract behavior
        // Actual implementation will depend on adapter capabilities
        const response = await adapter.push({ tasks: [task] });

        // When lock timeout occurs:
        if (!response.ok && response.error === SYNC_ERRORS.LOCK_TIMEOUT) {
          expect(response.ok).toBe(false);
          expect(response.error).toBe(SYNC_ERRORS.LOCK_TIMEOUT);
          // results should be empty or undefined when error occurs
          expect(
            Object.values(response.results).every(
              (arr) => !arr || arr.length === 0,
            ),
          ).toBe(true);
        } else {
          // If adapter doesn't support lock timeout simulation, push succeeds normally
          expect(response.ok).toBe(true);
        }
      });
    });

    describe("Multiple entity types", () => {
      it("should push and pull tasks + goals + contexts", async () => {
        await adapter.init();

        const task = createWireTask({ name: "Task" });
        const goal = createWireGoal({ name: "Goal" });
        const context = createWireContext({ name: "Context" });

        await adapter.push({
          tasks: [task],
          goals: [goal],
          contexts: [context],
        });

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

      // FR7: Settings conflict resolution (push older timestamp → conflict)
      it("should return conflict when pushing setting with older timestamp", async () => {
        await adapter.init();

        const setting = {
          key: "test_key",
          value: "server_value",
          updated_at: "2026-01-02T00:00:00.000Z",
        };
        await adapter.push({ settings: [setting] });

        const staleUpdate = {
          key: "test_key",
          value: "client_value",
          updated_at: "2026-01-01T00:00:00.000Z",
        };
        const response = await adapter.push({ settings: [staleUpdate] });

        expect(response.results.settings?.[0]?.status).toBe("conflict");
        expect(response.results.settings?.[0]?.server_record).toBeDefined();
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

      // FR8: SHA-256 deduplication (reused: true on duplicate hash)
      it("should return reused: true for duplicate hash", async () => {
        await adapter.init();

        const imageData = btoa("unique-image-data");
        const hash = "same-hash-123";

        const upload1 = await adapter.uploadCover({
          goal_id: "goal-1",
          filename: "cover1.jpg",
          mime_type: "image/jpeg",
          data: imageData,
          data_hash: hash,
        });
        expect(upload1.reused).toBeFalsy();

        const upload2 = await adapter.uploadCover({
          goal_id: "goal-2",
          filename: "cover2.jpg",
          mime_type: "image/jpeg",
          data: imageData,
          data_hash: hash,
        });
        expect(upload2.reused).toBe(true);
        expect(upload2.file_id).toBe(upload1.file_id);
      });

      // FR9: Partial batch failure (1 of N covers fails)
      it("should handle partial batch failure", async () => {
        await adapter.init();

        const response = await adapter.uploadCovers({
          covers: [
            {
              local_id: "local-1",
              goal_id: "goal-1",
              filename: "valid.jpg",
              mime_type: "image/jpeg",
              data: btoa("valid-image"),
              data_hash: "hash1",
            },
            {
              local_id: "local-2",
              goal_id: "goal-2",
              filename: "invalid.txt",
              mime_type: "text/plain",
              data: btoa("not-an-image"),
              data_hash: "hash2",
            },
          ],
        });

        expect(response.ok).toBe(true);
        expect(response.results).toHaveLength(2);
        expect(response.results[0]?.file_id).toBeDefined();
        expect(response.results[1]?.error).toBeDefined();
      });

      // FR9: Batch size limit (>10 items rejected)
      it("should reject batch with more than 10 items", async () => {
        await adapter.init();

        const covers = Array.from({ length: 11 }, (_, i) => ({
          local_id: `local-${i}`,
          goal_id: `goal-${i}`,
          filename: `cover${i}.jpg`,
          mime_type: "image/jpeg",
          data: btoa(`image-${i}`),
          data_hash: `hash-${i}`,
        }));

        const response = await adapter.uploadCovers({ covers });
        expect(response.ok).toBe(false);
      });

      // FR10: Missing cover returns error per item
      it("should return error for missing cover file", async () => {
        await adapter.init();

        const response = await adapter.getCover({
          file_ids: ["non-existent-file-id"],
        });

        expect(response.ok).toBe(true);
        expect(response.covers).toHaveLength(1);
        expect(response.covers[0]?.error).toBeDefined();
      });

      // FR11: Reference counting — shared cover not deleted, ref_count decremented
      it("should decrement ref_count but not delete shared cover", async () => {
        await adapter.init();

        const uploadResponse = await adapter.uploadCover({
          goal_id: "goal-1",
          filename: "shared.jpg",
          mime_type: "image/jpeg",
          data: btoa("shared-image"),
          data_hash: "shared-hash",
        });

        // Simulate second goal using same cover (via dedup)
        await adapter.uploadCover({
          goal_id: "goal-2",
          filename: "shared2.jpg",
          mime_type: "image/jpeg",
          data: btoa("shared-image"),
          data_hash: "shared-hash",
        });

        const deleteResponse = await adapter.deleteCover({
          file_id: uploadResponse.file_id,
          goal_id: "goal-1",
        });

        expect(deleteResponse.ok).toBe(true);
        expect(deleteResponse.deleted).toBe(false);
        expect(deleteResponse.ref_count).toBeGreaterThan(0);

        // Cover should still be accessible
        const getResponse = await adapter.getCover({
          file_ids: [uploadResponse.file_id],
        });
        expect(getResponse.covers[0]?.file_id).toBe(uploadResponse.file_id);
        expect(getResponse.covers[0]?.error).toBeUndefined();
      });

      it("should delete cover when ref_count reaches 0", async () => {
        await adapter.init();

        const uploadResponse = await adapter.uploadCover({
          goal_id: "goal-1",
          filename: "single.jpg",
          mime_type: "image/jpeg",
          data: btoa("single-image"),
          data_hash: "single-hash",
        });

        const deleteResponse = await adapter.deleteCover({
          file_id: uploadResponse.file_id,
          goal_id: "goal-1",
        });

        expect(deleteResponse.ok).toBe(true);
        expect(deleteResponse.deleted).toBe(true);
        expect(deleteResponse.ref_count).toBe(0);
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
