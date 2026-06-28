import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import { Temporal } from "@/lib/temporal";
import { buildGoal } from "@/test/factories/goalFactory";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { GoalService } from "./GoalService";

describe("GoalService", () => {
  let mockGoalRepository: GoalRepository;

  beforeEach(() => {
    mockGoalRepository = createMockGoalRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no goals exist", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const goals = await goalService.getAll();
      expect(goals).toEqual([]);
    });

    it("should return goals sorted by sort_order ascending", async () => {
      const unsortedGoals = [
        buildGoal({ sort_order: "a2" }),
        buildGoal({ sort_order: "a0" }),
        buildGoal({ sort_order: "a1" }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(unsortedGoals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const goals = await goalService.getAll();
      expect(String(goals[0].sort_order) < String(goals[1].sort_order)).toBe(
        true,
      );
      expect(String(goals[1].sort_order) < String(goals[2].sort_order)).toBe(
        true,
      );
    });

    it("should call repository.getActive", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await goalService.getAll();
      expect(mockGoalRepository.getActive).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return goal when found", async () => {
      const goal = buildGoal();
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const result = await goalService.getById(goal.id);
      expect(result).toEqual(goal);
    });

    it("should return undefined when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const result = await goalService.getById("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should call repository.getById with the id", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await goalService.getById("test-id");
      expect(mockGoalRepository.getById).toHaveBeenCalledWith("test-id");
    });
  });

  describe("update", () => {
    it("should update goal fields", async () => {
      const goal = buildGoal({ name: "Old name" });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { name: "New name" });
      expect(updated.name).toBe("New name");
    });

    it("should update updated_at timestamp", async () => {
      const goal = buildGoal({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { name: "X" });
      expect(updated.updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set syncStatus to true", async () => {
      const goal = buildGoal({ syncStatus: "synced" as const });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { name: "X" });
      expect(updated.syncStatus).toBe("pending");
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(goalService.update("nonexistent", {})).rejects.toThrow(
        "Goal not found: nonexistent",
      );
    });

    it("should call repository.update with the updated goal", async () => {
      const goal = buildGoal();
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.update(goal.id, { name: "Updated" });
      expect(mockGoalRepository.update).toHaveBeenCalled();
    });

    it("should preserve id when updating", async () => {
      const goal = buildGoal();
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { name: "X" });
      expect(updated.id).toBe(goal.id);
    });
  });

  describe("updateStatus", () => {
    it("should update goal status", async () => {
      const goal = buildGoal({ status: "planning" });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.updateStatus(goal.id, "in_progress");
      expect(updated.status).toBe("in_progress");
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(
        goalService.updateStatus("nonexistent", "completed"),
      ).rejects.toThrow("Goal not found: nonexistent");
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const goal = buildGoal({ is_deleted: false });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const deleted = await goalService.softDelete(goal.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(goalService.softDelete("nonexistent-id")).rejects.toThrow(
        "Goal not found: nonexistent-id",
      );
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const goal = buildGoal({ is_deleted: true });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const restored = await goalService.restore(goal.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(goalService.restore("nonexistent-id")).rejects.toThrow(
        "Goal not found: nonexistent-id",
      );
    });
  });
});
