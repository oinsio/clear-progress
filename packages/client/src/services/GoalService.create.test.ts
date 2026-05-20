import { beforeEach, describe, expect, it } from "vitest";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { GoalService } from "./GoalService";

describe("GoalService", () => {
  let mockGoalRepository: GoalRepository;

  beforeEach(() => {
    mockGoalRepository = createMockGoalRepository();
  });

  describe("create", () => {
    let createdGoal: Awaited<ReturnType<GoalService["create"]>>;

    beforeEach(async () => {
      const goalService = new GoalService(mockGoalRepository);
      createdGoal = await goalService.create({ name: "My goal" });
    });

    it("should create goal with given name", () => {
      expect(createdGoal.name).toBe("My goal");
    });

    it("should create goal with is_deleted false", () => {
      expect(createdGoal.is_deleted).toBe(false);
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

    it("should create goal with needsSync true", () => {
      expect(createdGoal.needsSync).toBe(true);
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
        name: "Test",
        description: "Custom description",
      });
      expect(goal.description).toBe("Custom description");
    });

    it("should preserve provided status", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const goal = await goalService.create({
        name: "Test",
        status: "in_progress",
      });
      expect(goal.status).toBe("in_progress");
    });
  });
});
