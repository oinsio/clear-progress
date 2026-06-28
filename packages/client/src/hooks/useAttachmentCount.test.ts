/**
 * Implements FR11, NFR-P1 of task-detail-page-ui-improvements
 * Implements FR1, NFR-P1 of fix-nonsync-indication-for-attachments
 */
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/db/database";
import { buildAttachment } from "@/test/factories/attachmentFactory";
import { useAttachmentCount } from "./useAttachmentCount";

const TEST_ENTITY_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_ENTITY_ID = "00000000-0000-4000-8000-000000000002";
const TEST_ENTITY_TYPE = "task" as const;

describe("useAttachmentCount", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("should return 0 when no attachments exist", async () => {
    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.attachmentCount).toBe(0);
  });

  it("should return correct count of non-deleted attachments", async () => {
    await db.attachments.bulkPut([
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
      }),
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
      }),
    ]);

    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.attachmentCount).toBe(2);
  });

  it("should exclude deleted attachments from count", async () => {
    await db.attachments.bulkPut([
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
      }),
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: true,
      }),
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: true,
      }),
    ]);

    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.attachmentCount).toBe(1);
  });

  it("should only count attachments for the specified entity", async () => {
    await db.attachments.bulkPut([
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
      }),
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: OTHER_ENTITY_ID,
        is_deleted: false,
      }),
    ]);

    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.attachmentCount).toBe(1);
  });

  it("should return 0 and not load when entityId is empty", async () => {
    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, ""),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.attachmentCount).toBe(0);
  });

  it("should return 0 for empty entityId even when matching attachments exist in DB", async () => {
    await db.attachments.put(
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: "",
        is_deleted: false,
      }),
    );

    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, ""),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.attachmentCount).toBe(0);
  });

  it("should update count when entityId changes", async () => {
    await db.attachments.put(
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: OTHER_ENTITY_ID,
        is_deleted: false,
      }),
    );

    const { result, rerender } = renderHook(
      ({ entityId }) => useAttachmentCount(TEST_ENTITY_TYPE, entityId),
      { initialProps: { entityId: TEST_ENTITY_ID } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.attachmentCount).toBe(0);

    rerender({ entityId: OTHER_ENTITY_ID });

    await waitFor(() => {
      expect(result.current.attachmentCount).toBe(1);
    });
  });

  it("should clean up subscription on unmount", async () => {
    const { result, unmount } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const countBeforeUnmount = result.current.attachmentCount;

    unmount();

    // Add data after unmount
    await db.attachments.put(
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
      }),
    );

    // Wait for potential subscription callback
    await new Promise((resolve) => setTimeout(resolve, 100));

    // After unmount, the result should still reflect the old count
    // (subscription was cleaned up, no state updates)
    expect(result.current.attachmentCount).toBe(countBeforeUnmount);
  });

  it("should start in loading state with default values", () => {
    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasUnsyncedAttachments).toBe(false);
    expect(result.current.attachmentCount).toBe(0);
  });

  it("should return hasUnsyncedAttachments true when unsynced attachments exist", async () => {
    await db.attachments.bulkPut([
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
        syncStatus: "pending" as const,
      }),
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
        syncStatus: "synced",
      }),
    ]);

    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasUnsyncedAttachments).toBe(true);
  });

  it("should return hasUnsyncedAttachments false when all attachments are synced", async () => {
    await db.attachments.bulkPut([
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
        syncStatus: "synced",
      }),
      buildAttachment({
        entity_type: TEST_ENTITY_TYPE,
        entity_id: TEST_ENTITY_ID,
        is_deleted: false,
        syncStatus: "synced",
      }),
    ]);

    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasUnsyncedAttachments).toBe(false);
  });

  it("should return hasUnsyncedAttachments false when no attachments exist", async () => {
    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasUnsyncedAttachments).toBe(false);
  });

  it("should return hasUnsyncedAttachments false when entityId is empty", async () => {
    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, ""),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasUnsyncedAttachments).toBe(false);
  });
});
