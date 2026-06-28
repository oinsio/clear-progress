import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { buildGoal } from "@/test/factories/goalFactory";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { GoalService } from "./GoalService";

describe("GoalService", () => {
  describe("reorderGoals", () => {
    it("should update goal with new sort_order", async () => {
      const goal = buildGoal({ sort_order: "a0" });
      const mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);

      await goalService.reorderGoals(goal.id, "a1");

      expect(mockGoalRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: goal.id,
          sort_order: "a1",
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const goal = buildGoal({
        sort_order: "a0",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);

      await goalService.reorderGoals(goal.id, "a1");

      const updatedGoal = (
        mockGoalRepository.update as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(updatedGoal.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when goal not found", async () => {
      const mockGoalRepository = createMockGoalRepository();
      const goalService = new GoalService(mockGoalRepository);
      await expect(
        goalService.reorderGoals("nonexistent", "a1"),
      ).rejects.toThrow("Goal not found: nonexistent");
    });

    it("should not trigger rebalancing when key is short", async () => {
      const goal = buildGoal({ sort_order: "a0" });
      const mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);

      await goalService.reorderGoals(goal.id, "a1");

      expect(mockGoalRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const goal = buildGoal({ sort_order: "a0" });
      const allGoals = [
        buildGoal({ sort_order: "a0" }),
        buildGoal({ sort_order: "a1" }),
      ];
      const mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
        getActive: vi.fn().mockResolvedValue(allGoals),
      });
      const goalService = new GoalService(mockGoalRepository);

      await goalService.reorderGoals(goal.id, longKey);

      expect(mockGoalRepository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance all goals with fresh keys", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const goal = buildGoal({ sort_order: "a0" });
      const allGoals = [
        buildGoal({ sort_order: "b0" }),
        buildGoal({ sort_order: "a0" }),
      ];
      const mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
        getActive: vi.fn().mockResolvedValue(allGoals),
      });
      const goalService = new GoalService(mockGoalRepository);

      await goalService.reorderGoals(goal.id, longKey);

      const rebalancedGoals = (
        mockGoalRepository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(rebalancedGoals).toHaveLength(2);
      for (const rebalancedGoal of rebalancedGoals) {
        expect(typeof rebalancedGoal.sort_order).toBe("string");
        expect(rebalancedGoal.syncStatus).toBe("pending");
      }
    });
  });
});
