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

  describe("searchByName - edge cases", () => {
    it("should return empty array when query is empty string", async () => {
      const goals = [buildGoal({ name: "Test" })];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("");
      expect(results).toEqual(goals);
    });

    it("should sort finished goals after non-finished goals", async () => {
      const completedGoal = buildGoal({
        name: "Learn A",
        status: "completed",
      });
      const activeGoal = buildGoal({ name: "Learn B", status: "in_progress" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([completedGoal, activeGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("learn");
      expect(results[0].id).toBe(activeGoal.id);
      expect(results[1].id).toBe(completedGoal.id);
    });

    it("should sort cancelled goals after non-finished goals", async () => {
      const cancelledGoal = buildGoal({
        name: "Learn A",
        status: "cancelled",
      });
      const activeGoal = buildGoal({ name: "Learn B", status: "planning" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([cancelledGoal, activeGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("learn");
      expect(results[0].id).toBe(activeGoal.id);
      expect(results[1].id).toBe(cancelledGoal.id);
    });

    it("should keep order when both goals are finished", async () => {
      const completedGoal = buildGoal({
        name: "Learn A",
        status: "completed",
      });
      const cancelledGoal = buildGoal({
        name: "Learn B",
        status: "cancelled",
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([completedGoal, cancelledGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("learn");
      expect(results).toHaveLength(2);
    });

    it("should keep order when both goals are non-finished", async () => {
      const planningGoal = buildGoal({ name: "Learn A", status: "planning" });
      const activeGoal = buildGoal({
        name: "Learn B",
        status: "in_progress",
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([planningGoal, activeGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("learn");
      expect(results).toHaveLength(2);
    });

    it("should sort goals by status priority (in_progress first, cancelled last)", async () => {
      const goals = [
        buildGoal({ name: "Goal A", status: "cancelled" }),
        buildGoal({ name: "Goal B", status: "in_progress" }),
        buildGoal({ name: "Goal C", status: "completed" }),
        buildGoal({ name: "Goal D", status: "planning" }),
        buildGoal({ name: "Goal E", status: "paused" }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("goal");
      expect(results[0].status).toBe("in_progress");
      expect(results[1].status).toBe("planning");
      expect(results[2].status).toBe("paused");
      expect(results[3].status).toBe("completed");
      expect(results[4].status).toBe("cancelled");
    });

    it("should sort goals with same status by updated_at descending", async () => {
      const timestamp1 = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
      );
      const timestamp2 = toISOTimestamp(
        Temporal.Instant.from("2025-01-02T10:00:00.000Z"),
      );
      const timestamp3 = toISOTimestamp(
        Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
      );
      const goals = [
        buildGoal({
          name: "Goal A",
          status: "in_progress",
          updated_at: timestamp1,
        }),
        buildGoal({
          name: "Goal B",
          status: "in_progress",
          updated_at: timestamp3,
        }),
        buildGoal({
          name: "Goal C",
          status: "in_progress",
          updated_at: timestamp2,
        }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("goal");
      expect(results[0].updated_at).toBe(timestamp3);
      expect(results[1].updated_at).toBe(timestamp2);
      expect(results[2].updated_at).toBe(timestamp1);
    });

    it("should prioritize in_progress over planning", async () => {
      const planningGoal = buildGoal({
        name: "Goal A",
        status: "planning",
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
        ),
      });
      const inProgressGoal = buildGoal({
        name: "Goal B",
        status: "in_progress",
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([planningGoal, inProgressGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("goal");
      expect(results[0].status).toBe("in_progress");
      expect(results[1].status).toBe("planning");
    });

    it("should prioritize planning over paused", async () => {
      const pausedGoal = buildGoal({ name: "Goal A", status: "paused" });
      const planningGoal = buildGoal({ name: "Goal B", status: "planning" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([pausedGoal, planningGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("goal");
      expect(results[0].status).toBe("planning");
      expect(results[1].status).toBe("paused");
    });

    it("should prioritize paused over completed", async () => {
      const completedGoal = buildGoal({ name: "Goal A", status: "completed" });
      const pausedGoal = buildGoal({ name: "Goal B", status: "paused" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([completedGoal, pausedGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("goal");
      expect(results[0].status).toBe("paused");
      expect(results[1].status).toBe("completed");
    });

    it("should prioritize completed over cancelled", async () => {
      const cancelledGoal = buildGoal({ name: "Goal A", status: "cancelled" });
      const completedGoal = buildGoal({ name: "Goal B", status: "completed" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([cancelledGoal, completedGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("goal");
      expect(results[0].status).toBe("completed");
      expect(results[1].status).toBe("cancelled");
    });
  });
});
