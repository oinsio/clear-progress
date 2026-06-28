// implements FR5 of fix-push-poison-pill
import { describe, expect, it } from "vitest";
import { RECORD_SYNC_STATUS } from "@/constants";
import { handleServerRejection } from "./pushRejectionHandler";

describe("handleServerRejection", () => {
  // FR5: fk_violation:goal_id → clear goal_id
  it("should return healable with goal_id cleared for fk_violation:goal_id", () => {
    const result = handleServerRejection("fk_violation:goal_id");

    expect(result.isHealable).toBe(true);
    expect(result.healedFields).toEqual({ goal_id: "" });
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
  });

  // FR5: fk_violation:context_id → clear context_id
  it("should return healable with context_id cleared for fk_violation:context_id", () => {
    const result = handleServerRejection("fk_violation:context_id");

    expect(result.isHealable).toBe(true);
    expect(result.healedFields).toEqual({ context_id: "" });
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
  });

  // FR5: fk_violation:category_id → clear category_id
  it("should return healable with category_id cleared for fk_violation:category_id", () => {
    const result = handleServerRejection("fk_violation:category_id");

    expect(result.isHealable).toBe(true);
    expect(result.healedFields).toEqual({ category_id: "" });
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
  });

  // FR5: fk_violation:task_id → soft delete
  it("should return healable with is_deleted for fk_violation:task_id", () => {
    const result = handleServerRejection("fk_violation:task_id");

    expect(result.isHealable).toBe(true);
    expect(result.healedFields).toEqual({ is_deleted: true });
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
  });

  // FR5: check_violation → unhealable
  it("should return unhealable for check_violation:box", () => {
    const result = handleServerRejection("check_violation:box");

    expect(result.isHealable).toBe(false);
    expect(result.healedFields).toBeUndefined();
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });

  // FR5: unique_violation → unhealable
  it("should return unhealable for unique_violation", () => {
    const result = handleServerRejection("unique_violation");

    expect(result.isHealable).toBe(false);
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });

  // FR5: no reason → unhealable
  it("should return unhealable when reason is undefined", () => {
    const result = handleServerRejection(undefined);

    expect(result.isHealable).toBe(false);
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });

  // FR5: unknown fk field → unhealable
  it("should return unhealable for unknown fk_violation field", () => {
    const result = handleServerRejection("fk_violation:unknown_field");

    expect(result.isHealable).toBe(false);
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });

  // FR5: check_violation with specific constraint name → unhealable
  it("should return unhealable for check_violation with specific constraint", () => {
    const result = handleServerRejection("check_violation:tasks_box_check");

    expect(result.isHealable).toBe(false);
    expect(result.healedFields).toBeUndefined();
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });

  // FR5: completely unknown reason → unhealable
  it("should return unhealable for completely unknown reason", () => {
    const result = handleServerRejection("something_totally_unknown");

    expect(result.isHealable).toBe(false);
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });

  // FR5: empty string reason → unhealable (different from undefined)
  it("should return unhealable for empty string reason", () => {
    const result = handleServerRejection("");

    expect(result.isHealable).toBe(false);
    expect(result.syncStatus).toBe(RECORD_SYNC_STATUS.REJECTED);
  });
});
