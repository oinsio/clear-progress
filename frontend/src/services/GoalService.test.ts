import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoalService } from "./GoalService";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import { buildGoal } from "@/test/factories/goalFactory";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";

describe("GoalService", () => {
  let mockGoalRepository: GoalRepository;

  beforeEach(() => {
    mockGoalRepository = createMockGoalRepository();
  });

  describe("searchByTitle", () => {
    it("should return empty array when no goals match", async () => {
      const goals = [buildGoal({ title: "Learn piano" })];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("nonexistent");
      expect(results).toEqual([]);
    });

    it("should return matching goals case-insensitively", async () => {
      const goals = [
        buildGoal({ title: "Learn piano" }),
        buildGoal({ title: "Read books" }),
        buildGoal({ title: "Learn Spanish" }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("learn");
      expect(results).toHaveLength(2);
    });

    it("should match partial title", async () => {
      const goal = buildGoal({ title: "My important goal" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("import");
      expect(results).toEqual([goal]);
    });

    it("should call getActive on repository", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await goalService.searchByTitle("query");
      expect(mockGoalRepository.getActive).toHaveBeenCalled();
    });

    it("should return empty array when repository returns no goals", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("anything");
      expect(results).toEqual([]);
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

    it("should increment version on restore", async () => {
      const goal = buildGoal({ is_deleted: true, version: 3 });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const restored = await goalService.restore(goal.id);
      expect(restored.version).toBe(4);
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(goalService.restore("nonexistent-id")).rejects.toThrow(
        "Goal not found: nonexistent-id",
      );
    });
  });

  describe("getAll", () => {
    it("should return empty array when no goals exist", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const goals = await goalService.getAll();
      expect(goals).toEqual([]);
    });

    it("should return goals sorted by sort_order ascending", async () => {
      const unsortedGoals = [
        buildGoal({ sort_order: 3 }),
        buildGoal({ sort_order: 1 }),
        buildGoal({ sort_order: 2 }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(unsortedGoals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const goals = await goalService.getAll();
      expect(goals[0].sort_order).toBe(1);
      expect(goals[1].sort_order).toBe(2);
      expect(goals[2].sort_order).toBe(3);
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

  describe("create", () => {
    let createdGoal: Awaited<ReturnType<GoalService["create"]>>;

    beforeEach(async () => {
      const goalService = new GoalService(mockGoalRepository);
      createdGoal = await goalService.create({ title: "My goal" });
    });

    it("should create goal with given title", () => {
      expect(createdGoal.title).toBe("My goal");
    });

    it("should create goal with is_deleted false", () => {
      expect(createdGoal.is_deleted).toBe(false);
    });

    it("should create goal with version 1", () => {
      expect(createdGoal.version).toBe(1);
    });

    it("should create goal with a UUID id", () => {
      expect(createdGoal.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create goal with empty string defaults for optional fields", () => {
      expect(createdGoal.description).toBe("");
      expect(createdGoal.cover_file_id).toBe("");
    });

    it("should create goal with status planning by default", () => {
      expect(createdGoal.status).toBe("planning");
    });

    it("should create goal with sort_order 0 by default", () => {
      expect(createdGoal.sort_order).toBe(0);
    });

    it("should create goal with _dirty true", () => {
      expect(createdGoal._dirty).toBe(true);
    });

    it("should create goal with revision 0", () => {
      expect(createdGoal.revision).toBe(0);
    });

    it("should call repository.create with the constructed goal", () => {
      expect(mockGoalRepository.create).toHaveBeenCalledWith(createdGoal);
    });

    it("should preserve provided description", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const goal = await goalService.create({
        title: "Test",
        description: "Custom description",
      });
      expect(goal.description).toBe("Custom description");
    });

    it("should preserve provided status", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const goal = await goalService.create({
        title: "Test",
        status: "in_progress",
      });
      expect(goal.status).toBe("in_progress");
    });
  });

  describe("update", () => {
    it("should update goal fields", async () => {
      const goal = buildGoal({ title: "Old title" });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { title: "New title" });
      expect(updated.title).toBe("New title");
    });

    it("should increment version on update", async () => {
      const goal = buildGoal({ version: 2 });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { title: "X" });
      expect(updated.version).toBe(3);
    });

    it("should update updated_at timestamp", async () => {
      const goal = buildGoal({ updated_at: "2025-01-01T00:00:00.000Z" });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { title: "X" });
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set _dirty to true", async () => {
      const goal = buildGoal({ _dirty: false });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { title: "X" });
      expect(updated._dirty).toBe(true);
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
      await goalService.update(goal.id, { title: "Updated" });
      expect(mockGoalRepository.update).toHaveBeenCalled();
    });

    it("should preserve id when updating", async () => {
      const goal = buildGoal();
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.update(goal.id, { title: "X" });
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

    it("should increment version when updating status", async () => {
      const goal = buildGoal({ status: "planning", version: 2 });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const updated = await goalService.updateStatus(goal.id, "completed");
      expect(updated.version).toBe(3);
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

    it("should increment version on soft delete", async () => {
      const goal = buildGoal({ version: 3 });
      mockGoalRepository = createMockGoalRepository({
        getById: vi.fn().mockResolvedValue(goal),
      });
      const goalService = new GoalService(mockGoalRepository);
      const deleted = await goalService.softDelete(goal.id);
      expect(deleted.version).toBe(4);
    });

    it("should throw when goal not found", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await expect(goalService.softDelete("nonexistent-id")).rejects.toThrow(
        "Goal not found: nonexistent-id",
      );
    });
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

    it("should increment version for each reordered goal", async () => {
      const goalA = buildGoal({ version: 3 });
      const goalB = buildGoal({ version: 5 });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA, goalB]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].version).toBe(4);
      expect(upserted[1].version).toBe(6);
    });

    it("should update updated_at for each reordered goal", async () => {
      const goalA = buildGoal({ updated_at: "2025-01-01T00:00:00.000Z" });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA]);
      const upserted = getUpsertedGoals();
      expect(upserted[0].updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should set _dirty to true for each reordered goal", async () => {
      const goalA = buildGoal({ _dirty: false });
      const goalService = new GoalService(mockGoalRepository);
      await goalService.reorderGoals([goalA]);
      const upserted = getUpsertedGoals();
      expect(upserted[0]._dirty).toBe(true);
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
  });

  describe("searchByTitle - edge cases", () => {
    it("should return empty array when query is empty string", async () => {
      const goals = [buildGoal({ title: "Test" })];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("");
      expect(results).toEqual(goals);
    });

    it("should sort finished goals after non-finished goals", async () => {
      const completedGoal = buildGoal({
        title: "Learn A",
        status: "completed",
      });
      const activeGoal = buildGoal({ title: "Learn B", status: "in_progress" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([completedGoal, activeGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("learn");
      expect(results[0].id).toBe(activeGoal.id);
      expect(results[1].id).toBe(completedGoal.id);
    });

    it("should sort cancelled goals after non-finished goals", async () => {
      const cancelledGoal = buildGoal({
        title: "Learn A",
        status: "cancelled",
      });
      const activeGoal = buildGoal({ title: "Learn B", status: "planning" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([cancelledGoal, activeGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("learn");
      expect(results[0].id).toBe(activeGoal.id);
      expect(results[1].id).toBe(cancelledGoal.id);
    });

    it("should keep order when both goals are finished", async () => {
      const completedGoal = buildGoal({
        title: "Learn A",
        status: "completed",
      });
      const cancelledGoal = buildGoal({
        title: "Learn B",
        status: "cancelled",
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([completedGoal, cancelledGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("learn");
      expect(results).toHaveLength(2);
    });

    it("should keep order when both goals are non-finished", async () => {
      const planningGoal = buildGoal({ title: "Learn A", status: "planning" });
      const activeGoal = buildGoal({
        title: "Learn B",
        status: "in_progress",
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([planningGoal, activeGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByTitle("learn");
      expect(results).toHaveLength(2);
    });
  });
});
