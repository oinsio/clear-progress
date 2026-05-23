import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "../helpers/response";
import { getAllContexts } from "../sheets/contexts.sheet";
import { getAllGoals } from "../sheets/goals.sheet";
import { getAllTasks, upsertTasks } from "../sheets/tasks.sheet";
import { push } from "./push";
import {
  expectErrorResponse,
  getMockLock,
  makeContext,
  makeGoal,
  makeTask,
  parseResponse,
  setupPushTests,
} from "./push-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

describe("push", () => {
  setupPushTests();

  describe("error handling", () => {
    it("should return NOT_INITIALIZED error when sheet throws with NOT_INITIALIZED message", () => {
      vi.mocked(getAllTasks).mockImplementation(() => {
        throw new Error(ERROR_CODES.NOT_INITIALIZED);
      });

      push({ tasks: [makeTask()] });

      expectErrorResponse(ERROR_CODES.NOT_INITIALIZED);
    });

    it("should return INTERNAL_ERROR when sheet throws an unexpected error", () => {
      vi.mocked(getAllGoals).mockImplementation(() => {
        throw new Error("Spreadsheet not accessible");
      });

      push({ goals: [makeGoal()] });

      expectErrorResponse(ERROR_CODES.INTERNAL_ERROR);
    });

    it("should include the original error message in INTERNAL_ERROR response", () => {
      const originalMessage = "Unexpected sheet error";
      vi.mocked(getAllContexts).mockImplementation(() => {
        throw new Error(originalMessage);
      });

      push({ contexts: [makeContext()] });

      expect(parseResponse().message).toBe(originalMessage);
    });
  });

  describe("LockService", () => {
    it("should acquire a script lock before processing", () => {
      push({ tasks: [makeTask()] });
      expect(LockService.getScriptLock).toHaveBeenCalled();
      expect(getMockLock().tryLock).toHaveBeenCalled();
    });

    it("should release the lock after processing", () => {
      push({ tasks: [makeTask()] });
      expect(getMockLock().releaseLock).toHaveBeenCalled();
    });

    it("should release the lock even when processing throws", () => {
      vi.mocked(getAllTasks).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      push({ tasks: [makeTask()] });

      expect(getMockLock().releaseLock).toHaveBeenCalled();
    });

    it("should return SYNC_LOCK_TIMEOUT error when lock cannot be acquired", () => {
      getMockLock().tryLock.mockReturnValue(false);

      push({ tasks: [makeTask()] });

      expectErrorResponse("SYNC_LOCK_TIMEOUT");
    });

    it("should NOT process any records when lock cannot be acquired", () => {
      getMockLock().tryLock.mockReturnValue(false);

      push({ tasks: [makeTask()] });

      expect(getAllTasks).not.toHaveBeenCalled();
      expect(upsertTasks).not.toHaveBeenCalled();
    });
  });
});
