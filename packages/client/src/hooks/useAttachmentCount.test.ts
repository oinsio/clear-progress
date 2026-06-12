/** Implements FR11, NFR-P1 of task-detail-page-ui-improvements */
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

  it("should start in loading state", () => {
    const { result } = renderHook(() =>
      useAttachmentCount(TEST_ENTITY_TYPE, TEST_ENTITY_ID),
    );

    expect(result.current.isLoading).toBe(true);
  });
});
