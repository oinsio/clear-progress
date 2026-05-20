import { beforeEach, describe, expect, it, type vi } from "vitest";
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

  describe("reorderGoals", () => {
    const getUpsertedGoals = () =>
      (mockGoalRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

    it("should call bulkUpsert with goals assigned sort_order by position", async () => {
      const goalA = buildGoal({ sort_order: 2 });
      const goalB = buildGoal({ sort_order: 0 });
      const goalC = buildGoal({ sort_order: 1 });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB, goalC]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should update updated_at for each reordered goal", async () => {
      const goalA = buildGoal({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should set needsSync to true for each reordered goal", async () => {
      const goalA = buildGoal({ needsSync: false });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].needsSync).toBe(true);
    });

    it("should preserve goal ids after reorder", async () => {
      const goalA = buildGoal();
      const goalB = buildGoal();
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].id).toBe(goalA.id);
      expect(upserted[1].id).toBe(goalB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([]);
      expect(mockGoalRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should use same timestamp for all goals in batch", async () => {
      const goalA = buildGoal();
      const goalB = buildGoal();
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].updated_at).toBe(upserted[1].updated_at);
    });

    // FR18: Reorder optimization — needsSync only for changed records
    it("should not call bulkUpsert when order has not changed", async () => {
      const goalA = buildGoal({ sort_order: 0 });
      const goalB = buildGoal({ sort_order: 1 });
      const goalC = buildGoal({ sort_order: 2 });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB, goalC]);
      expect(mockGoalRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should set needsSync to false for goals that did not change position", async () => {
      const goalA = buildGoal({ sort_order: 0, needsSync: true });
      const goalB = buildGoal({ sort_order: 2, needsSync: true });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].needsSync).toBe(false); // не изменился
      expect(upserted[1].needsSync).toBe(true); // изменился с 2 на 1
    });

    it("should not update updated_at for goals that did not change position", async () => {
      const oldTimestamp = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
      );
      const goalA = buildGoal({ sort_order: 0, updated_at: oldTimestamp });
      const goalB = buildGoal({ sort_order: 2, updated_at: oldTimestamp });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].updated_at).toBe(oldTimestamp); // не изменился
      expect(upserted[1].updated_at).not.toBe(oldTimestamp); // изменился
    });
  });
});
